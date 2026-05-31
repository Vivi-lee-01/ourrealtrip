// 4. SocialProof — "N명 참여의향" + 아바타 (PRD 6절 4번, DESIGN_BRIEF 5-9)
//
// 루마 "N Going" 차용 → "N명 참여의향". InterestSignal 집계 톤(예약 확정 아님).
// 집계 정의(DISCOVER 7절): response_type in (interested/date_dependent/
// price_dependent/voted_option). 익명이라 이름 없이 아바타 placeholder 스택만.
// "N명 예약" 같은 표현 금지(예약 확정 오인 방지).

import { AvatarStack } from "@/components/ui/Avatar";

interface SocialProofProps {
  /** 참여의향 신호 수 (InterestSignal 집계) */
  interestCount: number;
  /** 옵션 투표 수 (선택, 있으면 함께 표기) */
  voteCount?: number;
}

export default function SocialProof({
  interestCount,
  voteCount = 0,
}: SocialProofProps) {
  // 아직 신호가 없으면 "처음 의향을 남겨보세요" 톤으로 (빈 0명 강조 회피)
  if (interestCount <= 0) {
    return (
      <section
        aria-label="참여 의향"
        className="rounded-card border border-surface-border bg-surface-soft px-4 py-3"
      >
        <p className="text-body-sm text-ink-muted">
          아직 의향을 남긴 사람이 없어요. 가장 먼저 관심을 남겨보세요.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="참여 의향"
      className="flex items-center gap-3 rounded-card border border-surface-border bg-surface-soft px-4 py-3"
    >
      <AvatarStack count={interestCount} size={28} />
      <div className="min-w-0">
        <p className="text-body text-ink">
          <span className="font-mono font-semibold text-brand-softfg">
            {interestCount}
          </span>
          명이 참여의향을 남겼어요
        </p>
        {voteCount > 0 && (
          <p className="text-caption text-ink-faint">
            그중 <span className="font-mono">{voteCount}</span>명이 특정 안에 투표
          </p>
        )}
      </div>
    </section>
  );
}
