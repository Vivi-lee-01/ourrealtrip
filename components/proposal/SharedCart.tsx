// 8·9·10. 공동 여행 장바구니 (함께보기 뷰) (PRD 6절 8·9·10번, COMMERCE 2·3·5·6, DESIGN_BRIEF 5-5·5-6)
//
// ★★ 절대 준수 (no-merchant, COMMERCE 1-3):
//  - 이것은 코디네이션/함께보기 뷰다. 체크아웃이 아니다.
//  - 단일 "전체 예약"/묶음결제 버튼이 구조적으로 없다 — 항목별 독립 CTA(BookingItemControls)만.
//  - 합계는 "1인 예상총액 (참고)" 라벨로만. 결제 버튼 옆에 두는 합계 레이아웃 금지.
//  - 7번째 고지(함께보기용)를 항상 뷰 안에 노출(DisclosureBanner variant="cart").
//
// 구성: 헤더 + "N명이 이 안 담음" pill + 1인 예상총액(참고) + 포함내역(항공/숙소/TNA)
//   항목 row(독립 CTA) + 그룹 진행현황(BookingProgressBar #10) + 7번 고지.
// status가 booking_open이 아니면 "수렴 예정 안" 참고 톤 안내를 덧붙인다(데모 가시성).

import DisclosureBanner from "@/components/DisclosureBanner";
import Badge from "@/components/ui/Badge";
import BookingItemControls from "@/components/proposal/BookingItemControls";
import BookingProgressBar from "@/components/proposal/BookingProgressBar";
import { findBanned } from "@/lib/copy/banned-phrases";
import {
  PRODUCT_TYPE_LABEL,
  PRODUCT_TYPE_ORDER,
  PRODUCT_TYPE_ICON,
} from "@/components/proposal/dimension-labels";
import {
  deriveCartTotal,
  formatKRW,
  groupLinksByType,
} from "@/lib/cart";
import type {
  TravelOptionWithLinks,
  ProductLink,
  ProposalStatus,
  BookingProgressAggregate,
  BookingProgress,
} from "@/lib/types";

/** 제3자 상품 제목의 특가·프로모션 강조 문구 중립화(PRD 17-2) */
function neutralizeTitle(title: string): string {
  let out = title;
  for (const phrase of findBanned(title)) out = out.split(phrase).join("");
  out = out.replace(/\s{2,}/g, " ").replace(/^[\s·,/]+|[\s·,/]+$/g, "").trim();
  return out.length > 0 ? out : "상품 보기";
}

interface SharedCartProps {
  proposalId: string;
  /** 그룹이 수렴한 옵션(+상품 링크 묶음) */
  option: TravelOptionWithLinks;
  status: ProposalStatus;
  /** "N명이 이 안 담음" — voted_option 집계 */
  addedByCount: number;
  /** 그룹 진행현황 집계(#10). 없으면 진행 바 0건 */
  progress: BookingProgressAggregate;
  /** 내 진행 상태(쿠키 세션 복원). product_link_id → status */
  myProgress: Record<string, BookingProgress["status"]>;
}

function CartItemRow({
  link,
  proposalId,
  optionId,
  myStatus,
}: {
  link: ProductLink;
  proposalId: string;
  optionId: string;
  myStatus?: BookingProgress["status"];
}) {
  const title = neutralizeTitle(link.title);
  return (
    <li
      id={`pl-${link.product_link_id}`}
      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-ink">{title}</p>
        {link.source && (
          <p className="mt-0.5 text-caption text-ink-faint">
            판매처 · {link.source}
          </p>
        )}
        {link.price_hint && (
          <p className="mt-1 font-mono text-num text-ink-muted">
            {link.price_hint}
          </p>
        )}
        {link.caution && (
          <p className="mt-1 text-caption text-ink-faint">주의 · {link.caution}</p>
        )}
        {link.checked_at && (
          <p className="mt-1 font-mono text-caption text-ink-faint">
            {link.checked_at} 확인 기준 · 이후 변동될 수 있어요
          </p>
        )}
      </div>
      <div className="shrink-0">
        <BookingItemControls
          proposalId={proposalId}
          optionId={optionId}
          productLinkId={link.product_link_id}
          initialStatus={myStatus ?? "pending"}
        />
      </div>
    </li>
  );
}

export default function SharedCart({
  proposalId,
  option,
  status,
  addedByCount,
  progress,
  myProgress,
}: SharedCartProps) {
  const grouped = groupLinksByType(option.product_links);
  const groupsToRender = PRODUCT_TYPE_ORDER.filter((t) => grouped[t].length > 0);
  if (groupsToRender.length === 0) return null;

  const total = deriveCartTotal(option.product_links);
  const notYetOpen = status !== "booking_open";

  // product_link_id → 진행 집계 (진행 바용)
  const progressByLink = new Map(
    progress.by_product_link.map((b) => [b.product_link_id, b]),
  );

  return (
    <section
      aria-labelledby="cart-title"
      className="rounded-card border border-surface-border bg-surface-sunken p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="cart-title" className="text-h2 text-ink">
          우리 여행 장바구니
        </h2>
        {addedByCount > 0 && (
          <Badge tone="brand">
            <span className="font-mono">{addedByCount}</span>명이 이 안을 담음
          </Badge>
        )}
      </div>
      <p className="mt-1 text-caption text-ink-muted">
        함께 보기용이에요. 결제·예약은 각자, 판매처에서 따로 진행해요.
      </p>
      <p className="mt-1 text-body-sm text-ink-muted">
        수렴한 안 · <span className="text-ink">{option.option_name}</span>
      </p>

      {notYetOpen && (
        <p className="mt-3 rounded-chip bg-surface-soft px-3 py-2 text-caption text-ink-muted">
          아직 모집 단계예요. 아래는 가장 많이 모인 안을 미리 함께 보는 참고용이고,
          각 상품은 판매처에서 직접 확인·구매합니다.
        </p>
      )}

      {/* 포함내역 (항공/숙소/TNA) — 항목별 독립 CTA */}
      <div className="mt-4 space-y-4">
        {groupsToRender.map((type) => (
          <div key={type}>
            <p className="flex items-center gap-1.5 text-label text-ink-muted">
              <span aria-hidden>{PRODUCT_TYPE_ICON[type]}</span>
              {PRODUCT_TYPE_LABEL[type]}
            </p>
            <ul className="mt-1 divide-y divide-surface-border rounded-card border border-surface-border bg-surface px-3">
              {grouped[type].map((link) => (
                <CartItemRow
                  key={link.product_link_id}
                  link={link}
                  proposalId={proposalId}
                  optionId={option.option_id}
                  myStatus={myProgress[link.product_link_id]}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 1인 예상총액 (참고) — 단일 결제 버튼 옆에 두지 않음 */}
      {total.sum != null && (
        <div className="mt-4 rounded-card border border-surface-border bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-label text-ink-muted">
              1인 예상총액 (참고)
            </span>
            <span className="font-mono text-num-lg text-ink">
              {formatKRW(total.sum)}
              {!total.complete && (
                <span className="text-caption text-ink-faint">~</span>
              )}
            </span>
          </div>
          <p className="mt-1 text-caption text-ink-faint">
            {total.complete
              ? "합산은 참고용이며 묶음 결제가 아니에요."
              : `가격이 확보된 ${total.countedItems}개 항목 기준 참고치예요. 묶음 결제가 아니에요.`}
          </p>
        </div>
      )}

      {/* 10. 그룹 진행현황 */}
      <BookingProgressBar
        className="mt-5"
        progress={progress}
        productLinks={option.product_links}
        progressByLink={progressByLink}
      />

      {/* 7번째 고지 — 장바구니 뷰 안에 항상(단일 출처) */}
      <DisclosureBanner variant="cart" className="mt-4" />
    </section>
  );
}
