// 1. CoverHero — 커버 Hero (PRD 6절 1번, DESIGN_BRIEF 5-2)
//
// coverGradient 커버(외부 이미지 없을 때 저채도 그라데이션 + 목적지 이니셜) 위에
// 상태칩 · 제목(display) · 한 줄 컨셉 · 날짜·목적지를 얹는다.
// 모바일 풀블리드(거터 0) / 데스크톱 rounded-card. 자동재생·캐러셀·"지금 예약" 금지.
// 텍스트는 이미지/그라데이션 위 흰색, 하단 그라데이션 오버레이로 가독 확보.

import StatusBadge from "@/components/proposal/StatusBadge";
import { coverGradient, coverInitial } from "@/lib/cover";
import type { TripProposalDetail } from "@/lib/types";

interface CoverHeroProps {
  proposal: TripProposalDetail;
}

export default function CoverHero({ proposal }: CoverHeroProps) {
  const {
    title,
    concept,
    expected_dates,
    destination_candidates,
    status,
    cover_image_url,
    category_key,
  } = proposal;

  const destination = destination_candidates?.[0] ?? null;
  // 커버 이미지 없으면 카테고리 기반 저채도 그라데이션 (무지개 금지)
  const gradient = coverGradient(category_key ?? destination ?? title);
  const initial = coverInitial(destination ?? title);

  return (
    <section
      aria-labelledby="cover-title"
      // 모바일 풀블리드: 컨테이너 좌우 거터를 상쇄(-mx-4) → 끝까지. 데스크톱은 rounded-card
      className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-card sm:border sm:border-surface-border"
    >
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
        {cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover_image_url}
            alt={`${destination ?? ""} ${concept}`.trim()}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div
            aria-hidden
            className={`absolute inset-0 flex items-center justify-center ${gradient}`}
          >
            <span className="select-none font-mono text-6xl font-bold text-white/40 sm:text-7xl">
              {initial}
            </span>
          </div>
        )}

        {/* 하단 그라데이션 오버레이 — 텍스트 가독 (다크에서 약간 진하게) */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent dark:from-black/70"
        />

        {/* 텍스트 레이어 */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="mb-2">
            <StatusBadge status={status} />
          </div>
          <h1
            id="cover-title"
            className="text-display font-bold text-white drop-shadow-sm sm:text-display-lg"
          >
            {title}
          </h1>
          {concept && (
            <p className="mt-1.5 text-h3 font-normal text-white/90">{concept}</p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-label text-white/85">
            {destination && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>📍</span>
                {destination}
              </span>
            )}
            {destination && expected_dates && (
              <span aria-hidden className="text-white/50">
                ·
              </span>
            )}
            {expected_dates && (
              <span className="font-mono">{expected_dates}</span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
