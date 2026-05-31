// 카드 원자 — 패널/카드 컨테이너 (docs/DESIGN_BRIEF.md 4·5절)
//
// 그림자는 거의 안 보일 만큼 얕게(루마 톤). variant로 면 톤을 분기한다.
//  - default: 카드 면(surface) + 헤어라인 보더 + shadow-card
//  - sunken: 장바구니/입력 안쪽 면(surface-sunken, "안으로 들어간" 느낌)
//  - selected: 수렴/선택된 카드(brand 보더 + brand.soft 톤, 채도 점프 없음)

import type { ElementType, ReactNode } from "react";

export type CardVariant = "default" | "sunken" | "selected";

interface CardProps {
  variant?: CardVariant;
  /** 렌더 태그 (예: "article", "section"). 기본 div */
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-surface border border-surface-border shadow-card",
  sunken: "bg-surface-sunken border border-surface-border",
  selected: "bg-brand-soft border border-brand shadow-card",
};

export default function Card({
  variant = "default",
  as,
  className = "",
  children,
}: CardProps) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={`rounded-card p-4 sm:p-5 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </Tag>
  );
}
