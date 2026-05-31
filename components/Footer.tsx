// 전역 푸터 — Airbnb footer-light 패턴 (docs/DESIGN_SYSTEM_AIRBNB.md §Footer)
//
// 흰 캔버스(페이지 floor와 동일, 대비 푸터 없음) + 헤어라인으로 구분된 링크 컬럼 3개 +
// 하단 legal band(저작권·고지 링크)는 muted caption 톤.
// merchant 아님 불변식: 결제/예약/Reserve 링크 0건 — 참여/모임/탐색 언어만.
// 고지 의무(disclosure)는 본문 DisclosureBanner가 1차로 충족하고, 푸터는 정책 링크만 보조.

import Link from "next/link";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

// 링크는 실재 라우트 기준(추측 라우트 금지). 미구현 안내는 정적 텍스트로만 둔다.
const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "둘러보기",
    links: [
      { label: "여행 탐색", href: "/discover" },
      { label: "카테고리", href: "/discover" },
    ],
  },
  {
    heading: "모임장",
    links: [
      { label: "이벤트 만들기", href: "/host/create" },
      { label: "로그인", href: "/login" },
    ],
  },
  {
    heading: "안내",
    links: [{ label: "전체 안내 보기", href: "/disclosure" }],
  },
];

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer
      className={`w-full border-t border-surface-border bg-surface ${className}`}
    >
      <div className="mx-auto w-full max-w-discover px-4 py-10 sm:px-6 sm:py-12">
        {/* 링크 컬럼 — 데스크톱 3컬럼, 모바일 1컬럼 */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-label font-semibold text-ink">
                {col.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* legal band — 헤어라인 위, muted caption 톤 */}
        <div className="mt-10 border-t border-surface-border pt-6">
          <p className="text-caption text-ink-faint">
            © 2026 OurRealTrip · 모임의 여행 의향을 모으는 곳입니다. 결제·예약은
            각자 판매처에서 진행돼요.
          </p>
        </div>
      </div>
    </footer>
  );
}
