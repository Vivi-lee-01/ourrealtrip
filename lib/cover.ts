// 커버 그라데이션 헬퍼 — 외부 커버 이미지가 없을 때의 저채도 대체 면
// (docs/DESIGN_BRIEF.md 5-1·5-2·7절: 이미지 없으면 surface-sunken + 목적지 이니셜
//  저채도 그라데이션). cover_image_url=null인 시드/proposal의 커버 배경에 사용한다.
//
// 무지개 카테고리 색 금지(DESIGN_BRIEF 13-8) — 채도 낮은 뉴트럴/차분한 톤만 반환한다.
// 카테고리 key별로 안정적(deterministic)으로 한 가지 그라데이션을 고른다.

/** 채도 낮은 Tailwind 그라데이션 클래스 풀 (다크 호환 고려한 차분한 톤) */
const GRADIENT_POOL: readonly string[] = [
  "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800",
  "bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800",
  "bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800",
  "bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800",
  "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800",
  "bg-gradient-to-br from-sky-100 to-slate-300 dark:from-sky-900 dark:to-slate-800",
] as const;

/** 문자열을 안정적 양의 정수 해시로 변환 (시드 안정성) */
function hashKey(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * 카테고리 key(또는 임의 식별 키)로 저채도 그라데이션 Tailwind 클래스를 반환한다.
 * 같은 key는 항상 같은 그라데이션을 받는다(시드/렌더 안정성).
 */
export function coverGradient(key: string | null | undefined): string {
  const seed = key && key.trim() !== "" ? key : "default";
  return GRADIENT_POOL[hashKey(seed) % GRADIENT_POOL.length];
}

/**
 * 목적지/제목에서 커버 이니셜(1~2자)을 뽑는다. 한글은 첫 글자, 라틴은 첫 글자 대문자.
 * 커버 이미지 없을 때 그라데이션 위에 얹는 placeholder 글자에 사용.
 */
export function coverInitial(label: string | null | undefined): string {
  const s = (label ?? "").trim();
  if (!s) return "·";
  return s.slice(0, 1).toUpperCase();
}
