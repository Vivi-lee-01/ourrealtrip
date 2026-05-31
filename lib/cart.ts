// 공동 장바구니 파생 헬퍼 (COMMERCE_MODEL 2-2·2-3)
//
// ★ 이것은 "1인 예상총액 (참고)" 표시용 합산일 뿐 — 체크아웃 합계가 아니다.
//   별도 cart 테이블/주문 엔티티 없음. 결제는 항목별·각자·판매처에서.
//   price_hint는 자유 텍스트("46,550원~", "왕복 ~₩52,000대 (변동)")라 best-effort 파싱.
//   파싱 불가 항목은 합산에서 빠지므로 총액은 "확보된 항목 기준 참고치"임을 화면에 명시한다.

import type { ProductLink, ProductType } from "@/lib/types";

/** price_hint 문자열에서 첫 번째 원화/숫자 금액을 best-effort로 추출(없으면 null) */
export function parsePriceHint(hint: string | null): number | null {
  if (!hint) return null;
  // "46,550원~", "~₩52,000대", "92,073원~ · 평점 4.9" 등에서 첫 숫자 그룹
  const m = hint.replace(/[₩,]/g, "").match(/(\d{4,})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export interface CartTotal {
  /** 합산에 포함된 항목 수 (가격 파싱 성공분) */
  countedItems: number;
  /** 전체 항목 수 */
  totalItems: number;
  /** 합산된 1인 예상총액(원). 파싱된 항목만 — 참고치 */
  sum: number | null;
  /** 모든 항목 가격이 파싱돼 합산이 완전한지 */
  complete: boolean;
}

/**
 * 옵션의 ProductLink 묶음에서 "1인 예상총액 (참고)"을 계산한다.
 * 파싱 가능한 항목만 합산하며, 불완전하면 complete=false로 화면에 "확보된 항목 기준" 명시.
 */
export function deriveCartTotal(links: ProductLink[]): CartTotal {
  const active = links.filter((l) => l.status === "active");
  let sum = 0;
  let counted = 0;
  for (const l of active) {
    const p = parsePriceHint(l.price_hint);
    if (p != null) {
      sum += p;
      counted += 1;
    }
  }
  return {
    countedItems: counted,
    totalItems: active.length,
    sum: counted > 0 ? sum : null,
    complete: counted === active.length && active.length > 0,
  };
}

/** 원화 표시 포맷 (예: 277,550원) */
export function formatKRW(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** product_type별로 active 링크를 그룹핑 (항공 → 숙소 → TNA 순서는 호출부에서) */
export function groupLinksByType(
  links: ProductLink[],
): Record<ProductType, ProductLink[]> {
  const grouped: Record<ProductType, ProductLink[]> = {
    flight: [],
    stay: [],
    tna: [],
  };
  for (const l of links) {
    if (l.status !== "active") continue;
    grouped[l.product_type].push(l);
  }
  return grouped;
}
