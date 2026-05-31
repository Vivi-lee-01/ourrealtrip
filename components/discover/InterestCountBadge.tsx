// 참여의향 수 배지 — "N명 참여의향" (docs/DESIGN_BRIEF.md 5-1·5-9, DISCOVER.md 6절)
//
// 루마 "N Going" 차용 → "N명 참여의향". "N명 예약"으로 오인되지 않도록 라벨 고정.
// 소셜프루프 pill: brand.soft 배경 + brand.softfg 텍스트 + (선택) 아바타 스택.
// count=0이면 렌더하지 않는다(빈 신호를 과장 표기하지 않음).

import { AvatarStack } from "@/components/ui/Avatar";

interface InterestCountBadgeProps {
  /** 참여 의향 신호 수(InterestSignal 집계) */
  count: number;
  /** 아바타 스택 동반 여부(기본 true) — 익명이라 개수만 사용 */
  avatars?: boolean;
  className?: string;
}

export default function InterestCountBadge({
  count,
  avatars = true,
  className = "",
}: InterestCountBadgeProps) {
  // 아직 의향이 없으면 표기하지 않는다(과장 방지)
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill bg-brand-soft px-2.5 py-1 ${className}`}
    >
      {avatars ? <AvatarStack count={count} size={22} /> : null}
      <span className="text-caption font-medium text-brand-softfg">
        <span className="font-mono tabular-nums">{count}</span>명 참여의향
      </span>
    </span>
  );
}
