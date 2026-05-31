// 중심 화면 — Trip Proposal Detail (PRD 6절 v2 anatomy · 12절 화면 2)
//
// v2 섹션 순서(PRD 6절): CoverHero → HostLedTrust → RsvpPanel(상품보다 먼저) →
//   SocialProof → WhyThisTrip → Itinerary → TravelOptionSet →
//   SharedCart(공동 장바구니 함께보기 + 각자예약 + 그룹 진행현황) →
//   DecisionHelpers → ShareCta + DisclosureBanner(7종).
//
// getProposalBySlug(slug)로 seed 상세를 읽고, 없으면 notFound().
// generateStaticParams로 3 slug SSG. 모바일 우선 단일 컬럼. Supabase 호출 없음 —
// 참여/진행 집계는 lib/store/local(Phase 1 로컬 JSON, .data 없으면 빈 폴백).

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import CoverHero from "@/components/proposal/CoverHero";
import HostLedTrust from "@/components/proposal/HostLedTrust";
import RsvpPanel from "@/components/proposal/RsvpPanel";
import SocialProof from "@/components/proposal/SocialProof";
import WhyThisTrip from "@/components/proposal/WhyThisTrip";
import Itinerary from "@/components/proposal/Itinerary";
import TravelOptionSet from "@/components/proposal/TravelOptionSet";
import SharedCart from "@/components/proposal/SharedCart";
import DecisionHelpers from "@/components/proposal/DecisionHelpers";
import ShareCta from "@/components/proposal/ShareCta";
import DisclosureBanner from "@/components/DisclosureBanner";

import {
  getProposalBySlug,
  getProposals,
  getItinerary,
  getConvergedOption,
} from "@/lib/data/proposals";
import {
  readInterestsByProposal,
  getBookingProgress,
  getMyBookingProgress,
} from "@/lib/store/local";
import type {
  TripProposalDetail,
  BookingProgressAggregate,
  BookingProgress,
} from "@/lib/types";

const COOKIE_NAME = "participant_session_id";

// seed가 정적이므로 빌드 시 slug를 미리 생성(SSG) — 3 slug
export function generateStaticParams(): { slug: string }[] {
  return getProposals().map((p) => ({ slug: p.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** 절대 URL 생성 — 환경변수 없으면 상대 경로 폴백 */
function buildShareUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/trips/${slug}`;
}

/** voted_option 신호를 option_id별로 집계 (수렴 옵션 결정·"N명 담음"용) */
function tallyVotes(
  signals: { response_type: string; option_id: string | null }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of signals) {
    if (s.response_type === "voted_option" && s.option_id) {
      out[s.option_id] = (out[s.option_id] ?? 0) + 1;
    }
  }
  return out;
}

/** 참여의향 신호 수 (DISCOVER 7절 정의: interested/date/price/voted) */
function countInterest(signals: { response_type: string }[]): number {
  const POS = new Set([
    "interested",
    "date_dependent",
    "price_dependent",
    "voted_option",
  ]);
  return signals.filter((s) => POS.has(s.response_type)).length;
}

export default async function TripProposalPage({ params }: PageProps) {
  const { slug } = await params;
  const proposal: TripProposalDetail | null = getProposalBySlug(slug);
  if (!proposal) notFound();

  const itinerary = getItinerary(proposal.proposal_id);

  // ── 참여/진행 집계 (로컬 store, .data 없으면 빈 폴백) ──
  let interestCount = 0;
  let voteCounts: Record<string, number> = {};
  let progress: BookingProgressAggregate = {
    basis: "참여자 자가보고 + 클릭추적 기준",
    by_product_link: [],
    by_option: [],
  };
  let myProgressRows: BookingProgress[] = [];

  try {
    const signals = await readInterestsByProposal(proposal.proposal_id);
    interestCount = countInterest(signals);
    voteCounts = tallyVotes(signals);
  } catch {
    // SSG/파일 부재 — 0건 폴백
  }

  // 수렴 옵션 — vote 1위, 없으면 첫 옵션 (COMMERCE 2-3)
  const convergedOption = getConvergedOption(proposal, voteCounts);
  // 수렴 옵션의 상품 링크 묶음(SharedCart 입력)
  const convergedWithLinks = proposal.options.find(
    (o) => o.option_id === convergedOption?.option_id,
  );

  try {
    progress = await getBookingProgress(
      proposal.proposal_id,
      convergedOption?.option_id,
    );
    const session = (await cookies()).get(COOKIE_NAME)?.value ?? null;
    myProgressRows = await getMyBookingProgress(proposal.proposal_id, session);
  } catch {
    // 폴백 유지
  }

  // 내 진행 상태 맵 (product_link_id → status)
  const myProgress: Record<string, BookingProgress["status"]> = {};
  for (const r of myProgressRows) myProgress[r.product_link_id] = r.status;

  // 일정표 item 링크 라벨 (product_link_id → title)
  const linkTitles: Record<string, string> = {};
  for (const o of proposal.options) {
    for (const pl of o.product_links) linkTitles[pl.product_link_id] = pl.title;
  }

  const convergedVoteCount = convergedOption
    ? (voteCounts[convergedOption.option_id] ?? 0)
    : 0;
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  const shareUrl = buildShareUrl(proposal.slug);
  // 공유 문안 — 공식 오인/패키지/전체 예약 표현 없는 중립 카피
  const shareText = [
    `[${proposal.community.name}] ${proposal.title}`,
    proposal.concept,
    "관심·날짜·가격·투표·질문만 먼저 남겨주세요 (예약 아님).",
  ]
    .filter(Boolean)
    .join("\n");

  const optionChoices = proposal.options.map((o) => ({
    option_id: o.option_id,
    option_name: o.option_name,
  }));

  return (
    <main className="container-content space-y-8 py-6 sm:space-y-10 sm:py-8">
      {/* 1. CoverHero */}
      <CoverHero proposal={proposal} />

      {/* 2. HostLedTrust */}
      <HostLedTrust host={proposal.host} community={proposal.community} />

      {/* 3. RsvpPanel — 상품보다 먼저 (Interest before booking) */}
      <RsvpPanel proposalId={proposal.proposal_id} options={optionChoices} />

      {/* 4. SocialProof — "N명 참여의향" */}
      <SocialProof interestCount={interestCount} voteCount={totalVotes} />

      {/* 5. WhyThisTrip */}
      <WhyThisTrip proposal={proposal} />

      {/* 6. Itinerary — Day1/Day2 */}
      <Itinerary itinerary={itinerary} linkTitles={linkTitles} />

      {/* 7. TravelOptionSet — A/B/C 운영안 */}
      <TravelOptionSet
        options={proposal.options}
        convergedOptionId={convergedOption?.option_id ?? null}
        voteCounts={voteCounts}
      />

      {/* 8·9·10. SharedCart — 공동 장바구니(함께보기) + 각자예약 + 그룹 진행현황 */}
      {convergedWithLinks && (
        <SharedCart
          proposalId={proposal.proposal_id}
          option={convergedWithLinks}
          status={proposal.status}
          addedByCount={convergedVoteCount}
          progress={progress}
          myProgress={myProgress}
        />
      )}

      {/* 11. DecisionHelpers */}
      <DecisionHelpers proposal={proposal} />

      {/* 12. ShareCta + 필수 고지 7종 */}
      <ShareCta title={proposal.title} shareText={shareText} url={shareUrl} />
      <DisclosureBanner variant="collapsed" />
    </main>
  );
}
