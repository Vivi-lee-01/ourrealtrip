// 호스트 이벤트 draft 스토어 — Phase 1 (백엔드 없음)
//
// /host/create 폼에서 생성한 이벤트 초안을 .data/drafts.json 에 저장한다.
// .data/는 gitignore. 인터페이스는 swappable: 향후 Supabase 교체 시 아래 함수
// 시그니처를 유지한 채 내부만 insert/select(RLS host_id 기준)로 바꾼다.
//
// ★ A방식(merchant 아님) 불변식: 이 스토어는 가격을 price_hint(표시 문자열)로만
//   다룬다. 결제 금액/PG/정산 필드는 존재하지 않는다. 결제는 마이리얼트립 판매처에서
//   각자 진행하며(/go 리다이렉트), OurRealTrip은 결제를 수취하지 않는다.

import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ProductType,
  Visibility,
  EventAudience,
  LocationVisibility,
  MoodPreset,
  ScheduleCandidate,
  DraftOption,
  ProposalStatus,
} from "@/lib/types";

// Vercel 서버리스는 읽기전용 FS → /tmp 로 분기 (로컬은 프로젝트 루트 .data).
// 단, draft 발행은 Supabase insert 가 우선이며 파일 경로는 폴백/로컬 전용이다.
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "ourrealtrip-data")
  : path.join(process.cwd(), ".data");
const DRAFTS_FILE = path.join(DATA_DIR, "drafts.json");

/** draft에 연결된 마이리얼트립 상품(A방식: 표시 전용) */
export interface DraftProductLink {
  /** 상품 유형(투어·티켓·액티비티/숙소/항공) */
  product_type: ProductType;
  /** 판매처(항상 "마이리얼트립" 류 — 공식 오인 방지 고지와 함께 표시) */
  source: string;
  title: string;
  /** 가격 표시 문자열(예: "45,000원~"). 확정가 아님 — checked_at 기준 변동 가능 */
  price_hint: string | null;
  /** 마이리얼트립 상품 페이지 URL(있으면 /go 리다이렉트 대상) */
  source_url: string | null;
  /** searchTnas 등에서 받은 상품 id(있으면) */
  myrealtrip_product_id: string | null;
}

/** 생성 방식 — 사람 직접 입력 vs GGUI 에이전트 보조 */
export type DraftCreatedVia = "human" | "agent" | "mcp";

type EventDraftRow = Omit<EventDraft, "product_links"> & {
  product_links: unknown;
};

/**
 * 이벤트 draft (Luma create 폼 대응). 발행 전 초안이므로 status는 항상 "draft".
 * 발행(공개 trips/[slug] 노출)은 사람 승인 게이트 통과 후 별도 단계.
 */
export interface EventDraft {
  draft_id: string;
  /** 공유/미리보기 URL 키 */
  slug: string;
  /** Supabase Auth user.id 기반 소유자. 로컬 데모/기존 데이터는 null. */
  host_user_id: string | null;
  title: string;
  /** 한 줄 컨셉(부제) */
  concept: string | null;
  /** 본문 설명 */
  description: string | null;
  /** 일시 표시 문자열(예: "5월 30일 토 오후 8:30 – 9:30") */
  date_text: string | null;
  /** 시간대 표시 문자열(예: "GMT+09:00 서울") */
  timezone: string | null;
  /** 장소(오프라인 주소 또는 가상 링크) */
  location_text: string | null;
  /** 커버 이미지 URL(없으면 그라데이션 폴백) */
  cover_image_url: string | null;
  /** 모집 인원(null = 무제한) */
  recruit_capacity: number | null;
  /** 참여 승인 필요 여부 */
  requires_approval: boolean;
  /** 정원 초과 시 대기자 명단 허용 여부 */
  waitlist_enabled: boolean;
  /** 노출 범위(Phase 1 기본 unlisted) — audience 에서 파생(접근 제어용) */
  visibility: Visibility;
  /** UI 공개 범위 3-way (P1-1): public/unlisted/draft */
  audience: EventAudience;
  /** 호스트 커뮤니티/채널 (P1-2). null=개인 */
  community_id: string | null;
  /** 장소 공개 수준 (P1-5) */
  location_visibility: LocationVisibility | null;
  /** 분위기/테마 프리셋 (P1-4) */
  mood: MoodPreset | null;
  /** 승인 필요 시 신청자에게 물을 질문 (P1-6) */
  participation_questions: string[];
  /** 일정 후보 (P2-1 foundation) */
  schedule_candidates: ScheduleCandidate[];
  /** 옵션 A/B/C (P2-2 foundation) */
  options: DraftOption[];
  /** 운영 단계 (P2-3): draft→interest_check→option_refining→booking_open… */
  lifecycle: ProposalStatus;
  /** 연결 상품(A방식 표시 전용, 0개 이상) */
  product_links: DraftProductLink[];
  created_via: DraftCreatedVia;
  /** draft=초안(비공개) / published=발행(공개 /e/[slug] 노출) */
  status: "draft" | "published";
  /** 발행 시각(null=미발행) */
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 폼/에이전트가 넘기는 draft 생성 입력(서버에서 id·slug·시각 채움) */
export interface CreateDraftInput {
  title: string;
  host_user_id?: string | null;
  concept?: string | null;
  description?: string | null;
  date_text?: string | null;
  timezone?: string | null;
  location_text?: string | null;
  cover_image_url?: string | null;
  recruit_capacity?: number | null;
  requires_approval?: boolean;
  waitlist_enabled?: boolean;
  visibility?: Visibility;
  audience?: EventAudience;
  community_id?: string | null;
  location_visibility?: LocationVisibility | null;
  mood?: MoodPreset | null;
  participation_questions?: string[];
  schedule_candidates?: ScheduleCandidate[];
  options?: DraftOption[];
  lifecycle?: ProposalStatus;
  product_links?: DraftProductLink[];
  created_via?: DraftCreatedVia;
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readDrafts(): Promise<EventDraft[]> {
  try {
    const raw = await fs.readFile(DRAFTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EventDraft[]) : [];
  } catch {
    return [];
  }
}

async function writeDrafts(rows: EventDraft[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DRAFTS_FILE, JSON.stringify(rows, null, 2), "utf8");
}

/**
 * 제목에서 URL-safe slug 생성.
 * ★ ASCII 전용: Next App Router의 한글 동적 세그먼트가 404를 내는 문제를 피하려고
 *   라틴 글자/숫자만 남긴다. 한글 등 비-ASCII만 있는 제목이면 안정적인 short-id로 폴백.
 */
function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // ASCII 영숫자 외(한글 포함) → 하이픈
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  // base가 비거나 너무 짧으면(한글 제목 등) event-<id>로 폴백
  return base.length >= 2 ? `${base}-${suffix}` : `event-${suffix}`;
}

function normalizeDraft(row: EventDraftRow): EventDraft {
  return {
    ...row,
    concept: row.concept ?? null,
    description: row.description ?? null,
    date_text: row.date_text ?? null,
    timezone: row.timezone ?? null,
    location_text: row.location_text ?? null,
    cover_image_url: row.cover_image_url ?? null,
    recruit_capacity: row.recruit_capacity ?? null,
    community_id: row.community_id ?? null,
    location_visibility: row.location_visibility ?? null,
    mood: row.mood ?? null,
    published_at: row.published_at ?? null,
    participation_questions: Array.isArray(row.participation_questions)
      ? row.participation_questions
      : [],
    schedule_candidates: Array.isArray(row.schedule_candidates)
      ? row.schedule_candidates
      : [],
    options: Array.isArray(row.options) ? row.options : [],
    product_links: Array.isArray(row.product_links)
      ? (row.product_links as DraftProductLink[])
      : [],
  };
}

function buildDraft(input: CreateDraftInput): EventDraft {
  const now = new Date().toISOString();
  // audience(UI 3-way)에서 접근제어용 visibility 파생. private→unlisted, public→public.
  const audience: EventAudience = input.audience ?? "private";
  return {
    draft_id: crypto.randomUUID(),
    slug: slugify(input.title),
    host_user_id: input.host_user_id?.trim() || null,
    title: input.title.trim(),
    concept: input.concept?.trim() || null,
    description: input.description?.trim() || null,
    date_text: input.date_text?.trim() || null,
    timezone: input.timezone?.trim() || null,
    location_text: input.location_text?.trim() || null,
    cover_image_url: input.cover_image_url?.trim() || null,
    recruit_capacity:
      input.recruit_capacity != null && input.recruit_capacity > 0
        ? Math.floor(input.recruit_capacity)
        : null,
    requires_approval: Boolean(input.requires_approval),
    waitlist_enabled: Boolean(input.waitlist_enabled),
    visibility: input.visibility ?? (audience === "public" ? "public" : "unlisted"),
    audience,
    community_id: input.community_id?.trim() || null,
    location_visibility: input.location_visibility ?? null,
    mood: input.mood ?? null,
    participation_questions: input.participation_questions ?? [],
    schedule_candidates: input.schedule_candidates ?? [],
    options: input.options ?? [],
    lifecycle: input.lifecycle ?? "draft",
    product_links: input.product_links ?? [],
    created_via: input.created_via ?? "human",
    status: "draft",
    published_at: null,
    created_at: now,
    updated_at: now,
  };
}

async function shouldUseSupabase(): Promise<boolean> {
  return isSupabaseConfigured();
}

/** draft 한 건을 생성·저장하고 저장된 객체를 반환한다 */
export async function createDraft(
  input: CreateDraftInput,
): Promise<EventDraft> {
  const draft = buildDraft(input);
  if (await shouldUseSupabase()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase client is not configured");
    const { data, error } = await supabase
      .from("event_draft")
      .insert(draft)
      .select("*")
      .single();
    if (error) throw new Error(`event_draft insert failed: ${error.message}`);
    return normalizeDraft(data as EventDraftRow);
  }

  const rows = await readDrafts();
  rows.push(draft);
  await writeDrafts(rows);
  return draft;
}

/**
 * draft를 발행(published)한다 — 공개 /e/[slug] 노출 시작.
 * ★ 사람 승인 게이트: 이 함수는 호스트가 미리보기에서 명시적으로 호출할 때만 실행된다
 *   (에이전트 자동 발행 금지, PRD 2-C). 이미 published면 그대로 반환.
 */
export async function publishDraft(
  id: string,
  ownerUserId?: string | null,
): Promise<EventDraft | null> {
  if (await shouldUseSupabase()) {
    const now = new Date().toISOString();
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase client is not configured");
    let query = supabase
      .from("event_draft")
      .update({ status: "published", published_at: now, updated_at: now })
      .eq("draft_id", id);
    if (ownerUserId) query = query.eq("host_user_id", ownerUserId);
    const { data, error } = await query.select("*").maybeSingle();
    if (error) throw new Error(`event_draft publish failed: ${error.message}`);
    return data ? normalizeDraft(data as EventDraftRow) : null;
  }

  const rows = await readDrafts();
  const idx = rows.findIndex((d) => d.draft_id === id);
  if (idx < 0) return null;
  if (ownerUserId && rows[idx].host_user_id && rows[idx].host_user_id !== ownerUserId) {
    return null;
  }
  const now = new Date().toISOString();
  rows[idx] = {
    ...rows[idx],
    status: "published",
    published_at: rows[idx].published_at ?? now,
    updated_at: now,
  };
  await writeDrafts(rows);
  return rows[idx];
}

/** draft_id로 조회(없으면 null) */
export async function getDraftById(
  id: string,
  ownerUserId?: string | null,
): Promise<EventDraft | null> {
  if (await shouldUseSupabase()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase client is not configured");
    let query = supabase.from("event_draft").select("*").eq("draft_id", id);
    if (ownerUserId) query = query.eq("host_user_id", ownerUserId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`event_draft select failed: ${error.message}`);
    return data ? normalizeDraft(data as EventDraftRow) : null;
  }

  const rows = await readDrafts();
  const draft = rows.find((d) => d.draft_id === id) ?? null;
  if (!draft) return null;
  if (ownerUserId && draft.host_user_id && draft.host_user_id !== ownerUserId) return null;
  return draft;
}

/** slug로 조회(없으면 null) */
export async function getDraftBySlug(slug: string): Promise<EventDraft | null> {
  if (await shouldUseSupabase()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase client is not configured");
    const { data, error } = await supabase
      .from("event_draft")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`event_draft select by slug failed: ${error.message}`);
    return data ? normalizeDraft(data as EventDraftRow) : null;
  }

  const rows = await readDrafts();
  return rows.find((d) => d.slug === slug) ?? null;
}

/** 전체 draft 목록(최근 생성 우선) */
export async function listDrafts(ownerUserId?: string | null): Promise<EventDraft[]> {
  if (await shouldUseSupabase()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase client is not configured");
    let query = supabase
      .from("event_draft")
      .select("*")
      .order("created_at", { ascending: false });
    if (ownerUserId) query = query.eq("host_user_id", ownerUserId);
    const { data, error } = await query;
    if (error) throw new Error(`event_draft list failed: ${error.message}`);
    return (data ?? []).map((row) => normalizeDraft(row as EventDraftRow));
  }

  const rows = await readDrafts();
  const visibleRows = ownerUserId
    ? rows.filter((d) => !d.host_user_id || d.host_user_id === ownerUserId)
    : rows;
  return visibleRows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}
