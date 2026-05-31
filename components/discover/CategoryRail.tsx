// CategoryRail — 카테고리 타일 가로 스크롤 (docs/DESIGN_BRIEF.md 5-8, DISCOVER.md 4·6절)
//
// /discover·/c/[category] 공용. 모바일은 가로 스크롤(snap-x), 데스크톱은 wrap.
// 루마 "Browse by Category" anatomy 차용 — 클론 아님(자체 토큰·간격).

import type { DiscoverCategoryWithCount } from "@/lib/types";
import CategoryTile from "@/components/discover/CategoryTile";

interface CategoryRailProps {
  categories: DiscoverCategoryWithCount[];
  /** 현재 보고 있는 카테고리 key(활성 토글) */
  activeKey?: string;
  className?: string;
}

export default function CategoryRail({
  categories,
  activeKey,
  className = "",
}: CategoryRailProps) {
  if (categories.length === 0) return null;

  return (
    <div
      role="list"
      aria-label="카테고리"
      className={`flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {categories.map((c) => (
        <div role="listitem" key={c.category_id}>
          <CategoryTile
            categoryKey={c.key}
            label={c.label}
            icon={c.icon}
            count={c.count}
            active={c.key === activeKey}
          />
        </div>
      ))}
    </div>
  );
}
