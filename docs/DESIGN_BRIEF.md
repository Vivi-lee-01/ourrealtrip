# OurRealTrip / 아워리얼트립 — DESIGN BRIEF v1

> 빌드 기준은 `PRD.md`(v2)이며, 본 문서는 그 PRD를 화면으로 옮기는 **비주얼 시스템 단일 진실 원천**이다.
> 루마(luma.com)급 절제된 비주얼 — 콘텐츠가 주인공, 크롬은 조용히. 모바일 우선. 모든 토큰은 Tailwind로 바로 구현 가능하게 정의한다.

---

## 0. 디자인 컨텍스트 (현재 코드 정합)

본 브리프는 기존 코드와 충돌하지 않게 설계됐다.

| 항목 | 현재 상태 (`tailwind.config.ts` / `globals.css` / `layout.tsx`) | 본 브리프의 처리 |
|------|---------------------------------------------------------------|------------------|
| 컬러 토큰 네임스페이스 | `brand` / `ink` / `surface` 존재 | **동일 네임스페이스 유지·확장** (기존 클래스 깨지지 않음) |
| 폰트 | 시스템 한글 스택 (`-apple-system … "Noto Sans KR"`) | 본문 폰트는 그대로 한글 fallback, **Inter는 라틴 우선 / JetBrains Mono는 수치 전용**으로 추가 (PRD: 이미 링크됨 전제) |
| 컨테이너 | `.container-content` (max 640px), `.touch-target` (44px) | 그대로 사용. 본 시스템의 레이아웃 베이스 |
| 라운드/섀도 | `rounded-card`(14px), `shadow-card` | 토큰 스케일로 확장 |
| 다크 모드 | `color-scheme: light` 고정 | `class` 전략 다크 모드 추가 (10절) |

> 주의: 기존 `brand.DEFAULT = #1f6feb`(쨍한 파랑)은 루마급 절제 톤에 비해 채도가 높다. 본 브리프는 brand를 **더 차분한 잉크-블루**로 재정의한다(2절). 기존 코드의 토큰 *이름*은 유지되므로 마크업 변경 없이 색만 갱신된다.

---

## 1. 디자인 원칙 (Design Principles)

PRD 15절 UX 원칙을 **비주얼 의사결정 기준**으로 번역한다.

| # | 원칙 | 비주얼 함의 |
|---|------|-------------|
| 1 | **콘텐츠가 주인공, 크롬은 조용히** | 커버 이미지·호스트·일정이 시각 위계 최상단. 버튼·테두리·그림자는 최소 채도. 루마처럼 "여백이 디자인". |
| 2 | **Event-first 위계** | 화면 첫 스크롤은 항상 *여행 제안*(커버→호스트→RSVP)이다. 상품 카드/장바구니는 항상 그 아래. 시각 무게가 이 순서를 강제한다. |
| 3 | **신뢰는 톤으로 번다** | 과장 X. 강조색은 "여기서 한 번"만. 가격·고지·`checked_at`은 또렷하되 차분하게. 화려한 그라데이션·세일 배지·카운트다운 금지(패키지/특가 오인 방지, PRD 16·17절). |
| 4 | **Interest before booking** | RSVP/관심 패널이 상품 CTA보다 **시각적으로 먼저, 더 크게**. 예약 버튼은 `booking_open` 전까지 등장하지 않거나 비활성 톤. |
| 5 | **Option set, not product list** | A/B/C는 동등한 3카드 비교 레이아웃. 상품 그리드처럼 보이면 안 됨. 의도 차원(관계 깊이·산출물)을 칩으로 시각화. |
| 6 | **Shared cart ≠ checkout** | 장바구니는 "함께 보기" 톤(중립 surface, 정보 위주). 단일 결제 버튼 시각 언어(꽉 찬 풀폭 primary 버튼 + "결제") **절대 금지**. 항목별 독립 CTA는 secondary/outline 톤. |
| 7 | **Not a merchant, 시각적으로도** | 어디에도 "장바구니 합계 → 결제" 흐름을 암시하는 UI 없음. 합계는 *1인 예상총액(참고)* 라벨로 명시. 진행현황은 "자가보고" 톤(체크박스·뱃지)이지 주문 상태(배송/결제완료) 톤이 아님. |
| 8 | **No official / package confusion** | 마이리얼트립 로고·공식 컬러 모방 금지. 패키지 상품 카드(큰 가격 + "구매") 레이아웃 금지. |
| 9 | **Intent, translated** | 의도/목적은 철학어가 아니라 따뜻한 한글 카피 + 부드러운 칩으로. 막대그래프는 host dashboard에만(참여자 화면은 사람 언어). |
| 10 | **모바일 우선, 터치 우선** | 모든 인터랙티브 요소 ≥44px(`.touch-target`). 본문 640px 단일 컬럼. 데스크톱은 *확장*이지 기준이 아님. |
| 11 | **Human-curated, data-grounded** | "host가 골랐다"가 보이는 톤(호스트 아바타·trust_note 강조). AI 그라운딩은 보조 라벨(`checked_at`, 출처)로 조용히. |

---

## 2. 컬러 토큰 (Color Tokens)

전략: **절제된 뉴트럴 90% + 강조색 1개 + 의미색 4개.** 루마처럼 회색조가 화면을 지배하고, 강조색은 핵심 액션·소셜프루프에만 등장한다.

### 2-1. 강조색 (Brand / Accent) — 단 하나

차분한 잉크-블루. 쨍한 SaaS 파랑이 아니라 "신뢰 가는 조용한 파랑". 액션·링크·"N명 참여의향"에만 사용.

```
brand.DEFAULT  #2563EB   // 핵심 강조 (RSVP primary, 링크). 채도 절제
brand.hover    #1D4ED8   // hover/active
brand.fg       #FFFFFF   // 강조색 위 텍스트
brand.soft     #EFF4FF   // 강조 배경 (선택 칩, 소셜프루프 pill) — 라이트
brand.softfg   #1E40AF   // soft 배경 위 텍스트
```

### 2-2. 뉴트럴 (Ink / Surface) — 화면의 90%

```
// 텍스트 (ink)
ink.DEFAULT    #18181B   // 본문/제목 (zinc-900 계열, 순흑 회피)
ink.muted      #52525B   // 보조 텍스트 (메타, 설명)
ink.faint      #A1A1AA   // 비활성/placeholder/캡션

// 표면 (surface)
surface.DEFAULT #FFFFFF  // 카드/패널 바닥
surface.soft    #F7F7F8  // 페이지 배경 (살짝 따뜻한 회색)
surface.sunken  #EFEFF1  // 입력 필드/장바구니 안쪽 면
surface.border  #E4E4E7  // 1px 헤어라인 테두리
surface.borderStrong #D4D4D8 // 강조 테두리 (선택된 카드)
```

### 2-3. 의미색 (Semantic) — 절제, 배지·상태 전용

```
success.DEFAULT #16A34A  success.soft #E7F6EC  // 예약 완료(self_booked), 긍정
warn.DEFAULT    #B45309  warn.soft    #FBF1E4  // 오래된 checked_at, 주의(caution)
info.DEFAULT    #0E7490  info.soft    #E1F2F5  // 클릭됨(clicked), 안내
neutral.DEFAULT #71717A  neutral.soft #F1F1F3  // pending, 미진행
```

> 의미색은 **배지/도트/얇은 보더**에만. 면 전체를 칠하지 않는다(세일 배너처럼 보임 → 금지).

### 2-4. Tailwind 토큰 구현

`tailwind.config.ts`의 `theme.extend.colors`를 아래로 교체(네임스페이스 동일, 값만 확장):

```ts
colors: {
  brand: {
    DEFAULT: "#2563EB",
    hover:   "#1D4ED8",
    fg:      "#FFFFFF",
    soft:    "#EFF4FF",
    softfg:  "#1E40AF",
  },
  ink: {
    DEFAULT: "#18181B",
    muted:   "#52525B",
    faint:   "#A1A1AA",
  },
  surface: {
    DEFAULT:      "#FFFFFF",
    soft:         "#F7F7F8",
    sunken:       "#EFEFF1",
    border:       "#E4E4E7",
    borderStrong: "#D4D4D8",
  },
  success: { DEFAULT: "#16A34A", soft: "#E7F6EC" },
  warn:    { DEFAULT: "#B45309", soft: "#FBF1E4" },
  info:    { DEFAULT: "#0E7490", soft: "#E1F2F5" },
  neutral: { DEFAULT: "#71717A", soft: "#F1F1F3" },
},
```

> 다크 모드 값은 CSS 변수로 분기한다(10절). 위 hex는 라이트 기준값이며, 다크는 `:root.dark`에서 변수로 덮어쓴다.

---

## 3. 타이포그래피 (Typography)

폰트는 PRD 전제대로 **Inter(라틴/UI) + JetBrains Mono(수치)** 가 링크돼 있다고 본다. 한글 본문은 기존 시스템 스택을 fallback으로 유지한다.

### 3-1. 폰트 패밀리

```
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
             "Pretendard", "Noto Sans KR", "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
```

- **Inter**: 라틴 글자·UI 라벨·버튼. 한글은 자동 fallback(시스템 한글)으로 자연스럽게 섞임.
- **JetBrains Mono**: **수치 전용** — 가격(`46,550원~`), `checked_at` 타임스탬프, 진행 카운트(`3/8`), 예상총액. 숫자 정렬·신뢰감(데이터 그라운딩 톤)에 사용. 산문에는 쓰지 않는다.

Tailwind:
```ts
fontFamily: {
  sans: ["var(--font-sans)"],
  mono: ["var(--font-mono)"],
},
```
`layout.tsx`에서 `next/font`로 Inter·JetBrains Mono를 로드해 `--font-sans`/`--font-mono`에 바인딩(또는 PRD가 말한 기존 링크 사용). 미로드 시 fallback 스택이 동작하므로 화면은 깨지지 않음.

### 3-2. 타입 스케일 (모바일 기준 / 데스크톱 확장)

`word-break: keep-all`(globals 기존)·`line-height` 한글 가독 기준 유지.

| 토큰 | 용도 | 모바일 | 데스크톱(sm+) | weight | tracking | line-height |
|------|------|--------|---------------|--------|----------|-------------|
| `display` | 커버 Hero 제목 | 28px | 36px | 700 | -0.02em | 1.2 |
| `h1` | 페이지 제목 | 24px | 28px | 700 | -0.015em | 1.25 |
| `h2` | 섹션 제목 (Why This Trip 등) | 19px | 20px | 650 | -0.01em | 1.3 |
| `h3` | 카드 제목 (옵션명, 상품명) | 16px | 17px | 600 | -0.005em | 1.35 |
| `body` | 본문 | 15px | 16px | 400 | 0 | 1.6 |
| `body-sm` | 보조 설명 | 13px | 14px | 400 | 0 | 1.55 |
| `label` | 라벨·칩·버튼 | 13px | 13px | 600 | 0.01em | 1.2 |
| `caption` | 캡션·고지·`checked_at` | 12px | 12px | 500 | 0.01em | 1.4 |
| `num` | 가격·수치(mono) | 15px | 16px | 600 | 0 | 1.2 |
| `num-lg` | 강조 가격(1인 예상총액) | 22px | 24px | 700 | -0.01em | 1.15 |

Tailwind `fontSize` 토큰:
```ts
fontSize: {
  display:  ["1.75rem", { lineHeight: "1.2",  letterSpacing: "-0.02em",  fontWeight: "700" }],
  "display-lg": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
  h1:       ["1.5rem",  { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "700" }],
  h2:       ["1.1875rem",{ lineHeight: "1.3", letterSpacing: "-0.01em",  fontWeight: "600" }],
  h3:       ["1rem",    { lineHeight: "1.35", letterSpacing: "-0.005em", fontWeight: "600" }],
  body:     ["0.9375rem",{ lineHeight: "1.6" }],
  "body-sm":["0.8125rem",{ lineHeight: "1.55" }],
  label:    ["0.8125rem",{ lineHeight: "1.2", letterSpacing: "0.01em", fontWeight: "600" }],
  caption:  ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
},
```
(데스크톱 크기는 `sm:text-*` 유틸로 올림. 예: 커버 제목 `text-display sm:text-display-lg`.)

> 수치는 `font-mono tabular-nums`(또는 `font-variant-numeric: tabular-nums`)로 자리 정렬. 가격 비교(A/B/C)에서 자릿수 흔들림 방지.

---

## 4. 스페이싱 & 레이아웃 (Spacing / Layout)

4px 베이스 스케일. Tailwind 기본 스페이싱을 그대로 쓰되, **시맨틱 간격 약속**을 정한다.

| 약속 | 값(rem / px) | 용도 |
|------|--------------|------|
| 컴포넌트 내부 패딩 | `p-4` (16px) 모바일 / `sm:p-5` (20px) | 카드·패널 안쪽 |
| 카드 간 간격 | `space-y-3` (12px) | 리스트 내 카드 |
| 섹션 간 간격 | `space-y-8` (32px) 모바일 / `sm:space-y-10` | Trip Proposal 섹션 사이 |
| 섹션 제목↔본문 | `mb-3` (12px) | |
| 칩/태그 간격 | `gap-1.5` (6px) | 의도 칩 묶음 |
| 페이지 좌우 거터 | `px-4` (16px) 모바일 / `sm:px-6` | `.container-content` 기존값 |
| 화면 상단 sticky 안전영역 | `pt-[env(safe-area-inset-top)]` | 모바일 노치 |
| 하단 고정 CTA 안전영역 | `pb-[env(safe-area-inset-bottom)]` | sticky RSVP 바 |

레이아웃 베이스:
- **본문 컬럼**: `.container-content`(max 640px) — Trip Proposal·RSVP·장바구니 모두 단일 컬럼.
- **Discover**: 단일 컬럼 위에서 카테고리는 가로 스크롤 row, 인기 트립은 1열(모바일)→`sm:grid-cols-2`.
- **데스크톱**: 본문은 640px 고정 유지(루마처럼 좁고 읽기 좋게). Discover만 `lg:max-w-[960px]` 그리드로 확장 허용.

라운드/섀도/보더 토큰:
```ts
borderRadius: { card: "0.875rem", pill: "9999px", chip: "0.5rem", sheet: "1.25rem" },
boxShadow: {
  card:  "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",  // 기존 유지
  pop:   "0 8px 24px rgba(0,0,0,0.10)",  // 모달/시트
  focus: "0 0 0 3px rgba(37,99,235,0.30)", // 포커스 링
},
```
- 카드: `rounded-card border border-surface-border shadow-card` — 그림자는 거의 안 보일 만큼 얕게(루마 톤).
- 선택된 옵션 카드: `border-brand shadow-card` + soft 배경. 채도 점프 없이 "선택됨"만 전달.

---

## 5. 핵심 컴포넌트 비주얼 스펙

각 컴포넌트는 PRD 6·9절 엔티티에 매핑된다. 모든 치수는 모바일 기준, 데스크톱은 `sm:`/`lg:`로 확장.

### 5-1. ProposalCard (Discover 인기 트립 카드)

> 데이터: TripProposal(`cover_image_url`, `title`, `concept`, `destination`, `status`) + PerformanceSnapshot(`interested_count`).

```
[ 카드: rounded-card, border-surface-border, shadow-card, overflow-hidden ]
 ┌──────────────────────────────────┐
 │  커버 이미지 (16:9, object-cover) │  ← 상태 배지 우상단 오버레이
 │                          [관심 모으는 중] │
 ├──────────────────────────────────┤
 │  교토 · 9월        ← caption, ink.muted  │
 │  고즈넉한 사진 촬영 위크    ← h3, ink     │
 │  카메라 들고 천천히 걷는 사람들…  ← body-sm 2줄 clamp │
 │  ─────────────────────────       │  ← 헤어라인
 │  ◍◍◍ +5   12명 관심  ← 아바타 스택 + brand.soft pill │
 └──────────────────────────────────┘
```
- 커버: `aspect-[16/9]`, 이미지 없으면 `surface-sunken` + 목적지 이니셜 그라데이션(채도 낮음).
- 상태 배지: `8절 상태 모델`에 따른 라벨/색 (5-12 상태칩 규칙). 커버 위 `bg-surface/90 backdrop-blur`.
- 소셜프루프 pill: `bg-brand-soft text-brand-softfg`, 아바타 스택(겹침 -8px, 최대 3 + `+N`).
- 카드 전체가 링크(`/trips/[slug]`). hover: `shadow-pop`, 이미지 `scale-[1.02]` 부드럽게.
- **금지**: 가격을 카드 전면에 큰 숫자로 띄우지 않음(상품 카드 오인). 가격은 상세에서.

### 5-2. 커버 Hero (Trip Proposal 상단)

> 데이터: TripProposal(`cover_image_url`, `title`, `concept`, `expected_dates`, `destination`, `status`). PRD 6절 (1)Cover.

```
 ┌──────────────────────────────────────────┐
 │   커버 이미지 풀블리드 (모바일 풀폭)         │
 │   aspect-[4/3] 모바일 / sm:aspect-[16/9]   │
 │   하단 그라데이션 오버레이(텍스트 가독)       │
 │                                            │
 │   [관심 모으는 중]  ← 상태칩               │
 │   고즈넉한 사진 촬영 위크   ← display       │
 │   카메라 들고 천천히 걷는 사람들의 교토       │  ← h2, white/90 (concept)
 │   📍 교토  ·  9월 셋째 주 (예정)  ← label, mono 날짜 │
 └──────────────────────────────────────────┘
```
- 텍스트는 이미지 위 흰색, 하단 `bg-gradient-to-t from-black/55 to-transparent` 위에. 이미지 없으면 `surface-sunken` + ink 텍스트.
- 모바일은 풀블리드(거터 0), 데스크톱은 `rounded-card` 적용 + 640px 컬럼 내.
- display 제목은 한 화면에 강하게. 그 외 요소는 조용히.
- **금지**: 자동재생 영상·캐러셀·"지금 예약" 오버레이 버튼.

### 5-3. RSVP 패널 (관심/투표/질문)

> 데이터: InterestSignal(`response_type`, `preferred_dates`, `preferred_budget`, `comment`, `objection_type`). PRD 6절 (3)·익명 세션(확정 결정 1·4). 기존 `components/proposal/RsvpPanel.tsx` 존재.

화면 위계상 **커버·호스트 바로 다음, 상품보다 먼저, 가장 두드러진 카드.**

```
 ┌──────────────────────────────────┐
 │  같이 갈까 고민 중이라면          │  ← h2
 │  부담 없이 의향만 먼저 남겨요      │  ← body-sm, ink.muted
 │                                  │
 │ [ 관심 있어요 ]   ← primary (brand, 풀폭, ≥44px) │
 │ [ 날짜 맞으면 갈래요 ] [ 가격 맞으면 ] ← 2-up outline 칩버튼 │
 │ [ 옵션에 투표 ]   [ 질문 남기기 ]  ← outline │
 │                                  │
 │  (선택 시 펼침) 선호 날짜/예산 입력 · 코멘트 │
 │  이름·이메일은 받지 않아요  ← caption, ink.faint │
 └──────────────────────────────────┘
```
- 6개 응답 타입 = 1 primary(`interested`) + 5 secondary(outline). 선택 시 `bg-brand-soft border-brand`로 토글, 체크 도트.
- 펼침 입력은 선택적(`date_dependent`/`price_dependent`/`question` 시). placeholder는 `ink.faint`.
- **모바일 sticky 변형**: 스크롤 시 화면 하단에 `관심 있어요` 단일 바(`fixed bottom-0`, safe-area, `shadow-pop`)로 축약 노출. 패널 자체는 인라인 유지.
- 익명 강조: "이름·이메일은 받지 않아요" caption 상시. 신뢰 톤.
- **금지**: "예약하기"/"결제" 류 단어. 여기는 *의향*만.

### 5-4. TravelOptionCard (A/B/C 운영안)

> 데이터: TravelOption(`option_name`, `option_type`, `description`, `estimated_budget`, `fit_reason`, `risk_note`, `community_intent_fit`, `relationship_depth`, `learning_or_creation_potential`, `post_trip_artifact`, `schedule_difficulty`). PRD 7절.

상품 그리드가 아니라 **3개 동등 비교 카드**. 모바일 세로 스택, `sm:` 가로 스크롤 또는 3열.

```
 ┌────────────────────────────┐
 │ A · 가볍게 다녀오는 기본형  │  ← h3 + option_type 칩
 │ 처음 만나도 부담 낮게         │  ← body-sm (description)
 │ ─────────────────           │
 │ 예상 1인  60~80만원   ← num-lg(mono), label "예상 1인" │
 │                            │
 │ 칩: [관계 낮음~중간] [일정 쉬움]  ← 의도 차원 칩 (5-9) │
 │ 칩: [남는 것 · 사진/회고]        │
 │ ─────────────────           │
 │ ✓ 누구에게 맞나: …  ← body-sm (fit_reason) │
 │ ⚠ 알아둘 점: …      ← body-sm warn (risk_note) │
 │                            │
 │ [ 이 안에 투표 ]   ← outline 버튼, 풀폭, ≥44px │
 └────────────────────────────┘
```
- option_type 칩 색: basic=neutral, premium=brand.soft, budget=info.soft, experimental=warn.soft — 면 X, 텍스트+얇은 보더.
- **선택/수렴된 옵션**: `border-brand` + 상단 `bg-brand-soft` 리본 "이 안으로 모였어요". 다른 카드보다 두드러지되 채도 점프 금지.
- 가격은 항상 `예상`·`~` 표기(확정 가격 오인 방지). mono tabular-nums.
- 의도 차원 칩(relationship_depth/schedule_difficulty/post_trip_artifact)은 **사람 언어**로(low→"가볍게", high→"깊게"). 막대그래프 X.
- **금지**: "구매"/"이 안 예약" CTA. 여기는 투표/관심까지만.

### 5-5. 공동 여행 장바구니 (Shared Trip Cart — 함께보기 뷰)

> 데이터: 수렴 `option_id` + `InterestSignal(voted_option)` 집계 + ProductLink 묶음 + BookingProgress. PRD 2-A·6절(8·9)·9-12. **별도 테이블 아님(파생 뷰).**

루마식 "정보 패널". 체크아웃이 **아니다.** 톤은 중립 surface, 정보 위주.

```
 ┌──────────────────────────────────────┐
 │ 우리 여행 장바구니               ← h2  │
 │ 함께 보기용이에요. 결제·예약은 각자, 판매처에서. │ ← caption (고지 7)
 │ 8명이 이 안(B)을 담았어요  ← brand.soft pill │
 │ ──────────────────────────────       │
 │  ✈ 항공  ICN→KIX 왕복   89,000원~  [내 예약] │ ← 항목 row, 독립 CTA
 │  🏨 숙소  가와라마치 2박  142,000원~ [내 예약] │
 │  🎟 투어  교토 포토 버스   46,550원~ [내 예약] │
 │ ──────────────────────────────       │
 │  1인 예상총액 (참고)        277,550원~ │ ← num-lg(mono), 합계 아님 명시
 │                                       │
 │  ※ 합산은 참고용이며 묶음 결제가 아니에요.   │ ← caption
 └──────────────────────────────────────┘
```
- 컨테이너: `bg-surface-sunken rounded-card p-4`(살짝 들어간 면 = "안쪽" 느낌).
- 항목별 row: 좌측 product_type 아이콘(✈/🏨/🎟), 제목·`price_hint`(mono), 우측 **항목별 독립 CTA** `[내 예약]`(outline, ≥44px) → `/go/[product_link_id]`.
- 합계: **반드시 "1인 예상총액 (참고)"** 라벨. 단일 결제 버튼·풀폭 primary "결제하기" **절대 금지**(원칙 6·7, PRD 16·17).
- "N명이 담음"은 brand.soft pill(소셜프루프).
- 고지 7번 항상 패널 내부에 caption으로.
- **금지 시각언어**: 전체 합계를 큰 primary 버튼 옆에 두는 커머스 장바구니 레이아웃. "전체 예약"·"패키지 구매" 버튼.

### 5-6. 각자 예약 가이드 + 진행현황 바 (BookingProgress)

> 데이터: BookingProgress(`status`: pending/clicked/self_booked, `product_link_id`, `participant_session_id`). PRD 6절(9·10)·9-9.

장바구니 하단에 붙는다. **주문 상태 톤이 아니라 "우리 진행 같이 보기" 톤.**

```
 진행현황   ← h3
 참여자 자가보고 + 클릭추적 기준이에요  ← caption, ink.faint
 ┌──────────────────────────────────┐
 │ ✈ 항공   [██████░░░░] 5/8 예약함  │ ← 진행 바 + mono 카운트
 │ 🏨 숙소   [████░░░░░░] 3/8 예약함  │
 │ 🎟 투어   [█████████░] 7/8 예약함  │
 └──────────────────────────────────┘
 내 진행:  ✈ ◉예약완료  🏨 ○클릭함  🎟 ○아직  ← 자가표시 토글
```
- 진행 바: `bg-neutral-soft` 트랙 + 채움 `bg-success`(완료분). 높이 6px, `rounded-pill`. 채도 절제.
- 상태 색: pending=neutral, clicked=info, self_booked=success. **도트/배지로만**.
- 카운트는 mono(`5/8`).
- "내 진행" 토글: 참여자가 `/go` 복귀 후 self_booked 자가표시. 체크 = success 도트. **결제 확인이 아니라 자가표시**임을 톤·문구로 분명히("예약함" 자가보고, "결제완료" 같은 단정 표현 X).
- **금지**: 배송 추적/주문 상태 메타포(택배 아이콘, "결제 확인됨").

### 5-7. 일정표 (Itinerary — Day1/Day2)

> 데이터: Itinerary/ItineraryDay(`day_no`, `title`, `items:[{time?, title, product_link_id?}]`). PRD 6절(6)·9-10. 루마 일정 세부(18:30/19:00…) 차용.

```
 일정표   ← h2
 ┌── Day 1 ─ 도착과 가벼운 워밍업 ──┐  ← day 헤더 (h3 + title)
 │  14:00  KIX 도착 · 시내 이동      │  ← time(mono) + title
 │  16:30  가와라마치 체크인         │
 │  18:30  골목 산책 · 저녁          │
 │  ┊ 19:00  교토 포토 버스 투어  →  │  ← product_link_id 연결 시 link 아이콘
 └──────────────────────────────────┘
 ┌── Day 2 ─ … ──┐
```
- 좌측 타임라인 레일(`border-l border-surface-border`), time은 mono `ink.muted`.
- 날짜 미정(`date?` null) 허용 → "Day 1"만 표시, 시간 없는 item은 불릿.
- `product_link_id` 있는 item: 우측 `→` 링크 아이콘 + 미세 brand 텍스트(상품 연결 암시). 클릭은 해당 상품 anchor로 스크롤(예약 강요 X).
- 톤: 타임라인은 조용한 정보. 강조색은 연결 링크에만.

### 5-8. DiscoverCategoryTile (카테고리 타일)

> 데이터: DiscoverCategory(`key`, `label`, `icon`, `sort_order`) + 건수. PRD 12절·9-11. 루마 "Browse by Category"(아이콘+건수) 차용.

```
 [가로 스크롤 row, snap-x, 모바일 / sm:flex-wrap]
 ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
 │  📷  │ │  🏃  │ │  🧘  │ │  🌊  │
 │ 사진 │ │ 러닝 │ │웰니스│ │ 서핑 │
 │ 12   │ │  8   │ │  5   │ │  3   │  ← 건수 mono, ink.faint
 └──────┘ └──────┘ └──────┘ └──────┘
```
- 타일: `min-w-[88px] aspect-square` 가까운 비율, `rounded-card border-surface-border bg-surface`, 아이콘 24px + label(label 토큰) + 건수(mono caption).
- 선택 시: `bg-brand-soft border-brand text-brand-softfg`. (필터 토글)
- 가로 스크롤 `snap-x snap-mandatory`, 데스크톱 `sm:flex-wrap`.
- 아이콘은 단색 라인 아이콘(이모지 placeholder 가능). 채도 낮게.
- **금지**: 카테고리마다 다른 강조색(무지개 X). 뉴트럴 + 선택 시에만 brand.

### 5-9. 의도 칩 / 소셜프루프 / 상태칩 (공용 원자)

- **의도 칩**(community_intent_fit·relationship_depth·post_trip_artifact 등): `rounded-chip bg-surface-soft text-ink-muted border border-surface-border`, label 토큰, 좌측 8px 도트(의미 약하게). 사람 언어 카피.
- **소셜프루프 pill**("N명 참여의향"/"N명이 담음"): `rounded-pill bg-brand-soft text-brand-softfg` + 아바타 스택.
- **상태칩**(8절 상태 모델, 5-12): 라벨·색 매핑 고정.

### 5-12. 상태칩 매핑 (Proposal status)

| status | 라벨(참여자) | 색 |
|--------|--------------|-----|
| `draft` | (비노출 — host만) | neutral |
| `interest_check` | 관심 모으는 중 | brand.soft / brand.softfg |
| `option_refining` | 여행안 다듬는 중 | info.soft / info |
| `booking_open` | 예약 링크 열림 | success.soft / success |
| `closed` | 모집 마감 | neutral.soft / neutral |
| `cancelled` | 취소됨 | neutral.soft / ink.faint |
| `archived` | 지난 제안 | neutral.soft / ink.faint |

> "예약 링크 열림"은 success 톤이되 "예약 보장"·"예약 가능 보장" 같은 금지 문구 절대 사용 안 함.

---

## 6. 버튼 & 인터랙션 시스템

| 변형 | 스타일 | 용도 |
|------|--------|------|
| **primary** | `bg-brand text-brand-fg hover:bg-brand-hover rounded-card font-label` | 화면당 1개 권장. RSVP "관심 있어요". |
| **secondary / outline** | `border border-surface-border text-ink hover:bg-surface-soft` | 투표·질문·항목별 "내 예약". |
| **ghost** | `text-ink-muted hover:bg-surface-soft` | 보조 액션, 더보기. |
| **chip-toggle** | 기본 outline → 선택 `bg-brand-soft border-brand text-brand-softfg` | RSVP 옵션, 카테고리. |

- 모든 버튼 `min-h-[44px]`(`.touch-target`), 가로 패딩 `px-4`.
- 포커스: `focus-visible:outline-none focus-visible:shadow-focus`(brand 30% 링). 키보드 접근 필수.
- 트랜지션: `transition-colors duration-150` / 이미지·카드 hover는 `duration-200 ease-out`. 과한 모션 금지(루마 톤).
- **"내 예약" CTA는 절대 primary 풀폭 단일 버튼으로 묶지 않음** — 항상 항목별 secondary. (PRD 16·17, 원칙 6)

---

## 7. 아이콘 & 이미지

- 아이콘: 단색 라인(stroke 1.5px), 24px 기준. product_type은 고정 의미 아이콘(항공✈/숙소🏨/투어🎟 — 또는 동등 라인 아이콘). 채도 없는 `ink.muted`.
- 이미지: 커버는 `object-cover`, lazy. 없으면 `surface-sunken` + 목적지 이니셜(저채도 그라데이션). 외부 상품 썸네일은 그대로 쓰되 **프로모션 텍스트 오버레이는 중립화**(PRD 17-2).
- 마이리얼트립 로고·브랜드 컬러 모방 금지(공식 오인).

---

## 8. 카피 톤 & 금지 문구 (디자이너 가드레일)

화면에 들어가는 **모든 마이크로카피**는 아래를 준수한다(PRD 17절).

**금지 문구 — 어떤 버튼·배지·툴팁에도 등장 금지:**
> 공식 추천 / 단독 특가 / 최저가 보장 / 예약 가능 보장 / 전체 예약하기 / 패키지 구매하기 / 이 일정 그대로 예약하기 / 예약하면 수익 보장 / 누구나 여행으로 돈 번다 / 방문자 캐시백

**권장 카피 패턴(번역된 의도, 따뜻하고 담백하게):**
- 관심 단계: "부담 없이 의향만 먼저", "같이 갈까 고민 중이라면"
- 의도/목적: "이번 여행의 목적", "이 여행이 끝나고 남을 것", "우리 모임이 같이 움직일 이유"
- 장바구니: "우리 여행 장바구니 · 함께 보기용", "결제·예약은 각자, 판매처에서"
- 진행현황: "참여자 자가보고 + 클릭추적 기준"
- 예약 CTA: "내 예약"(항목별) — "예약하기"는 항목별일 때만, 묶음 금지

**시각적으로도 금지:** 단일 묶음결제 버튼, 호스트 정산/송금 UI, 합계 옆 "결제" 버튼, 카운트다운 타이머, 세일 배너, 마이리얼트립 공식 배지.

---

## 9. 필수 고지 표현 (Disclosure UI)

PRD 17-1 고지 7종을 화면에서 표현 가능해야 한다.

- **상시 노출**: 장바구니 패널 내부에 고지 7번(함께보기용) caption 고정. Trip Proposal 하단 섹션(12)에 고지 7종 전체 + `/disclosure` 링크.
- **시각 톤**: `bg-surface-soft text-ink-muted text-caption rounded-chip p-3`. 경고처럼 빨갛게 X, 차분한 회색 정보 박스.
- **`checked_at` 표시**: 가격·예약가능 옆에 `mono caption ink.faint` "○월○일 확인". 30일 이상 경과 시 `warn` 도트 + "정보가 오래됐어요"(PRD 19 trust 지표: 오래된 checked_at 명확 표시).

---

## 10. 라이트 / 다크 모드

`class` 전략(`darkMode: "class"`). 라이트가 기본, 다크는 CSS 변수로 토큰을 덮어쓴다. 마크업·Tailwind 클래스는 변경 없음(변수 기반).

### 10-1. 구현 방식 (CSS 변수 토큰)

`tailwind.config.ts`에서 색을 변수 참조로:
```ts
darkMode: "class",
// colors 값은 "hsl(var(--xxx))" 또는 "var(--xxx)" 형태로 바인딩(또는 라이트 hex 유지 + dark 오버라이드)
```
`globals.css`에 변수 정의(권장 — 기존 `color-scheme` 라인 확장):
```css
:root {
  color-scheme: light;
  --surface-DEFAULT:#FFFFFF; --surface-soft:#F7F7F8; --surface-sunken:#EFEFF1;
  --surface-border:#E4E4E7; --surface-borderStrong:#D4D4D8;
  --ink-DEFAULT:#18181B; --ink-muted:#52525B; --ink-faint:#A1A1AA;
  --brand-DEFAULT:#2563EB; --brand-soft:#EFF4FF; --brand-softfg:#1E40AF;
}
.dark {
  color-scheme: dark;
  --surface-DEFAULT:#18181B; --surface-soft:#0F0F11; --surface-sunken:#232327;
  --surface-border:#2E2E33; --surface-borderStrong:#3F3F46;
  --ink-DEFAULT:#FAFAFA; --ink-muted:#A1A1AA; --ink-faint:#71717A;
  --brand-DEFAULT:#60A5FA; --brand-soft:#1E2A4A; --brand-softfg:#BFD3FF;
}
```

### 10-2. 다크 모드 색 가이드

| 토큰 | 라이트 | 다크 | 비고 |
|------|--------|------|------|
| 페이지 배경 | `#F7F7F8` | `#0F0F11` | 순흑 회피(깊은 회색) |
| 카드 면 | `#FFFFFF` | `#18181B` | 배경보다 한 단계 밝게(떠 보이게) |
| sunken(장바구니/입력) | `#EFEFF1` | `#232327` | 카드보다 들어가 보이게 |
| 본문 텍스트 | `#18181B` | `#FAFAFA` | |
| 강조색 | `#2563EB` | `#60A5FA` | 다크에선 채도↓ 명도↑(눈부심 방지) |
| 의미색(success 등) | 라이트값 | 명도 +12~15% | soft 배경은 어둡게, 텍스트는 밝게 |

- 다크에서 커버 Hero 그라데이션 오버레이는 `from-black/65`로 약간 진하게(텍스트 가독).
- 이미지·커버는 다크에서도 그대로(필터 X), 단 보더를 `surface-border`로 분리.
- 토글: 시스템 선호(`prefers-color-scheme`) 따라 초기값, 사용자 토글은 후순위(Phase 1 라이트 우선이라도 토큰은 다크 대비 검증).

---

## 11. 접근성 (Accessibility)

| 항목 | 기준 |
|------|------|
| **명도 대비** | 본문 텍스트 ≥4.5:1, 큰 텍스트(≥19px/700)·UI 요소 ≥3:1. `ink.muted #52525B` on `surface.soft` = 통과. `ink.faint`는 캡션·placeholder 한정(본문 금지). 다크 토큰도 동일 검증. |
| **터치 타깃** | 모든 인터랙티브 ≥44×44px (`.touch-target`). 칩 버튼도 패딩으로 확보. |
| **포커스 가시성** | `focus-visible:shadow-focus`(brand 30% 3px 링) 전 인터랙티브에. 키보드 탭 순서 = 시각 순서(커버→호스트→RSVP→옵션→장바구니). |
| **색 비의존** | 진행 상태(pending/clicked/self_booked)·투표 선택은 색 + 아이콘/라벨 병기. 색맹 안전. |
| **모션** | `prefers-reduced-motion: reduce` 시 hover scale·트랜지션 제거. |
| **시맨틱/스크린리더** | 진행 바 `role="progressbar"` + `aria-valuenow/valuemax`. RSVP 토글 `aria-pressed`. 상태칩 텍스트 라벨 포함(색만 X). 커버 이미지 `alt`(목적지+컨셉). |
| **언어/줄바꿈** | `lang="ko"`(기존), `word-break: keep-all`(기존) 유지 — 한글 어절 단위 줄바꿈. |
| **확대** | `maximum-scale=5`(기존 viewport) — 확대 허용. 텍스트 rem 단위로 OS 글자 크기 반영. |
| **고지 접근** | 고지·`checked_at`는 스크린리더에서 가격과 연결(`aria-describedby`). |

---

## 12. Tailwind 토큰 통합 요약 (구현 체크리스트)

`tailwind.config.ts` `theme.extend`에 반영할 항목:

- [ ] `colors`: brand(DEFAULT/hover/fg/soft/softfg) + ink(DEFAULT/muted/faint) + surface(DEFAULT/soft/sunken/border/borderStrong) + success/warn/info/neutral(DEFAULT/soft) — 2-4절. **기존 네임스페이스 유지**.
- [ ] `fontFamily`: sans(`var(--font-sans)`)·mono(`var(--font-mono)`) — 3-1절.
- [ ] `fontSize`: display/display-lg/h1/h2/h3/body/body-sm/label/caption — 3-2절.
- [ ] `borderRadius`: card(기존 0.875rem)·pill·chip·sheet — 4절.
- [ ] `boxShadow`: card(기존)·pop·focus — 4절.
- [ ] `maxWidth`: content(기존 640px) 유지 + Discover용 960px는 유틸로.
- [ ] `darkMode: "class"` + globals.css CSS 변수 라이트/다크 — 10절.
- [ ] `layout.tsx`: Inter·JetBrains Mono를 `--font-sans`/`--font-mono`에 바인딩(미바인딩 시 fallback 동작).
- [ ] `globals.css`: 기존 `.container-content`·`.touch-target` 유지, `prefers-reduced-motion` 가드 추가, focus-visible 기본 스타일.

> 위 토큰은 모두 기존 코드의 클래스(`bg-surface-soft`, `text-ink`, `rounded-card`, `shadow-card`)를 **깨지 않고** 확장한다. 색 값만 갱신되며 마크업 변경은 불필요하다.

---

## 13. 디자인 금지 사항 요약 (Negative Visual Spec)

PRD 14·16·17절을 비주얼 레벨로 못 박는다. 아래는 **절대 디자인 금지**:

1. 단일 묶음결제 버튼 / 합계 옆 "결제하기" / 풀폭 primary "전체 예약" 버튼.
2. 커머스 장바구니 체크아웃 레이아웃(합계 → 결제 흐름).
3. 호스트 정산·송금·"내가 모아서 결제" UI.
4. 세일 배너·카운트다운·"단독 특가"·"최저가" 배지.
5. 마이리얼트립 공식 로고/컬러/배지 모방(공식 오인).
6. 패키지 상품 카드(큰 가격 + "구매") 레이아웃.
7. 참여자 캐시백/리워드/포인트 UI.
8. 무지개 카테고리 색·과한 그라데이션·자동재생 영상.
9. 의도/목적에 철학어("대학 언번들링" 등) 노출.
10. 8절 금지 문구 일체.

---

*이 브리프는 PRD v2의 비주얼 계약이다. 컴포넌트 구현 시 본 문서의 토큰·스펙·금지 사항을 근거로 한다. 토큰 갱신은 본 문서와 `tailwind.config.ts`를 함께 수정한다.*
