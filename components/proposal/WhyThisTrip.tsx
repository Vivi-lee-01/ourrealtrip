// 5. WhyThisTrip — 우리 모임에 왜 의미 있는가 (PRD 6절 5번, 17-4)
//
// 의도 필드를 사용자-facing 번역 카피로 표시한다(철학어 금지).
//   community_intent     → "이번 여행의 목적"
//   intended_outcome     → "우리 모임이 얻고 싶은 것"
//   learning_or_creation_goal → "배우거나 만들고 싶은 것"
//   post_trip_artifact   → "이 여행이 끝나고 남을 것"
//   why_now              → "왜 지금인가"
// + target_audience("누구에게 맞고 누구에게 애매한지").
// 내부 전략어는 seed 단계에서 이미 번역됨 — 여기선 라벨만 사용자 언어로 붙인다.

import type { TripProposalDetail } from "@/lib/types";

interface WhyRow {
  label: string;
  value: string | null;
}

interface WhyThisTripProps {
  proposal: TripProposalDetail;
}

export default function WhyThisTrip({ proposal }: WhyThisTripProps) {
  const rows: WhyRow[] = [
    { label: "이번 여행의 목적", value: proposal.community_intent },
    { label: "우리 모임이 얻고 싶은 것", value: proposal.intended_outcome },
    {
      label: "배우거나 만들고 싶은 것",
      value: proposal.learning_or_creation_goal,
    },
    { label: "이 여행이 끝나고 남을 것", value: proposal.post_trip_artifact },
    { label: "왜 지금인가", value: proposal.why_now },
  ];

  const filled = rows.filter((r) => r.value && r.value.trim().length > 0);

  if (filled.length === 0 && !proposal.target_audience) return null;

  return (
    <section
      aria-labelledby="why-trip-title"
      className="rounded-card border border-surface-border bg-surface p-4 shadow-card sm:p-5"
    >
      <h2 id="why-trip-title" className="text-h2 text-ink">
        우리 모임에 왜 의미 있는가
      </h2>
      <p className="mt-1 text-body-sm text-ink-muted">
        이 여행이 우리 모임에 어떤 의미인지, 왜 지금인지 먼저 봐주세요.
      </p>

      {filled.length > 0 && (
        <dl className="mt-4 space-y-3">
          {filled.map((row) => (
            <div key={row.label} className="rounded-chip bg-surface-soft px-3 py-2.5">
              <dt className="text-caption text-ink-faint">{row.label}</dt>
              <dd className="mt-0.5 text-body text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {proposal.target_audience && (
        <div className="mt-4 rounded-chip border border-surface-border px-3 py-2.5">
          <p className="text-caption text-ink-faint">
            이런 분께 맞아요 / 이런 분껜 애매해요
          </p>
          <p className="mt-0.5 text-body text-ink">{proposal.target_audience}</p>
        </div>
      )}
    </section>
  );
}
