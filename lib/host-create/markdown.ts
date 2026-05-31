// 경량 마크다운 후처리 (의존성 없음)
//
// 에이전트(Claude)는 응답에 마크다운(**굵게**, *기울임*, `코드`, 목록 등)을 섞어 쓴다.
// - 구조화 폼 필드(제목/컨셉/설명)는 <textarea>·평문 표시면이라 마크다운을 렌더할 수
//   없으므로 마커를 제거(strip)해 깨끗한 평문으로 만든다.
// - 대화 로그는 components/host/Markdown.tsx의 MarkdownText로 실제 렌더한다.

/** 마크다운 마커를 제거하고 평문으로 만든다(텍스트는 보존). */
export function stripMarkdown(s: string): string {
  if (!s) return s;
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **굵게**
    .replace(/__([^_]+)__/g, "$1") // __굵게__
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2") // *기울임*
    .replace(/(^|[^_])_([^_\n]+)_/g, "$1$2") // _기울임_
    .replace(/`([^`]+)`/g, "$1") // `코드`
    .replace(/~~([^~]+)~~/g, "$1") // ~~취소선~~
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // # 헤딩
    .replace(/^\s*>\s?/gm, "") // > 인용
    .replace(/^\s*[-*+]\s+/gm, "• ") // - 목록 → •
    .replace(/^\s*\d+\.\s+/gm, "") // 1. 번호 목록 → 번호 제거
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [텍스트](url) → 텍스트
    .replace(/^\s*\|[\s|:-]+\|\s*$/gm, "") // 표 구분선(|---|---|) 제거
    .replace(/^\s*\|(.+)\|\s*$/gm, (_m, inner: string) =>
      inner
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean)
        .join(" · "),
    ) // 표 행(| a | b |) → "a · b"
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, "") // 수평선(---) 제거
    .replace(/\n{3,}/g, "\n\n") // 과한 빈 줄 축소
    .trim();
}
