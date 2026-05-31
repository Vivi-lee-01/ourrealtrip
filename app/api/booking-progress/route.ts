// "/api/booking-progress" 그룹 예약 진행현황 (PRD 9-9, COMMERCE_MODEL 6절)
//
// POST: 참여자가 항목별 "예약 완료"/"클릭함"을 자가표시(self_booked/clicked) 기록.
// GET:  proposal(+option) 진행현황 집계 조회. 개별 세션 id는 노출하지 않음(익명 보존).
//
// 확정 결정 1·4: 이름/이메일 미수집. 식별은 participant_session_id 쿠키뿐.
// 쿠키 우선 → body 안전망 → 신규 발급(HttpOnly). /api/rsvp와 동일 쿠키 속성.
// Phase 1: lib/store/local(로컬 JSON .data/booking.json)에 기록. Supabase 호출 없음.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  recordBookingProgress,
  getBookingProgress,
} from "@/lib/store/local";
import type { BookingProgressStatus } from "@/lib/types";

const COOKIE_NAME = "participant_session_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

/** 자가표시로 허용되는 status — 참여자 자가보고 경로만(COMMERCE_MODEL 6-1).
 *  pending(미진행 강제)·host_confirmed_booked(호스트 전용)·
 *  externally_confirmed_booked(외부 ingestion 전용)는 이 API로 세팅 불가. */
const ALLOWED_STATUS: readonly Exclude<BookingProgressStatus, "pending">[] = [
  "clicked_booking_link",
  "booking_intent",
  "self_reported_booked",
  "cancelled_or_refunded",
];

/** 비어있지 않은 문자열만 통과, 그 외는 null로 정규화 */
function asText(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

// ──────────────────────────────────────────────────────────
// POST — 자가표시(예약 완료/클릭) 기록
// ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. body 파싱 (잘못된 JSON은 400)
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 본문입니다." },
      { status: 400 },
    );
  }

  // 2. 필수 필드 검증 — proposal_id, product_link_id, option_id
  const proposalId = asText(body.proposal_id);
  const productLinkId = asText(body.product_link_id);
  const optionId = asText(body.option_id);
  if (!proposalId || !productLinkId || !optionId) {
    return NextResponse.json(
      {
        ok: false,
        error: "proposal_id, product_link_id, option_id가 모두 필요합니다.",
      },
      { status: 400 },
    );
  }

  // 3. status 검증 — self_booked/clicked 외(특히 pending)는 거부
  const rawStatus = body.status;
  if (
    typeof rawStatus !== "string" ||
    !ALLOWED_STATUS.includes(
      rawStatus as Exclude<BookingProgressStatus, "pending">,
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "유효하지 않은 status입니다." },
      { status: 400 },
    );
  }
  const status = rawStatus as Exclude<BookingProgressStatus, "pending">;

  // 4. 익명 세션 확보 — 쿠키 우선, 없으면 body 안전망, 그래도 없으면 신규 발급
  const cookieSession = request.cookies.get(COOKIE_NAME)?.value;
  const bodySession = asText(body.participant_session_id);
  const isNewSession = !cookieSession;
  const participantSessionId =
    cookieSession ?? bodySession ?? crypto.randomUUID();

  // 5. upsert ((session, product_link) 키). 자가표시는 결과를 기대하는 명시 행위 → 실패 시 500
  let result;
  try {
    result = await recordBookingProgress({
      proposal_id: proposalId,
      option_id: optionId,
      product_link_id: productLinkId,
      participant_session_id: participantSessionId,
      status,
    });
  } catch (err) {
    console.error("[/api/booking-progress] recordBookingProgress 실패:", err);
    return NextResponse.json(
      { ok: false, error: "기록에 실패했습니다." },
      { status: 500 },
    );
  }

  // 6. 응답 — 새 세션이면 HttpOnly 쿠키 발급
  const res = NextResponse.json({
    ok: true,
    progress_id: result.progress_id,
    status: result.status,
    source: result.source,
    confidence: result.confidence,
  });
  if (isNewSession) {
    res.cookies.set(COOKIE_NAME, participantSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return res;
}

// ──────────────────────────────────────────────────────────
// GET — 그룹 진행현황 집계 조회 (?proposal_id=...&option_id=...)
// ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const proposalId = asText(searchParams.get("proposal_id"));
  if (!proposalId) {
    return NextResponse.json(
      { ok: false, error: "proposal_id가 필요합니다." },
      { status: 400 },
    );
  }
  const optionId = asText(searchParams.get("option_id")) ?? undefined;

  try {
    const aggregate = await getBookingProgress(proposalId, optionId);
    // basis 필드를 항상 포함해 클라이언트가 "자가보고+클릭추적 기준" 문구를 강제 렌더
    return NextResponse.json({ ok: true, ...aggregate });
  } catch (err) {
    console.error("[/api/booking-progress] getBookingProgress 실패:", err);
    return NextResponse.json(
      { ok: false, error: "조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
