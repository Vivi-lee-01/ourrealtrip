// 의도/차원 enum → 사용자-facing 번역 라벨 (PRD 17-4)
//
// relationship_depth / schedule_difficulty enum을 사용자 언어로 번역해서 노출.
// 이 모듈은 TravelOptionCard·DecisionHelpers가 공유한다. 보장/특가 표현 없음.

import type { RelationshipDepth, ScheduleDifficulty, ProductType } from "@/lib/types";

export const RELATIONSHIP_DEPTH_LABEL: Record<RelationshipDepth, string> = {
  low: "가볍게",
  mid: "적당히 가까워짐",
  high: "깊이 가까워짐",
};

export const SCHEDULE_DIFFICULTY_LABEL: Record<ScheduleDifficulty, string> = {
  low: "여유로움",
  mid: "보통",
  high: "빡빡함",
};

// 상품 유형 라벨 — 독립 CTA 단위 (PRD 9-5)
export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  flight: "항공",
  stay: "숙소",
  tna: "투어·티켓·액티비티",
};

// 상품 유형 섹션 렌더 순서 (항공 → 숙소 → TNA)
export const PRODUCT_TYPE_ORDER: ProductType[] = ["flight", "stay", "tna"];

// 상품 유형 아이콘 (DESIGN_BRIEF 7절: 항공✈/숙소🏨/투어🎟 단색 의미 아이콘)
export const PRODUCT_TYPE_ICON: Record<ProductType, string> = {
  flight: "✈",
  stay: "🏨",
  tna: "🎟",
};

// 옵션 유형 라벨 (PRD 9-4 → 사용자 카피)
export const OPTION_TYPE_LABEL: Record<string, string> = {
  basic: "기본형",
  premium: "몰입형",
  budget: "현실형",
  experimental: "실험형",
};
