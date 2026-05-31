"use client";

// 호스트 이벤트 생성 — 에이전트 작업대 (P0-1·P0-3·P0-4·P0-5)
//
// @ggui-ai/react 본체 직접 통합:
//   - useMcpAppsChat 으로 MCP-Apps-spec agent 백엔드(localhost:6790 기본)와 대화
//   - AppRenderer 로 에이전트가 ggui_render 한 UI(샌드박스 iframe)를 본체 안에 렌더
//   - 에이전트가 host_create_apply 툴을 호출하면 그 인자를 구조화 payload 로 추출,
//     호스트가 "페이지에 반영"을 눌렀을 때만 왼쪽 폼에 적용한다(사람 승인 게이트).
//
// 톤: 호스트(아워리얼트립) 흰 배경 미니멀. GGUI 다크테마/브랜딩 미사용.
// 안정성: manifest/token/send 모든 네트워크 실패는 offline 안내로만 떨어진다(throw X).

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AppRenderer, type RequestHandlerExtra, type SandboxConfig } from "@ggui-ai/react";
import {
  useMcpAppsChat,
  type ChatEntry,
  type RenderRef,
  type UseMcpAppsChatResult,
} from "@ggui-ai/react/chat-helpers";
import type {
  CallToolRequest,
  CallToolResult,
  ReadResourceRequest,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import {
  validateAgentPayload,
  isPayloadEmpty,
  type HostCreateAgentPayload,
} from "@/lib/host-create/agentPayload";
import {
  runSafetyCheck,
  type SafetyCheckInput,
  type SafetyFinding,
} from "@/lib/host-create/safetyCheck";
import { stripMarkdown } from "@/lib/host-create/markdown";
import MarkdownText from "@/components/host/Markdown";

// ── 상수 ──
const LS_GUEST_TOKEN = "ourrealtrip/agent-guest-token";
// 호스트 도메인 작업대에 맞춘 추천 질문 (handoff P0-4)
const SUGGESTED_QUESTIONS = [
  "이 모임이 소개팅처럼 보이지 않게 다듬어줘.",
  "상품 연결을 판매 페이지처럼 보이지 않게 정리해줘.",
  "처음 온 사람이 어색하지 않게 진행 순서를 짜줘.",
  "일정 후보 3개와 장단점을 만들어줘.",
];
const SKILL_CHIPS = [
  "페이지 반영",
  "상품 추천",
  "일정 후보",
  "참여 안내",
  "안전 문구 점검",
  "더 많은 스킬 ˅",
];
// 백엔드 미연결 시 P0-3 브리지 검증용 mock payload(개발/데모 안전망)
const MOCK_PAYLOAD: HostCreateAgentPayload = {
  title: "서울의 밤을 걷는 사진 산책",
  concept: "같은 밤을 보고, 각자의 장면을 남기는 시간",
  description:
    "사진 실력을 겨루는 시간이 아닙니다. 좋은 카메라가 없어도 괜찮고, 혼자 와도 어색하지 않도록 짧은 자기소개와 산책 루트를 준비합니다.",
  date_text: "2026년 6월 22일 토요일 19:00–21:30",
  timezone: "GMT+09:00 서울",
  location_text: "을지로 · 청계천 일대",
  // 백엔드 미연결(offline) 데모에서도 발행 카드가 실사진 커버로 보이도록 repo 내 실제
  // 에셋(public/demo-assets)을 미리 채운다. 라이브 경로(searchTnas)에서는
  // extractTnaImageFromEntries 가 실제 MRT 상품 사진으로 덮어쓰므로 데모 전용 폴백이다.
  cover_image_url: "/demo-assets/ouroboros-snake.png",
  location_visibility: "area",
  visibility: "private",
  requires_approval: true,
  recruit_capacity: 12,
  waitlist_enabled: true,
  mood: "quiet",
  participation_questions: [
    "이 모임에 관심 있는 이유가 궁금해요.",
    "혼자 오시나요, 함께 오시나요?",
  ],
  product_links: [
    {
      title: "야간 사진 워크숍",
      price_hint: "45,000원~",
      source_url: "https://www.myrealtrip.com/",
      product_type: "tna",
      reason: "산책 후 바로 이어가기 좋은 짧은 클래스",
      caution: "예약은 판매처에서 개별 진행",
    },
  ],
  safety_notes: [
    "‘소개팅’으로 읽힐 문구는 활동 중심으로 바꿨습니다.",
    "상품은 하단 연결 링크로만 두고 묶음결제 표현을 피했습니다.",
  ],
};

type ConnState = "connecting" | "connected" | "offline";

function resolveAgentEndpoint(): string {
  const v = process.env.NEXT_PUBLIC_AGENT_ENDPOINT;
  return v && v.trim().length > 0 ? v.trim() : "http://localhost:6790";
}

/** POST /auth/guest — 게스트 베어러 토큰 발급 */
async function mintGuestToken(agentEndpoint: string): Promise<string> {
  const res = await fetch(`${agentEndpoint}/auth/guest`, { method: "POST" });
  if (!res.ok) throw new Error(`auth/guest ${res.status}`);
  const body = (await res.json()) as { guestToken?: unknown };
  if (typeof body.guestToken !== "string" || body.guestToken.length === 0) {
    throw new Error("auth/guest: guestToken 누락");
  }
  return body.guestToken;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// searchTnas 툴콜 결과(실제 MyRealTrip CDN 상품 사진)에서 첫 이미지 URL을 추출한다.
// ★ LLM이 cover_image_url을 직접 안 채워도 결정적으로 실사진 커버를 확보하기 위함 —
//   tool 결과는 이미 entries에 있으므로 모델의 전사(transcription)에 의존하지 않는다.
function extractTnaImageFromEntries(entries: ReadonlyArray<ChatEntry>): string | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.kind === "tool-call" && /searchtnas/i.test(e.name) && e.result !== undefined) {
      let blob = "";
      try {
        blob = JSON.stringify(e.result);
      } catch {
        blob = "";
      }
      const m = blob.match(
        /https?:\/\/[^"'\\\s)]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s)]*)?/i,
      );
      if (m) return m[0];
    }
  }
  return null;
}

export interface HostCreateAgentPanelProps {
  /** 호스트가 "페이지에 반영"을 누르면 호출 — 검증된 payload 전달 */
  onApplyPayload: (payload: HostCreateAgentPayload) => void;
  /** 현재 왼쪽 초안 상태(라이브 안전 점검용) */
  draftSafety: SafetyCheckInput;
}

export default function HostCreateAgentPanel({
  onApplyPayload,
  draftSafety,
}: HostCreateAgentPanelProps) {
  const agentEndpoint = useMemo(resolveAgentEndpoint, []);

  // ── 연결 상태 (manifest fetch) ──
  const [conn, setConn] = useState<ConnState>("connecting");
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [connError, setConnError] = useState<string | null>(null);

  // ── 게스트 토큰 ──
  const guestTokenRef = useRef<string | null>(null);
  const getAuthToken = useCallback(() => guestTokenRef.current ?? undefined, []);

  // manifest(GET /)에서 sandboxProxyUrl 확보 + 토큰 발급. 실패=offline.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cached =
          typeof window !== "undefined"
            ? window.localStorage.getItem(LS_GUEST_TOKEN)
            : null;
        if (cached) guestTokenRef.current = cached;

        const res = await fetch(`${agentEndpoint}/`, {
          headers: { Accept: "application/json" },
        });
        if (cancelled) return;
        if (!res.ok) {
          setConnError(`백엔드 응답 ${res.status}`);
          setConn("offline");
          return;
        }
        const body = (await res.json()) as { sandboxProxyUrl?: unknown };
        if (
          typeof body.sandboxProxyUrl !== "string" ||
          body.sandboxProxyUrl.length === 0
        ) {
          setConnError("manifest 에 sandboxProxyUrl 없음");
          setConn("offline");
          return;
        }
        if (!guestTokenRef.current) {
          try {
            const fresh = await mintGuestToken(agentEndpoint);
            if (cancelled) return;
            guestTokenRef.current = fresh;
            window.localStorage.setItem(LS_GUEST_TOKEN, fresh);
          } catch {
            // 토큰 실패해도 연결은 진행 — 요청 시 401 처리에서 재발급
          }
        }
        setSandboxUrl(body.sandboxProxyUrl);
        setConn("connected");
      } catch (err) {
        if (cancelled) return;
        setConnError(err instanceof Error ? err.message : String(err));
        setConn("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentEndpoint]);

  const onUnauthenticated = useCallback(async (): Promise<boolean> => {
    try {
      const fresh = await mintGuestToken(agentEndpoint);
      guestTokenRef.current = fresh;
      window.localStorage.setItem(LS_GUEST_TOKEN, fresh);
      return true;
    } catch {
      return false;
    }
  }, [agentEndpoint]);

  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const onChatAllocated = useCallback((allocated: string) => {
    setChatId((prev) => (prev === allocated ? prev : allocated));
  }, []);

  // ── GGUI 채팅 훅 (항상 호출 — hook 규칙) ──
  const chat: UseMcpAppsChatResult = useMcpAppsChat({
    chatEndpoint: `${agentEndpoint}/agent`,
    snapshotEndpoint: `${agentEndpoint}/agent`,
    ...(chatId !== undefined ? { chatId } : {}),
    onChatAllocated,
    getAuthToken,
    onUnauthenticated,
  });
  const { entries, renders, sending, send, handleAppMessage, abort } = chat;

  const [prompt, setPrompt] = useState("");
  // 호스트가 검토 중인 제안 payload(에이전트 host_create_apply 또는 mock 주입)
  const [proposed, setProposed] = useState<HostCreateAgentPayload | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);

  // ── 웹 모드(공개 배포) ──
  // GGUI 백엔드(localhost:6790)는 공개 HTTPS 사이트에서 닿지 않는다(mixed-content/미기동).
  // conn === "offline" 이면 GGUI 대신 same-origin /api/agent(서버사이드 Claude)로 초안을 만든다.
  const webMode = conn === "offline";
  const [webMsgs, setWebMsgs] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [webBusy, setWebBusy] = useState(false);

  // 에이전트가 host_create_apply 툴을 호출하면 그 인자를 구조화 payload 로 추출.
  // entries 를 역순으로 훑어 가장 최근 호출 1건만 본다.
  useEffect(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      if (e.kind === "tool-call") {
        // MCP 네임스페이스는 mcp__<server>__<tool> (server 명에 _ 포함 가능 → host_create).
        // 접두 제거 대신 suffix 매칭으로 안전하게 식별한다.
        if (e.name === "host_create_apply" || e.name.endsWith("__host_create_apply")) {
          // 툴 인자 스키마는 { payload: {...} } 래핑(서버 zod inputSchema).
          // 래핑돼 있으면 .payload를, 아니면 input 자체를 검증한다.
          const inp = e.input as Record<string, unknown> | null | undefined;
          const raw =
            inp && typeof inp === "object" && inp.payload && typeof inp.payload === "object"
              ? inp.payload
              : e.input;
          const validated = validateAgentPayload(raw);
          // 커버가 비어 있으면 searchTnas 결과의 실제 상품 사진으로 결정적 보강
          if (!validated.cover_image_url) {
            const img = extractTnaImageFromEntries(entries);
            if (img) validated.cover_image_url = img;
          }
          if (!isPayloadEmpty(validated)) setProposed(validated);
          return;
        }
      }
    }
  }, [entries]);

  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  // ★ 이 패널은 바깥 CreateEventForm <form> 안에 렌더된다. 중첩 <form>은 HTML 위반
  //   (브라우저가 내부 form을 무시 → submit 이벤트 안 뜸)이므로, 채팅 입력은 form 없이
  //   버튼 onClick / Enter 로 직접 send 한다.
  function submitPrompt() {
    const text = prompt.trim();
    if (!text) return;

    // 웹 모드: GGUI 백엔드 대신 /api/agent(서버사이드 Claude)로 초안 생성
    if (webMode) {
      if (webBusy) return;
      setPrompt("");
      setWebMsgs((m) => [...m, { role: "user", text }]);
      setWebBusy(true);
      void fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      })
        .then(async (r) => {
          const d = (await r.json()) as {
            summary?: string;
            payload?: unknown;
            error?: string;
          };
          if (d.error) {
            setWebMsgs((m) => [
              ...m,
              { role: "assistant", text: `(오류) ${d.error}` },
            ]);
            return;
          }
          setWebMsgs((m) => [
            ...m,
            { role: "assistant", text: d.summary ?? "초안을 만들었어요." },
          ]);
          const p = validateAgentPayload(d.payload);
          if (!isPayloadEmpty(p)) setProposed(p);
        })
        .catch((err) => {
          setWebMsgs((m) => [
            ...m,
            {
              role: "assistant",
              text: `(오류) ${err instanceof Error ? err.message : String(err)}`,
            },
          ]);
        })
        .finally(() => setWebBusy(false));
      return;
    }

    // GGUI 모드
    if (sending) return;
    setPrompt("");
    // send 실패(백엔드 down 등)는 hook 내부에서 error 엔트리로 떨어진다
    void Promise.resolve(send(text)).catch(() => {});
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      submitPrompt();
    }
  };

  function handleChip(chip: string) {
    if (chip === "페이지 반영") {
      if (proposed) onApplyPayload(proposed);
      return;
    }
    if (chip === "안전 문구 점검") {
      setPrompt("지금 초안에서 오해 소지가 있는 표현이 있으면 짚어줘. 결제·예약 확정·소개팅처럼 보이는 문구 위주로.");
      return;
    }
    const map: Record<string, string> = {
      "상품 추천": "이 모임에 어울리는 마이리얼트립 상품을 하단 연결로 추천해줘. 묶음결제처럼 보이지 않게.",
      "일정 후보": "일정 후보 3개를 장단점과 함께 만들어줘.",
      "참여 안내": "승인·대기·관심 상태별 참여 안내 문구를 만들어줘. 외부 발송은 하지 말고 복사용으로.",
    };
    if (map[chip]) setPrompt(map[chip]);
  }

  // ── 라이브 안전 점검(현재 왼쪽 초안 기준) ──
  const liveFindings = useMemo(() => runSafetyCheck(draftSafety), [draftSafety]);

  const topRender = useMemo(
    () => (renders.length > 0 ? renders[renders.length - 1] : null),
    [renders],
  );

  return (
    // lg 이상: 뷰포트 높이로 패널을 상한 + sticky 고정 → 오른쪽 패널이 grid 행 높이를
    // 끌어올리지 못하게 막는다. 페이지 높이는 왼쪽 폼(=발행 옵션이 끝나는 높이)이 결정.
    // 모바일(stacked)은 종전대로 페이지 스크롤.
    <div className="flex min-h-[560px] flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:min-h-0">
      {/* 상단: Beta + 연결 상태 */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="rounded-pill bg-surface-sunken px-2.5 py-1 text-caption font-medium text-ink-muted">
          Beta
        </span>
        <span className="flex items-center gap-1.5 text-caption text-ink-faint">
          <span
            aria-hidden
            className={cx(
              "inline-block h-1.5 w-1.5 rounded-full",
              conn === "connected" || conn === "offline"
                ? "bg-success"
                : "bg-warn",
            )}
          />
          {conn === "connected"
            ? "에이전트 연결됨"
            : conn === "connecting"
              ? "에이전트 연결 중…"
              : "Claude 직접 연결 (웹)"}
        </span>
      </div>

      {/* 오프라인 안내 + 개발 검증 유틸 */}
      {webMode && webMsgs.length === 0 && (
        <div className="mb-4 space-y-2 rounded-xl border border-brand-soft bg-brand-soft/40 p-3">
          <p className="text-label text-ink-muted">
            원하는 이벤트를 아래에 적어보세요. 제목·소개·일정·연결 상품·안전 문구가 담긴
            초안을 만들어 드려요. 확인 후 “페이지에 반영”을 누르면 왼쪽 폼이 채워집니다.
          </p>
          <button
            type="button"
            onClick={() => setProposed(MOCK_PAYLOAD)}
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-caption font-medium text-ink hover:bg-surface-soft"
          >
            예시 초안 보기
          </button>
        </div>
      )}

      {/* 스크롤 영역 — 추천 질문 + 대화 로그 + 제안 카드 + 안전 점검을 한 컨테이너에 묶는다.
          min-h-0 은 flex 자식이 콘텐츠보다 작아질 수 있게 해 overflow-y-auto 를 실제로 발동시킨다
          (이게 빠지면 패널이 콘텐츠만큼 늘어나 페이지가 무한히 길어진다). */}
      <div
        ref={historyRef}
        role="log"
        aria-live="polite"
        className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto"
      >
        {/* 추천 질문 */}
        <div className="space-y-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setPrompt(q)}
              className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-left text-body-sm leading-6 text-ink transition hover:border-surface-borderStrong hover:shadow-card"
            >
              {q}
            </button>
          ))}
        </div>

        {/* 대화 로그 + 에이전트 렌더 (AppRenderer) */}
        {entries.map((entry, i) => (
          // 합성 키: 스트리밍 중 tool-call id가 일시 중복돼도 유니크 보장
          // (채팅 로그는 append-only라 index 사용이 안전)
          <ChatEntryView key={`${entry.id}_${i}`} entry={entry} />
        ))}

        {/* 웹 모드 대화 로그 (/api/agent) */}
        {webMode &&
          webMsgs.map((m, i) => (
            <div
              key={`web_${i}`}
              className={
                m.role === "user"
                  ? "ml-auto max-w-full whitespace-pre-wrap rounded-xl bg-surface-sunken px-3 py-2 text-body-sm leading-6 text-ink"
                  : "max-w-full rounded-xl bg-surface px-3 py-2 text-body-sm leading-6 text-ink"
              }
            >
              {m.role === "assistant" ? <MarkdownText text={m.text} /> : m.text}
            </div>
          ))}
        {webMode && webBusy && (
          <div className="px-3 py-2 text-caption text-ink-faint">
            에이전트가 초안을 작성하고 있어요…
          </div>
        )}

        {sandboxUrl && topRender && (
          <RenderFrame
            render={topRender}
            sandboxUrl={sandboxUrl}
            agentEndpoint={agentEndpoint}
            getAuthToken={getAuthToken}
            onAppMessage={handleAppMessage}
          />
        )}

        {/* 에이전트 제안 카드 — 사람 승인 후에만 페이지 반영 */}
        {proposed && (
          <ProposalCard
            payload={proposed}
            onApply={() => onApplyPayload(proposed)}
            onDismiss={() => setProposed(null)}
          />
        )}

        {/* 라이브 안전 점검 */}
        {liveFindings.length > 0 && (
          <SafetySection title="안전 점검 · 현재 초안" findings={liveFindings} />
        )}
      </div>

      {/* 스킬칩 + 입력 */}
      <div className="mt-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SKILL_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChip(chip)}
              className="whitespace-nowrap rounded-card border border-surface-border bg-surface px-3.5 py-2.5 text-label font-medium text-ink transition hover:bg-surface-soft"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-brand p-[1px] [border-right-color:var(--success-DEFAULT)] [border-bottom-color:var(--success-DEFAULT)]">
          <div className="rounded-[15px] bg-surface p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              rows={4}
              disabled={sending || webBusy}
              className="w-full resize-y border-0 bg-transparent text-body leading-7 text-ink placeholder:text-ink-faint focus-visible:outline-none"
              placeholder="원하는 이벤트를 적어주세요. 예: 서울에서 하는 3:3 랜덤 매칭 모임"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-caption text-ink-faint">
                답변·제안 확인 후 “페이지에 반영”
              </span>
              <button
                type="button"
                onClick={sending ? abort : submitPrompt}
                disabled={webBusy}
                aria-label={sending ? "중지" : "보내기"}
                className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xl leading-none text-surface transition hover:opacity-90 disabled:opacity-50"
              >
                {sending || webBusy ? "…" : "↑"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 대화 한 줄 (ChatEntry 판별 유니온 기준) ──
function ChatEntryView({ entry }: { entry: ChatEntry }) {
  switch (entry.kind) {
    case "render":
      return <div className="text-caption text-ink-faint">← 에이전트 UI</div>;
    case "tool-call": {
      const bare = entry.name.replace(/^mcp__.+?__/, "");
      return (
        <div className="text-caption text-ink-faint">
          · {bare}
          {entry.isError ? " (오류)" : ""}
        </div>
      );
    }
    case "end":
      return null;
    case "error":
      return (
        <div className="whitespace-pre-wrap rounded-xl bg-surface px-3 py-2 text-body-sm leading-6 text-warn">
          {entry.text}
        </div>
      );
    case "user":
      return (
        <div className="ml-auto max-w-full whitespace-pre-wrap rounded-xl bg-surface-sunken px-3 py-2 text-body-sm leading-6 text-ink">
          {entry.text}
        </div>
      );
    case "assistant":
      return (
        <div className="max-w-full rounded-xl bg-surface px-3 py-2 text-body-sm leading-6 text-ink">
          <MarkdownText text={entry.text} />
        </div>
      );
    default:
      return null;
  }
}

// ── 에이전트 제안 카드 ──
function ProposalCard({
  payload,
  onApply,
  onDismiss,
}: {
  payload: HostCreateAgentPayload;
  onApply: () => void;
  onDismiss: () => void;
}) {
  // 제안 본문 기준 호스트측 안전 재점검(에이전트가 놓친 게 있으면 표시)
  const findings = useMemo(
    () =>
      runSafetyCheck({
        title: payload.title ?? null,
        concept: payload.concept ?? null,
        description: payload.description ?? null,
        productCount: payload.product_links?.length ?? 0,
        locationVisibility: payload.location_visibility ?? null,
        capacityEnabled: payload.recruit_capacity != null,
      }),
    [payload],
  );

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-brand bg-brand-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label font-medium text-brand-softfg">에이전트 제안</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-caption text-ink-faint hover:text-ink"
          aria-label="제안 닫기"
        >
          ✕
        </button>
      </div>

      {payload.title && (
        <p className="text-h3 font-bold text-ink">{stripMarkdown(payload.title)}</p>
      )}
      {payload.concept && (
        <p className="text-body-sm text-ink-muted">{stripMarkdown(payload.concept)}</p>
      )}
      {payload.description && (
        <p className="line-clamp-4 whitespace-pre-wrap text-body-sm leading-6 text-ink">
          {stripMarkdown(payload.description)}
        </p>
      )}

      {payload.product_links && payload.product_links.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-caption font-medium text-ink-muted">연결 상품</p>
          {payload.product_links.map((pl, i) => (
            <div
              key={i}
              className="rounded-lg border border-surface-border bg-surface px-3 py-2"
            >
              <p className="text-body-sm font-medium text-ink">{pl.title}</p>
              <p className="text-caption text-ink-muted">
                {pl.price_hint ?? "가격 미정"}
                {pl.reason ? ` · ${pl.reason}` : ""}
              </p>
            </div>
          ))}
          <p className="text-caption text-ink-faint">
            예약은 각 판매처에서 개별 진행됩니다.
          </p>
        </div>
      )}

      {payload.safety_notes && payload.safety_notes.length > 0 && (
        <ul className="space-y-1">
          {payload.safety_notes.map((note, i) => (
            <li key={i} className="text-caption text-ink-muted">
              · {note}
            </li>
          ))}
        </ul>
      )}

      {findings.length > 0 && <SafetySection title="안전 점검 · 제안" findings={findings} />}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onApply}
          className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-label font-medium text-surface hover:opacity-90"
        >
          페이지에 반영
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-surface-border bg-surface px-4 py-2.5 text-label font-medium text-ink hover:bg-surface-soft"
        >
          무시
        </button>
      </div>
    </div>
  );
}

// ── 안전 점검 섹션 ──
function SafetySection({ title, findings }: { title: string; findings: SafetyFinding[] }) {
  const sevClass: Record<SafetyFinding["severity"], string> = {
    high: "text-warn",
    medium: "text-ink",
    low: "text-ink-muted",
  };
  return (
    <div className="mt-3 space-y-1.5 rounded-xl border border-surface-border bg-surface p-3">
      <p className="text-caption font-medium text-ink-muted">{title}</p>
      <ul className="space-y-1.5">
        {findings.map((f) => (
          <li key={f.id} className="text-caption leading-5">
            <span className={cx("font-medium", sevClass[f.severity])}>● </span>
            <span className="text-ink">{f.message}</span>
            <span className="text-ink-faint"> → {f.suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── AppRenderer 래퍼: 에이전트가 ggui_render 한 UI(샌드박스 iframe)를 렌더 ──
// 인라인된 resource HTML 을 그대로 mount. 툴콜은 agent 백엔드로 relay.
function RenderFrame({
  render,
  sandboxUrl,
  agentEndpoint,
  getAuthToken,
  onAppMessage,
}: {
  render: RenderRef;
  sandboxUrl: string;
  agentEndpoint: string;
  getAuthToken: () => string | undefined;
  onAppMessage: UseMcpAppsChatResult["handleAppMessage"];
}) {
  const html = render.inlinedResource?.text;
  const inlinedCsp = render.inlinedResource?.csp;

  const sandbox: SandboxConfig = useMemo(() => {
    const url = new URL(sandboxUrl);
    if (!inlinedCsp) return { url };
    const csp: { connectDomains?: string[]; resourceDomains?: string[] } = {};
    if (inlinedCsp.connectDomains) csp.connectDomains = [...inlinedCsp.connectDomains];
    if (inlinedCsp.resourceDomains) csp.resourceDomains = [...inlinedCsp.resourceDomains];
    return { url, csp };
  }, [sandboxUrl, inlinedCsp]);

  const onCallTool = useCallback(
    async (
      params: CallToolRequest["params"],
      _extra: RequestHandlerExtra,
    ): Promise<CallToolResult> => {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const resp = await fetch(`${agentEndpoint}/agent`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            kind: "tool-call",
            name: params.name,
            arguments: params.arguments ?? {},
          }),
        });
        if (!resp.ok) return { isError: true, content: [] };
        const jsonRpc = (await resp.json()) as {
          result?: CallToolResult;
          error?: { message?: string };
        };
        if (jsonRpc.error) {
          return {
            isError: true,
            content: [{ type: "text", text: jsonRpc.error.message ?? "relay error" }],
          };
        }
        return jsonRpc.result ?? { content: [] };
      } catch {
        return { isError: true, content: [] };
      }
    },
    [agentEndpoint, getAuthToken],
  );

  const onReadResource = useCallback(
    async (
      params: ReadResourceRequest["params"],
      _extra: RequestHandlerExtra,
    ): Promise<ReadResourceResult> => {
      throw new Error(
        `[RenderFrame] resources/read(${params.uri})는 호스트 relay 미지원 — 에이전트 서버가 첫 결과에 인라인합니다.`,
      );
    },
    [],
  );

  if (html === undefined) {
    return (
      <p className="rounded-lg border border-surface-border bg-surface-soft px-3 py-2 text-caption text-ink-faint">
        에이전트 UI 가 아직 인라인되지 않았습니다.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border">
      <AppRenderer
        key={render.resourceUri}
        toolName="ggui_render"
        sandbox={sandbox}
        html={html}
        onReadResource={onReadResource}
        onCallTool={onCallTool}
        onMessage={onAppMessage}
        onError={() => {}}
      />
    </div>
  );
}
