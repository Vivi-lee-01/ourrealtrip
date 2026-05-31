/**
 * Claude Agent SDK adapter for `@ggui-ai/agent-server`.
 *
 * Implements the `AgentAdapter` contract: receives prompt + chatId +
 * MCP server map per request and yields normalized SDK messages.
 * Every ggui-coupled concern (HTTP, SSE, MCP routing, tool-result
 * resource inlining, directive synthesis, auth, chat ownership)
 * lives in the library — this file only knows about the Claude
 * Agent SDK's native event stream.
 *
 * Brand-agnostic: no imports from
 * `@ggui-ai/protocol/integrations/mcp-apps`. The library handles
 * every `_meta.ui.*` / `_meta.ai.ggui/*` slice.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  query,
  type SDKMessage,
  type SpawnOptions,
  type SpawnedProcess,
} from '@anthropic-ai/claude-agent-sdk';
import type {
  AgentAdapter,
  AgentInput,
  NormalizedMessage,
  McpCallToolResult,
} from '@ggui-ai/agent-server';

/**
 * Locate the Claude Agent SDK's bundled `cli.js`. The SDK ships a
 * portable `#!/usr/bin/env node` `cli.js` AND optional platform-
 * native binaries (`@anthropic-ai/claude-agent-sdk-<plat>`); its
 * default lookup prefers the native binary and hard-errors when the
 * matching optional package didn't install. Pinning
 * `pathToClaudeCodeExecutable` at the bundled `cli.js` runs the
 * agent loop on plain Node everywhere.
 */
function resolveClaudeCliPath(): string {
  const tried: string[] = [];
  const startDir = dirname(fileURLToPath(import.meta.url));
  let dir = startDir;
  for (let depth = 0; depth < 20; depth++) {
    const candidates = [
      tryResolveSdkDir(dir),
      join(dir, 'node_modules', '@anthropic-ai', 'claude-agent-sdk'),
    ];
    for (const sdkDir of candidates) {
      if (!sdkDir) continue;
      const cli = join(sdkDir, 'cli.js');
      if (!tried.includes(cli)) tried.push(cli);
      if (existsSync(cli)) return cli;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `Could not locate @anthropic-ai/claude-agent-sdk/cli.js. ` +
      `Checked ${tried.length} candidate path(s):\n  ${tried.join('\n  ')}`,
  );
}

function tryResolveSdkDir(fromDir: string): string | null {
  try {
    const req = createRequire(join(fromDir, 'noop.js'));
    return dirname(req.resolve('@anthropic-ai/claude-agent-sdk'));
  } catch {
    return null;
  }
}

const CLAUDE_CLI_PATH = resolveClaudeCliPath();

function spawnClaudeCli(opts: SpawnOptions): SpawnedProcess {
  if (!existsSync(CLAUDE_CLI_PATH)) {
    throw new Error(
      `spawnClaudeCli: cli.js missing at spawn time — was present at module ` +
        `load but is gone now: ${CLAUDE_CLI_PATH}`,
    );
  }
  const child = spawn(process.execPath, [CLAUDE_CLI_PATH, ...opts.args], {
    cwd: opts.cwd,
    env: opts.env,
    signal: opts.signal,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[agent-cli] ${chunk.toString()}`);
  });
  const { stdin, stdout } = child;
  if (!stdin || !stdout) {
    throw new Error(
      'spawnClaudeCli: child stdin/stdout missing despite pipe stdio',
    );
  }
  return {
    stdin,
    stdout,
    get killed() {
      return child.killed;
    },
    get exitCode() {
      return child.exitCode;
    },
    kill: child.kill.bind(child),
    on: child.on.bind(child),
    once: child.once.bind(child),
    off: child.off.bind(child),
  };
}

export interface ClaudeAgentSdkAdapterOptions {
  /** Default `claude-haiku-4-5`. */
  readonly model?: string;
  /** Default `process.env.ANTHROPIC_API_KEY`. */
  readonly apiKey?: string;
  /** Default 50. Caps the tool-use loop. */
  readonly maxTurns?: number;
  /**
   * Per-server tool allowlist. MCP tools auto-namespace as
   * `mcp__<server>__<tool>`; this map declares which prefixes the
   * agent is allowed to call. Conventional defaults are wired below;
   * operators can override.
   */
  readonly allowedToolsByServer?: Record<string, ReadonlyArray<string>>;
}

/**
 * 호스트 어시스턴트의 도메인 자세(posture-only) 프롬프트.
 *
 * ggui 와이어 플로우(render/consume 등)는 각 툴 설명이 가르치므로 여기서
 * 다시 설명하지 않는다 — 오직 어떤 태도로 호스트를 돕는지만 정의한다.
 * `SYSTEM_PROMPT` 환경변수가 주어지면 그것이 우선한다(index.ts 참조);
 * 아무것도 지정하지 않으면 이 자세가 기본값이 된다.
 */
export const HOST_CREATE_SYSTEM_PROMPT = [
  '당신은 커뮤니티 여행 이벤트를 만드는 호스트를 돕는 따뜻한 호스트 어시스턴트입니다.',
  '호스트와 대화하며 모임의 컨셉·일정·장소·정원·분위기를 함께 다듬고, 초안 제안을 만들어 호스트가 검토·반영하도록 돕습니다.',
  '',
  '- 모임에 어울리는 MyRealTrip 상품은 searchTnas(실제 검색)로 찾아 "표시 전용 연결 링크"로만 제안하고, 대표 상품의 이미지 URL을 host_create_apply의 cover_image_url에 넣습니다. host_recommend_products는 사용하지 않습니다. 아워리얼트립은 판매자(merchant)가 아니며, 결제·예약은 외부 판매처에서 참여자가 각자 진행합니다. price_hint는 참고용 표시 금액일 뿐입니다.',
  '- 초안이 준비되면 host_create_apply로 구조화 제안을 제출합니다. 이것은 호스트가 검토 후 폼에 반영하기 위한 초안일 뿐, 발행이 아닙니다.',
  '- 절대 자동으로 발행(publish)하거나 모집을 오픈(booking_open)하거나 외부에 공유하지 않습니다. 발행·예약 오픈·외부 공유는 항상 사람(호스트)이 승인합니다.',
  '- 결제 완료·예약 확정·확정가·묶음결제 같은 결제/확정 뉘앙스의 표현을 쓰지 않습니다. 작성한 문구가 의심되면 host_safety_check로 점검하고 중립 표현으로 바꿉니다.',
  '- 외부 예약 확정 상태(externally_confirmed_booked 등)는 절대 세팅하지 않습니다.',
].join('\n');

const DEFAULT_ALLOWED_TOOLS: Record<string, ReadonlyArray<string>> = {
  ggui: [
    'mcp__ggui__ggui_handshake',
    'mcp__ggui__ggui_render',
    'mcp__ggui__ggui_update',
    'mcp__ggui__ggui_emit',
    'mcp__ggui__ggui_consume',
  ],
  todo: [
    'mcp__todo__todo_list',
    'mcp__todo__todo_add',
    'mcp__todo__todo_toggle',
    'mcp__todo__todo_delete',
  ],
  // GGUI_HOST_CREATE_MCP_URL → server name `host_create` (regex lowercases the
  // capture group), so tools namespace as `mcp__host_create__*`.
  host_create: [
    'mcp__host_create__host_create_apply',
    'mcp__host_create__host_safety_check',
    'mcp__host_create__host_create_draft',
    'mcp__host_create__host_update_draft',
    'mcp__host_create__host_get_draft',
    'mcp__host_create__host_list_my_events',
    'mcp__host_create__host_publish_event',
  ],
  myrealtrip: [
    'mcp__myrealtrip__getCurrentTime',
    'mcp__myrealtrip__searchStays',
    'mcp__myrealtrip__getStayDetail',
    'mcp__myrealtrip__getCategoryList',
    'mcp__myrealtrip__searchTnas',
    'mcp__myrealtrip__getTnaDetail',
    'mcp__myrealtrip__getTnaOptions',
    'mcp__myrealtrip__searchInternationalFlights',
    'mcp__myrealtrip__searchDomesticFlights',
    'mcp__myrealtrip__getPromotionAirlines',
    'mcp__myrealtrip__flightsFareCalendar',
  ],
};

/**
 * Per-process record of which chat ids have produced at least one
 * Claude SDK turn. Drives sessionId-vs-resume:
 *
 *   - `sessionId: <id>` — first turn, create a new session under
 *     our id.
 *   - `resume: <id>` — subsequent turn, load the persisted session.
 *
 * The Claude SDK saves sessions to `~/.claude/projects/`, so the
 * set is empty after a restart but the on-disk session still
 * exists; the first POST after a restart starts a fresh
 * `sessionId` collision with the on-disk one. Fall-back is a
 * fresh isolated turn, never an error.
 */
const knownChats = new Set<string>();

export function createClaudeAgentSdkAdapter(
  opts: ClaudeAgentSdkAdapterOptions = {},
): AgentAdapter {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  // 구독 OAuth 토큰(Claude Code) 폴백: API 크레딧이 없어도 구독으로 인증 가능.
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!apiKey && !oauthToken) {
    throw new Error(
      'createClaudeAgentSdkAdapter: ANTHROPIC_API_KEY 또는 CLAUDE_CODE_OAUTH_TOKEN 중 하나가 필요합니다.',
    );
  }
  const model = opts.model ?? 'claude-haiku-4-5';
  const maxTurns = opts.maxTurns ?? 50;
  const allowedToolsByServer =
    opts.allowedToolsByServer ?? DEFAULT_ALLOWED_TOOLS;

  return {
    name: 'claude-agent-sdk',
    run(input: AgentInput): AsyncIterable<NormalizedMessage> {
      return runOnce({
        input,
        apiKey,
        oauthToken,
        model,
        maxTurns,
        allowedToolsByServer,
      });
    },
  };
}

async function* runOnce(args: {
  readonly input: AgentInput;
  readonly apiKey?: string;
  readonly oauthToken?: string;
  readonly model: string;
  readonly maxTurns: number;
  readonly allowedToolsByServer: Record<string, ReadonlyArray<string>>;
}): AsyncIterable<NormalizedMessage> {
  const { input, apiKey, oauthToken, model, maxTurns, allowedToolsByServer } = args;

  // 자세 기본값은 host-create 도메인 프롬프트. `SYSTEM_PROMPT` 환경변수가
  // 주어지면 input.systemPrompt로 흘러와 우선하고, `none`이면 null →
  // undefined로 SDK 내장 기본 프롬프트를 쓴다(index.ts 참조).
  const systemPrompt =
    input.systemPrompt === null
      ? undefined
      : (input.systemPrompt ?? HOST_CREATE_SYSTEM_PROMPT);

  // Translate the library's brand-agnostic mcpServers map into the
  // SDK's native shape. Bearer is the library-resolved one.
  const sdkMcpServers: Record<
    string,
    { type: 'http'; url: string; headers?: Record<string, string> }
  > = {};
  for (const [name, cfg] of Object.entries(input.mcpServers)) {
    // bearer가 있는 서버(ggui 등)에만 Authorization 헤더를 붙인다.
    // MyRealTrip 같은 무인증 MCP는 예상치 못한 Authorization 헤더를 받으면
    // 거부/오작동할 수 있으므로 헤더를 생략한다(`Bearer undefined` 방지).
    sdkMcpServers[name] = {
      type: 'http',
      url: cfg.url,
      ...(cfg.bearer
        ? { headers: { Authorization: `Bearer ${cfg.bearer}` } }
        : {}),
    };
  }

  const allowedTools: string[] = [];
  for (const name of Object.keys(input.mcpServers)) {
    const tools = allowedToolsByServer[name];
    if (tools) allowedTools.push(...tools);
  }

  // Multi-turn session continuity via the SDK's filesystem store.
  // The SDK requires a UUID-shaped sessionId; the library mints
  // `chat_<22-char base62>` chat ids that don't match. Derive a
  // deterministic UUID from the chat id (SHA-256 hash → first 16
  // bytes shaped as UUIDv4) so the same chat keeps the same SDK
  // session across turns, while the library's wire shape stays
  // brand-agnostic.
  const sdkSessionId = chatIdToUuid(input.chatId);
  const sessionOptions: { resume?: string; sessionId?: string } = {};
  if (knownChats.has(input.chatId)) {
    sessionOptions.resume = sdkSessionId;
  } else {
    sessionOptions.sessionId = sdkSessionId;
    knownChats.add(input.chatId);
  }

  // Per-request AbortController bridging input.abortSignal into the
  // SDK's `abortController` option. Created here (not threaded
  // through the library) because the SDK accepts AbortController,
  // not AbortSignal.
  const sdkAbort = new AbortController();
  const onAbort = (): void => sdkAbort.abort();
  if (input.abortSignal.aborted) {
    sdkAbort.abort();
  } else {
    input.abortSignal.addEventListener('abort', onAbort);
  }

  try {
    const response = query({
      prompt: input.prompt,
      options: {
        model,
        mcpServers: sdkMcpServers,
        allowedTools,
        // allowlist에 없는 MCP 도구도 권한 프롬프트 없이 실행(로컬 cockpit 데모).
        // 권한 게이트가 MyRealTrip 도구를 막던 문제 해소.
        permissionMode: 'bypassPermissions',
        ...sessionOptions,
        tools: [],
        settingSources: [],
        strictMcpConfig: true,
        maxTurns,
        env: oauthToken
          ? { CLAUDE_CODE_OAUTH_TOKEN: oauthToken }
          : { ANTHROPIC_API_KEY: apiKey as string },
        pathToClaudeCodeExecutable: CLAUDE_CLI_PATH,
        spawnClaudeCodeProcess: spawnClaudeCli,
        ...(systemPrompt ? { systemPrompt } : {}),
        abortController: sdkAbort,
      },
    });

    for await (const msg of response) {
      // Each SDKMessage already matches NormalizedMessage's variants
      // (the normalized envelope was modeled after Anthropic's SDK).
      // `assistant`/`user` shapes ride through verbatim; the
      // `tool_use_result` sibling field carries the full MCP
      // CallToolResult (with `_meta.ui.*`) the library's
      // tool-result interceptor needs.
      const normalized = sdkMessageToNormalized(msg);
      if (normalized) yield normalized;
    }
  } finally {
    input.abortSignal.removeEventListener('abort', onAbort);
  }
}

/**
 * Map any opaque chat id to a deterministic UUID v4-shaped string —
 * SHA-256 the chat id, take the first 16 bytes, force version + variant
 * bits to match RFC 4122. Same input always yields the same UUID so
 * the SDK's session store keys stay stable across turns.
 */
function chatIdToUuid(chatId: string): string {
  const hash = createHash('sha256').update(chatId).digest();
  // RFC 4122 v4: bits 12-15 = 0100 (version), bits 6-7 of clock_seq_hi = 10 (variant)
  hash[6] = (hash[6]! & 0x0f) | 0x40;
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Adapt one Claude SDK message into a NormalizedMessage. Returns
 * `null` for SDK message types the chat UI doesn't surface
 * (e.g. partial deltas the SDK might add in future).
 */
function sdkMessageToNormalized(
  msg: SDKMessage,
): NormalizedMessage | null {
  // The SDKMessage union closely mirrors NormalizedMessage; we use a
  // typed dispatch on `type` and reshape only as needed.
  if (msg.type === 'assistant') {
    const out: Array<
      | { readonly type: 'text'; readonly text: string }
      | {
          readonly type: 'tool_use';
          readonly id: string;
          readonly name: string;
          readonly input: unknown;
        }
    > = [];
    for (const block of msg.message?.content ?? []) {
      if (block.type === 'text' && typeof block.text === 'string') {
        out.push({ type: 'text', text: block.text });
      } else if (
        block.type === 'tool_use' &&
        typeof block.id === 'string' &&
        typeof block.name === 'string'
      ) {
        out.push({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input ?? {},
        });
      }
    }
    if (out.length === 0) return null;
    return { type: 'assistant', message: { content: out } };
  }
  if (msg.type === 'user') {
    const rawContent = msg.message?.content;
    const out: Array<{
      readonly type: 'tool_result';
      readonly tool_use_id: string;
      readonly content: ReadonlyArray<{
        readonly type: 'text';
        readonly text: string;
      }>;
      readonly is_error?: boolean;
    }> = [];
    if (Array.isArray(rawContent)) {
      for (const block of rawContent) {
        if (block.type !== 'tool_result') continue;
        const toolUseId =
          typeof block.tool_use_id === 'string' ? block.tool_use_id : '';
        let textBlocks: Array<{ type: 'text'; text: string }> = [];
        if (Array.isArray(block.content)) {
          for (const c of block.content) {
            if (
              c &&
              typeof c === 'object' &&
              (c as { type?: unknown }).type === 'text'
            ) {
              const text = (c as { text?: unknown }).text;
              if (typeof text === 'string') {
                textBlocks.push({ type: 'text', text });
              }
            }
          }
        } else if (typeof block.content === 'string') {
          textBlocks = [{ type: 'text', text: block.content }];
        }
        out.push({
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: textBlocks,
          ...(block.is_error === true ? { is_error: true } : {}),
        });
      }
    }
    if (out.length === 0) return null;
    const full = (msg as { tool_use_result?: unknown }).tool_use_result;
    return {
      type: 'user',
      message: { content: out },
      ...(full && typeof full === 'object'
        ? { tool_use_result: full as McpCallToolResult }
        : {}),
    };
  }
  if (msg.type === 'result') {
    return {
      type: 'result',
      subtype: String((msg as { subtype?: unknown }).subtype ?? 'ok'),
    };
  }
  return null;
}
