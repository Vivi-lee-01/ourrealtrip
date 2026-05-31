// "/api/rsvp" RSVP/관심/투표/질문 수집 (PRD 12절 화면 3, 9-6 InterestSignal)
//
// POST 핸들러: 익명 참여자의 관심 신호를 기록한다.
// 확정 결정 1·4: 이름/이메일을 받지 않는다. 식별은 participant_session_id 쿠키뿐.
// 쿠키가 없으면 crypto.randomUUID()로 발급(HttpOnly). body의 participant_session_id는
// 쿠키 부재 시 안전망으로만 사용한다(쿠키가 항상 우선).
//
// Phase 1: lib/store(로컬 JSON)에 기록. Supabase 호출 없음(향후 anon insert로 swap).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { recordInterest } from "@/lib/store/local";
import type {
  InterestSignal,
  ResponseType,
  ObjectionType,
} from "@/lib/types";

const COOKIE_NAME = "participant_session_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

/** 허용 response_type (PRD 9-6) — 그 외 값은 거부 */
const RESPONSE_TYPES: readonly ResponseType[] = [
  "interested",
  "date_dependent",
  "price_dependent",
  "voted_option",
  "question",
  "not_interested",
];

/** 허용 objection_type (PRD 9-6) */
const OBJECTION_TYPES: readonly ObjectionType[] = [
  "date",
  "budget",
  "destination",
  "companions",
  "other",
];

/** 비어있지 않은 문자열만 통과, 그 외는 null로 정규화 */
function asText(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

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

  // 2. 필수 필드 검증 — proposal_id, response_type
  const proposalId = asText(body.proposal_id);
  if (!proposalId) {
    return NextResponse.json(
      { ok: false, error: "proposal_id가 필요합니다." },
      { status: 400 },
    );
  }

  const responseType = body.response_type;
  if (
    typeof responseType !== "string" ||
    !RESPONSE_TYPES.includes(responseType as ResponseType)
  ) {
    return NextResponse.json(
      { ok: false, error: "유효하지 않은 response_type입니다." },
      { status: 400 },
    );
  }

  // 3. 익명 세션 확보 — 쿠키 우선, 없으면 body 안전망, 그래도 없으면 신규 발급
  const cookieSession = request.cookies.get(COOKIE_NAME)?.value;
  const bodySession = asText(body.participant_session_id);
  const isNewSession = !cookieSession;
  const participantSessionId =
    cookieSession ?? bodySession ?? crypto.randomUUID();

  // 4. objection_type 정규화 (유효값 아니면 null)
  const rawObjection = body.objection_type;
  const objectionType: ObjectionType | null =
    typeof rawObjection === "string" &&
    OBJECTION_TYPES.includes(rawObjection as ObjectionType)
      ? (rawObjection as ObjectionType)
      : null;

  // 5. InterestSignal 구성 — 이름/이메일 필드 자체가 없음(확정 결정 4)
  const signal: InterestSignal = {
    signal_id: crypto.randomUUID(),
    proposal_id: proposalId,
    option_id: asText(body.option_id),
    participant_session_id: participantSessionId,
    response_type: responseType as ResponseType,
    preferred_dates: asText(body.preferred_dates),
    preferred_budget: asText(body.preferred_budget),
    comment: asText(body.comment),
    response_reason: asText(body.response_reason),
    intent_resonance: asText(body.intent_resonance),
    objection_type: objectionType,
  };

  // 6. 기록 (실패 시 500)
  try {
    await recordInterest(signal);
  } catch (err) {
    console.error("[/api/rsvp] recordInterest 실패:", err);
    return NextResponse.json(
      { ok: false, error: "기록에 실패했습니다." },
      { status: 500 },
    );
  }

  // 7. 응답 — 새 세션이면 HttpOnly 쿠키 발급(쿠키 부재 경로 안전망)
  const res = NextResponse.json({ ok: true, signal_id: signal.signal_id });
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
