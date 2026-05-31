---
title: 아워리얼트립 Airbnb 디자인 시스템 채택 — 구현 SPEC
date: 2026-05-31
status: plan
design_doc: /Users/vivi/ourrealtrip/docs/DESIGN_SYSTEM_AIRBNB.md
prd: /Users/vivi/ourrealtrip/docs/PRD-ourrealtrip-main-product.md
brief: /Users/vivi/ourrealtrip/docs/DESIGN_BRIEF.md
---

# 아워리얼트립 Airbnb 디자인 시스템 채택 SPEC

> 본 문서는 **구현 계획**이다. `DESIGN_SYSTEM_AIRBNB.md`(시각 소스 오브 트루스)와 `PRD-ourrealtrip-main-product.md`(메인 페이지 리부트), `DESIGN_BRIEF.md`(현행 토큰·도메인 불변식)를 **병합**해 토큰·컴포넌트 단위의 실행 순서로 환원한다.
> 핵심 원칙(PRD §9, DESIGN_SYSTEM_AIRBNB.md:229-234): **룩앤필 층은 Airbnb가 supersede**(액센트 hue·타입 절제·소프트 형태·단일 그림자), **행동/반-merchant 층은 DESIGN_BRIEF가 supersede**(Reserve/결제/카트 금지·도메인 시맨틱 컬러·좁은 컬럼). 한쪽이 다른 쪽을 통째로 대체하지 않는다.

---

## 0. 범위 & 검증 규약

### 0-1. 이 SPEC이 다루는 것
- **Phase 1**: `tailwind.config.ts` + `app/globals.css`의 토큰 매핑 (color/type/radius/spacing/elevation 1-tier).
- **Phase 2**: 컴포넌트별 리스타일 순서 (AppTopNav → 버튼 → 카드 → 폼 → 푸터) + merchant 금지 불변식 보존.
- **Phase 3**: 반응형 브레이크포인트 정렬.

### 0-2. 이 SPEC이 다루지 않는 것 (PRD §4-2 비목표 준수)
- 라우팅/IA 변경(메인 페이지 신설·`safeNext.ts` 착지점 변경·전역 셸 layout 승격)은 **PRD의 후속 구현 작업**이며 본 SPEC의 디자인 토큰/컴포넌트 리스타일과 **분리**한다. 단 Phase 2에서 AppTopNav·푸터를 리스타일할 때 IA 작업과 충돌하지 않도록 **순서 의존성**만 명시한다(§5-1).
- 다크 모드 Rausch 팔레트 도출(Airbnb 공개 웹 다크 모드 없음 — `DESIGN_SYSTEM_AIRBNB.md:37`). 다크 토큰은 **현행 블루 값을 유지하거나(무회귀) 채택 범위 밖으로 동결**(§G0-3 결정).
- Discover 데이터 소스 Supabase 전환.

### 0-3. Phase별 검증 (강제)
- 검증 커맨드 = **`npm run typecheck && npm run build`** 두 가지. (`package.json` 확인: `typecheck`=`tsc --noEmit`, `build`=`next build`. **`lint` 스크립트 없음** — eslint 단독 게이트 불가, typecheck+build로 대체.)
- 각 Phase는 위 2개가 **모두 PASS**해야 다음 Phase 진입. 실패 시 해당 Phase 내에서 회복.
- 디자인 회귀(시각)는 자동 검증 불가 → Phase 완료 후 `code-reviewer`/`verifier` 분리 패스 + Vivi 육안 확인(타인 산출물=공용 토큰 영향이므로 자기확증 편향 방지, CLAUDE.md 작업 방식 룰).
- merchant 금지 검증: `lib/copy/banned-phrases.ts`(실재 확인, 2392B) 기준. 본 SPEC 작업으로 금지 문구가 **신규 유입되지 않음**을 Phase 2 종료 시 확인.

---

## G0. 전제 (Prerequisites & Decisions)

### G0-1. 폰트 Inter 도입 방식 — **격차 없음, 신규 도입 불필요**
- `app/layout.tsx`가 `next/font/google`로 Inter를 이미 라이브 바인딩(`--font-sans`), `globals.css:42-44`에 Inter 우선 + 한글 fallback 스택(`Apple SD Gothic Neo`/`Pretendard`/`Noto Sans KR`) 존재. JetBrains Mono는 `--font-mono`(수치 전용).
- 목표 폰트 Airbnb Cereal VF는 라이선스 폰트라 사용 불가 → 문서가 명시한 **Inter 대체**(`DESIGN_SYSTEM_AIRBNB.md:98`, `:233`)가 **이미 적용 완료**.
- **결정**: 폰트 패밀리 변경 0건. Cereal 대비 line-height ~2% 타이트닝(`DESIGN_SYSTEM_AIRBNB.md:98`)은 **Phase 1의 타입 스케일 매핑에서 display 계열 lineHeight 값에 흡수**(별도 폰트 작업 아님).

### G0-2. 토큰 네이밍 결정 — **현행 네임스페이스 유지·값만 교체 (rename 최소화)**

| 결정 | 근거 |
|---|---|
| `brand.*` 네임스페이스를 **그대로 유지**하고 hex 값만 블루→Rausch로 교체 | `tailwind.config.ts:6-8` 주석 정책("마크업 변경 없이 색만 갱신"). 마크업의 `bg-brand`/`text-brand` 27+23+21회(아래 §G0-4) 호출부를 건드리지 않고 토큰 값만 바꿔 회귀면을 최소화 |
| `borderRadius`는 현행 `card`/`pill`/`chip`/`sheet` 유지 + **`xl: 32px` 신규 추가** | Airbnb `rounded.xl`(32px, 카테고리 스트립) 대응 토큰 부재(`DESIGN_SYSTEM_AIRBNB.md:15`). `chip`(8px)=Airbnb sm, `card`(14px)=Airbnb md, `pill`=full는 이미 정렬. rename(chip→sm·card→md)은 **cosmetic이라 미적용**(호출부 전수 변경 회귀 위험 > 이득) |
| `boxShadow`는 `card`를 Airbnb 단일 3-레이어로 **값 교체**, `pop`은 **유지하되 모달에만 한정**(Airbnb는 scrim 사용), `focus`는 **Rausch로 recolor 또는 잉크 2px 보더 — 결정 필요(§G0-5)** | `DESIGN_SYSTEM_AIRBNB.md:24,123` 단일 그림자 + scrim 정책 |
| 시맨틱 컬러 `success`/`warn`/`info`/`neutral`는 **유지**, Airbnb `error`/`scrim`/`legal-link`는 **신규 추가**(replace 아님) | 현행 시맨틱은 도메인 기능(checked_at staleness·booking status·intent chip) 구동 — 제거하면 기능 회귀. Airbnb 문서는 success/warn/info 미정의일 뿐 금지 아님. DESIGN_BRIEF 도메인 시맨틱은 supersede 안 됨(PRD §9) |
| `spacing` 스케일은 **신규 토큰으로 도입하되 옵트인**(기존 Tailwind 기본 spacing과 공존) | 현행은 spacing 커스텀 토큰 0개(`tailwind.config.ts` theme.extend에 spacing 키 없음, maxWidth만). Airbnb 4px base + named token(`DESIGN_SYSTEM_AIRBNB.md:104) 추가는 **신규 컴포넌트/메인 페이지에서 사용**, 기존 마크업의 `p-4`/`space-y-3`은 강제 치환 안 함(DESIGN_BRIEF의 semantic-promise 방식 존중) |

### G0-3. 다크 모드 결정 — **무회귀 동결**
- `globals.css:49-79` `.dark` 오버라이드 + `tailwind.config.ts:10` `darkMode:"class"` 현존. Airbnb는 다크 없음 → Rausch 다크 값 UNKNOWN(PRD §4-2, §12-6).
- **결정**: `.dark` 블록을 **건드리지 않는다**(현행 블루 다크 값 유지). 단 Phase 1에서 `--brand-*` 라이트 값을 Rausch로 바꾸면 라이트/다크가 hue 불일치(라이트 레드 / 다크 블루)가 되므로, 다크 모드 토글이 실제로 노출되는지부터 확인. **노출되면** 다크 brand만 Rausch-dark 근사값으로 임시 동기(saturation↓/lightness↑ 룰), **미노출이면** 라이트만 적용하고 다크는 후속 SPEC으로 이월. → **G0 결정 항목(Vivi 확인)**.

### G0-4. 마이그레이션 표면 (call-site census — 정량 근거)
ripgrep 실측(`app/` + `components/`, `*.tsx`):

| 패턴 | 발생 횟수 | 의미 |
|---|---|---|
| `brand` (전체) | **54회** | 토큰 값만 교체하면 전 호출부 자동 전파 (마크업 변경 0) |
| `text-brand` | **27회** | 사용 철학 축소 대상 1순위 — Airbnb는 inline 링크를 ink로 두고 Rausch는 극소수(§4-2). 링크에 쓰인 `text-brand`는 Phase 2에서 ink로 좁힐 후보 |
| `bg-brand` | **23회** | primary CTA 면 — Rausch 유지가 맞는 곳 |
| `border-brand` | **21회** | selected/chip-toggle 보더 — 유지 |
| `rgba(37, 99, 235` (블루 리터럴) | **2곳**: `app/globals.css:102`, `tailwind.config.ts:115` | focus ring 하드코딩 블루. 브랜드 이전 시 **고아(stranded) 리터럴** — Phase 1에서 반드시 처리 |
| `shadow-focus`/`shadow-pop` 사용 | **2건** | 그림자 티어 정리 시 영향 받는 마크업 — `Button.tsx`의 `focus-visible:shadow-focus` 포함 |

> **결론**: 토큰 값 교체(Phase 1)는 hue를 한 번에 바꾸지만, **사용 철학 축소**(text-brand 27회를 ink로 좁히기)는 토큰만으론 불가능하며 Phase 2 컴포넌트 패스에서 call-site별 판단이 필요(survey 핵심 발견과 일치).

### G0-5. focus ring 처리 — **결정 필요 (Vivi 확인)**
두 옵션 중 택1, Phase 1 착수 전 확정:
- **(A) Rausch recolor**: `rgba(37,99,235,0.3)` → `rgba(255,56,92,0.3)`. 현행 a11y 링(DESIGN_BRIEF:530-538) 유지하며 색만 이동. 변경 최소, Airbnb 입력 정책과는 불일치.
- **(B) Airbnb 입력 패턴**: 입력류는 ring 제거 + 포커스 시 2px ink 보더(`DESIGN_SYSTEM_AIRBNB.md:190 "no glow, no ring"`). 단 a11y 가시성을 위해 버튼/링크는 ring 유지(Rausch recolor). → 입력과 버튼을 분기.
- **권고 분기**: 입력=B, 버튼/링크=A(Rausch). 단 최종 채택은 Vivi 확인. 본 SPEC은 두 옵션을 Phase 1 작업 항목에 모두 명세.

---

## Phase 1 — 토큰 매핑 (`tailwind.config.ts` + `app/globals.css`)

> **목표**: 마크업을 건드리지 않고 토큰 값/구조만 바꿔 hue·타입·radius·spacing·elevation을 Airbnb로 전환. 토큰 정의는 두 파일에 분산(값=`globals.css` `:root`, 바인딩=`tailwind.config.ts` `var(--x, fallback)`)되어 있으므로 **두 파일을 한 단위로** 수정.

### 1-1. Color — Brand (블루 → Rausch)
`globals.css :root`(25-29) + `tailwind.config.ts`(22-28) 동기 수정:

| 토큰 | 현행 | → Airbnb | 근거 |
|---|---|---|---|
| `--brand-DEFAULT` | `#2563eb` | `#ff385c` (Rausch) | `DESIGN_SYSTEM_AIRBNB.md:30` |
| `--brand-hover` | `#1d4ed8` | `#e00b41` (Rausch Active=press) | `:31` (Airbnb는 hover=active 통합) |
| `--brand-fg` | `#ffffff` | `#ffffff` (on-primary) | `:52` 변경 없음 |
| `--brand-soft` | `#eff4ff` | Rausch 연한 틴트(예 `#ffe8ec` 근사) | soft 배경은 Airbnb 미정의 → DESIGN_BRIEF chip-toggle/selected용 도메인 토큰, **Rausch 계열로 hue만 이동** |
| `--brand-softfg` | `#1e40af` | Rausch 진한 텍스트(예 `#a8071a`/`#c13515` 근사) | selected 카드 텍스트 대비 확보 |
| **신규** `--brand-disabled` | (없음) | `#ffd1da` | `DESIGN_SYSTEM_AIRBNB.md:32` Rausch Disabled — **신규 토큰** + `tailwind.config.ts` 바인딩 추가 |

- `tailwind.config.ts`의 `var(--x, hex)` fallback hex도 **동일하게 교체**(주석상 fallback이 라이트 기본과 일치해야 함, `:18-19`).

### 1-2. Color — Ink (톤 3→5+ 확장)
`globals.css`(20-22) + `tailwind.config.ts`(30-34):

| 토큰 | 현행 | → Airbnb | 근거 |
|---|---|---|---|
| `--ink-DEFAULT` | `#18181b` | `#222222` (never pure black) | `:47` |
| `--ink-muted` | `#52525b` | `#6a6a6a` | `:49` |
| `--ink-faint` | `#a1a1aa` | `#929292` (muted-soft) | `:50` |
| **신규** `--ink-body` | (없음) | `#3f3f3f` | `:48` 장문 본문 톤 — 신규 추가 |
| star-rating | (없음, =ink) | =`#222222`(ink 재사용) | `:51` 별도 토큰 불요, ink 재사용 명시 |

### 1-3. Color — Surface & Hairlines (fill/hairline 분리)
`globals.css`(13-17) + `tailwind.config.ts`(36-42). Airbnb는 fill surface(soft/strong)와 hairline(3종)을 분리(`DESIGN_SYSTEM_AIRBNB.md:36-44`):

| 토큰 | 현행 | → Airbnb | 비고 |
|---|---|---|---|
| `--surface-DEFAULT` | `#ffffff` | `#ffffff` (canvas) | 동일 |
| `--surface-soft` | `#f7f7f8` | `#f7f7f7` | `:38` 미세 |
| **신규** `--surface-strong` | (없음) | `#f2f2f2` | `:39` 아이콘버튼 면 — 신규(현행 `sunken #efeff1`과 별개로 둘지/대체할지 결정: **신규 추가 권고**, sunken은 도메인 장바구니 톤이라 유지) |
| `--surface-sunken` | `#efeff1` | **유지** | DESIGN_BRIEF 장바구니/입력 안쪽 면, Airbnb 비대응 도메인 토큰 |
| `--surface-border`(=hairline) | `#e4e4e7` | `#dddddd` | `:42` — 의미상 어두워짐(가시 변화 있음) |
| **신규** `--hairline-soft` | (없음) | `#ebebeb` | `:43` 긴 스크롤 구분선 — 신규 |
| `--surface-borderStrong` | `#d4d4d8` | `#c1c1c1` | `:44` border-strong |

### 1-4. Color — Semantic (유지 + Airbnb 신규 추가)
- **유지**(변경 0): `success`/`warn`/`info`/`neutral` 라이트·다크 값 (`globals.css:32-39,70-78`, `tailwind.config.ts:44-59`). 도메인 기능 구동.
- **신규 추가**(`DESIGN_SYSTEM_AIRBNB.md:55-60`):
  - `--error` `#c13515` (form 검증 에러 텍스트, Rausch와 구분)
  - `--error-hover` `#b32505`
  - `--legal-link` `#428bff` (legal 카피 내 inline 링크 — `/disclosure` 등 법적 링크 전용)
  - `--scrim` `#000000` (렌더 시 50% opacity — 모달 백드롭)
- `tailwind.config.ts` colors에 위 4개 바인딩 추가.

### 1-5. Typography — 타입 스케일 (굵기 절제 + 신규 토큰)
`tailwind.config.ts fontSize`(66-103) 매핑. Airbnb는 display 굵기 500-600(현행 700 광범위)(`DESIGN_SYSTEM_AIRBNB.md:73-90`):

| 현행 토큰 | 현행 | → Airbnb 대응 | 변경 |
|---|---|---|---|
| `display-lg` | 2.25rem/700 | display-lg 22px/500 (`:75`) | **굵기 700→500, 크기 축소** |
| `display` | 1.75rem/700 | display-xl 28px/700 (`:74`) | 28px/700로 정렬(homepage h1) |
| `h1` | 1.5rem/700 | display-md 21px/700 또는 sm 20px/600 | 굵기·크기 조정 |
| `h2` | 1.1875rem/600 | display-sm 20px/600 / title-md 16px/600 | 조정 |
| `h3` | 1rem/600 | title-md 16px/600 (`:78`) | 유지 근사 |
| `body` | 0.9375rem(15px)/400 | body-md 16px/400 (`:80`) | **15→16px** |
| `body-sm` | 0.8125rem(13px) | body-sm 14px/400 (`:81`) | 13→14px |
| `label` | 13px/600 | caption 14px/500 (`:82`) | 조정 |
| `caption` | 12px/500 | caption-sm 13px/400 (`:83`) | 조정 |
| `num`/`num-lg` (mono) | 유지 | (Airbnb 비대응) | **유지** — 도메인 수치 mono(가격 정렬) |
| **신규** `rating-display` | (없음) | 64px/700, lh 1.1, ls -1px (`:73`) | 신규 — 시스템 최고 굵기 토큰(평점) |
| **신규** `uppercase-tag` | (없음) | 8px/700, ls 0.32em, uppercase (`:86`) | 신규 — "NEW" 뱃지 |
| **신규** `badge` | (없음) | 11px/600 (`:84`) | 신규 — floating 뱃지 |
| **신규** `micro-label` | (없음) | 12px/700 (`:85`) | 신규 |

- **line-height ~2% 타이트닝**(G0-1): display 계열(`display`/`display-lg`) lineHeight를 현행 1.2 → ~1.18로 미세 조정(Cereal 근사). 본문은 1.5(body-md) 유지.
- **굵기 절제가 핵심**: display 700 광범위 사용을 500-600로 낮추는 것이 토큰 변경의 시각적 본질(`DESIGN_SYSTEM_AIRBNB.md:19,93`).

### 1-6. Radius — `xl: 32px` 신규 추가
`tailwind.config.ts borderRadius`(104-110): 현행 `card`(14px)/`pill`/`chip`(8px)/`sheet`(20px) **유지** + **`xl: "2rem"`(32px) 신규 추가**(`DESIGN_SYSTEM_AIRBNB.md:15` 카테고리 스트립). rename(chip→sm·card→md)은 미적용(cosmetic, 호출부 회귀 위험).

### 1-7. Spacing — named token 신규 도입(옵트인)
`tailwind.config.ts theme.extend`에 `spacing` 키 신규 추가(`DESIGN_SYSTEM_AIRBNB.md:104`):
```
xxs:2px · xs:4px · sm:8px · md:12px · base:16px · lg:24px · xl:32px · xxl:48px · section:64px
```
- Tailwind 기본 spacing과 **충돌 회피**: 기본 `p-4`(=16px) 등은 그대로 동작. named token은 신규/리스타일 컴포넌트에서 `py-section` 등으로 **옵트인 사용**. 기존 마크업 강제 치환 안 함(DESIGN_BRIEF semantic-promise 존중, G0-2).
- `maxWidth`(117-121): 현행 `content:640px`/`discover:960px` **유지**. Airbnb 1280px 광폭 그리드는 **메인 페이지 IA 작업(PRD 후속)에서 결정** — 본 SPEC은 토큰만, 광폭 채택 시 `maxWidth.home:1280px` 추가 여지만 명시(좁은 컬럼 철학 vs 마켓플레이스 그리드 충돌은 PRD §6/§11-Q1 결정 의존).

### 1-8. Elevation — 단일 3-레이어 그림자 + focus ring 정리
`tailwind.config.ts boxShadow`(111-116) + `globals.css`(101-102):

| 토큰 | 현행 | → Airbnb |
|---|---|---|
| `shadow-card` | `0 1px 3px .06, 0 1px 2px .04` | **단일 티어로 교체**: `rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0` (`DESIGN_SYSTEM_AIRBNB.md:24,123`) |
| `shadow-pop` | `0 8px 24px .10` | **모달/시트 한정 유지** (Airbnb는 scrim 선호 — `--scrim` 도입으로 모달은 scrim, pop은 드롭다운 잔존분만) |
| `shadow-focus` | `0 0 0 3px rgba(37,99,235,.30)` (블루) | **G0-5 결정 적용**: (A) Rausch `rgba(255,56,92,.30)` recolor / (B) 입력은 ring 제거+2px ink 보더 |
| `globals.css:101-102` focus-visible 블루 리터럴 | `rgba(37,99,235,0.3)` | **반드시 동기 변경** — 2곳 고아 리터럴(G0-4) |

### Phase 1 검증
- `npm run typecheck && npm run build` PASS.
- 토큰만 변경했으므로 마크업 컴파일 무영향 확인. 라이트 모드에서 hue 전환·display 굵기 절제 육안 확인.
- 회귀 체크: 다크 모드 토글 노출 여부(G0-3) 확인 후 라이트/다크 hue 불일치 판단.

---

## Phase 2 — 컴포넌트 리스타일 (순서: AppTopNav → 버튼 → 카드 → 폼 → 푸터)

> **목표**: 토큰만으로 안 되는 "사용 철학 축소"(text-brand 27회 → ink로 좁히기)와 Airbnb 컴포넌트 형태(pill nav·8px 버튼·photo-first 카드·2px ink 입력 보더)를 call-site별로 적용. **merchant 금지 불변식 보존**.

### 2-0. merchant 금지 불변식 (전 컴포넌트 공통 — 협상 불가)
- **금지**: Reserve/예약 확정 CTA, 결제·체크아웃, 일괄결제, 묶음 단일 예약 CTA, 큰 가격표 상품 카드(PRD §9, `lib/copy/banned-phrases.ts`).
- **치환**: Airbnb reservation-card "Reserve/결제" 패턴 → **"참여 신청 / 관심"**(`DESIGN_SYSTEM_AIRBNB.md:234`). 이미 `RegisterBox.tsx`는 "참가 신청"으로 구현됨(`:74,98,135`) — **신규 유입 방지**가 작업.
- **구조적 방어 유지**: `Button.tsx`(1-6)는 "전체 예약"/"패키지 구매"/"묶음결제" variant를 의미적으로 만들 수 없게 설계됨 — Airbnb 리스타일 중에도 variant 집합(`primary`/`outline`/`ghost`/`chip-toggle`)을 **확장하지 않는다**.
- Phase 2 종료 시 `lib/copy/banned-phrases.ts` 기준 금지 문구 0건 확인.

### 2-1. AppTopNav (`components/AppTopNav.tsx`) — **IA 작업과 순서 의존**
- **순서 주의**: PRD §6-4(3-product nav 매핑)·§6-3(layout 전역 셸 승격)은 **IA 작업**이며, 본 SPEC의 리스타일은 그 IA 결정 **이후 또는 병행**이어야 한다. AppTopNav는 현재 깨져 있음(3탭 전부 `/discover`, `calendar` 키 강조 불가, `GMT+9`·`⌕`·`♢` 비기능 장식 — `:10-14,42-58`). **리스타일만 먼저 하면 깨진 구조에 페인트칠**이 됨.
- **결정 게이트**: IA(라우트/항목 확정, PRD §11-Q5)가 선행되면 → Airbnb top-nav 형태 적용:
  - 흰 면 + 1px 하단 hairline(`#dddddd`), nav-link 16px/600(`DESIGN_SYSTEM_AIRBNB.md:90`).
  - `이벤트 등록하기`(Airbnb host link 대응)는 **네비 한 항목으로 격하**(PRD §6-4) — primary CTA 면 아님.
  - 로그인 버튼: 현행 `rounded-pill border` 유지하되 Rausch는 쓰지 않음(Airbnb 로그인은 ink/secondary).
  - 비기능 장식(`⌕`/`♢`/`GMT+9`) 제거 or 실제 검색 orb로 승격(Where/When/Who 검색바는 PRD §11-Q1-c 결정 의존 — 본 SPEC 범위 밖, placeholder 제거만 권고).
- **IA 미선행 시**: AppTopNav 리스타일을 **보류**하고 버튼/카드/폼/푸터 먼저 진행(아래 순서 재배치 허용).

### 2-2. 버튼 (`components/ui/Button.tsx`) — 최대 blast-radius 원자
- BASE radius `rounded-card`(14px) → Airbnb 버튼은 8px(`rounded.sm`=현행 `chip`)(`DESIGN_SYSTEM_AIRBNB.md:132`). **`rounded-chip`(8px)로 변경** 또는 BASE를 8px로(버튼 한정).
- `primary`: Rausch 면 유지(`bg-brand` 토큰이 Phase 1에서 Rausch가 됨). 높이 48px·weight 500(`:132`)에 맞춰 `lg` 사이즈 정렬(현행 lg `min-h-[48px]` 일치).
- disabled: 현행 `disabled:opacity-50`(`:56`) → Airbnb는 `#ffd1da` pale Rausch(`:136`). `--brand-disabled` 토큰(Phase 1 신규) 적용 — opacity 대신 명시 disabled 면.
- `focus-visible:shadow-focus`(`:55`) → G0-5 결정 반영.
- **variant 확장 금지**(2-0). secondary(흰 면+ink 1px 보더)는 현행 `outline`이 대응 — 신규 variant 불요.

### 2-3. 카드 (`components/ui/Card.tsx` + `components/discover/TripCard.tsx`)
- `Card.tsx`: `shadow-card`(default variant, `:21`)가 Phase 1에서 단일 티어로 바뀜 — 자동 전파. radius `rounded-card`(14px)=Airbnb md 정렬(`:162` property-card). `selected` variant(`bg-brand-soft border-brand`, `:23`)는 Rausch-soft로 자동 전환.
- `TripCard.tsx`(photo-first 16:9): Airbnb property-card는 1:1 또는 4:5(`:162,166`)이나 **OurRealTrip은 16:9 유지**(도메인 트립 커버) — 종횡비는 강제 정렬 안 함, **radius·hairline·meta 타입만** Airbnb 정렬. heart-save(Rausch) 패턴은 OurRealTrip "관심"(InterestCountBadge)으로 대응 — **신규 결제 유발 UI 금지**.
- **ProposalCard.tsx 처리**: survey상 ProposalCard는 raw Tailwind 사이즈(text-sm/base/xs) 사용 + 렌더 사이트 미확인(dead/legacy 의심). **리스타일 전 실사용 여부 확인** — 미사용이면 작업 대상 제외(낭비 방지).

### 2-4. 폼 입력 (`components/event/RegisterBox.tsx` INPUT + `components/host/CreateEventForm.tsx`)
- `RegisterBox.tsx` `INPUT` 상수(`:24-26`): `rounded-lg border border-surface-border` + `focus-visible:border-brand`(현재 브랜드=Rausch로 자동 전환).
  - Airbnb text-input(`:190`): 8px radius·56px height·포커스 시 **2px ink 보더(no glow/ring)**. → G0-5 (B) 채택 시 `focus-visible:border-brand` → `focus-visible:border-2 focus-visible:border-ink`로 변경.
  - radius `rounded-lg` → `rounded-chip`(8px=Airbnb sm) 정렬.
- `CreateEventForm.tsx`(744줄, 에이전트 패널 포함): GGUI 다크 테마 미사용·화이트 미니멀 톤 유지(PRD §8-3). 입력/버튼은 위 원자 변경이 전파되므로 **개별 markup 변경 최소** — 내부 입력 클래스가 raw 하드코딩이면 토큰 클래스로 정렬(상세는 구현 시 line-level 확인 필요, 본 SPEC 미열람 구간).
- merchant 금지: 폼 제출 CTA 라벨이 "신청"/"관심" 계열 유지(`RegisterBox.tsx:135` "신청하기" OK).

### 2-5. 푸터 (net-new)
- 현재 Footer 컴포넌트 **부재**(survey 확인). 고지 의무는 `DisclosureBanner` 인라인으로 충족 중.
- **net-new 컴포넌트** — 단 **생성 위치/도입은 PRD §6-3(layout 전역 셸 승격) IA 작업에 종속**. 본 SPEC은 **푸터의 시각 스펙만** 정의, 실제 신설·layout 배치는 IA 작업과 함께:
  - Airbnb `footer-light`(`:194`): 흰 면(캔버스와 동일, 대비 푸터 없음), 3-column 링크 블록, 24px gutter, column head=title-sm 16px/500, 링크=body-sm ink.
  - `legal-band`(`:196`): 하단 strip, muted `#6a6a6a`·caption-sm 13px. **`/disclosure` 필수 고지 링크**를 legal-band에 배치(legal-link `#428bff` 토큰은 법적 링크 전용).
  - merchant 금지: 푸터에 결제/상품/가격 링크 0건.

### Phase 2 검증
- `npm run typecheck && npm run build` PASS (컴포넌트 마크업 변경이 컴파일 통과).
- merchant 금지: `lib/copy/banned-phrases.ts` 기준 신규 금지 문구 0건.
- text-brand 27회 중 inline 링크에 쓰인 것이 ink로 좁혀졌는지 call-site별 확인(사용 철학 축소 완료 여부).
- `code-reviewer`/`verifier` 분리 패스(공용 원자 변경 = 타인 산출물 영향).

---

## Phase 3 — 반응형 브레이크포인트

> **목표**: Airbnb 반응형 정책(`DESIGN_SYSTEM_AIRBNB.md:200-217`)을 OurRealTrip 좁은 컬럼 철학과 병합.

### 3-1. 브레이크포인트 매핑
Airbnb 4단(`:202-205`) → Tailwind 기본 브레이크포인트로 매핑:

| Airbnb | 폭 | Tailwind 근사 | 핵심 변화 |
|---|---|---|---|
| Mobile | <744px | base~`sm`(640) 사이 | nav 햄버거화, 카드 1-up, 카테고리 스냅 스크롤 |
| Tablet | 744–1128px | `md`(768)~`lg`(1024) | nav 탭 유지, 카드 2-up |
| Desktop | 1128–1440px | `xl`(1280) | nav 풀 3탭, 카드 4-up |
| Wide | >1440px | `2xl`(1536) | content 캡 |

- **결정**: Airbnb 744/1128/1440 정확 픽셀로 커스텀 브레이크포인트 추가하지 **않음** — Tailwind 기본 `sm/md/lg/xl/2xl` 유지(현행 마크업이 이미 `sm:`/`md:`/`lg:` 사용). 커스텀 브레이크포인트 도입은 전 마크업 회귀 위험 > 이득.
- 현행 `discover` maxWidth 960px·`content` 640px 유지. Airbnb 광폭(1280px) 그리드는 메인 페이지 IA 결정(PRD §11-Q1)에 종속 — 본 SPEC은 토큰 여지만 남김(`maxWidth.home` 추가 가능).

### 3-2. 컬럼 드롭 전략 (Airbnb `:216`)
- "행 reflow 금지, 컬럼 수만 감소" 원칙 적용: 카드 그리드는 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`처럼 컬럼만 단계 감소.
- 현행 `app/discover/page.tsx` 그리드(`grid-cols-1 sm:grid-cols-2`)는 이미 이 패턴 — **2-up까지만**이라 desktop 4-up 확장 시 `lg:grid-cols-3`/`xl:grid-cols-4` 추가 여부는 좁은 컬럼 철학(640px content)과 충돌하므로 **Discover/메인 폭 결정(IA) 후 적용**.

### 3-3. 터치 타깃 (Airbnb `:208-211`)
- primary CTA 최소 48×48px — 현행 `Button` lg `min-h-[48px]`·`touch-target`(globals.css:125 `min-h-[44px]`) 유지. Airbnb 48px와 현행 44px 차이는 **버튼은 48, 보조는 44** 분기로 충족(현행 sm/md=44, lg=48 이미 일치).

### Phase 3 검증
- `npm run typecheck && npm run build` PASS.
- mobile/tablet/desktop 폭에서 카드 컬럼 드롭·nav 동작 육안 확인(IA 작업 완료분 한정).

---

## 회귀 리스크 (Risk Register)

| # | 리스크 | 영향 | 완화 |
|---|---|---|---|
| R1 | **라이트/다크 hue 불일치** — Phase 1에서 라이트 brand를 Rausch로 바꾸면 `.dark`(globals.css:64) brand는 블루 잔존 | 다크 토글 노출 시 라이트=레드/다크=블루 깨짐 | G0-3: 다크 노출 여부 먼저 확인. 노출 시 다크 brand만 Rausch-dark 근사 동기, 미노출 시 후속 이월 |
| R2 | **고아 블루 리터럴** — `globals.css:102`·`tailwind.config.ts:115`의 `rgba(37,99,235)` 미변경 시 focus ring만 블루 잔존 | 브랜드 전환 후 포커스 링 색 불일치 | Phase 1-8에서 2곳 **동기 변경 강제**(체크리스트 항목) |
| R3 | **사용 철학 축소 누락** — 토큰만 바꾸고 text-brand 27회를 ink로 안 좁히면 Rausch가 링크에 과다 노출 | Airbnb "90% white+ink, Rausch 극소수" 위배 | Phase 2에서 call-site census 기반 inline 링크 ink 전환 (토큰만으론 불가) |
| R4 | **merchant 금지 회귀** — Airbnb reservation-card 패턴 직수입 시 Reserve/결제 UI 유입 | 반-merchant 불변식 파괴(협상 불가) | 2-0: variant 확장 금지·"참여 신청/관심" 치환·banned-phrases 0건 검증 |
| R5 | **AppTopNav 깨진 구조에 페인트칠** — IA(라우트/항목) 미선행 상태로 리스타일하면 3탭 동일링크·비기능 장식 잔존 | 시각만 바뀌고 IA 문제 지속 | 2-1: IA(PRD §6-4) 선행 게이트. 미선행 시 nav 리스타일 보류, 버튼/카드/폼 먼저 |
| R6 | **시맨틱 컬러 제거 사고** — Airbnb에 success/warn/info 없다고 현행 시맨틱 삭제 | checked_at staleness·booking status·intent chip 기능 회귀 | G0-2/1-4: 시맨틱 **유지** + error/scrim/legal-link **추가**(replace 아님) |
| R7 | **type 굵기 토큰 변경의 광역 전파** — display 700→500 변경이 의도치 않은 화면까지 약하게 보이게 | 강조가 필요한 도메인 화면(가격·상태)이 흐려짐 | 1-5: `num`/`num-lg` mono 토큰 유지, rating-display(64/700) 신규로 강조 모멘트 보존. Phase 1 후 육안 |
| R8 | **rename 유혹 회귀** — chip→sm·card→md rename 시 호출부 전수 변경 필요 | 누락 시 빌드/시각 깨짐 | G0-2: rename 미적용(cosmetic), 값/구조만 변경 |
| R9 | **광폭 그리드 vs 좁은 컬럼 충돌** — Airbnb 1280px를 현행 640px content에 강제 적용 | DESIGN_BRIEF "luma처럼 좁고" 철학 파괴 | 1-7/3-1: maxWidth 유지, 광폭은 PRD §11-Q1 IA 결정 종속(본 SPEC 미결정) |
| R10 | **ProposalCard 헛작업** — dead/legacy 가능성 있는 컴포넌트 리스타일 | 시간 낭비 | 2-3: 실사용 여부 확인 후 대상 결정 |
| R11 | **lint 게이트 부재** — package.json에 `lint` 스크립트 없음 | eslint 단독 회귀 감지 불가 | 0-3: typecheck+build로 대체, 시각 회귀는 verifier+육안 |
| R12 | **CreateEventForm 미열람 구간** — 744줄 내부 raw 하드코딩 클래스 존재 가능 | 토큰 미적용 잔존 | 2-4: 구현 시 line-level 확인 필요(본 SPEC 미열람 — UNKNOWN) |

---

## 미확인 / UNKNOWN
- 다크 모드 토글의 실제 UI 노출 여부 (G0-3 결정 입력 필요).
- `CreateEventForm.tsx`/`HostCreateAgentPanel.tsx` 내부(744/739줄)의 raw 클래스 사용 여부 — 본 SPEC 미열람.
- proposal/ 하위 12개 컴포넌트(RsvpPanel·SharedCart·TravelOptionCard 등) line-level 클래스 — composition 순서만 확인, 내부 미열람.
- `ProposalCard.tsx` 실사용 여부(dead 의심).
- Airbnb soft/disabled Rausch 틴트의 정확 hex — 문서 미제공, 근사값 제안(1-1). Vivi/디자인 확정 필요.
- 광폭 메인 페이지 폭(1280px) 채택 여부 — PRD §11-Q1 IA 결정 종속.
