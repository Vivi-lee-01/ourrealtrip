import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export type HostCreateScope = 'read' | 'write' | 'publish';

export interface HostCreateAuthContext {
  userId: string;
  hostId: string | null;
  scopes: ReadonlySet<HostCreateScope>;
  tokenLabel: string;
}

interface TokenConfig {
  user_id?: string;
  userId?: string;
  host_id?: string | null;
  hostId?: string | null;
  scopes?: HostCreateScope[];
  label?: string;
}

const ALL_SCOPES: HostCreateScope[] = ['read', 'write', 'publish'];

function parseBearer(req: IncomingMessage): string | null {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match?.[1]?.trim() || null;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function normalizeScopes(scopes: unknown): ReadonlySet<HostCreateScope> {
  if (!Array.isArray(scopes)) return new Set(ALL_SCOPES);
  const allowed = new Set<HostCreateScope>();
  for (const scope of scopes) {
    if (scope === 'read' || scope === 'write' || scope === 'publish') allowed.add(scope);
  }
  return allowed.size > 0 ? allowed : new Set<HostCreateScope>(['read']);
}

function parseJsonTokenMap(raw: string | undefined): Map<string, TokenConfig> {
  if (!raw?.trim()) return new Map();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return new Map();
    const map = new Map<string, TokenConfig>();
    for (const [tokenOrHash, config] of Object.entries(parsed)) {
      if (!config || typeof config !== 'object' || Array.isArray(config)) continue;
      map.set(tokenOrHash, config as TokenConfig);
    }
    return map;
  } catch {
    return new Map();
  }
}

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.HOST_CREATE_MCP_BEARER_TOKEN?.trim() ||
      process.env.HOST_CREATE_MCP_PAT_TOKENS?.trim(),
  );
}

export function authenticateRequest(req: IncomingMessage): HostCreateAuthContext | null {
  const token = parseBearer(req);
  const configured = isAuthConfigured();

  // 로컬 개발 편의: PAT env가 없으면 기존 echo-only MCP처럼 열어둔다.
  // 원격 운영에서는 반드시 HOST_CREATE_MCP_BEARER_TOKEN 또는 HOST_CREATE_MCP_PAT_TOKENS 설정.
  if (!configured) {
    return {
      userId: 'local-dev-user',
      hostId: 'local-dev-host',
      scopes: new Set(ALL_SCOPES),
      tokenLabel: 'local-dev',
    };
  }

  if (!token) return null;

  const single = process.env.HOST_CREATE_MCP_BEARER_TOKEN?.trim();
  if (single && safeEqual(token, single)) {
    return {
      userId: process.env.HOST_CREATE_MCP_USER_ID?.trim() || 'mcp-user',
      hostId: process.env.HOST_CREATE_MCP_HOST_ID?.trim() || null,
      scopes: normalizeScopes(
        (process.env.HOST_CREATE_MCP_SCOPES ?? 'read,write,publish')
          .split(',')
          .map((s) => s.trim()),
      ),
      tokenLabel: 'env-single-token',
    };
  }

  const tokenMap = parseJsonTokenMap(process.env.HOST_CREATE_MCP_PAT_TOKENS);
  const tokenHash = sha256(token);
  for (const [tokenOrHash, config] of Array.from(tokenMap.entries())) {
    const matched = tokenOrHash.startsWith('sha256:')
      ? safeEqual(tokenOrHash.slice('sha256:'.length), tokenHash)
      : safeEqual(tokenOrHash, token);
    if (!matched) continue;

    const userId = config.user_id ?? config.userId;
    if (!userId) return null;
    return {
      userId,
      hostId: config.host_id ?? config.hostId ?? null,
      scopes: normalizeScopes(config.scopes),
      tokenLabel: config.label ?? 'json-token',
    };
  }

  return null;
}

export function hasScope(auth: HostCreateAuthContext, scope: HostCreateScope): boolean {
  return auth.scopes.has(scope);
}

export function requireScope(auth: HostCreateAuthContext, scope: HostCreateScope): void {
  if (!hasScope(auth, scope)) {
    throw new Error(`missing required scope: ${scope}`);
  }
}
