// Discover 카테고리 택소노미 시드 6종 (docs/DISCOVER.md 3절, PRD 9-11·12절)
//
// key = /c/[category] slug. label은 한글 표시. 데모 커뮤니티 3건 매핑:
//   교토=photography(사진), 발리=builder(빌더), 하와이=surf(서핑).
// 추가 카테고리(등산/와인/책/음악 등)는 운영 중 INSERT로 확장(icon nullable이라 안전).
// ⚠️ config-데이터 키 정합(rules/automation-config-data-sync): proposal의 category_key와
//    이 key를 동일 표기로 정규화한다(seed/categories.ts CATEGORY_KEYS 단일 출처).

import type { DiscoverCategory } from "@/lib/types";

export const DISCOVER_CATEGORIES: readonly DiscoverCategory[] = [
  {
    category_id: "cat-photography",
    key: "photography",
    label: "사진",
    icon: "📷",
    sort_order: 1,
  },
  {
    category_id: "cat-builder",
    key: "builder",
    label: "빌더",
    icon: "🛠️",
    sort_order: 2,
  },
  {
    category_id: "cat-run",
    key: "run",
    label: "러닝",
    icon: "🏃",
    sort_order: 3,
  },
  {
    category_id: "cat-wellness",
    key: "wellness",
    label: "웰니스",
    icon: "🧘",
    sort_order: 4,
  },
  {
    category_id: "cat-food",
    key: "food",
    label: "미식",
    icon: "🍜",
    sort_order: 5,
  },
  {
    category_id: "cat-surf",
    key: "surf",
    label: "서핑",
    icon: "🏄",
    sort_order: 6,
  },
] as const;

/** 유효 카테고리 key 집합 (정합 검증·매핑 단일 출처) */
export const CATEGORY_KEYS: readonly string[] = DISCOVER_CATEGORIES.map(
  (c) => c.key,
);
