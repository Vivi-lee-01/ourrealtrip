// "/go/[product_link_id]" 클릭 추적 redirect (PRD 12절 화면 4, ARCHITECTURE.md 5절)
//
// GET 핸들러: product_link_id로 링크 조회 → 클릭을 best-effort 기록 → 외부 판매처
// source_url로 302 redirect. UI 없음.
//
// 설계 포인트:
// - 기록 → 302 순서. 기록 실패가 사용자 이동을 막지 않도록 best-effort(실패해도 redirect 수행).
// - 302(temporary). 301(permanent)은 캐시되어 추적을 건너뛰므로 쓰지 않는다.
// - redirect 대상은 항상 외부 판매처(마이리얼트립/제휴 링크) — 아워리얼트립은
//   직접 판매·예약 대행하지 않는다(필수 고지 4·6)는 원칙과 정합.
// - Phase 1: lib/store(로컬 JSON)에 기록. Supabase 호출 없음(향후 swap).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductLinkById, getProposals } from "@/lib/data/proposals";
import { recordClick, recordBookingProgress } from "@/lib/store/local";
import type { ClickEvent } from "@/lib/types";

const COOKIE_NAME = "participant_session_id";

/** User-Agent에서 device_type을 best-effort 분류 (PII 아님) */
function parseDeviceType(ua: string | null): string | null {
  if (!ua) return null;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

/** User-Agent에서 browser를 best-effort 분류 (PII 아님) */
function parseBrowser(ua: string | null): string | null {
  if (!ua) return null;
  // 순서 주의: Edge/Chrome 토큰이 서로 포함되므로 구체적인 것부터 검사
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  // Safari는 Chrome 토큰을 포함하지 않을 때만
  if (/Safari\//i.test(ua)) return "Safari";
  return "기타";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ product_link_id: string }> },
): Promise<NextResponse> {
  const { product_link_id } = await params;

  // 1. 링크 조회 — 없거나 source_url이 비면 404
  const link = getProductLinkById(product_link_id);
  if (!link || !link.source_url) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2. 부모 proposal_id 해석 (ProductLink는 option_id만 보유 → 데이터 레이어에서 역참조)
  //    best-effort: 못 찾아도 redirect는 수행하고 proposal_id는 null로 기록.
  let proposalId: string | null = null;
  for (const proposal of getProposals()) {
    if (proposal.options.some((o) => o.option_id === link.option_id)) {
      proposalId = proposal.proposal_id;
      break;
    }
  }

  // 3. redirect 대상 — 제휴 mylink가 있으면 우선, 없으면 manual source_url
  const redirectUrl = link.mylink_url ?? link.source_url;

  // 4. 클릭 페이로드 구성 (UTM/referrer/device/browser)
  const { searchParams } = new URL(request.url);
  const ua = request.headers.get("user-agent");

  const event: ClickEvent = {
    // Phase 1 로컬 식별자 (향후 DB가 PK 생성 → swap)
    event_id: crypto.randomUUID(),
    proposal_id: proposalId ?? "",
    option_id: link.option_id,
    product_link_id: link.product_link_id,
    product_type: link.product_type,
    clicked_at: new Date().toISOString(),
    referrer: request.headers.get("referer"),
    device_type: parseDeviceType(ua),
    browser: parseBrowser(ua),
    utm_source: searchParams.get("utm_source"),
    utm_medium: searchParams.get("utm_medium"),
    utm_campaign: searchParams.get("utm_campaign"),
    utm_term: searchParams.get("utm_term"),
    utm_content: searchParams.get("utm_content"),
    redirect_url: redirectUrl,
  };

  // 5. best-effort 기록 — 실패해도 사용자 이동을 막지 않는다(에러만 로깅)
  try {
    await recordClick(event);
  } catch (err) {
    console.error("[/go] recordClick 실패 (redirect는 계속):", err);
  }

  // 5-1. BookingProgress upsert(status=clicked) — best-effort (COMMERCE_MODEL 6-4)
  //      쿠키 세션이 있을 때만 기록. 이미 self_booked인 행은 store에서 보존(되돌리지 않음).
  //      proposal_id를 못 찾았으면(=빈 문자열) 진행 기록은 건너뛴다.
  const cookieSession = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieSession && proposalId) {
    try {
      await recordBookingProgress({
        proposal_id: proposalId,
        option_id: link.option_id,
        product_link_id: link.product_link_id,
        participant_session_id: cookieSession,
        status: "clicked_booking_link",
        source: "redirect_tracking",
      });
    } catch (err) {
      console.error("[/go] recordBookingProgress 실패 (redirect는 계속):", err);
    }
  }

  // 6. 외부 판매처로 302(temporary) redirect — 301 아님
  return NextResponse.redirect(redirectUrl, 302);
}
