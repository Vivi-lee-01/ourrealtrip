// 카테고리 상세 — /c/[category] (docs/DISCOVER.md 5절, DESIGN_BRIEF.md, PRD 12절)
//
// 서버 컴포넌트(async). [category] = DiscoverCategory.key (slug, DISCOVER.md D2).
// 블록 순서:
//   1. 카테고리 헤더(icon + label + 건수)
//   2. 이 카테고리 인기 트립(TripGrid, 참여의향수 내림차순) — 없으면 빈 상태
//   3. 다른 카테고리(CategoryRail, 재탐색)
//   4. 하단 필수 고지
//
// DB에 없는 key → notFound()(DISCOVER.md 5절). 데이터는 lib/data(seed) + lib/store/local만.

import Link from "next/link";
import { notFound } from "next/navigation";

import DisclosureBanner from "@/components/DisclosureBanner";
import CategoryRail from "@/components/discover/CategoryRail";
import TripCard from "@/components/discover/TripCard";
import {
  getDiscoverCategories,
  getProposalsByCategory,
} from "@/lib/data/proposals";
import {
  getDiscoverCategoriesWithCount,
  getInterestCounts,
  isDiscoverVisible,
  toTripCardData,
  type TripCardData,
} from "@/lib/data/discover";

// 카테고리 6종은 정적이므로 빌드 시 미리 생성(SSG)
export function generateStaticParams(): { category: string }[] {
  return getDiscoverCategories().map((c) => ({ category: c.key }));
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  // 유효 카테고리인지 확인(없으면 404)
  const categoriesWithCount = getDiscoverCategoriesWithCount();
  const current = categoriesWithCount.find((c) => c.key === category);
  if (!current) notFound();

  const interestCounts = await getInterestCounts();

  // 이 카테고리의 노출-대상 트립 → 참여의향수 내림차순
  const trips: TripCardData[] = getProposalsByCategory(category)
    .filter(isDiscoverVisible)
    .map((p) => toTripCardData(p, interestCounts[p.proposal_id] ?? 0))
    .sort((a, b) => b.interestCount - a.interestCount);

  return (
    <main className="mx-auto w-full max-w-discover px-4 py-8 sm:px-6 sm:py-12">
      {/* 0. 돌아가기 */}
      <p className="mb-4 text-caption text-ink-faint">
        <Link href="/discover" className="underline underline-offset-2">
          ← 둘러보기로
        </Link>
      </p>

      {/* 1. 카테고리 헤더 */}
      <header className="mb-8 flex items-center gap-3">
        <span className="text-display-lg leading-none" aria-hidden>
          {current.icon ?? "•"}
        </span>
        <div>
          <h1 className="text-h1 text-ink">{current.label}</h1>
          <p className="mt-0.5 text-body-sm text-ink-muted">
            <span className="font-mono tabular-nums">{current.count}</span>개의
            여행 제안
          </p>
        </div>
      </header>

      {/* 2. 이 카테고리 인기 트립 */}
      <section aria-labelledby="category-trips" className="mb-10">
        <h2 id="category-trips" className="mb-3 text-h2 text-ink">
          이 카테고리의 여행
        </h2>
        {trips.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trips.map((trip) => (
              <li key={trip.slug}>
                <TripCard trip={trip} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-card border border-surface-border bg-surface p-6 text-center">
            <p className="text-body-sm text-ink-muted">
              아직 이 카테고리의 여행 제안이 없어요.
            </p>
            <p className="mt-2 text-caption text-ink-faint">
              <Link href="/discover" className="underline underline-offset-2">
                다른 카테고리 둘러보기
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* 3. 다른 카테고리(재탐색) */}
      <section aria-labelledby="other-categories" className="mb-10">
        <h2 id="other-categories" className="mb-3 text-h2 text-ink">
          다른 카테고리
        </h2>
        <CategoryRail categories={categoriesWithCount} activeKey={category} />
      </section>

      {/* 4. 하단 필수 고지 */}
      <DisclosureBanner className="mt-10" />
      <p className="mt-3 text-caption text-ink-faint">
        <Link href="/disclosure" className="underline underline-offset-2">
          전체 안내 보기
        </Link>
      </p>
    </main>
  );
}
