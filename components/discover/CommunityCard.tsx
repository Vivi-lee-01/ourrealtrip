// CommunityCard — 커뮤니티 구독 카드 (시각만, 구독 영속화는 Phase 2 스텁)
//
// 근거: DISCOVER.md 4절 #4 / 8절 B1·열린질문 1 — PRD 9절에 Subscription 엔티티가
// 정의돼 있지 않아 임의 구독 테이블 신설은 보류한다. 따라서 Phase 1은 "다음 제안
// 알림 받기"를 시각적으로만 노출하고, 실제 구독 동작·데이터는 두지 않는다(스텁).
// 루마 "Featured Calendars"(커뮤니티 구독) anatomy 차용 — 클론 아님.
//
// negative spec 준수: 결제/예약 CTA 없음. 카드는 정보 + 구독 스텁만.

import { coverGradient, coverInitial } from "@/lib/cover";

interface CommunityCardProps {
  communityId: string;
  name: string;
  /** 카테고리(자유 text, nullable) */
  category?: string | null;
  hostName: string;
  description?: string | null;
}

export default function CommunityCard({
  communityId,
  name,
  category,
  hostName,
  description,
}: CommunityCardProps) {
  return (
    <div className="flex flex-col rounded-md border border-surface-border bg-surface p-4 transition-shadow duration-200 ease-out hover:shadow-card">
      {/* 상단: 커뮤니티 아바타(저채도 면 + 이니셜) + 이름·호스트 */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-h3 font-bold text-ink/30 ${coverGradient(
            communityId,
          )}`}
        >
          {coverInitial(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-h3 text-ink">{name}</p>
          <p className="truncate text-caption text-ink-faint">
            모임장 {hostName}
            {category ? (
              <>
                <span aria-hidden> · </span>
                <span>{category}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* 설명 */}
      {description ? (
        <p className="mt-3 line-clamp-2 text-body-sm text-ink-muted">
          {description}
        </p>
      ) : null}

      {/* 구독 스텁 — Phase 2 예정. 동작 없음(disabled), 오해 없도록 톤 명시 */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="다음 제안 알림 기능은 준비 중이에요"
        className="touch-target mt-4 w-full cursor-not-allowed rounded-pill border border-surface-border bg-surface-soft px-4 text-label text-ink-faint"
      >
        다음 제안 알림 받기 (준비 중)
      </button>
    </div>
  );
}
