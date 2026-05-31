// 호스트 이벤트 생성 — 에이전트 구조화 payload 스키마 + 검증기 (P0-2)
//
// 이 모듈은 "에이전트가 만든 제안 → 호스트가 검토 → 페이지에 반영"의 **단일 계약**이다.
// 세 경계가 같은 타입을 공유한다:
//   1) GGUI MCP 툴(host_create_apply)의 structuredContent (서버 측)
//   2) 클라이언트 브리지 applyPayload() (CreateEventForm)
//   3) 폼 상태 매핑
//
// ★ 안전 불변식(merchant 아님):
//   - product_links는 표시(price_hint/외부 URL) 전용. 결제 금액/PG/정산 필드 없음.
//   - externally_confirmed 같은 외부검증 상태는 이 payload로 세팅 불가(UI 금지).
//   - 발행/booking_open/외부 공유는 이 payload로 트리거하지 않는다(draft/preview까지만).
//
// 검증 규칙(handoff P0-2):
//   - 잘못된 product_type은 "tna" fallback
//   - product_links는 최대 10개로 제한
//   - recruit_capacity는 finite positive number만 허용

import type {
  ProductType,
  EventAudience,
  LocationVisibility,
  MoodPreset,
} from "@/lib/types";

// 단일 출처: 공개범위/장소공개/분위기 타입은 lib/types.ts 정의를 재사용·재노출한다.
export type { LocationVisibility, MoodPreset };

/** UI 레벨 공개 범위(= EventAudience) — 공개/비공개 2-way */
export type AgentVisibility = EventAudience;

/** 에이전트가 제안하는 연결 상품 1건 (A방식 표시 전용) */
export interface AgentProductLink {
  title: string;
  price_hint?: string | null;
  source_url?: string | null;
  product_type: ProductType;
  /** 왜 이 상품을 붙였는지 (선택) */
  reason?: string | null;
  /** 주의 고지 (선택) */
  caution?: string | null;
}

/** 일정 후보 1건 (P2-1 foundation) */
export interface AgentScheduleCandidate {
  /** 표시 라벨(예: "후보 A") */
  label: string;
  /** 일시 표시 문자열 */
  date_text: string;
  pros?: string | null;
  cons?: string | null;
}

/** 옵션 A/B/C 1건 (P2-2 foundation) */
export interface AgentTravelOption {
  option_name: string;
  option_type?: "basic" | "premium" | "budget" | "experimental";
  description?: string | null;
  estimated_budget?: string | null;
  fit_reason?: string | null;
  risk_note?: string | null;
  schedule_difficulty?: "low" | "mid" | "high";
  product_links?: AgentProductLink[];
}

/**
 * 에이전트 → 페이지 반영 payload (handoff P0-2 권장 타입 + P1/P2 확장).
 * 모든 필드는 optional — 에이전트가 채운 부분만 호스트 승인 후 반영된다.
 */
export interface HostCreateAgentPayload {
  // ── P0 코어 ──
  title?: string;
  concept?: string;
  description?: string;
  date_text?: string;
  timezone?: string;
  location_text?: string;
  cover_image_url?: string;
  visibility?: AgentVisibility;
  community_id?: string;
  requires_approval?: boolean;
  recruit_capacity?: number;
  waitlist_enabled?: boolean;
  participation_questions?: string[];
  product_links?: AgentProductLink[];
  safety_notes?: string[];

  // ── P1 확장 ──
  location_visibility?: LocationVisibility;
  mood?: MoodPreset;

  // ── P2 foundation ──
  schedule_candidates?: AgentScheduleCandidate[];
  options?: AgentTravelOption[];
}

const PRODUCT_TYPES: readonly ProductType[] = ["tna", "stay", "flight"];
const LOCATION_VISIBILITIES: readonly LocationVisibility[] = [
  "exact",
  "area",
  "after_approval",
  "online",
  "tbd",
];
const MOODS: readonly MoodPreset[] = [
  "quiet",
  "casual",
  "deep",
  "active",
  "local",
  "premium",
];
const OPTION_TYPES = ["basic", "premium", "budget", "experimental"] as const;
const SCHEDULE_DIFFICULTIES = ["low", "mid", "high"] as const;

const MAX_PRODUCT_LINKS = 10;
const MAX_QUESTIONS = 8;
const MAX_SAFETY_NOTES = 12;
const MAX_SCHEDULE_CANDIDATES = 6;
const MAX_OPTIONS = 4;

function asString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

function asStringOrNull(v: unknown): string | null {
  const s = asString(v);
  return s ?? null;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

/** finite positive integer만 통과(아니면 undefined) */
function asPositiveInt(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

function asStringArray(v: unknown, max: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.map(asString).filter((s): s is string => s !== undefined);
  return out.length > 0 ? out.slice(0, max) : undefined;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : undefined;
}

function normalizeProductLink(raw: unknown): AgentProductLink | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = asString(r.title);
  if (!title) return null; // 제목 없는 상품 행은 버린다
  return {
    title,
    price_hint: asStringOrNull(r.price_hint),
    source_url: asStringOrNull(r.source_url),
    // 잘못된 product_type은 "tna" fallback (handoff P0-2)
    product_type: oneOf(r.product_type, PRODUCT_TYPES) ?? "tna",
    reason: asStringOrNull(r.reason),
    caution: asStringOrNull(r.caution),
  };
}

function normalizeProductLinks(v: unknown): AgentProductLink[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map(normalizeProductLink)
    .filter((p): p is AgentProductLink => p !== null)
    .slice(0, MAX_PRODUCT_LINKS); // 최대 10개 (handoff P0-2)
  return out.length > 0 ? out : undefined;
}

function normalizeScheduleCandidates(
  v: unknown,
): AgentScheduleCandidate[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: AgentScheduleCandidate[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const label = asString(r.label);
    const date_text = asString(r.date_text);
    if (!label || !date_text) continue;
    out.push({
      label,
      date_text,
      pros: asStringOrNull(r.pros),
      cons: asStringOrNull(r.cons),
    });
    if (out.length >= MAX_SCHEDULE_CANDIDATES) break;
  }
  return out.length > 0 ? out : undefined;
}

function normalizeOptions(v: unknown): AgentTravelOption[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: AgentTravelOption[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const option_name = asString(r.option_name);
    if (!option_name) continue;
    out.push({
      option_name,
      option_type: oneOf(r.option_type, OPTION_TYPES),
      description: asStringOrNull(r.description),
      estimated_budget: asStringOrNull(r.estimated_budget),
      fit_reason: asStringOrNull(r.fit_reason),
      risk_note: asStringOrNull(r.risk_note),
      schedule_difficulty: oneOf(r.schedule_difficulty, SCHEDULE_DIFFICULTIES),
      product_links: normalizeProductLinks(r.product_links),
    });
    if (out.length >= MAX_OPTIONS) break;
  }
  return out.length > 0 ? out : undefined;
}

/**
 * 임의 입력(LLM 툴 콜 인자 등)을 안전한 HostCreateAgentPayload로 정규화한다.
 * 알 수 없는/불량 필드는 조용히 떨어지고, 정의된 필드만 남는다.
 * 빈 객체가 들어오면 빈 payload({})를 반환한다(throw 하지 않음).
 */
export function validateAgentPayload(raw: unknown): HostCreateAgentPayload {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: HostCreateAgentPayload = {};

  const title = asString(r.title);
  if (title) out.title = title;
  const concept = asString(r.concept);
  if (concept) out.concept = concept;
  const description = asString(r.description);
  if (description) out.description = description;
  const date_text = asString(r.date_text);
  if (date_text) out.date_text = date_text;
  const timezone = asString(r.timezone);
  if (timezone) out.timezone = timezone;
  const location_text = asString(r.location_text);
  if (location_text) out.location_text = location_text;
  const cover_image_url = asString(r.cover_image_url);
  if (cover_image_url) out.cover_image_url = cover_image_url;
  const community_id = asString(r.community_id);
  if (community_id) out.community_id = community_id;

  // 공개/비공개 2-way로 정규화. 구 값(unlisted/draft) 또는 임의 문자열은 비공개로 흡수.
  if (typeof r.visibility === "string") {
    out.visibility = r.visibility === "public" ? "public" : "private";
  }
  const location_visibility = oneOf(r.location_visibility, LOCATION_VISIBILITIES);
  if (location_visibility) out.location_visibility = location_visibility;
  const mood = oneOf(r.mood, MOODS);
  if (mood) out.mood = mood;

  const requires_approval = asBool(r.requires_approval);
  if (requires_approval !== undefined) out.requires_approval = requires_approval;
  const waitlist_enabled = asBool(r.waitlist_enabled);
  if (waitlist_enabled !== undefined) out.waitlist_enabled = waitlist_enabled;

  const recruit_capacity = asPositiveInt(r.recruit_capacity);
  if (recruit_capacity !== undefined) out.recruit_capacity = recruit_capacity;

  const participation_questions = asStringArray(
    r.participation_questions,
    MAX_QUESTIONS,
  );
  if (participation_questions) out.participation_questions = participation_questions;
  const safety_notes = asStringArray(r.safety_notes, MAX_SAFETY_NOTES);
  if (safety_notes) out.safety_notes = safety_notes;

  const product_links = normalizeProductLinks(r.product_links);
  if (product_links) out.product_links = product_links;
  const schedule_candidates = normalizeScheduleCandidates(r.schedule_candidates);
  if (schedule_candidates) out.schedule_candidates = schedule_candidates;
  const options = normalizeOptions(r.options);
  if (options) out.options = options;

  return out;
}

/** payload에 실제로 반영할 내용이 하나라도 있는지 */
export function isPayloadEmpty(p: HostCreateAgentPayload): boolean {
  return Object.keys(p).length === 0;
}
