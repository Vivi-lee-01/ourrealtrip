// 공통 버튼 원자 — 디자인 시스템 (docs/DESIGN_BRIEF.md 6절)
//
// 금지 방향 구조적 방어(PRD 17-3, 16절): "전체 예약"·"패키지 구매"·"묶음결제" 같은
// variant는 정의하지 않는다. variant는 primary/outline/ghost/chip-toggle 뿐이며,
// 단일 "전체 예약" CTA를 만들 수 있는 의미적 자리 자체가 없다.
// 항목별 "내 예약" CTA는 항상 outline(secondary)으로만 쓴다(DESIGN_BRIEF 6절 말미).

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "chip-toggle";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** chip-toggle 전용: 선택됨 상태(brand.soft 토글) */
  selected?: boolean;
}

// 단순 className 병합(외부 의존성 없이) — 빈 값 제거 후 공백 결합
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // 화면당 1개 권장 (RSVP "관심 있어요"). brand.soft 아님, 강조색 면.
  primary:
    "bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-hover border border-transparent",
  // 투표·질문·항목별 "내 예약" — 중립 톤
  outline:
    "bg-surface text-ink border border-surface-border hover:bg-surface-soft active:bg-surface-soft",
  // 보조 액션·더보기
  ghost:
    "bg-transparent text-ink-muted hover:bg-surface-soft active:bg-surface-soft border border-transparent",
  // RSVP 옵션·카테고리 토글 (selected에 따라 아래에서 덮어씀)
  "chip-toggle":
    "bg-surface text-ink border border-surface-border hover:bg-surface-soft",
};

// chip-toggle 선택됨: 채도 점프 없이 brand.soft 톤으로 토글
const CHIP_SELECTED_CLASSES =
  "bg-brand-soft text-brand-softfg border border-brand hover:bg-brand-soft";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  // 모든 사이즈가 터치 타깃 최소 44px 충족
  sm: "min-h-[44px] px-3 py-2 text-label",
  md: "min-h-[44px] px-4 py-2.5 text-label",
  lg: "min-h-[48px] px-5 py-3 text-body",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-card font-medium " +
  "transition-colors duration-150 focus-visible:outline-none " +
  "focus-visible:shadow-focus " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", selected, className, type, ...rest },
  ref,
) {
  const variantClass =
    variant === "chip-toggle" && selected
      ? CHIP_SELECTED_CLASSES
      : VARIANT_CLASSES[variant];

  return (
    <button
      ref={ref}
      // 명시 type 미지정 시 form submit 오작동 방지로 button 기본값
      type={type ?? "button"}
      // chip-toggle 접근성: 선택 상태를 aria-pressed로 노출
      aria-pressed={variant === "chip-toggle" ? Boolean(selected) : undefined}
      className={cx(BASE_CLASSES, variantClass, SIZE_CLASSES[size], className)}
      {...rest}
    />
  );
});

export default Button;
