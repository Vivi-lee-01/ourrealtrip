// Discover 파생 집계 레이어 — 참여의향수 / 카테고리 건수 (docs/DISCOVER.md 2·7절)
//
// Phase 1: 백엔드 없음. 참여의향수는 lib/store/local(로컬 JSON)의 InterestSignal을
// 집계해서 구한다(Supabase 호출 없음). 향후 교체 시 아래 함수 시그니처를 유지한 채
// 내부 구현만 anon client count 쿼리로 바꾸면 호출부 변경 없이 swap 가능하다.
//
// "N명 참여의향" 정의(DISCOVER.md 7절, PRD 6절 4번 소셜프루프와 일치):
//   count(InterestSignal where proposal_id=X and response_type in
//         (interested, date_dependent, price_dependent, voted_option))
//   — question / not_interested 제외(참여 의향 신호만).

import type {
  DiscoverCategoryWithCount,
  ResponseType,
  TripProposalDetail,
} from "@/lib/types";
import type { EventDraft } from "@/lib/store/drafts";
import { readInterests } from "@/lib/store/local";
import {
  getDiscoverCategories,
  getProposals,
} from "@/lib/data/proposals";

/** 참여 의향으로 집계하는 response_type 집합 (question/not_interested 제외) */
const INTEREST_RESPONSE_TYPES: ReadonlySet<ResponseType> = new Set<ResponseType>([
  "interested",
  "date_dependent",
  "price_dependent",
  "voted_option",
]);

/**
 * proposal_id → 참여의향수 맵을 반환한다.
 * 로컬 store(InterestSignal)에서 참여 의향 신호만 카운트. 신호가 없으면 0.
 * (한 번 읽어 맵으로 만들어 N+1 조회를 피한다.)
 * 향후 교체: anon client group-by count 쿼리.
 */
export async function getInterestCounts(): Promise<Record<string, number>> {
  const signals = await readInterests();
  const counts: Record<string, number> = {};
  for (const s of signals) {
    if (!INTEREST_RESPONSE_TYPES.has(s.response_type)) continue;
    counts[s.proposal_id] = (counts[s.proposal_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * 단일 proposal의 참여의향수를 반환한다(없으면 0).
 * 카드 1건만 필요할 때 사용. 목록 렌더에는 getInterestCounts() 맵을 권장.
 */
export async function getInterestCount(proposalId: string): Promise<number> {
  const counts = await getInterestCounts();
  return counts[proposalId] ?? 0;
}

/**
 * Discover 카테고리 6종에 노출-대상 proposal 건수를 붙여 반환한다
 * (sort_order 오름차순). 건수 0인 카테고리도 노출한다(수요 시그널, DISCOVER.md D5).
 *
 * 노출-대상 게이트(DISCOVER.md 2·7절):
 *   visibility !== 'unlisted' 는 Phase 1 seed에선 의미 제한적(데모는 unlisted)이라
 *   여기서는 category_key 매핑 + Discover 노출 상태로 집계한다. 향후 public 게이트는
 *   getProposals()를 getPublicProposals()로 swap하면서 함께 들어온다.
 */
export function getDiscoverCategoriesWithCount(): DiscoverCategoryWithCount[] {
  const categories = getDiscoverCategories();
  const proposals = getProposals();

  // Discover 노출 대상 상태만 카운트(draft/closed/cancelled/archived 제외)
  const visibleByKey: Record<string, number> = {};
  for (const p of proposals) {
    if (!isDiscoverVisible(p)) continue;
    if (!p.category_key) continue;
    visibleByKey[p.category_key] = (visibleByKey[p.category_key] ?? 0) + 1;
  }

  return categories.map((c) => ({
    ...c,
    count: visibleByKey[c.key] ?? 0,
  }));
}

/**
 * Discover 노출 대상 상태인지 판정한다(DISCOVER.md 2절).
 * interest_check / option_refining / booking_open 만 노출, 나머지는 제외.
 */
export function isDiscoverVisible(proposal: TripProposalDetail): boolean {
  return (
    proposal.status === "interest_check" ||
    proposal.status === "option_refining" ||
    proposal.status === "booking_open"
  );
}

/** Discover 카드용 경량 데이터 (TripProposalDetail에서 추출 + 참여의향수) */
export interface TripCardData {
  slug: string;
  coverImageUrl: string | null;
  title: string;
  concept: string;
  /** 대표 도시(destination_candidates 첫 항목) */
  city: string | null;
  hostName: string;
  communityName: string;
  expectedDates: string | null;
  expectedBudget: string | null;
  status: TripProposalDetail["status"];
  interestCount: number;
  /** 커버 그라데이션 안정 키(카테고리 또는 slug) */
  coverKey: string;
}

/**
 * TripProposalDetail + 참여의향수 → TripCardData로 변환한다(카드 렌더 입력).
 * 도시는 destination_candidates 대표(첫 항목). 커버 키는 category_key 우선, 없으면 slug.
 */
export function toTripCardData(
  proposal: TripProposalDetail,
  interestCount: number,
): TripCardData {
  return {
    slug: proposal.slug,
    coverImageUrl: proposal.cover_image_url,
    title: proposal.title,
    concept: proposal.concept,
    city: proposal.destination_candidates?.[0] ?? null,
    hostName: proposal.host.name,
    communityName: proposal.community.name,
    expectedDates: proposal.expected_dates,
    expectedBudget: proposal.expected_budget,
    status: proposal.status,
    interestCount,
    coverKey: proposal.category_key ?? proposal.slug,
  };
}

// ──────────────────────────────────────────────────────────
// 파일럿 프로그램(랜딩 데모 시드 7건) — featured 캐러셀 데이터
// ──────────────────────────────────────────────────────────
//
// 메인 상단 캐러셀에 featured로 올리는 7건의 slug. 나머지(교토/발리/하와이)는
// "지금 모이는 여행" 그리드로 내린다. 캐러셀 노출 순서 = 이 배열 순서.
export const PILOT_SLUGS: readonly string[] = [
  "ouroboros-seoul-oneday",
  "beijing-mandu-2d1n",
  "my-girlfriend-drawing",
  "jeffrey-gukjungbak-docent",
  "ralphwood-bali-canggu",
  "random-dating-3activity",
  "skin-concern-beauty-meetup",
] as const;

const PILOT_SLUG_SET: ReadonlySet<string> = new Set(PILOT_SLUGS);

/** proposal이 파일럿(featured) 대상인지 판정한다. */
export function isPilotProposal(proposal: TripProposalDetail): boolean {
  return PILOT_SLUG_SET.has(proposal.slug);
}

/** 파일럿 카드 1개의 렌더 입력 (이미지 없을 땐 concept 그라데이션 + glyph 폴백) */
export interface PilotCardData {
  slug: string;
  /** 커버 사진 경로(테마 매칭 MRT CloudFront 사진). 없으면 null → concept 그라데이션 */
  coverImageUrl: string | null;
  /**
   * 호스트 일러스트 아바타(byline 옆 작은 원형). 커버 사진과 별개.
   * 발행 draft 카드 등 일러스트가 없으면 생략(optional) — null/undefined면 아바타 미노출.
   */
  avatarUrl?: string | null;
  /** 이미지 object-position(인물 머리 잘림 방지). 기본 center */
  coverPosition: "top" | "center";
  /** 이미지 없을 때 그라데이션 위에 얹는 큰 텍스트(예: "3:3", "肌") */
  conceptGlyph: string | null;
  title: string;
  /** 카드 뱃지(pill) 2개 */
  badges: [string, string];
  hostName: string;
  communityName: string;
  /** 예상 1인 가격 힌트(표시만, 예약/결제 CTA 금지) */
  expectedBudget: string | null;
  status: TripProposalDetail["status"];
  interestCount: number;
  /**
   * 확정 파일럿 여부. true면 "관심 모으는 중" 대신 "확정" 뱃지를 노출한다.
   * (호스트가 일정·인원을 확정한 프로그램. PILOT_META.confirmed 또는 발행 draft에서 파생)
   */
  confirmed: boolean;
  /**
   * 발행 이벤트(draft store) 출처 여부. true면 카드 링크가 /e/[slug](발행 이벤트 상세),
   * false면 시드 파일럿 /trips/[slug]. 기본 false.
   */
  fromDraft?: boolean;
}

/** slug → 뱃지·이미지 표시 메타(랜딩 PILOT 캐러셀 형식 재현). */
const PILOT_META: Record<
  string,
  {
    badges: [string, string];
    coverPosition?: "top" | "center";
    conceptGlyph?: string;
    /** 확정 파일럿(일정·인원 확정) — true면 "관심 모으는 중" 대신 "확정" 뱃지 */
    confirmed?: boolean;
  }
> = {
  "ouroboros-seoul-oneday": {
    badges: ["Ouroboros", "서울 1일 루트"],
    confirmed: true,
  },
  "beijing-mandu-2d1n": { badges: ["북경", "1박 2일"], confirmed: true },
  "my-girlfriend-drawing": {
    badges: ["Hent-ai", "창작형"],
    coverPosition: "top",
    confirmed: true,
  },
  "jeffrey-gukjungbak-docent": {
    badges: ["K-스킬", "도슨트형"],
    confirmed: true,
  },
  "ralphwood-bali-canggu": { badges: ["랄프우드", "웰니스"] },
  "random-dating-3activity": {
    badges: ["랜덤소개팅", "액티비티 묶음"],
    conceptGlyph: "3:3",
  },
  "skin-concern-beauty-meetup": {
    badges: ["여성 전용", "뷰티 밋업"],
    conceptGlyph: "肌",
  },
};

/**
 * TripProposalDetail + 참여의향수 → PilotCardData로 변환한다(파일럿 캐러셀 입력).
 * 뱃지·glyph·이미지 정렬은 PILOT_META에서 가져온다(메타 미정의 시 안전 폴백).
 */
export function toPilotCardData(
  proposal: TripProposalDetail,
  interestCount: number,
): PilotCardData {
  const meta = PILOT_META[proposal.slug];
  return {
    slug: proposal.slug,
    coverImageUrl: proposal.cover_image_url,
    // 호스트 일러스트는 byline 아바타로(커버는 테마 사진). 일러스트 없으면 null.
    avatarUrl: proposal.host.profile_image_url,
    coverPosition: meta?.coverPosition ?? "center",
    conceptGlyph: meta?.conceptGlyph ?? null,
    title: proposal.title,
    badges: meta?.badges ?? [proposal.community.name, "파일럿"],
    hostName: proposal.host.name,
    communityName: proposal.community.name,
    expectedBudget: proposal.expected_budget,
    status: proposal.status,
    interestCount,
    confirmed: meta?.confirmed ?? false,
  };
}

/**
 * 발행(published)된 호스트 이벤트 draft → PilotCardData로 변환한다.
 * /host/create 에서 만들어 발행한 이벤트를 메인 캐러셀 카드 모양에 맞춘다.
 * (제목·커버·호스트·일정·상태만 매핑. 가격/예약 CTA는 붙이지 않는다 — merchant 아님)
 *
 * 라우팅 주의: 발행 이벤트 상세는 /e/[slug] 이지만, 파일럿 캐러셀 카드 링크는
 * /trips/[slug] 패턴을 공유한다. 시드 파일럿과 동일 카드 컴포넌트를 쓰되 링크 prefix만
 * PilotCarousel 에서 분기한다(draft 출처 표시).
 */
export function publishedDraftToPilotCard(draft: EventDraft): PilotCardData {
  // 커뮤니티명: 연결 커뮤니티가 없으면(개인 이벤트) 호스트 개인 라벨로 폴백.
  const communityName = draft.community_id ? "커뮤니티 이벤트" : "개인 이벤트";
  return {
    slug: draft.slug,
    coverImageUrl: draft.cover_image_url,
    coverPosition: "center",
    // 커버 없을 땐 제목 첫 글자를 glyph 폴백으로(그라데이션 위에 얹음)
    conceptGlyph: draft.cover_image_url ? null : draft.title.slice(0, 1),
    title: draft.title,
    badges: ["새 이벤트", "방금 발행"],
    // host_user_id만 있는 로컬 데모는 표시용 이름이 없으므로 "호스트"로 폴백
    hostName: "호스트",
    communityName,
    // draft는 표시용 price_hint만 가지므로 캐러셀 예상가 힌트는 비운다
    expectedBudget: null,
    // 발행 이벤트는 운영 lifecycle을 그대로 반영(없으면 interest_check)
    status: draft.lifecycle ?? "interest_check",
    interestCount: 0,
    confirmed: false,
    fromDraft: true,
  };
}
