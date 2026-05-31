// 로컬 JSON 스토어 — Phase 1 RSVP·클릭 기록 (백엔드 없음)
//
// .data/interest.json, .data/clicks.json 에 append 한다. .data/는 gitignore.
// 인터페이스는 swappable: 향후 Supabase로 교체 시 아래 4개 함수 시그니처를 유지한 채
// 내부 구현만 anon insert(interest) / service-role insert(click) 로 바꾼다.
// Supabase 호출은 Phase 1에 절대 넣지 않는다.

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  InterestSignal,
  ClickEvent,
  BookingProgress,
  BookingProgressStatus,
  BookingProgressSource,
  BookingProgressAggregate,
  BookingProgressByLink,
  BookingProgressByOption,
  ProductType,
} from "@/lib/types";
import { getProductLinkById } from "@/lib/data/proposals";
import {
  confidenceForSource,
  defaultSourceForStatus,
  isExternallyConfirmedForbidden,
  wouldDowngrade,
} from "@/lib/domain/booking-progress";

// 데이터 디렉토리. 로컬은 프로젝트 루트 .data, Vercel 서버리스는 읽기전용 FS라
// 쓰기 가능한 유일 경로 /tmp 로 분기한다(없으면 recordInterest 쓰기가 500 → "의향 남기기" 실패).
// ※ /tmp 는 인스턴스별·휘발성 — 영속이 필요하면 Supabase anon insert 로 교체(주석 참고).
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "ourrealtrip-data")
  : path.join(process.cwd(), ".data");
const INTEREST_FILE = path.join(DATA_DIR, "interest.json");
const CLICKS_FILE = path.join(DATA_DIR, "clicks.json");
const BOOKING_FILE = path.join(DATA_DIR, "booking.json");

/** 그룹 진행현황 집계에 항상 병기하는 기준 문구 (COMMERCE_MODEL 6-2) */
export const BOOKING_PROGRESS_BASIS = "참여자 자가보고 + 클릭추적 기준";

/** .data 디렉토리가 없으면 생성한다 */
async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/** JSON 배열 파일을 읽는다(없으면 빈 배열) */
async function readJsonArray<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (err) {
    // 파일 없음(ENOENT) 또는 손상 시 빈 배열로 시작
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    return [];
  }
}

/** JSON 배열 파일에 한 건 append (디렉토리 보장 + 읽기 → push → 쓰기) */
async function appendJson<T>(file: string, record: T): Promise<void> {
  await ensureDataDir();
  const existing = await readJsonArray<T>(file);
  existing.push(record);
  await fs.writeFile(file, JSON.stringify(existing, null, 2), "utf8");
}

/** JSON 배열 파일 전체를 덮어쓴다 (upsert용 — 디렉토리 보장 후 write) */
async function writeJsonArray<T>(file: string, rows: T[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

// ──────────────────────────────────────────────────────────
// 쓰기
// ──────────────────────────────────────────────────────────

/**
 * 관심/투표/질문 신호를 기록한다 (PRD 9-6, 익명 세션).
 * 향후 교체: anon client insert into interest_signal.
 */
export async function recordInterest(signal: InterestSignal): Promise<void> {
  await appendJson<InterestSignal>(INTEREST_FILE, signal);
}

/**
 * 클릭 이벤트를 기록한다 (PRD 9-7, /go redirect 경로).
 * 향후 교체: service-role client insert into click_event (anon 위조 차단).
 */
export async function recordClick(event: ClickEvent): Promise<void> {
  await appendJson<ClickEvent>(CLICKS_FILE, event);
}

// ──────────────────────────────────────────────────────────
// 읽기 (host dashboard 집계 입력)
// ──────────────────────────────────────────────────────────

/** 기록된 모든 관심 신호를 반환한다 */
export async function readInterests(): Promise<InterestSignal[]> {
  return readJsonArray<InterestSignal>(INTEREST_FILE);
}

/** 기록된 모든 클릭 이벤트를 반환한다 */
export async function readClicks(): Promise<ClickEvent[]> {
  return readJsonArray<ClickEvent>(CLICKS_FILE);
}

/** 특정 proposal의 관심 신호만 반환한다 */
export async function readInterestsByProposal(
  proposalId: string,
): Promise<InterestSignal[]> {
  const all = await readInterests();
  return all.filter((s) => s.proposal_id === proposalId);
}

/** 특정 proposal의 클릭 이벤트만 반환한다 */
export async function readClicksByProposal(
  proposalId: string,
): Promise<ClickEvent[]> {
  const all = await readClicks();
  return all.filter((e) => e.proposal_id === proposalId);
}

// ──────────────────────────────────────────────────────────
// BookingProgress (v2 신규 — 그룹 예약 진행, COMMERCE_MODEL 5·6)
// .data/booking.json 에 upsert. 유니크 키 = (participant_session_id, product_link_id).
// 향후 교체: anon upsert into booking_progress(자기 세션 행만) + 집계 view.
// ──────────────────────────────────────────────────────────

/** recordBookingProgress 입력 (참여자 자가표시 / clicked / 호스트 확인 기록) */
export interface RecordBookingProgressInput {
  proposal_id: string;
  option_id: string;
  product_link_id: string;
  participant_session_id: string;
  /** 진행 상태 — pending 직접 지정 불가(COMMERCE_MODEL 6-1) */
  status: Exclude<BookingProgressStatus, "pending">;
  /** 신호 출처. 생략 시 status로부터 추론(자가표시/클릭 경로) */
  source?: BookingProgressSource;
  /** 근거 메모(host_confirmed/external) */
  note?: string | null;
}

/**
 * 그룹 예약 진행을 (participant_session_id, product_link_id) 키로 upsert 한다.
 * 규칙(COMMERCE_MODEL 3-2·6-4, PRD 9-9):
 *  - source/confidence를 함께 기록한다(confidence는 source에서 자동 산정).
 *  - 완료·검증된 상위 상태는 /go 자동 clicked 기록으로 되돌리지 않는다(wouldDowngrade).
 *  - clicked 없이 바로 self_reported_booked 표시도 허용(다른 기기/직접 검색 케이스).
 *  - cancelled_or_refunded는 어느 상태에서든 분기 허용.
 *  - ★ externally_confirmed_booked는 source=external_api에서만. 그 외 거부(throw).
 * @returns upsert된 BookingProgress 행
 */
export async function recordBookingProgress(
  input: RecordBookingProgressInput,
): Promise<BookingProgress> {
  const source = input.source ?? defaultSourceForStatus(input.status);

  // ★ 안전 가드: 외부 검증 결제완료는 external_api ingestion으로만 도달 가능
  if (isExternallyConfirmedForbidden(input.status, source)) {
    throw new Error(
      "externally_confirmed_booked는 외부 전환 API ingestion(source=external_api)으로만 세팅 가능합니다(PRD 9-9-3·18-5).",
    );
  }

  const confidence = confidenceForSource(source);
  const note = input.note ?? null;

  const rows = await readJsonArray<BookingProgress>(BOOKING_FILE);
  const now = new Date().toISOString();

  const idx = rows.findIndex(
    (r) =>
      r.participant_session_id === input.participant_session_id &&
      r.product_link_id === input.product_link_id,
  );

  if (idx >= 0) {
    const existing = rows[idx];
    // 완료·검증된 상위 상태를 되돌리지 않는다 — 단, 이는 /go 자동 클릭
    // (redirect_tracking)에만 적용. 참여자/호스트의 명시적 입력은 의도된 정정이므로
    // 다운그레이드(자가표시 취소 등)를 허용한다(COMMERCE_MODEL 3-2·6-4).
    const isAutoClick = source === "redirect_tracking";
    const keep = isAutoClick && wouldDowngrade(existing.status, input.status);
    const updated: BookingProgress = {
      ...existing,
      proposal_id: input.proposal_id,
      option_id: input.option_id,
      status: keep ? existing.status : input.status,
      source: keep ? existing.source : source,
      confidence: keep ? existing.confidence : confidence,
      note: keep ? existing.note : note,
      updated_at: now,
    };
    rows[idx] = updated;
    await writeJsonArray(BOOKING_FILE, rows);
    return updated;
  }

  const created: BookingProgress = {
    progress_id: crypto.randomUUID(),
    proposal_id: input.proposal_id,
    option_id: input.option_id,
    product_link_id: input.product_link_id,
    participant_session_id: input.participant_session_id,
    status: input.status,
    source,
    confidence,
    note,
    updated_at: now,
  };
  rows.push(created);
  await writeJsonArray(BOOKING_FILE, rows);
  return created;
}

/** 기록된 모든 BookingProgress 행을 반환한다 */
export async function readBookingProgress(): Promise<BookingProgress[]> {
  return readJsonArray<BookingProgress>(BOOKING_FILE);
}

/** product_link_id의 product_type을 best-effort로 해석(없으면 tna 폴백) */
function resolveProductType(productLinkId: string): ProductType {
  return getProductLinkById(productLinkId)?.product_type ?? "tna";
}

/**
 * 그룹 진행현황 집계를 반환한다 (COMMERCE_MODEL 6-2).
 * 개별 participant_session_id는 노출하지 않는다(익명 보존, 확정 결정 4).
 * @param proposalId 대상 제안
 * @param optionId 특정 수렴 옵션으로 필터(선택)
 */
export async function getBookingProgress(
  proposalId: string,
  optionId?: string,
): Promise<BookingProgressAggregate> {
  const all = await readBookingProgress();
  const rows = all.filter(
    (r) =>
      r.proposal_id === proposalId &&
      (optionId ? r.option_id === optionId : true),
  );

  // 항목별(product_link_id) status 분포
  const byLinkMap = new Map<string, BookingProgressByLink>();
  // 옵션별 신뢰도 계층별 참여자 / 전체 참여자(세션 유니크)
  const optionSelfReported = new Map<string, Set<string>>();
  const optionHostConfirmed = new Map<string, Set<string>>();
  const optionExternal = new Map<string, Set<string>>();
  const optionTotal = new Map<string, Set<string>>();

  const addTo = (m: Map<string, Set<string>>, oid: string, sid: string) => {
    if (!m.has(oid)) m.set(oid, new Set());
    m.get(oid)!.add(sid);
  };

  for (const r of rows) {
    let link = byLinkMap.get(r.product_link_id);
    if (!link) {
      link = {
        product_link_id: r.product_link_id,
        product_type: resolveProductType(r.product_link_id),
        pending: 0,
        clicked_booking_link: 0,
        booking_intent: 0,
        self_reported_booked: 0,
        host_confirmed_booked: 0,
        externally_confirmed_booked: 0,
        cancelled_or_refunded: 0,
      };
      byLinkMap.set(r.product_link_id, link);
    }
    link[r.status] += 1;

    addTo(optionTotal, r.option_id, r.participant_session_id);
    // 예약완료 계층: 외부검증 > 호스트확인 > 자가보고. 상위에 카운트되면 별도 집계.
    if (r.status === "self_reported_booked")
      addTo(optionSelfReported, r.option_id, r.participant_session_id);
    if (r.status === "host_confirmed_booked")
      addTo(optionHostConfirmed, r.option_id, r.participant_session_id);
    if (r.status === "externally_confirmed_booked")
      addTo(optionExternal, r.option_id, r.participant_session_id);
  }

  const by_option: BookingProgressByOption[] = [...optionTotal.entries()].map(
    ([oid, total]) => ({
      option_id: oid,
      self_reported_booked_participants: optionSelfReported.get(oid)?.size ?? 0,
      host_confirmed_participants: optionHostConfirmed.get(oid)?.size ?? 0,
      externally_confirmed_participants: optionExternal.get(oid)?.size ?? 0,
      total_participants: total.size,
    }),
  );

  return {
    basis: BOOKING_PROGRESS_BASIS,
    by_product_link: [...byLinkMap.values()],
    by_option,
  };
}

/**
 * 쿠키 세션 본인의 진행 행만 반환한다(장바구니 체크 상태 복원용, COMMERCE_MODEL 6-3).
 * 세션이 없거나 행이 없으면 빈 배열.
 */
export async function getMyBookingProgress(
  proposalId: string,
  participantSessionId: string | null | undefined,
): Promise<BookingProgress[]> {
  if (!participantSessionId) return [];
  const all = await readBookingProgress();
  return all.filter(
    (r) =>
      r.proposal_id === proposalId &&
      r.participant_session_id === participantSessionId,
  );
}
