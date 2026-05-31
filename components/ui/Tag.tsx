// 태그 원자 — 의도 칩 (docs/DESIGN_BRIEF.md 5-9)
//
// community_intent_fit·relationship_depth·post_trip_artifact 등 의도 차원을
// "사람 언어" 칩으로 표시한다(막대그래프 X, 철학어 X). 면 X — 차분한 surface 톤.
// Badge(상태/의미색)와 구분: Tag는 정보성 메타 칩, 채도 약한 도트만 선택.

import type { ReactNode } from "react";

interface TagProps {
  /** 좌측 도트 표시(의미 약하게) */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export default function Tag({ dot = false, className = "", children }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border border-surface-border bg-surface-soft px-2 py-1 text-label text-ink-muted ${className}`}
    >
      {dot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-pill bg-ink-faint"
        />
      )}
      {children}
    </span>
  );
}
