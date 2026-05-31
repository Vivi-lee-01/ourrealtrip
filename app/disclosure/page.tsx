// "/disclosure" 고지/정책 페이지 (PRD 12절 화면 5, 17-1 필수 고지 6종)
//
// 고지 문구는 lib/copy/disclosures.ts 단일 출처에서만 가져온다(하드코딩 금지).
// DisclosureBanner의 variant="list"가 6종 전체를 평면 리스트로 렌더한다.
// 서버 컴포넌트 — JS 없이 동작.

import type { Metadata } from "next";
import DisclosureBanner from "@/components/DisclosureBanner";

export const metadata: Metadata = {
  title: "고지·정책 · 아워리얼트립",
  description:
    "아워리얼트립 이용 시 알아두어야 할 필수 고지 — 공식 서비스 여부, 수익 발생 가능성, 가격·예약 변동, 판매·예약 대행 여부, 조합형 여행안 성격, 상품별 독립 확인 안내",
};

export default function DisclosurePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">고지·정책</h1>
        <p className="mt-2 text-sm text-ink-muted">
          아워리얼트립을 이용하기 전에 아래 내용을 확인해 주세요. 이 안내는
          모든 여행 제안 페이지에도 함께 표시됩니다.
        </p>
      </header>

      {/* 필수 고지 6종 — 단일 출처(lib/copy/disclosures.ts)에서 전체 렌더 */}
      <DisclosureBanner variant="list" />
    </main>
  );
}
