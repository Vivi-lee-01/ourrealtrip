// Discover 인기 트립 카드 (docs/DESIGN_BRIEF.md 5-1·5-12, DISCOVER.md 5·6절)
//
// 데이터: TripCardData(slug/cover/title/concept/city/host·community/날짜·예상가/참여의향수/status).
// 카드 전체가 /trips/[slug] 상세로 가는 navigation 링크다(unlisted slug 접근 키, PRD 9-3).
//
// negative spec 준수:
//  - 예약/체크아웃 CTA 없음. 카드 클릭 → 상세 이동만(DISCOVER.md 6절 TripCard 규칙).
//  - 가격 단정 표기 금지 → "예상 ○○" 힌트만(DISCOVER.md D4, PRD 17-2).
//  - "N명 참여의향"만 표기(예약 오인 금지). 제3자 특가 강조 문구 미반영(중립화).
//  - 커버 이미지 없으면 저채도 그라데이션 + 도시 이니셜(무지개 색 금지, DESIGN_BRIEF 13-8).

import Link from "next/link";

import { coverGradient, coverInitial } from "@/lib/cover";
import type { ProposalStatus } from "@/lib/types";
import type { TripCardData } from "@/lib/data/discover";
import InterestCountBadge from "@/components/discover/InterestCountBadge";

interface TripCardProps {
  trip: TripCardData;
}

// 상태칩 매핑 (DESIGN_BRIEF 5-12). Discover 노출 대상 외 상태도 폴백 라벨을 둔다.
// 보장 표현(PRD 17-2 금지 문구) 회피: 예약·가격 단정/보장 톤 라벨을 절대 쓰지 않는다.
const STATUS_CHIP: Record<ProposalStatus, { label: string; className: string }> =
  {
    draft: { label: "준비 중", className: "bg-surface-soft text-ink-muted" },
    interest_check: {
      label: "관심 모으는 중",
      className: "bg-brand-soft text-brand-softfg",
    },
    option_refining: {
      label: "여행안 다듬는 중",
      className: "bg-info-soft text-info",
    },
    booking_open: {
      label: "예약 링크 열림",
      className: "bg-success-soft text-success",
    },
    closed: { label: "모집 마감", className: "bg-neutral-soft text-ink-muted" },
    cancelled: { label: "취소됨", className: "bg-neutral-soft text-ink-faint" },
    archived: { label: "지난 제안", className: "bg-neutral-soft text-ink-faint" },
  };

export default function TripCard({ trip }: TripCardProps) {
  const {
    slug,
    coverImageUrl,
    title,
    concept,
    city,
    hostName,
    communityName,
    expectedDates,
    expectedBudget,
    status,
    interestCount,
    coverKey,
  } = trip;

  const chip = STATUS_CHIP[status];
  // 커버 상단 메타: "도시 · 날짜" (둘 중 있는 것만)
  const metaLine = [city, expectedDates].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/trips/${slug}`}
      className="group block rounded-md focus-visible:outline-none"
    >
      {/* 커버 — photo-first. 16:9, 라운드된 사진 plate가 카드 상단. 이미지 없으면 저채도 그라데이션 + 도시 이니셜 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md transition-shadow duration-200 ease-out group-hover:shadow-card">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={`${city ?? ""} ${concept}`.trim()}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
          />
        ) : (
          <div
            aria-hidden
            className={`flex h-full w-full items-center justify-center ${coverGradient(coverKey)}`}
          >
            <span className="text-display-lg font-bold text-ink/20">
              {coverInitial(city ?? title)}
            </span>
          </div>
        )}

        {/* 상태칩 — 커버 우상단 floating pill (단일 그림자 티어로 면 분리) */}
        <span
          className={`absolute right-3 top-3 rounded-pill px-2.5 py-1 text-caption font-medium shadow-card backdrop-blur-sm ${chip.className}`}
        >
          {chip.label}
        </span>
      </div>

      {/* 본문 — 사진 아래 메타 블록(타이틀 weight + 흐린 보조 라인) */}
      <div className="pt-3">
        {/* 제목 — title weight */}
        <h3 className="text-h3 text-ink">{title}</h3>

        {/* 도시 · 날짜 — muted 메타 */}
        {metaLine ? (
          <p className="mt-1 text-body-sm text-ink-muted">{metaLine}</p>
        ) : null}

        {/* 한 줄 컨셉(2줄 clamp) */}
        <p className="mt-0.5 line-clamp-2 text-body-sm text-ink-muted">
          {concept}
        </p>

        {/* host · community */}
        <p className="mt-1 truncate text-caption text-ink-faint">
          <span className="font-medium text-ink-muted">{hostName}</span>
          <span aria-hidden> · </span>
          <span>{communityName}</span>
        </p>

        {/* 예상 가격대 힌트(단정 금지 톤) */}
        {expectedBudget ? (
          <p className="mt-1 text-body-sm text-ink-muted">
            예상 <span className="font-mono tabular-nums">{expectedBudget}</span>
          </p>
        ) : null}

        {/* 참여의향 소셜프루프 */}
        {interestCount > 0 ? (
          <div className="mt-2">
            <InterestCountBadge count={interestCount} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
