// 11. DecisionHelpers — 결정 보조 (PRD 6절 11번, DESIGN_BRIEF 9절)
//
// 가격대 / 일정 난이도 / 동선·취소·변경 리스크 / 추천·비추천 대상 / checked_at 요약.
// 옵션 전반을 가로질러 의사결정 보조. 보장 표현 없음. checked_at 30일 경과 시 warn 톤.

import { SCHEDULE_DIFFICULTY_LABEL } from "@/components/proposal/dimension-labels";
import type { TripProposalDetail } from "@/lib/types";

interface DecisionHelpersProps {
  proposal: TripProposalDetail;
}

/** checked_at(YYYY-MM-DD) 기준일로부터 경과일. 파싱 불가 시 null */
function daysSince(checkedAt: string | null): number | null {
  if (!checkedAt) return null;
  const t = Date.parse(checkedAt);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

export default function DecisionHelpers({ proposal }: DecisionHelpersProps) {
  const difficulties = proposal.options
    .map((o) => o.schedule_difficulty)
    .filter((d): d is NonNullable<typeof d> => d != null);
  const difficultyLabels = Array.from(
    new Set(difficulties.map((d) => SCHEDULE_DIFFICULTY_LABEL[d])),
  );

  const risks = proposal.options
    .filter((o) => o.risk_note)
    .map((o) => ({ name: o.option_name, note: o.risk_note as string }));

  const elapsed = daysSince(proposal.checked_at);
  const stale = elapsed != null && elapsed >= 30;

  return (
    <section
      aria-labelledby="decision-title"
      className="rounded-card border border-surface-border bg-surface p-4 shadow-card sm:p-5"
    >
      <h2 id="decision-title" className="text-h2 text-ink">
        결정에 도움이 되는 정보
      </h2>

      <dl className="mt-3 space-y-3 text-body-sm">
        {proposal.expected_budget && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-caption text-ink-faint">예상 가격대</dt>
            <dd className="text-ink">
              {proposal.expected_budget}
              <span className="text-ink-faint"> · 확인 시점 기준, 변동 가능</span>
            </dd>
          </div>
        )}

        {difficultyLabels.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-caption text-ink-faint">일정 난이도</dt>
            <dd className="text-ink">{difficultyLabels.join(" ~ ")}</dd>
          </div>
        )}

        {proposal.target_audience && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-caption text-ink-faint">추천 / 비추천 대상</dt>
            <dd className="text-ink">{proposal.target_audience}</dd>
          </div>
        )}

        {risks.length > 0 && (
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-ink-faint">동선·취소·변경 리스크</dt>
            <dd>
              <ul className="space-y-1 text-ink">
                {risks.map((r) => (
                  <li key={r.name} className="flex gap-2">
                    <span aria-hidden className="text-ink-faint">
                      ·
                    </span>
                    <span>
                      <span className="text-ink-muted">{r.name}</span> {r.note}
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      {proposal.checked_at && (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 font-mono text-caption ${stale ? "text-warn" : "text-ink-faint"}`}
        >
          {stale && (
            <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-warn" />
          )}
          정보 확인 시점 · {proposal.checked_at}
          {stale && <span className="font-sans"> · 정보가 오래됐어요</span>}
        </p>
      )}
    </section>
  );
}
