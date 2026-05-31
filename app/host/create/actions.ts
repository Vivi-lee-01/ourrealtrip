"use server";

// /host/create 폼의 server action — draft 생성 후 미리보기로 이동
//
// ★ A방식(merchant 아님): 가격은 price_hint 표시 문자열로만 받는다. 결제 금액/PG
//   필드 없음. 발행이 아니라 draft 저장이므로 외부 부작용 없음(공개 노출 X).

import { redirect } from "next/navigation";
import { createDraft } from "@/lib/store/drafts";
import { getHostAuthContext } from "@/lib/auth/host";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  DraftProductLink,
  DraftCreatedVia,
} from "@/lib/store/drafts";
import type {
  ProductType,
  EventAudience,
  LocationVisibility,
  MoodPreset,
  ScheduleCandidate,
  DraftOption,
  OptionType,
  ScheduleDifficulty,
} from "@/lib/types";

const AUDIENCES: EventAudience[] = ["public", "private"];
const LOCATION_VISIBILITIES: LocationVisibility[] = [
  "exact",
  "area",
  "after_approval",
  "online",
  "tbd",
];
const MOODS: MoodPreset[] = ["quiet", "casual", "deep", "active", "local", "premium"];
const OPTION_TYPES: OptionType[] = ["basic", "premium", "budget", "experimental"];
const SCHEDULE_DIFFICULTIES: ScheduleDifficulty[] = ["low", "mid", "high"];

/** unknown → trimmed string | null */
function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/**
 * 클라이언트가 hidden input(JSON)으로 보낸 일정 후보를 파싱·재검증한다(P2-1).
 * 폼 필드라 변조 가능 → 신뢰하지 않고 형태/개수를 다시 막는다.
 */
function parseScheduleCandidates(form: FormData): ScheduleCandidate[] {
  const raw = str(form, "schedule_candidates");
  if (!raw) return [];
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const out: ScheduleCandidate[] = [];
    for (const it of arr) {
      if (!it || typeof it !== "object") continue;
      const r = it as Record<string, unknown>;
      const label = strOrNull(r.label);
      const date_text = strOrNull(r.date_text);
      if (!label || !date_text) continue;
      out.push({ label, date_text, pros: strOrNull(r.pros), cons: strOrNull(r.cons) });
      if (out.length >= 6) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** 옵션 A/B/C 파싱·재검증 (P2-2) */
function parseOptions(form: FormData): DraftOption[] {
  const raw = str(form, "options");
  if (!raw) return [];
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const out: DraftOption[] = [];
    for (const it of arr) {
      if (!it || typeof it !== "object") continue;
      const r = it as Record<string, unknown>;
      const option_name = strOrNull(r.option_name);
      if (!option_name) continue;
      out.push({
        option_name,
        option_type: OPTION_TYPES.includes(r.option_type as OptionType)
          ? (r.option_type as OptionType)
          : null,
        description: strOrNull(r.description),
        estimated_budget: strOrNull(r.estimated_budget),
        fit_reason: strOrNull(r.fit_reason),
        risk_note: strOrNull(r.risk_note),
        schedule_difficulty: SCHEDULE_DIFFICULTIES.includes(
          r.schedule_difficulty as ScheduleDifficulty,
        )
          ? (r.schedule_difficulty as ScheduleDifficulty)
          : null,
      });
      if (out.length >= 4) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** form value를 안전한 trimmed 문자열로(없으면 null) */
function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

const PRODUCT_TYPES: ProductType[] = ["tna", "stay", "flight"];

/**
 * 폼에서 product_link 묶음을 파싱한다(인덱스 기반 필드명).
 * pl_title_0 / pl_price_0 / pl_url_0 / pl_type_0 … 형태.
 * title이 비면 그 행은 무시한다.
 */
function parseProductLinks(form: FormData): DraftProductLink[] {
  const out: DraftProductLink[] = [];
  for (let i = 0; i < 10; i++) {
    const title = str(form, `pl_title_${i}`);
    if (!title) continue;
    const rawType = str(form, `pl_type_${i}`);
    const product_type: ProductType = PRODUCT_TYPES.includes(
      rawType as ProductType,
    )
      ? (rawType as ProductType)
      : "tna";
    out.push({
      product_type,
      source: str(form, `pl_source_${i}`) ?? "마이리얼트립",
      title,
      price_hint: str(form, `pl_price_${i}`),
      source_url: str(form, `pl_url_${i}`),
      myrealtrip_product_id: str(form, `pl_mrtid_${i}`),
    });
  }
  return out;
}

export async function createEventDraftAction(form: FormData): Promise<void> {
  const auth = await getHostAuthContext();
  if (isSupabaseConfigured() && !auth) {
    redirect("/login?next=/host/create");
  }

  const title = str(form, "title");
  if (!title) {
    // 제목 없으면 진행 불가 — 폼에서 required로 막지만 서버에서도 방어
    throw new Error("이벤트 이름은 필수입니다.");
  }

  const capacityRaw = str(form, "recruit_capacity");
  const recruit_capacity = capacityRaw ? Number(capacityRaw) : null;

  const createdViaRaw = str(form, "created_via");
  const created_via: DraftCreatedVia =
    createdViaRaw === "agent" ? "agent" : "human";

  // ── P1 필드 파싱 ──
  const audienceRaw = str(form, "audience") as EventAudience | null;
  const audience: EventAudience =
    audienceRaw && AUDIENCES.includes(audienceRaw) ? audienceRaw : "private";

  const locVisRaw = str(form, "location_visibility") as LocationVisibility | null;
  const location_visibility =
    locVisRaw && LOCATION_VISIBILITIES.includes(locVisRaw) ? locVisRaw : null;

  const moodRaw = str(form, "mood") as MoodPreset | null;
  const mood = moodRaw && MOODS.includes(moodRaw) ? moodRaw : null;

  // 커뮤니티: "__new__"(새로 만들기)·빈값(개인)은 null 로 저장
  let community_id = str(form, "community_id");
  if (community_id === "__new__") community_id = null;

  // 승인 질문: 줄바꿈 구분 textarea → 최대 8개
  const pqRaw = str(form, "participation_questions");
  const participation_questions = pqRaw
    ? pqRaw
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s !== "")
        .slice(0, 8)
    : [];

  const draft = await createDraft({
    title,
    host_user_id: auth?.userId ?? null,
    concept: str(form, "concept"),
    description: str(form, "description"),
    date_text: str(form, "date_text"),
    timezone: str(form, "timezone"),
    location_text: str(form, "location_text"),
    cover_image_url: str(form, "cover_image_url"),
    recruit_capacity:
      recruit_capacity != null && Number.isFinite(recruit_capacity)
        ? recruit_capacity
        : null,
    requires_approval: form.get("requires_approval") === "on",
    waitlist_enabled: form.get("waitlist_enabled") === "on",
    audience,
    community_id,
    location_visibility,
    mood,
    participation_questions,
    schedule_candidates: parseScheduleCandidates(form),
    options: parseOptions(form),
    product_links: parseProductLinks(form),
    created_via,
  });

  // 저장 후 미리보기로 이동(발행 아님 — 공개 노출 전 호스트 검토 단계)
  redirect(`/host/preview/${draft.draft_id}`);
}
