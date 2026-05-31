import type { Config } from "tailwindcss";

// 모바일 우선 디자인 토큰 v2 (docs/DESIGN_BRIEF.md)
//
// 원칙: 절제된 뉴트럴 90% + 강조색 1개 + 의미색 4개 (루마급 절제 톤).
// 기존 네임스페이스(brand/ink/surface)는 유지·확장한다 — 마크업 변경 없이 색만 갱신.
// 라이트/다크는 CSS 변수(globals.css)로 분기하며, Tailwind 색 토큰은 var() 참조로
// 바인딩한다(darkMode: "class"). 색 값을 마크업에 직접 쓰지 않고 토큰으로만 쓴다.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // CSS 변수 참조(라이트/다크 토큰은 globals.css에서 정의). 변수 미정의 시
      // 동일 hex fallback이 동작하도록 var(--x, hex) 형태로 안전망을 둔다.
      colors: {
        // ── 강조색(brand) — 단 하나 = Rausch (Airbnb 단일 액센트) ──
        brand: {
          DEFAULT: "var(--brand-DEFAULT, #FF385C)",
          hover: "var(--brand-hover, #E00B41)", // hover=active(press) 통합
          fg: "var(--brand-fg, #FFFFFF)",
          soft: "var(--brand-soft, #FFE8EC)",
          softfg: "var(--brand-softfg, #C13515)",
          disabled: "var(--brand-disabled, #FFD1DA)", // Rausch Disabled — 신규
        },
        // ── 텍스트(ink) — 톤 확장 (Airbnb: never pure black) ──
        ink: {
          DEFAULT: "var(--ink-DEFAULT, #222222)",
          body: "var(--ink-body, #3F3F3F)", // 장문 본문 톤 — 신규
          muted: "var(--ink-muted, #6A6A6A)",
          faint: "var(--ink-faint, #929292)", // muted-soft
        },
        // ── 표면(surface) — fill + hairline(3종) 분리 (Airbnb) ──
        surface: {
          DEFAULT: "var(--surface-DEFAULT, #FFFFFF)",
          soft: "var(--surface-soft, #F7F7F7)",
          strong: "var(--surface-strong, #F2F2F2)", // 아이콘버튼 면 — 신규
          sunken: "var(--surface-sunken, #EFEFF1)", // 도메인 토큰 — 유지
          border: "var(--surface-border, #DDDDDD)", // hairline
          hairlineSoft: "var(--hairline-soft, #EBEBEB)", // 긴 스크롤 구분선 — 신규
          borderStrong: "var(--surface-borderStrong, #C1C1C1)", // border-strong
        },
        // ── 의미색(semantic) — 배지·도트·얇은 보더 전용 (DESIGN_BRIEF 2-3) ──
        success: {
          DEFAULT: "var(--success-DEFAULT, #16A34A)",
          soft: "var(--success-soft, #E7F6EC)",
        },
        warn: {
          DEFAULT: "var(--warn-DEFAULT, #B45309)",
          soft: "var(--warn-soft, #FBF1E4)",
        },
        info: {
          DEFAULT: "var(--info-DEFAULT, #0E7490)",
          soft: "var(--info-soft, #E1F2F5)",
        },
        neutral: {
          DEFAULT: "var(--neutral-DEFAULT, #71717A)",
          soft: "var(--neutral-soft, #F1F1F3)",
        },
        // ── 의미색(semantic) — Airbnb 신규 추가 (replace 아님) ──
        error: {
          DEFAULT: "var(--error, #C13515)", // form 검증 에러 텍스트 (Rausch와 구분)
          hover: "var(--error-hover, #B32505)",
        },
        "legal-link": "var(--legal-link, #428BFF)", // legal 카피 inline 링크 전용
        scrim: "var(--scrim, #000000)", // 모달 백드롭 (렌더 시 50% opacity)
      },
      fontFamily: {
        // Inter(라틴/UI) + 한글 시스템 fallback / JetBrains Mono(수치 전용)
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // 타입 스케일 (Airbnb DESIGN_SYSTEM §Typography). display 굵기 절제(700→500-600),
        // display 계열 lineHeight ~1.18로 타이트닝(Cereal→Inter 근사, G0-1). 데스크톱 크기는 sm:text-* 유틸로 올림.
        display: [
          // homepage h1 대응(display-xl 28px/700)은 700 유지 — 강조 모멘트
          "1.75rem",
          { lineHeight: "1.18", letterSpacing: "0", fontWeight: "700" },
        ],
        "display-lg": [
          // listing detail h1(display-lg 22px/500) — 굵기 절제가 핵심
          "1.375rem",
          { lineHeight: "1.18", letterSpacing: "-0.44px", fontWeight: "500" },
        ],
        h1: [
          // display-md 21px/700
          "1.5rem",
          { lineHeight: "1.25", letterSpacing: "0", fontWeight: "700" },
        ],
        h2: [
          // display-sm 20px/600
          "1.1875rem",
          { lineHeight: "1.2", letterSpacing: "-0.18px", fontWeight: "600" },
        ],
        h3: [
          // title-md 16px/600
          "1rem",
          { lineHeight: "1.25", letterSpacing: "0", fontWeight: "600" },
        ],
        body: ["1rem", { lineHeight: "1.5" }], // body-md 16px/400 (15→16px)
        "body-sm": ["0.875rem", { lineHeight: "1.43" }], // body-sm 14px/400 (13→14px)
        label: [
          // caption 14px/500
          "0.875rem",
          { lineHeight: "1.29", letterSpacing: "0", fontWeight: "500" },
        ],
        caption: [
          // caption-sm 13px/400
          "0.8125rem",
          { lineHeight: "1.23", letterSpacing: "0", fontWeight: "400" },
        ],
        // ── 도메인 수치 mono(가격 정렬) — Airbnb 비대응, 유지 ──
        num: ["0.9375rem", { lineHeight: "1.2", fontWeight: "600" }],
        "num-lg": [
          "1.375rem",
          { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        // ── Airbnb 신규 스케일 ──
        "rating-display": [
          // 시스템 최고 굵기 토큰(평점 "4.81") — 강조 모멘트
          "4rem",
          { lineHeight: "1.1", letterSpacing: "-1px", fontWeight: "700" },
        ],
        "uppercase-tag": [
          // "NEW" 뱃지 (8px/700, uppercase tracking)
          "0.5rem",
          { lineHeight: "1.25", letterSpacing: "0.32em", fontWeight: "700" },
        ],
        badge: [
          // "Guest favorite" floating 뱃지 (11px/600)
          "0.6875rem",
          { lineHeight: "1.18", letterSpacing: "0", fontWeight: "600" },
        ],
        "micro-label": [
          // 카드 amenity micro-label (12px/700)
          "0.75rem",
          { lineHeight: "1.33", letterSpacing: "0", fontWeight: "700" },
        ],
      },
      borderRadius: {
        // 기존 card(0.875rem)/pill/chip/sheet 유지 + xl(32px, Airbnb 카테고리 스트립) 신규
        card: "0.875rem",
        pill: "9999px",
        chip: "0.5rem",
        sheet: "1.25rem",
        xl: "2rem", // 32px (Airbnb rounded.xl) — 신규
      },
      boxShadow: {
        // Airbnb 단일 3-레이어 그림자 티어로 card 교체 (DESIGN_SYSTEM Elevation).
        // pop(모달/시트)은 유지, focus는 Rausch로 recolor(고아 블루 리터럴 제거).
        card: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0",
        pop: "0 8px 24px rgba(0,0,0,0.10)",
        focus: "0 0 0 3px rgba(255,56,92,0.30)",
      },
      maxWidth: {
        // 모바일 우선: 본문 단일 컬럼 기준폭(기존 유지) + Discover 확장폭
        content: "640px",
        discover: "960px",
      },
    },
  },
  plugins: [],
};

export default config;
