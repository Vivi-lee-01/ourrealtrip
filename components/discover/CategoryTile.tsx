// DiscoverCategoryTile — 단일 카테고리 타일 (docs/DESIGN_BRIEF.md 5-8, DISCOVER.md 6절)
//
// 루마 "Browse by Category"(아이콘+건수) 차용. 아이콘 + 라벨 + 건수 배지.
// 클릭 → /c/[key]. 활성(현재 카테고리)이면 brand.soft 토글 톤.
// 무지개 카테고리 색 금지(DESIGN_BRIEF 13-8) — 뉴트럴 + 활성 시에만 brand.
// 건수 0이어도 노출한다(수요 시그널, DISCOVER.md D5) — 건수는 흐리게.

import Link from "next/link";

interface CategoryTileProps {
  categoryKey: string;
  label: string;
  /** 아이콘(이모지 placeholder, nullable) */
  icon?: string;
  /** 노출-대상 proposal 건수 */
  count: number;
  /** 현재 보고 있는 카테고리면 활성 토글 */
  active?: boolean;
}

export default function CategoryTile({
  categoryKey,
  label,
  icon,
  count,
  active = false,
}: CategoryTileProps) {
  return (
    <Link
      href={`/c/${categoryKey}`}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-pill border px-4 py-2 text-center transition-colors duration-150 ${
        active
          ? "border-brand bg-brand-soft text-brand-softfg"
          : "border-surface-border bg-surface text-ink hover:bg-surface-soft"
      }`}
    >
      <span className="text-base leading-none" aria-hidden>
        {icon ?? "•"}
      </span>
      <span className="text-label">{label}</span>
      {/* 건수: 0이면 흐리게(준비 중 톤), 있으면 mono caption */}
      <span
        className={`font-mono text-caption tabular-nums ${
          count > 0 ? "text-ink-faint" : "text-ink-faint/60"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
