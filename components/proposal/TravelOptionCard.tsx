// 7. TravelOptionCard — A/B/C 운영안 카드 (PRD 6절 7번·7절, DESIGN_BRIEF 5-4)
//
// 상품 그리드가 아니라 "3개 동등 비교 카드"(UX 원칙 4). 가격/일정 + 의도 차원:
//   community_intent_fit / relationship_depth / post_trip_artifact /
//   schedule_difficulty / learning_or_creation_potential 를 사람 언어 칩으로.
// 수렴된 옵션은 "이 안으로 모였어요" 리본 + selected 톤(채도 점프 없음).
// ★ v2: 상품 링크는 카드 안이 아니라 공동 장바구니(#8)에 있다. 여기는 투표/관심까지만 —
//   "구매"·"이 안 예약" CTA 금지. CTA는 RSVP 패널 앵커로.

import Tag from "@/components/ui/Tag";
import Badge from "@/components/ui/Badge";
import {
  RELATIONSHIP_DEPTH_LABEL,
  SCHEDULE_DIFFICULTY_LABEL,
  OPTION_TYPE_LABEL,
} from "@/components/proposal/dimension-labels";
import type { TravelOptionWithLinks } from "@/lib/types";

interface TravelOptionCardProps {
  option: TravelOptionWithLinks;
  /** 그룹이 수렴한 옵션이면 true → 리본 + selected 톤 */
  converged?: boolean;
  /** 이 안에 투표한 사람 수 (소셜프루프) */
  voteCount?: number;
}

export default function TravelOptionCard({
  option,
  converged = false,
  voteCount = 0,
}: TravelOptionCardProps) {
  // 의도 차원 칩 — 값 있는 것만, 사람 언어로
  const chips: string[] = [];
  if (option.relationship_depth) {
    chips.push(`관계 ${RELATIONSHIP_DEPTH_LABEL[option.relationship_depth]}`);
  }
  if (option.schedule_difficulty) {
    chips.push(`일정 ${SCHEDULE_DIFFICULTY_LABEL[option.schedule_difficulty]}`);
  }
  if (option.community_intent_fit) {
    chips.push(option.community_intent_fit);
  }

  const containerClass = converged
    ? "rounded-card border border-brand bg-brand-soft shadow-card"
    : "rounded-card border border-surface-border bg-surface shadow-card";

  return (
    <article className={`${containerClass} overflow-hidden`}>
      {converged && (
        <p className="bg-brand px-4 py-1.5 text-label text-brand-fg">
          이 안으로 모였어요
          {voteCount > 0 && (
            <span className="ml-1 font-mono">· {voteCount}명</span>
          )}
        </p>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-h3 text-ink">{option.option_name}</h3>
          <Tag>{OPTION_TYPE_LABEL[option.option_type] ?? option.option_type}</Tag>
        </div>

        {option.description && (
          <p className="mt-2 text-body-sm text-ink-muted">{option.description}</p>
        )}

        {option.estimated_budget && (
          <p className="mt-3">
            <span className="text-caption text-ink-faint">예상 1인 </span>
            <span className="font-mono text-num-lg text-ink">
              {option.estimated_budget}
            </span>
            <span className="text-caption text-ink-faint"> · 변동 가능</span>
          </p>
        )}

        {/* 의도 차원 칩 */}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Tag key={c} dot>
                {c}
              </Tag>
            ))}
          </div>
        )}

        {option.post_trip_artifact && (
          <p className="mt-2 text-body-sm text-ink-muted">
            <span className="text-ink-faint">남는 것 · </span>
            {option.post_trip_artifact}
          </p>
        )}
        {option.learning_or_creation_potential &&
          option.learning_or_creation_potential !== option.post_trip_artifact && (
            <p className="mt-1 text-body-sm text-ink-muted">
              <span className="text-ink-faint">배움·창작 · </span>
              {option.learning_or_creation_potential}
            </p>
          )}

        {option.fit_reason && (
          <p className="mt-3 rounded-chip bg-surface-soft px-3 py-2 text-body-sm text-ink">
            <span className="text-caption text-ink-faint">누구에게 맞나 · </span>
            {option.fit_reason}
          </p>
        )}

        {option.risk_note && (
          <p className="mt-2 flex gap-2 text-body-sm text-ink-muted">
            <span aria-hidden className="text-warn">
              ⚠
            </span>
            <span>
              <span className="text-caption text-ink-faint">알아둘 점 · </span>
              {option.risk_note}
            </span>
          </p>
        )}

        {/* 투표 안내 — RSVP 앵커로. "구매/예약" CTA 없음 */}
        <a
          href="#rsvp-title"
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-card border border-surface-border bg-surface px-4 py-2.5 text-label text-ink transition-colors hover:bg-surface-soft"
        >
          이 안에 투표하기
        </a>

        {!converged && voteCount > 0 && (
          <p className="mt-2 text-center">
            <Badge tone="brand" dot>
              <span className="font-mono">{voteCount}</span>명이 이 안에 투표
            </Badge>
          </p>
        )}
      </div>
    </article>
  );
}
