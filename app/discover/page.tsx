// Discover 홈 — /discover (docs/DISCOVER.md 4절, DESIGN_BRIEF.md, PRD 12절)
//
// 서버 컴포넌트(async). 블록 순서(루마 discover anatomy 차용 — 클론 아님):
//   1. 인트로(Hero)
//   2. Browse by Category (CategoryRail + 건수)
//   3. 인기 트립 (TripCard 그리드, 참여의향수 내림차순)
//   4. 커뮤니티 (CommunityCard — 시각만, 구독은 Phase 2 스텁)
//   5. 하단 필수 고지(DisclosureBanner)
//
// 데이터: lib/data(seed) + lib/store/local(참여의향 집계)만. Supabase 호출 없음(Phase 1).
//
// negative spec 준수(DISCOVER.md 9절):
//  - 묶음 단일 예약/일괄결제 CTA 없음. 결제·체크아웃 진입점 없음(merchant 아님).
//  - 금지 문구 0건. 마이리얼트립 공식 오인 UI 없음.
//  - "N명 참여의향"이 "N명 예약"으로 오인되지 않음. unlisted/비노출 상태는 집계에서 제외.

import Link from "next/link";

import AppTopNav from "@/components/AppTopNav";
import Footer from "@/components/Footer";
import DisclosureBanner from "@/components/DisclosureBanner";
import CategoryRail from "@/components/discover/CategoryRail";
import TripCard from "@/components/discover/TripCard";
import PilotCarousel from "@/components/discover/PilotCarousel";
import CommunityCard from "@/components/discover/CommunityCard";
import { getHostAuthContext } from "@/lib/auth/host";
import { getProposals } from "@/lib/data/proposals";
import { listDrafts } from "@/lib/store/drafts";
import {
  getDiscoverCategoriesWithCount,
  getInterestCounts,
  isDiscoverVisible,
  isPilotProposal,
  toTripCardData,
  toPilotCardData,
  publishedDraftToPilotCard,
  PILOT_SLUGS,
  type TripCardData,
  type PilotCardData,
} from "@/lib/data/discover";

export default async function DiscoverPage() {
  // 전역 네비용 인증 컨텍스트(키 미설정 로컬 데모는 null — AppTopNav가 로그인 버튼 노출)
  const user = await getHostAuthContext();

  // 카테고리(+건수), 노출-대상 proposal, 참여의향수 집계
  const categories = getDiscoverCategoriesWithCount();
  const interestCounts = await getInterestCounts();

  const visibleProposals = getProposals().filter(isDiscoverVisible);

  // 파일럿 프로그램(featured): PILOT_SLUGS 순서대로 캐러셀에 노출
  const pilotBySlug = new Map(
    visibleProposals
      .filter(isPilotProposal)
      .map((p) => [p.slug, toPilotCardData(p, interestCounts[p.proposal_id] ?? 0)]),
  );
  const seedPilots: PilotCardData[] = PILOT_SLUGS.map(
    (slug) => pilotBySlug.get(slug),
  ).filter((p): p is PilotCardData => Boolean(p));

  // 발행된 호스트 이벤트(draft store)도 캐러셀에 합류시킨다.
  //   /host/create 에서 만들어 발행한 이벤트가 메인 캐러셀에 자동 노출되도록(데모 핵심).
  //   listDrafts()는 최신 생성 우선 정렬 → status==="published"만 추려 카드로 변환.
  //   로컬 데모에서 store가 비었거나 읽기 실패하면 빈 배열로 graceful degrade(시드만 노출).
  let publishedPilots: PilotCardData[] = [];
  try {
    const drafts = await listDrafts();
    publishedPilots = drafts
      .filter((d) => d.status === "published")
      .map(publishedDraftToPilotCard);
  } catch {
    publishedPilots = [];
  }

  // 메인 캐러셀 우선 노출: 이재규·이웅재·조재표·Jeffrey 4팀을 항상 맨 앞으로 고정한다.
  // (발행 이벤트가 앞서 밀어내지 않도록 최종 정렬에서 강제 — V8 sort는 stable이라 나머지 순서 유지)
  const FRONT_PILOT_SLUGS = [
    "ouroboros-seoul-oneday", // 이재규
    "beijing-mandu-2d1n", // 이웅재
    "my-girlfriend-drawing", // 조재표
    "jeffrey-gukjungbak-docent", // Jeffrey
  ];
  const frontRank = (slug: string) => {
    const i = FRONT_PILOT_SLUGS.indexOf(slug);
    return i === -1 ? FRONT_PILOT_SLUGS.length : i;
  };
  const pilots: PilotCardData[] = [...publishedPilots, ...seedPilots].sort(
    (a, b) => frontRank(a.slug) - frontRank(b.slug),
  );

  // 지금 모이는 여행: 파일럿을 제외한 기존 트립(교토/발리/하와이).
  // 참여의향수 내림차순, 동률이면 안정(원래 순서) 유지(최신/시드 순서 = DISCOVER.md D6 폴백)
  const trips: TripCardData[] = visibleProposals
    .filter((p) => !isPilotProposal(p))
    .map((p) => toTripCardData(p, interestCounts[p.proposal_id] ?? 0))
    .sort((a, b) => b.interestCount - a.interestCount);

  // 커뮤니티: 노출-대상 proposal에서 중복 제거(community_id 기준)
  const communityMap = new Map<
    string,
    {
      communityId: string;
      name: string;
      category: string | null;
      hostName: string;
      description: string | null;
    }
  >();
  for (const p of visibleProposals) {
    if (communityMap.has(p.community.community_id)) continue;
    communityMap.set(p.community.community_id, {
      communityId: p.community.community_id,
      name: p.community.name,
      category: p.community.category,
      hostName: p.host.name,
      description: p.community.description,
    });
  }
  const communities = [...communityMap.values()];

  return (
    <>
      {/* 전역 상단 네비 — 흰 캔버스, 하단 헤어라인. 이 페이지가 "/" 별칭이므로 정문 네비 */}
      <div className="border-b border-surface-border bg-surface">
        <AppTopNav user={user} active="discover" />
      </div>

      <main className="mx-auto w-full max-w-discover px-4 py-8 sm:px-6 sm:py-12">
        {/* 1. 인트로(Hero) — 따뜻한 코랄 그라데이션 캔버스 + 강조 헤드라인 + CTA.
            무채색 완화 + 시선 고정점 부여(브랜드 Rausch 단일 액센트, 키워드 1개만 코랄). */}
        <header className="mb-12 overflow-hidden rounded-xl bg-gradient-to-br from-brand-soft to-surface px-6 py-12 ring-1 ring-brand-soft sm:px-10 sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-soft px-3 py-1 text-label font-semibold text-brand-softfg">
            <span aria-hidden className="inline-block size-1.5 rounded-pill bg-brand" />
            스토리가 있는 여행
          </span>
          <h1 className="mt-4 text-display font-bold text-ink sm:text-[2.5rem] sm:leading-[1.15]">
            당신의 콘텐츠가 <span className="text-brand">여행</span>이 됩니다.
          </h1>
          <p className="mt-3 max-w-content text-body text-ink-body">
            취향과 스토리가 더해진 여행 프로그램, 어때요? 함께 가실래요?
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/host/create"
              className="rounded-pill bg-brand px-6 py-3 text-label font-semibold text-brand-fg shadow-sm transition hover:bg-brand-hover"
            >
              이벤트 만들기
            </Link>
            <Link
              href="#discover-trips"
              className="rounded-pill border border-surface-borderStrong bg-surface px-6 py-3 text-label font-semibold text-ink transition hover:bg-surface-soft"
            >
              둘러보기
            </Link>
          </div>
        </header>

        {/* 2. Browse by Category — pill chip 레일 */}
        <section aria-labelledby="discover-categories" className="mb-10">
          <h2 id="discover-categories" className="mb-4 text-h2 text-ink">
            카테고리로 둘러보기
          </h2>
          <CategoryRail categories={categories} />
        </section>

        {/* 3. featured 캐러셀(랜딩 PILOT 형식). 메인 상단 우선 노출.
            가시 제목 라벨("파일럿 프로그램")은 제거하고 설명 라인만 노출.
            aria-labelledby 무결성을 위해 제목은 sr-only로 유지. */}
        {pilots.length > 0 ? (
          <section aria-labelledby="discover-pilots" className="mb-12">
            <h2 id="discover-pilots" className="sr-only">
              모임장이 띄운 여행 프로그램
            </h2>
            <p className="mb-4 text-body-sm text-ink-muted">
              취향과 스토리가 더해진 여행 프로그램, 어때요? 함께 가실래요?
            </p>
            <PilotCarousel pilots={pilots} />
          </section>
        ) : null}

        {/* 4. 지금 모이는 여행 — photo-first 카드 그리드(참여의향수 내림차순) */}
        <section aria-labelledby="discover-trips" className="mb-12">
          <h2 id="discover-trips" className="mb-4 text-h2 text-ink">
            지금 모이는 여행
          </h2>
          {trips.length > 0 ? (
            <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <li key={trip.slug}>
                  <TripCard trip={trip} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-surface-border bg-surface p-4 text-body-sm text-ink-muted">
              아직 모이는 여행 제안이 없어요.
            </p>
          )}
        </section>

        {/* 4. 커뮤니티 (시각만, 구독은 Phase 2 스텁) */}
        {communities.length > 0 ? (
          <section aria-labelledby="discover-communities" className="mb-12">
            <h2 id="discover-communities" className="mb-1 text-h2 text-ink">
              커뮤니티
            </h2>
            <p className="mb-4 text-body-sm text-ink-muted">
              다음 여행 제안을 먼저 받아보고 싶은 모임을 둘러보세요.
            </p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((c) => (
                <li key={c.communityId}>
                  <CommunityCard
                    communityId={c.communityId}
                    name={c.name}
                    category={c.category}
                    hostName={c.hostName}
                    description={c.description}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 4.5 작동 방식(How it works) — "지금 모이는 여행" 그리드 아래, 푸터 위.
            A방식 정체성을 명문화: 이벤트를 만들고, 상품은 마이리얼트립에서 붙는다.
            Airbnb 톤의 헤어라인 3컬럼 카드(ink/muted). 예약/결제 CTA 없음(merchant 아님). */}
        <section aria-labelledby="discover-howitworks" className="mb-12">
          <h2
            id="discover-howitworks"
            className="text-h2 text-ink"
          >
            스토리가 있는 여행/액티비티를 만들고, 상품은 마이리얼트립에서
            붙습니다.
          </h2>
          <p className="mt-3 max-w-content text-body text-ink-body">
            {"핵심은 “여행 추천”이 아닙니다. Luma처럼 이벤트를 만들고, 그 이벤트에 실제 티켓·체험·액티비티·여행 상품을 연결하는 것입니다."}
          </p>

          <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                no: "01",
                title: "스토리가 있는 이벤트를 만듭니다.",
                desc: "호스트의 이야기, 취향, 커뮤니티 맥락을 “같이 가볼 만한 이벤트”로 번역합니다.",
              },
              {
                no: "02",
                title: "실제 상품을 붙입니다.",
                desc: "서울 도슨트, 공예·향수 클래스, 한강 야경처럼 마이리얼트립에서 예약 가능한 상품을 이벤트 스토리라인에 맞춰 조합합니다.",
              },
              {
                no: "03",
                title: "RSVP 후 예약 링크를 엽니다.",
                desc: "처음부터 결제를 강요하지 않습니다. 관심자·질문·날짜 신호를 보고, 호스트 승인 후 상품 링크를 노출합니다.",
              },
            ].map((step) => (
              <li
                key={step.no}
                className="rounded-md border border-surface-border bg-surface p-5"
              >
                <span className="text-h3 font-bold tabular-nums text-brand">
                  {step.no}
                </span>
                <h3 className="mt-3 text-body font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-body-sm text-ink-muted">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* 5. 하단 필수 고지 + 전체 고지 링크 */}
        <DisclosureBanner className="mt-10" />
        <p className="mt-3 text-caption text-ink-faint">
          <Link href="/disclosure" className="underline underline-offset-2">
            전체 안내 보기
          </Link>
        </p>
      </main>

      {/* 6. 전역 푸터 — 흰 캔버스, 헤어라인 링크 컬럼 + legal band */}
      <Footer />
    </>
  );
}
