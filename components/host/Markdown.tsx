"use client";

// 대화 로그용 경량 마크다운 렌더러 (의존성 없음).
// 인라인: **굵게**, *기울임*/_기울임_, `코드`, [텍스트](url)
// 블록: # 헤딩(굵게), - 목록(•), 빈 줄(여백). 에이전트 채팅 출력 가독성용.

import { Fragment, type ReactNode } from "react";

// 한 줄 안의 인라인 마크다운을 React 노드로 변환
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // 순서 중요: 굵게(**) → 코드(`) → 기울임(*,_) → 링크
  const re =
    /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*\n]+)\*)|(_([^_\n]+)_)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[2] !== undefined) {
      nodes.push(<strong key={key}>{m[2]}</strong>);
    } else if (m[4] !== undefined) {
      nodes.push(
        <code key={key} className="rounded bg-surface-sunken px-1 text-[0.85em]">
          {m[4]}
        </code>,
      );
    } else if (m[6] !== undefined) {
      nodes.push(<em key={key}>{m[6]}</em>);
    } else if (m[8] !== undefined) {
      nodes.push(<em key={key}>{m[8]}</em>);
    } else if (m[10] !== undefined) {
      nodes.push(
        <a
          key={key}
          href={m[11]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline"
        >
          {m[10]}
        </a>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function MarkdownText({ text }: { text: string }) {
  const lines = (text ?? "").split(/\n/);
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // 표 구분선(|---|---|) → 표시하지 않음
        if (/\|/.test(line) && /^\s*\|?[\s|:-]+\|?\s*$/.test(line) && /-/.test(line)) {
          return null;
        }
        // 표 행(| a | b |) → 셀을 ·로 구분해 한 줄로
        const tableRow = /^\s*\|(.+)\|\s*$/.exec(line);
        if (tableRow) {
          const cells = tableRow[1].split("|").map((c) => c.trim());
          return (
            <p key={i} className="text-ink">
              {cells.map((c, ci) => (
                <Fragment key={ci}>
                  {ci > 0 && <span className="text-ink-faint"> · </span>}
                  {renderInline(c, `t${i}-${ci}`)}
                </Fragment>
              ))}
            </p>
          );
        }
        // 수평선(---, ***, ___)
        if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
          return <hr key={i} className="my-1 border-surface-border" />;
        }
        const heading = /^\s{0,3}#{1,6}\s+(.*)$/.exec(line);
        const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
        if (heading) {
          return (
            <p key={i} className="font-semibold text-ink">
              {renderInline(heading[1], `h${i}`)}
            </p>
          );
        }
        if (bullet) {
          return (
            <p key={i} className="pl-2">
              • {renderInline(bullet[1], `b${i}`)}
            </p>
          );
        }
        if (line.trim() === "") return <span key={i} className="block h-1" />;
        return <p key={i}>{renderInline(line, `l${i}`)}</p>;
      })}
    </div>
  );
}
