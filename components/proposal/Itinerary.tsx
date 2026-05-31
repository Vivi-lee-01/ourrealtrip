// 6. Itinerary — 일정표 Day1/Day2 (PRD 6절 6번, DESIGN_BRIEF 5-7)
//
// 루마 일정 세부(18:30/19:00…) 차용. 좌측 타임라인 레일 + time(mono) + title.
// item에 product_link_id가 있으면 우측에 링크 아이콘 + 미세 brand 텍스트로
// 상품 연결을 암시한다. 클릭은 해당 상품 anchor(#pl-{id})로 스크롤(예약 강요 X).
// 날짜 미정(date null) 허용 → "Day N"만, 시간 없는 item은 불릿.

import type { Itinerary as ItineraryType, ItineraryItem } from "@/lib/types";

interface ItineraryProps {
  itinerary: ItineraryType | null;
  /** product_link_id → 표시명 (item 연결 링크 라벨). 없으면 일반 anchor */
  linkTitles?: Record<string, string>;
}

function ItineraryItemRow({
  item,
  linkTitles,
}: {
  item: ItineraryItem;
  linkTitles?: Record<string, string>;
}) {
  const linked = item.product_link_id;
  const linkLabel = linked ? linkTitles?.[linked] : undefined;

  return (
    <li className="relative pl-5">
      {/* 타임라인 도트 */}
      <span
        aria-hidden
        className="absolute left-0 top-2 h-1.5 w-1.5 -translate-x-[3px] rounded-pill bg-surface-borderStrong"
      />
      <div className="flex items-baseline gap-2">
        {item.time && (
          <span className="shrink-0 font-mono text-caption text-ink-muted">
            {item.time}
          </span>
        )}
        <span className="text-body-sm text-ink">{item.title}</span>
      </div>
      {linked && (
        <a
          href={`#pl-${linked}`}
          className="mt-1 inline-flex items-center gap-1 text-caption text-brand-softfg hover:text-brand"
        >
          <span aria-hidden>→</span>
          <span>{linkLabel ? `${linkLabel} 보기` : "연결된 상품 보기"}</span>
        </a>
      )}
    </li>
  );
}

export default function Itinerary({ itinerary, linkTitles }: ItineraryProps) {
  if (!itinerary || itinerary.days.length === 0) return null;

  return (
    <section
      aria-labelledby="itinerary-title"
      className="rounded-card border border-surface-border bg-surface p-4 shadow-card sm:p-5"
    >
      <h2 id="itinerary-title" className="text-h2 text-ink">
        일정표
      </h2>
      <p className="mt-1 text-body-sm text-ink-muted">
        대략의 흐름이에요. 확정 일정이 아니라 참고용이에요.
      </p>

      <div className="mt-4 space-y-5">
        {itinerary.days.map((day) => (
          <div key={day.day_no}>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded-chip bg-surface-soft px-2 py-0.5 text-label text-ink">
                Day {day.day_no}
              </span>
              <span className="text-h3 text-ink">{day.title}</span>
              {day.date && (
                <span className="font-mono text-caption text-ink-faint">
                  {day.date}
                </span>
              )}
            </div>
            <ul className="mt-2 space-y-2.5 border-l border-surface-border pl-3">
              {day.items.map((item, i) => (
                <ItineraryItemRow
                  key={`${day.day_no}-${i}`}
                  item={item}
                  linkTitles={linkTitles}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
