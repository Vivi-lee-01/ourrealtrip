"use client";

// 파일럿 프로그램 featured 캐러셀 (랜딩 PILOT 캐러셀 형식 재현)
//
// 가로 스크롤-스냅 + 자동재생(~4초, 사용자 상호작용 시 일시정지) + dots + 드래그/휠 스크롤.
// 각 카드: 테마 매칭 사진 커버(또는 concept 그라데이션) → 뱃지 2개 → 제목 →
//          호스트 아바타(일러스트)·커뮤니티 → 예상 1인 가격 힌트(표시만) → 상태칩.
//          카드 클릭 → /trips/[slug] (TripCard 링크 패턴).
//
// negative spec 준수: 예약/결제/Reserve/장바구니 CTA 0건. "예상 1인 …" 힌트만(단정 금지 톤).
// 토큰 클래스만 사용(하드코딩 hex 금지).

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

import { coverGradient } from "@/lib/cover";
import type { ProposalStatus } from "@/lib/types";
import type { PilotCardData } from "@/lib/data/discover";

interface PilotCarouselProps {
  pilots: PilotCardData[];
}

// 상태칩 매핑(TripCard와 동일 톤 — 일관성). 보장/예약 단정 톤 금지.
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

// 확정 파일럿 뱃지 — 긍정/확정 톤(success pill). "관심 모으는 중"을 대체한다.
const CONFIRMED_CHIP = {
  label: "확정",
  className: "bg-success-soft text-success",
} as const;

const AUTOPLAY_MS = 4000;

export default function PilotCarousel({ pilots }: PilotCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  // 사용자 상호작용(hover/focus/포인터 다운) 동안 자동재생 일시정지
  const [paused, setPaused] = useState(false);
  const labelId = useId();

  // 활성 인덱스의 카드로 스크롤(자동재생/dot 클릭 공용)
  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  // 자동재생 — paused가 아니고 2개 이상일 때만. 다음 카드로 순환.
  useEffect(() => {
    if (paused || pilots.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % pilots.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, pilots.length, scrollToIndex]);

  // 스크롤(드래그/휠/스냅) 시 가장 가까운 카드로 active 동기화
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < track.children.length; i++) {
      const card = track.children[i] as HTMLElement;
      const cardCenter = card.offsetLeft - track.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }
    setActive(nearest);
  }, []);

  // 세로 휠을 가로 스크롤로 변환(트랙 위에서만)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    if (!track) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      track.scrollLeft += e.deltaY;
    }
  }, []);

  if (pilots.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onPointerDown={() => setPaused(true)}
    >
      {/* 가로 스크롤-스냅 트랙 — 드래그/휠/터치 스와이프 */}
      <ul
        ref={trackRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        aria-labelledby={labelId}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pilots.map((p) => (
          <li
            key={p.slug}
            className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
          >
            <PilotCard pilot={p} />
          </li>
        ))}
      </ul>

      {/* dots — 활성 카드 표시 + 클릭 이동 */}
      {pilots.length > 1 ? (
        <div
          className="mt-4 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="파일럿 프로그램 캐러셀 위치"
        >
          {pilots.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`${i + 1}번째 파일럿 보기`}
              onClick={() => {
                setActive(i);
                scrollToIndex(i);
              }}
              className={`h-2 rounded-pill transition-all duration-200 ${
                i === active
                  ? "w-5 bg-brand"
                  : "w-2 bg-surface-borderStrong hover:bg-ink-faint"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PilotCard({ pilot }: { pilot: PilotCardData }) {
  const {
    slug,
    coverImageUrl,
    avatarUrl,
    coverPosition,
    conceptGlyph,
    title,
    badges,
    hostName,
    communityName,
    expectedBudget,
    status,
    interestCount,
    confirmed,
    fromDraft,
  } = pilot;
  // 확정 파일럿이면 success 톤 "확정" 칩으로 대체, 아니면 상태 매핑 칩
  const chip = confirmed ? CONFIRMED_CHIP : STATUS_CHIP[status];
  // 발행 이벤트(draft 출처)는 /e/[slug] 상세, 시드 파일럿은 /trips/[slug]
  const href = fromDraft ? `/e/${slug}` : `/trips/${slug}`;

  return (
    <Link
      href={href}
      className="group block rounded-md focus-visible:outline-none"
    >
      {/* 커버 — 4:5 사진 plate. 이미지 없으면 concept 그라데이션 + 큰 glyph */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md transition-shadow duration-200 ease-out group-hover:shadow-card">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02] motion-reduce:transform-none ${
              coverPosition === "top" ? "object-top" : "object-center"
            }`}
          />
        ) : (
          <div
            aria-hidden
            className={`flex h-full w-full items-center justify-center ${coverGradient(slug)}`}
          >
            <span className="text-display-lg font-bold text-ink/25">
              {conceptGlyph ?? communityName.slice(0, 1)}
            </span>
          </div>
        )}

        {/* 상태칩 — 커버 우상단 floating pill */}
        <span
          className={`absolute right-3 top-3 rounded-pill px-2.5 py-1 text-caption font-medium shadow-card backdrop-blur-sm ${chip.className}`}
        >
          {chip.label}
        </span>
      </div>

      {/* 본문 */}
      <div className="pt-3">
        {/* 뱃지 2개 — pill */}
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={b}
              className="rounded-pill bg-surface-soft px-2.5 py-0.5 text-caption font-medium text-ink-muted"
            >
              {b}
            </span>
          ))}
        </div>

        {/* 제목 — 굵게, 줄바꿈 허용 */}
        <h3 className="mt-2 text-h3 font-bold text-ink">{title}</h3>

        {/* 호스트 · 커뮤니티 (호스트 일러스트가 있으면 작은 아바타 노출) */}
        <div className="mt-1 flex items-center gap-1.5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              aria-hidden
              loading="lazy"
              className="h-5 w-5 shrink-0 rounded-pill bg-surface-soft object-cover object-top"
            />
          ) : null}
          <p className="truncate text-caption text-ink-faint">
            <span className="font-medium text-ink-muted">{hostName}</span>
            <span aria-hidden> · </span>
            <span>{communityName}</span>
          </p>
        </div>

        {/* 예상 1인 가격 힌트(표시만, 단정 금지 톤) */}
        {expectedBudget ? (
          <p className="mt-1 text-body-sm text-ink-muted">
            예상 1인 <span className="font-mono tabular-nums">{expectedBudget}</span>
          </p>
        ) : null}

        {/* 상태칩(본문) — 확정 파일럿은 "확정", 그 외엔 "관심 모으는 중" 강조 */}
        <div className="mt-2">
          <span
            className={`inline-flex items-center rounded-pill px-2.5 py-1 text-caption font-medium ${chip.className}`}
          >
            {confirmed
              ? chip.label
              : interestCount > 0
                ? `관심 모으는 중 · ${interestCount}명 참여의향`
                : chip.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
