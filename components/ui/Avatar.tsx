// 아바타 원자 + 아바타 스택 — 소셜프루프 (docs/DESIGN_BRIEF.md 5-1·5-9)
//
// 이름/이메일은 수집하지 않으므로(확정 결정 4) 익명 이니셜·중립 면만 표시한다.
// 이미지가 없으면 저채도 surface-sunken 면 + 이니셜. 무지개 색 금지.

import { coverInitial } from "@/lib/cover";

interface AvatarProps {
  /** 표시명(있으면 이니셜, 없으면 중립 도트) — 익명일 땐 생략 */
  name?: string | null;
  src?: string | null;
  /** 픽셀 크기 (기본 28) */
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 28, className = "" }: AvatarProps) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ""}
        style={dim}
        className={`inline-block rounded-pill border border-surface-border object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={dim}
      className={`inline-flex items-center justify-center rounded-pill border border-surface-border bg-surface-sunken text-caption font-semibold text-ink-muted ${className}`}
    >
      {coverInitial(name)}
    </span>
  );
}

interface AvatarStackProps {
  /** 표시할 사람 수(소셜프루프). 익명이라 이름 배열 없이 개수만 받는다 */
  count: number;
  /** 화면에 겹쳐 보일 최대 아바타 수 (기본 3) */
  max?: number;
  size?: number;
  className?: string;
}

/** 겹친 아바타 스택 + "+N" (DESIGN_BRIEF 5-1: 겹침 -8px, 최대 3 + +N) */
export function AvatarStack({
  count,
  max = 3,
  size = 28,
  className = "",
}: AvatarStackProps) {
  const shown = Math.min(Math.max(count, 0), max);
  const extra = Math.max(count - shown, 0);
  return (
    <span className={`inline-flex items-center ${className}`}>
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} className={i > 0 ? "-ml-2" : ""}>
          <Avatar size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{ width: size, height: size }}
          className="-ml-2 inline-flex items-center justify-center rounded-pill border border-surface-border bg-surface-sunken font-mono text-caption text-ink-muted"
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

export default Avatar;
