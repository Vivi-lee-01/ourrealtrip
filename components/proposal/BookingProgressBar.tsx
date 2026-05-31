// 10. BookingProgressBar — 그룹 진행현황 (PRD 6절 10번, COMMERCE 5·6, DESIGN_BRIEF 5-6)
//
// 항목별 self_booked 진행을 진행 바로 보여준다. ★ "참여자 자가보고 + 클릭추적 기준"
// 문구를 항상 병기한다(실 결제확인 불가 — affiliate 한계). 주문 상태 톤(배송/결제완료) 금지.
// 진행 바 채움 = self_booked(완료) 자가표시 분. 트랙은 (clicked+self_booked) 참여자 기준.

import ProgressBar from "@/components/ui/ProgressBar";
import {
  PRODUCT_TYPE_LABEL,
  PRODUCT_TYPE_ICON,
  PRODUCT_TYPE_ORDER,
} from "@/components/proposal/dimension-labels";
import type {
  BookingProgressAggregate,
  BookingProgressByLink,
  ProductLink,
} from "@/lib/types";

interface BookingProgressBarProps {
  progress: BookingProgressAggregate;
  /** 수렴 옵션의 상품 링크(렌더 순서·제목 매핑용) */
  productLinks: ProductLink[];
  /** product_link_id → 집계(미리 만든 Map) */
  progressByLink: Map<string, BookingProgressByLink>;
  className?: string;
}

export default function BookingProgressBar({
  progress,
  productLinks,
  progressByLink,
  className = "",
}: BookingProgressBarProps) {
  // 항공 → 숙소 → TNA 순으로 active 링크 정렬
  const active = productLinks.filter((l) => l.status === "active");
  const ordered = PRODUCT_TYPE_ORDER.flatMap((t) =>
    active.filter((l) => l.product_type === t),
  );
  if (ordered.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-h3 text-ink">진행현황</h3>
      <p className="mt-0.5 text-caption text-ink-faint">{progress.basis}</p>

      <ul className="mt-3 space-y-3">
        {ordered.map((link) => {
          const agg = progressByLink.get(link.product_link_id);
          // 채움 = 예약완료(자가보고+호스트확인+외부검증). 클릭/의도는 아직 미완료.
          const booked = agg
            ? agg.self_reported_booked +
              agg.host_confirmed_booked +
              agg.externally_confirmed_booked
            : 0;
          // 트랙(참여자 수) = 진행 기록이 있는 참여자(취소 제외)
          const participants = agg
            ? agg.pending +
              agg.clicked_booking_link +
              agg.booking_intent +
              agg.self_reported_booked +
              agg.host_confirmed_booked +
              agg.externally_confirmed_booked
            : 0;
          const label = `${PRODUCT_TYPE_LABEL[link.product_type]} 진행`;
          return (
            <li key={link.product_link_id} className="flex items-center gap-3">
              <span
                className="w-6 shrink-0 text-center text-body-sm"
                aria-hidden
              >
                {PRODUCT_TYPE_ICON[link.product_type]}
              </span>
              <ProgressBar
                className="flex-1"
                value={booked}
                max={participants}
                label={label}
              />
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-caption text-ink-faint">
        “예약함”은 참여자가 직접 표시한 자가보고예요. 시스템이 결제를 확인한 게 아니에요.
      </p>
    </div>
  );
}
