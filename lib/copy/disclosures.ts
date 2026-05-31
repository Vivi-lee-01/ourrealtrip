// 필수 고지 7종 — 단일 출처 (PRD 17-1, COMMERCE_MODEL 4절)
//
// 이 배열이 고지 문구의 유일한 출처다. DisclosureBanner(배너)와 /disclosure(페이지),
// 공동 장바구니 뷰(7번 고지)가 모두 이 배열을 렌더하며, 문구를 다른 곳에 하드코딩하지 않는다.
// 7번(장바구니 함께보기)은 v2 신규 — 장바구니 뷰 안에 항상 노출한다(CART_DISCLOSURE_ID).

export interface Disclosure {
  /** 고지 번호 (PRD 17-1 순서) */
  id: number;
  /** 고지 본문 */
  text: string;
}

export const DISCLOSURES: readonly Disclosure[] = [
  {
    id: 1,
    text: "아워리얼트립은 마이리얼트립 공식 서비스가 아닙니다.",
  },
  {
    id: 2,
    text: "일부 링크를 통해 예약이 발생할 경우 운영자에게 수익이 발생할 수 있습니다.",
  },
  {
    id: 3,
    text: "상품 가격과 예약 가능 여부는 확인 시점 이후 변경될 수 있습니다.",
  },
  {
    id: 4,
    text: "아워리얼트립은 항공·숙소·투어 상품을 직접 판매하거나 예약을 대행하지 않습니다.",
  },
  {
    id: 5,
    text: "조합형 여행안은 참고용 편성이며 패키지 상품이 아닙니다.",
  },
  {
    id: 6,
    text: "각 상품은 판매처에서 독립적으로 확인하고 구매합니다.",
  },
  {
    id: 7,
    text: "장바구니는 함께 보기용입니다. 결제·예약은 각 판매처에서 개별적으로 진행되며, 아워리얼트립은 결제를 받지 않습니다.",
  },
] as const;

/** 배너에서 우선 노출할 핵심 고지(공식 오인·수익·확인 시점) */
export const CORE_DISCLOSURE_IDS: readonly number[] = [1, 2, 3] as const;

/** 공동 장바구니 뷰 안에 항상 노출하는 고지 id (v2 신규, COMMERCE_MODEL 4-2) */
export const CART_DISCLOSURE_ID = 7 as const;
