// 필수 고지 배너 — 서버 컴포넌트 (docs/DESIGN_BRIEF.md 9절, COMMERCE_MODEL 4절)
//
// 고지 문구는 lib/copy/disclosures.ts 단일 출처에서만 가져온다(하드코딩 금지).
// proposal 페이지·고지 페이지·공동 장바구니 뷰에 노출되며, 필수 고지 7종이
// 노출 누락 없이 표현된다. 'use client' 없음 — <details>/<summary> 네이티브 접이식.
// 시각 톤(DESIGN_BRIEF 9): 경고 빨강 X, 차분한 회색 정보 박스.

import {
  DISCLOSURES,
  CORE_DISCLOSURE_IDS,
  CART_DISCLOSURE_ID,
} from "@/lib/copy/disclosures";

interface DisclosureBannerProps {
  /**
   * "collapsed": 핵심 고지만 접이식으로(상품 섹션·전역 배너용, 기본값)
   * "list": 7종 전체를 평면 리스트로(고지 페이지용)
   * "cart": 공동 장바구니 전용 — 7번(함께보기용) 고지만 상시 노출(COMMERCE_MODEL 4-2)
   */
  variant?: "collapsed" | "list" | "cart";
  className?: string;
}

export default function DisclosureBanner({
  variant = "collapsed",
  className = "",
}: DisclosureBannerProps) {
  if (variant === "cart") {
    const cart = DISCLOSURES.find((d) => d.id === CART_DISCLOSURE_ID);
    if (!cart) return null;
    return (
      <p
        className={`rounded-chip bg-surface-soft p-3 text-caption text-ink-muted ${className}`}
      >
        {cart.text}
      </p>
    );
  }

  if (variant === "list") {
    return (
      <section
        aria-label="필수 고지"
        className={`rounded-card border border-surface-border bg-surface-soft p-4 text-body-sm text-ink-muted ${className}`}
      >
        <h2 className="mb-3 text-h3 text-ink">알려드립니다</h2>
        <ol className="list-decimal space-y-2 pl-5">
          {DISCLOSURES.map((d) => (
            <li key={d.id}>{d.text}</li>
          ))}
        </ol>
      </section>
    );
  }

  // collapsed: 핵심 고지를 요약으로 보여주고, 펼치면 7종 전체
  const coreText = DISCLOSURES.filter((d) =>
    CORE_DISCLOSURE_IDS.includes(d.id),
  ).map((d) => d.text);

  return (
    <details
      className={`rounded-card border border-surface-border bg-surface-soft text-body-sm text-ink-muted ${className}`}
    >
      <summary className="touch-target flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium text-ink">
        <span aria-hidden>ⓘ</span>
        <span>예약·수익·가격 변동 안내 (탭하여 전체 보기)</span>
      </summary>
      <div className="border-t border-surface-border px-4 py-3">
        <p className="mb-2 text-caption text-ink-faint">핵심 안내</p>
        <ul className="mb-3 space-y-1">
          {coreText.map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden>·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mb-2 text-caption text-ink-faint">전체 고지</p>
        <ol className="list-decimal space-y-1 pl-5">
          {DISCLOSURES.map((d) => (
            <li key={d.id}>{d.text}</li>
          ))}
        </ol>
      </div>
    </details>
  );
}
