// 진행 바 원자 — 그룹 예약 진행현황 (docs/DESIGN_BRIEF.md 5-6)
//
// 주의: 주문 상태 톤(택배/결제완료)이 아니라 "우리 진행 같이 보기" 톤.
// self_booked(자가표시) 분을 success로 채운다. 채도 절제, 높이 6px, rounded-pill.
// 접근성(DESIGN_BRIEF 11): role="progressbar" + aria-valuenow/valuemax.
// "예약함"은 자가보고 표현 — "결제완료" 같은 시스템 보증 표현은 쓰지 않는다.

interface ProgressBarProps {
  /** 완료(self_booked) 수 */
  value: number;
  /** 전체(참여자) 수 */
  max: number;
  /** 접근성 라벨 (예: "항공 진행") */
  label: string;
  /** 우측 카운트 표기 노출 (기본 true) — "5/8 예약함" */
  showCount?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  showCount = true,
  className = "",
}: ProgressBarProps) {
  const safeMax = Math.max(max, 0);
  const safeValue = Math.min(Math.max(value, 0), safeMax || value);
  const pct = safeMax > 0 ? Math.round((safeValue / safeMax) * 100) : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className="h-1.5 flex-1 overflow-hidden rounded-pill bg-neutral-soft"
      >
        <div
          className="h-full rounded-pill bg-success transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showCount && (
        <span className="shrink-0 font-mono text-caption text-ink-muted">
          {safeValue}/{safeMax} 예약함
        </span>
      )}
    </div>
  );
}
