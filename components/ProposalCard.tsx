// Proposal 요약 카드 — 서버 컴포넌트 (ARCHITECTURE.md 2절 #1, PRD 6·12·15절)
//
// "/" 홈에서 공개 proposal 리스트의 각 항목을 렌더한다. 카드 전체가
// /trips/[slug] 상세로 이동하는 링크다(unlisted slug 접근 키, PRD 9-3).
//
// negative spec 준수:
//  - 단일 "전체 예약" CTA 없음. 이 카드는 상세로 가는 navigation 링크일 뿐이다.
//  - 가격은 "확인 시점 기준·변동 가능" 톤 — 보장 표현 금지(PRD 17-2).
//  - 카피는 한국어, 내부 전략어 노출 금지(PRD 17-4). seed의 사용자-facing 필드만 사용.
//  - 상품에 checked_at 함께 표시(확인 시점 명시).

import Link from "next/link";
import type { ProposalStatus, TripProposalDetail } from "@/lib/types";

interface ProposalCardProps {
  proposal: TripProposalDetail;
}

// 상태 모델(PRD 8절) → 사용자-facing 한국어 라벨 + 뱃지 톤
// 보장 표현(PRD 17-2 금지 문구)을 피하고 진행 단계만 중립적으로 표기한다.
const STATUS_BADGE: Record<
  ProposalStatus,
  { label: string; className: string }
> = {
  draft: { label: "준비 중", className: "bg-surface-soft text-ink-muted" },
  interest_check: { label: "관심 모으는 중", className: "bg-brand-soft text-brand" },
  option_refining: { label: "옵션 다듬는 중", className: "bg-brand-soft text-brand" },
  booking_open: { label: "상품 링크 열림", className: "bg-brand text-brand-fg" },
  closed: { label: "모집 마감", className: "bg-surface-soft text-ink-muted" },
  cancelled: { label: "취소됨", className: "bg-surface-soft text-ink-faint" },
  archived: { label: "지난 제안", className: "bg-surface-soft text-ink-faint" },
};

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const {
    slug,
    title,
    concept,
    host,
    community,
    expected_dates,
    expected_budget,
    status,
    checked_at,
  } = proposal;

  const badge = STATUS_BADGE[status];

  return (
    <Link
      href={`/trips/${slug}`}
      // 모바일 우선: 세로 단일 컬럼 카드, 카드 전체가 터치 타깃
      className="block rounded-card border border-surface-border bg-surface p-4 shadow-card transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:p-5"
    >
      {/* 상단: host·community + 상태 뱃지 */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-ink-muted">
          <span className="font-medium text-ink">{host.name}</span>
          <span aria-hidden> · </span>
          <span>{community.name}</span>
        </p>
        <span
          className={`shrink-0 rounded-card px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* 제목 */}
      <h3 className="text-base font-semibold leading-snug text-ink sm:text-lg">
        {title}
      </h3>

      {/* 한 줄 컨셉 */}
      <p className="mt-1 text-sm text-ink-muted">{concept}</p>

      {/* 예상 날짜 · 예상 가격대 (가격은 변동 가능 톤) */}
      <dl className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2 sm:gap-x-4">
        {expected_dates ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-faint">예상 날짜</dt>
            <dd className="text-ink">{expected_dates}</dd>
          </div>
        ) : null}
        {expected_budget ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-faint">예상 가격대</dt>
            <dd className="text-ink">{expected_budget}</dd>
          </div>
        ) : null}
      </dl>

      {/* 확인 시점 + 변동 가능 안내 (보장 표현 금지) */}
      {checked_at ? (
        <p className="mt-3 text-xs text-ink-faint">
          {checked_at} 확인 기준 · 가격·예약 가능 여부는 변동될 수 있어요
        </p>
      ) : null}
    </Link>
  );
}
