// 7. TravelOptionSet — A/B/C 운영안 묶음 (PRD 6절 7번, DESIGN_BRIEF 5-4)
//
// TravelOptionCard 3장을 동등 비교 레이아웃으로. 모바일 세로 스택 / 데스크톱 2열.
// 수렴 옵션(convergedOptionId)에 리본을 붙인다. 상품 그리드처럼 보이지 않게 —
// 카드 간 간격·헤더 카피로 "운영안 비교"임을 분명히. 단일 묶음 CTA 없음.

import TravelOptionCard from "@/components/proposal/TravelOptionCard";
import type { TravelOptionWithLinks } from "@/lib/types";

interface TravelOptionSetProps {
  options: TravelOptionWithLinks[];
  /** 그룹이 수렴한 옵션 id (있으면 리본) */
  convergedOptionId?: string | null;
  /** option_id → 투표 수 */
  voteCounts?: Record<string, number>;
}

export default function TravelOptionSet({
  options,
  convergedOptionId,
  voteCounts,
}: TravelOptionSetProps) {
  if (options.length === 0) return null;

  return (
    <section aria-labelledby="options-title" className="space-y-3">
      <div>
        <h2 id="options-title" className="text-h2 text-ink">
          여행 운영안 A · B · C
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          상품 목록이 아니라, 우리 모임에 맞춘 운영안이에요. 마음에 드는 안에
          투표해 주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <TravelOptionCard
            key={option.option_id}
            option={option}
            converged={option.option_id === convergedOptionId}
            voteCount={voteCounts?.[option.option_id] ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
