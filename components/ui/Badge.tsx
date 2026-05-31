// 배지 원자 — 상태칩/의미 배지 (docs/DESIGN_BRIEF.md 2-3·5-9·5-12)
//
// 의미색은 면 전체를 칠하지 않고 soft 배경 + DEFAULT 텍스트 + 얇은 보더로만 쓴다
// (세일 배너처럼 보이는 것 금지). 색 비의존(접근성): 항상 텍스트 라벨을 동반한다.

import type { ReactNode } from "react";

export type BadgeTone =
  | "brand"
  | "success"
  | "warn"
  | "info"
  | "neutral";

interface BadgeProps {
  tone?: BadgeTone;
  /** 좌측 도트 표시(상태 색 비의존 보조) */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-brand-soft text-brand-softfg border-brand-soft",
  success: "bg-success-soft text-success border-success-soft",
  warn: "bg-warn-soft text-warn border-warn-soft",
  info: "bg-info-soft text-info border-info-soft",
  neutral: "bg-neutral-soft text-ink-muted border-surface-border",
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warn: "bg-warn",
  info: "bg-info",
  neutral: "bg-neutral",
};

export default function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-caption font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && (
        <span
          aria-hidden
          className={`h-1.5 w-1.5 shrink-0 rounded-pill ${DOT_CLASSES[tone]}`}
        />
      )}
      {children}
    </span>
  );
}
