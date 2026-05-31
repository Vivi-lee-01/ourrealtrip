// 데이터 액세스 레이어 — proposal 조회 (ARCHITECTURE.md 3절)
//
// Phase 1: lib/seed에서 동기적으로 읽는다. 백엔드 없음.
// 향후 Supabase 교체 가능한 인터페이스: 아래 함수 시그니처를 유지한 채
// 내부 구현만 anon/server client 쿼리로 바꾸면 호출부 변경 없이 swap 가능하다.
// (그때는 동기 → async 전환이 필요하므로 호출부는 await 가능한 형태를 가정해도 무방하다.)

import { SEED_PROPOSALS } from "@/lib/seed/proposals";
import { DISCOVER_CATEGORIES } from "@/lib/seed/categories";
import type {
  ProductLink,
  TripProposalDetail,
  TravelOptionWithLinks,
  DiscoverCategory,
  Itinerary,
  TravelOption,
} from "@/lib/types";

/** seed 묶음 → TripProposalDetail 중첩 구조로 변환 */
function toDetail(seed: (typeof SEED_PROPOSALS)[number]): TripProposalDetail {
  const options: TravelOptionWithLinks[] = seed.options
    .map(({ option, product_links }) => ({
      ...option,
      product_links,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    ...seed.proposal,
    host: seed.host,
    community: seed.community,
    options,
    itinerary: seed.itinerary,
    category_key: seed.category_key,
  };
}

/**
 * 전체 proposal 목록을 반환한다.
 * 향후 교체: getPublicProposals()로 visibility='public' 필터 + anon client 쿼리.
 */
export function getProposals(): TripProposalDetail[] {
  return SEED_PROPOSALS.map(toDetail);
}

/**
 * slug로 proposal 상세를 반환한다(없으면 null).
 * unlisted slug 접근 키 (PRD 9-3). 향후 교체: anon client + RLS(slug 일치) 쿼리.
 */
export function getProposalBySlug(slug: string): TripProposalDetail | null {
  const seed = SEED_PROPOSALS.find((s) => s.proposal.slug === slug);
  return seed ? toDetail(seed) : null;
}

/**
 * product_link_id로 ProductLink를 반환한다(없으면 null).
 * /go redirect 경로에서 사용. 향후 교체: getProductLinkForRedirect().
 */
export function getProductLinkById(id: string): ProductLink | null {
  for (const seed of SEED_PROPOSALS) {
    for (const { product_links } of seed.options) {
      const found = product_links.find((pl) => pl.product_link_id === id);
      if (found) return found;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────
// v2 신규 getter (Discover / 일정표 / 수렴 옵션)
// ──────────────────────────────────────────────────────────

/**
 * Discover 카테고리 6종을 sort_order 오름차순으로 반환한다.
 * 향후 교체: anon client select * from discover_category order by sort_order.
 */
export function getDiscoverCategories(): DiscoverCategory[] {
  return [...DISCOVER_CATEGORIES].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * 카테고리 key에 매핑된 proposal 상세 목록을 반환한다(없으면 빈 배열).
 * Phase 1은 seed의 category_key 일치로 필터. 향후 교체: category join 쿼리.
 */
export function getProposalsByCategory(key: string): TripProposalDetail[] {
  return SEED_PROPOSALS.filter((s) => s.category_key === key).map(toDetail);
}

/**
 * proposal_id로 일정표(Itinerary)를 반환한다(없으면 null).
 * 향후 교체: anon client select itinerary + itinerary_day(슬러그/proposal_id 기준).
 */
export function getItinerary(proposalId: string): Itinerary | null {
  const seed = SEED_PROPOSALS.find(
    (s) => s.proposal.proposal_id === proposalId,
  );
  return seed?.itinerary ?? null;
}

/**
 * 그룹이 수렴한 TravelOption을 반환한다 (공동 장바구니 파생 기준, COMMERCE_MODEL 2-3).
 * Phase 1 규칙: voted_option 집계 1위 옵션, 동률·신호 없음 시 첫 옵션(sort_order 최소) 폴백.
 * @param proposal 옵션이 채워진 proposal 상세
 * @param voteCounts option_id → voted_option 표 수 (없으면 첫 옵션 폴백)
 */
export function getConvergedOption(
  proposal: TripProposalDetail,
  voteCounts?: Record<string, number>,
): TravelOption | null {
  const options = [...proposal.options].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  if (options.length === 0) return null;

  // 투표 집계가 있으면 최다 득표(동률은 sort_order 빠른 쪽), 없으면 첫 옵션
  if (voteCounts) {
    let best = options[0];
    let bestCount = voteCounts[best.option_id] ?? 0;
    for (const opt of options) {
      const c = voteCounts[opt.option_id] ?? 0;
      if (c > bestCount) {
        best = opt;
        bestCount = c;
      }
    }
    return best;
  }
  return options[0];
}
