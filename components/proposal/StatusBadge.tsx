// Proposal 상태 배지 (PRD 8절 상태 모델)
//
// 사용자-facing 라벨은 번역 카피. 보장/특가 표현 없음.
// 서버 컴포넌트 — 상태 enum → 한국어 라벨 + 색상 토큰 매핑만 한다.

import type { ProposalStatus } from "@/lib/types";

const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "초안",
  interest_check: "관심 모으는 중",
  option_refining: "여행안 다듬는 중",
  booking_open: "상품 링크 확인 가능",
  closed: "모집 종료",
  cancelled: "취소됨",
  archived: "지난 제안",
};

// 상태별 톤(중립 위주). 보장/특가 색 강조 없음.
const STATUS_TONE: Record<ProposalStatus, string> = {
  draft: "bg-surface-soft text-ink-muted border-surface-border",
  interest_check: "bg-brand-soft text-brand border-brand-soft",
  option_refining: "bg-brand-soft text-brand border-brand-soft",
  booking_open: "bg-brand text-brand-fg border-transparent",
  closed: "bg-surface-soft text-ink-muted border-surface-border",
  cancelled: "bg-surface-soft text-ink-faint border-surface-border",
  archived: "bg-surface-soft text-ink-faint border-surface-border",
};

interface StatusBadgeProps {
  status: ProposalStatus;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_TONE[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
