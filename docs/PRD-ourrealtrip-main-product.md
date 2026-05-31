---
title: 아워리얼트립 메인 페이지 리부트 — 제품 PRD
date: 2026-05-31
status: draft
---

# 아워리얼트립 메인 페이지 리부트 PRD

> 본 문서는 **계획(PLANNING)** 산출물이다. 구현은 진행 중인 작업(로그인 검증 + MCP)이 끝난 **이후** 착수한다(Vivi 결정). 본 PRD는 코드 변경을 포함하지 않는다.

---

## 1. 1줄 정의

아워리얼트립은 모임이 함께 갈 여행을 **제안하고 관심·투표·질문으로 의향을 확인한 뒤 각자 실제 판매처에서 예약**하는 커뮤니티 여행 워크스페이스이며, 이번 리부트는 **로그인 직후 이벤트 생성 화면으로 떨어지는 현 IA를 폐기하고, Airbnb 시각 언어를 입힌 제대로 된 "메인(홈) 페이지"를 제품의 정문(front door)으로 세우는 것**이다.

---

## 2. 배경 / 현재 상태 (factual base)

### 2-1. 단일 코드베이스 + 배포 격차
- 적용 대상 = 로컬 `/Users/vivi/ourrealtrip` **단일 코드베이스**.
- 현재 배포된 `ourrealtrip-vercel-current.vercel.app`은 이 repo의 **한참 뒤처진(stale) 별도 정적 랜딩 페이지**다. 배포본은 `__NEXT_DATA__`·Tailwind 유틸리티가 없는 손수 작성한 정적 HTML 마케팅 페이지("landing v3")로, 앵커(`#how`·`#events`·`#rules`)만 있고 실제 라우트 링크(`/discover`·`/host/create`·`/login`)·`<button>`이 0개다. 즉 배포본은 제품 앱이 아니다.
- **이번 리부트의 핵심 전략**: 그 별도 랜딩은 더 이상 별도로 둘 필요가 없다 → **로컬을 재배포하여 배포본을 교체**하고, 그 URL을 **재설계된 제품의 메인 페이지**로 승격한다.

### 2-2. 현 IA의 라우팅 사실 (코드 직접 확인)
| 사실 | 근거 |
|---|---|
| `"/"`는 별도 홈이 아니라 Discover 화면을 그대로 재노출(별칭) | `app/page.tsx:7` `export { default } from "@/app/discover/page"` |
| Discover 구성: 인트로 Hero → 카테고리 레일 → 인기 트립 그리드 → 커뮤니티 → DisclosureBanner. Supabase 미호출(seed+local 집계만) | `app/discover/page.tsx:67-143`, `:10` |
| Discover/홈에는 **상단 네비(AppTopNav)가 없음** | `app/discover/page.tsx`(네비 import 없음) |
| 로그인 후 기본 착지 = `/host/create`(이벤트 만들기) | `lib/auth/safeNext.ts:4` `const DEFAULT_NEXT = "/host/create"` |
| OAuth 콜백·로그인 페이지·미로그인 "로그인" 버튼 모두 next 미지정 시 `/host/create`로 수렴 | `auth/callback/route.ts`, `login/page.tsx`, `AppTopNav.tsx:73` `/login?next=/host/create` |
| 미들웨어 보호 프리픽스는 `/host` 전체. 깊은 보호 경로 직접 진입 시 로그인 후 그 경로 복귀, 순수 로그인이면 `/host/create` 착지 | `middleware.ts:4` `HOST_PROTECTED_PREFIXES = ["/host"]`, `:19-23` |
| 별도 "방문자용 홈"과 "호스트용 첫 화면"이 분리·양분돼 있고, 둘과 독립된 통합 홈/대시보드는 부재 | `app/page.tsx`(=discover) vs `app/host/create/page.tsx` |
| AppTopNav 3개 탭(이벤트/캘린더/탐색)이 전부 `href="/discover"`로 동일하게 걸려 있고 `calendar` 키는 active union에 없어 절대 강조되지 않음 | `components/AppTopNav.tsx:10-14` |
| 루트 레이아웃은 최소 셸(html/body+폰트)만. 전역 헤더·푸터·네비 없음 → 네비가 페이지별로 산발 | `app/layout.tsx`(survey 확인), `AppTopNav`는 host/create·host/preview·e/[slug]에만 렌더 |
| 폰트는 이미 Inter가 라이브(fallback 아님) | `app/layout.tsx`에서 `next/font/google` Inter → `--font-sans` |

### 2-3. 톱레벨 라우트 인벤토리 (페이지 + route handler)
- **PAGE**: `/`(=Discover) · `/discover` · `/c/[category]`(카테고리별 트립, 6종 SSG) · `/trips/[slug]`(Trip Proposal 상세, 참여의향/예약진행 집계) · `/e/[slug]`(발행 이벤트 공개 페이지, RSVP) · `/login` · `/disclosure`(필수 고지 6종) · `/host/create`(이벤트 생성 폼, 로그인 후 기본 착지) · `/host/events/[draftId]`(호스트 대시보드, 신청자 승인/거절) · `/host/preview/[draftId]`(발행 전 초안 미리보기).
- **ROUTE HANDLER(UI 없음)**: `/go/[product_link_id]`(클릭 추적 후 외부 판매처 302) · `/auth/callback`(OAuth 코드 교환 → next 302) · `/api/rsvp` · `/api/booking-progress`.
- **UNKNOWN**: `/trips`(인덱스, slug 없는 경로) 직접 진입 동작은 매칭 page 부재로 추정 404이나 `next.config`의 rewrites/redirects 미확인. `/api/*`의 HTTP 메서드/스키마 미확인. 런타임 로그인 착지 실측은 OAuth/Supabase 실환경(키 게이트)에서만 end-to-end 확인 가능 — 본 분석은 정적 코드 추적.

---

## 3. 문제 정의

### 3-1. 핵심 문제 — "create-first" IA
**로그인하면 곧바로 `/host/create`(이벤트 만들기)로 떨어진다.** 이것이 잘못됐다.
- 모든 로그인 진입 경로(로그인 버튼·OAuth 콜백·미들웨어 게이트의 기본값)가 명시 next 없을 때 `/host/create`로 수렴한다(`lib/auth/safeNext.ts:4`).
- 결과적으로 **첫 인상이 "당신은 이제 호스트입니다. 이벤트를 만드세요"** 가 되어버린다. 대다수 사용자는 호스트가 아니라 **참여자·탐색자**다. create-first는 호스트 1명 대 참여자 N명이라는 제품 본질과 어긋난다.
- 정문(home)이 없어 "둘러보기 → 관심 표현 → 합의 → 예약"이라는 제품 서사의 진입점이 끊긴다.

### 3-2. 부수 문제 — 전역 셸/네비 부재
- 전역 헤더·푸터가 layout 레벨에 없어(`app/layout.tsx`) 네비가 page별로 산발한다. Discover·trips·category·login에는 상단 네비가 아예 없다.
- AppTopNav 자체가 내부적으로 깨져 있다: 3개 탭이 전부 `/discover`로 가고, `calendar` 키는 강조 불가, `GMT+9`·`⌕`·`♢`는 비기능 장식(`components/AppTopNav.tsx:10-14, 42-58`).
- 이벤트 생성이 "정문"인지 "기능"인지 IA가 모호하다.

### 3-3. 디자인 격차
- 현재 브랜드 액센트는 **블루**(`#2563eb`, DESIGN_BRIEF의 차분한 잉크-블루)인데 목표는 Airbnb **Rausch 레드**(`#ff385c`). 단순 hue 교체가 아니라, 블루를 링크+모든 CTA에 넓게 쓰던 사용 철학을 "90% 화이트 + 잉크 + Rausch는 극소수 순간만"으로 **좁히는** 변경이다.
- 폰트 패밀리는 이미 Inter로 정렬됨(격차 없음). 타입 스케일/굵기, 단일 그림자, radius 32px 토큰 등은 spec에서 매핑.

---

## 4. 목표 / 비목표

### 4-1. 목표 (Goals)
1. **메인(홈) 페이지를 제품의 정문으로 신설**한다 — 로그인 여부와 무관하게 처음 보는 화면.
2. **로그인 후 착지점을 `/host/create`에서 메인으로 변경**한다(딥링크 next는 보존).
3. **이벤트 등록(생성)을 상단 네비의 한 기능("이벤트 등록하기")으로 격하**시킨다 — 더 이상 로그인 직후 강제 화면이 아니다.
4. **전역 셸(상단 네비 + 푸터)을 layout 레벨로 끌어올려** 사이트 전역에서 일관되게 렌더한다.
5. **Airbnb 시각 언어를 채택**한다(DESIGN_SYSTEM_AIRBNB.md) — Rausch 액센트, 절제된 타입, 부드러운 형태, 단일 그림자. Cereal→Inter 대체.
6. **NOT-a-merchant 불변식을 보존**한다 — 결제·Reserve·일괄결제·체크아웃 카트 0건. "참여 신청/관심"으로만.
7. 배포본을 로컬 재배포로 **교체**하고 그 URL을 메인으로 승격한다.

### 4-2. 비목표 (Non-Goals)
- **이번 사이클에 구현하지 않는다** — 본 PRD는 계획이며 구현은 로그인 검증 + MCP 작업 이후 별도 착수.
- **개인화 대시보드(내 관심 트립/내가 만든 이벤트 모음)의 완전 구축은 비목표** — 후속 단계 후보(§11 열린 질문 참조).
- **Discover의 데이터 소스를 Supabase로 전환하는 작업은 비목표** — 현 seed+local 집계 유지(`app/discover/page.tsx:10`).
- **다크 모드 Rausch 팔레트 도출은 비목표** — Airbnb 공개 웹은 다크 모드 없음(`DESIGN_SYSTEM_AIRBNB.md:37`). 다크 모드 토큰은 첫 채택 범위 밖(UNKNOWN, 보류).
- **결제/예약/카트 도입은 영구 비목표**(NOT-a-merchant 불변식, §9).
- **AppTopNav의 `캘린더` 탭을 실제 캘린더 기능으로 구축하는 것은 비목표** — 본 PRD는 라우팅/IA 정리까지.
- **DESIGN_BRIEF.md의 도메인 불변식·640px 좁은 컬럼 철학을 통째로 폐기하는 것은 비목표** — Airbnb 문서는 룩앤필 층만 supersede(§8-3).

---

## 5. 사용자 흐름

### 5-1. 비로그인 방문자
1. URL(메인) 진입 → **메인 페이지** 렌더(전역 상단 네비 + 콘텐츠 + 푸터).
2. 상단 네비에 `로그인` 버튼과 `이벤트 등록하기`가 노출. 메인 콘텐츠는 공개 열람 가능(Discover/트립/이벤트 공개 페이지는 비보호 — `middleware.ts:4`는 `/host`만 보호).
3. 트립 카드 클릭 → `/trips/[slug]` 상세 열람(참여의향/소셜프루프). 관심·투표·질문은 공개 신호.
4. `이벤트 등록하기` 클릭 → 미인증이므로 `/login?next=/host/create`로 유도(딥링크 보존).
5. 외부 판매처로 가려면 `/go/[product_link_id]` 추적 후 302 — **결제는 우리 안에서 일어나지 않음**.

### 5-2. 로그인 후 착지
1. `로그인` → Google OAuth → `/auth/callback` → next 처리.
2. **명시 next가 없으면 → 메인 페이지로 착지**(현재의 `/host/create` 폐기). next 변경의 단일 진입점은 `lib/auth/safeNext.ts`의 `DEFAULT_NEXT`(현 `/host/create`).
3. **딥링크 보존**: 사용자가 `/host/events/[draftId]` 같은 보호 경로를 직접 노렸다면 로그인 후 그 경로로 복귀(`middleware.ts:19-23` 동작 유지).
4. 호스트가 되고 싶으면 메인의 상단 네비 `이벤트 등록하기` → `/host/create`로 **자발적 진입**.

> 착지점이 "메인"인지 "개인 대시보드"인지는 **Vivi 결정 필요**(§11-Q2).

---

## 6. 정보구조 · 라우팅 변경

### 6-1. 메인(홈) 신설 — `"/"`의 의미 재정의
- 현재 `"/"`는 Discover 별칭(`app/page.tsx:7`). 리부트 후 `"/"`는 **메인 페이지**가 된다.
- `/discover`와 메인의 관계는 **Vivi 결정 필요**(§11-Q4). 후보:
  - (a) 메인이 곧 새 Discover(현 별칭 구조 유지, Discover를 Airbnb 룩으로 재단장).
  - (b) 메인은 큐레이션/추천 허브로 신설하고 `/discover`는 전체 탐색 피드로 분리(별칭 해제).

### 6-2. 로그인 착지점 변경 (구현 시 단일 지점)
- `lib/auth/safeNext.ts:4`의 `DEFAULT_NEXT`를 `/host/create` → 메인 경로로 변경하면 **로그인 버튼·OAuth 콜백·미들웨어 게이트 전부가 한 번에** 메인 착지로 수렴(현 수렴 구조를 그대로 재활용).
- `AppTopNav.tsx:73`의 미로그인 "로그인" 버튼 `href="/login?next=/host/create"`도 함께 정리(메인 또는 next 미지정).
- **주의**: 깊은 보호 경로 딥링크는 보존해야 하므로, `safeNextPath`의 가드(open-redirect 방지)는 유지하되 기본값만 교체.

### 6-3. 전역 셸 도입 (layout로 끌어올리기)
- 현재 layout은 셸이 없고 네비가 page별 산발. **상단 네비 + (신규) 푸터를 layout 레벨로 이동**하여 전역 일관성 확보.
- **푸터는 net-new** — 현재 components/ 아래 Footer 컴포넌트 부재. 고지 의무는 지금 DisclosureBanner 인라인으로 충족 중이므로, 푸터 도입 시 고지/정책 링크(`/disclosure`)를 어디에 둘지 정리.

### 6-4. 상단 네비 재정의 (3-product nav 매핑)
- Airbnb의 Homes/Experiences/Services 3-product nav을 **OurRealTrip nav로 치환 매핑**(`DESIGN_SYSTEM_AIRBNB.md:232`): 이벤트/캘린더/탐색 + **이벤트 등록하기**.
- 현 AppTopNav의 깨진 부분 정리: 3탭 전부 `/discover` 동일 링크, `calendar` 키 강조 불가, 비기능 장식(`GMT+9`·`⌕`·`♢`)을 실제 라우트로 만들지 placeholder로 둘지 결정. **이벤트 등록하기**는 정문이 아니라 네비의 한 항목으로 위치.

### 6-5. 라우팅 변경 요약표
| 항목 | 현재 | 변경 후 |
|---|---|---|
| `"/"` | Discover 별칭(`app/page.tsx:7`) | 메인(홈) 페이지 (§11-Q1/Q4 결정 의존) |
| 로그인 기본 착지 | `/host/create`(`safeNext.ts:4`) | 메인 (또는 개인 대시보드 — §11-Q2) |
| 이벤트 생성 진입 | 로그인 직후 강제 화면 | 상단 네비 `이벤트 등록하기` 자발 진입 |
| 전역 네비/푸터 | page별 산발, 푸터 없음 | layout 전역 셸(네비+푸터) |
| 보호 경로 딥링크 | 로그인 후 복귀(`middleware.ts:19-23`) | **유지** |

---

## 7. 디자인 채택 요약 (DESIGN_SYSTEM_AIRBNB.md)

| 축 | 현재 | 목표(Airbnb) | 성격 |
|---|---|---|---|
| 브랜드 액센트 | 블루 `#2563eb`(`globals.css:25-29`) | Rausch `#ff385c` + active `#e00b41` + disabled `#ffd1da` | hue 교체 + 신규 disabled 토큰 |
| 액센트 사용 철학 | 링크+모든 CTA에 블루 확산 | CTA·검색·하트·워드마크에만 극소수 | **사용 범위 축소**(토큰 rename만으론 부족) |
| 잉크 | `#18181b` | `#222222`(never pure black), body `#3f3f3f`, muted `#6a6a6a` | 미세 교체 + 톤 확장(3톤→5+톤) |
| 폰트 패밀리 | Inter 라이브 | Cereal→Inter 대체 | **이미 정렬, 격차 없음** |
| 타입 굵기/스케일 | display 700 광범위 | display 500–600, body 16px/400, rating-display 64px/700 | 굵기 절제 + 신규 토큰 추가 |
| Radius | chip 8 / card 14 / pill / sheet 20 | sm 8 / md 14 / full / **xl 32(신규)** | ~80% 정렬, 32px 토큰 추가 |
| 그림자 | card/pop/focus 3티어 | **단일 3-레이어 그림자** + 모달 scrim | pop 티어 제거, focus 블루→Rausch 또는 잉크 2px 보더 |
| 다크 모드 | 존재 | **없음** | 보류(UNKNOWN, 비목표) |

> 토큰 단위 1:1 매핑·call-site 마이그레이션 표면(`text-brand`/`bg-brand` 사용처 census)은 별도 **design-system-adoption-spec**에서 확정한다(본 PRD는 채택 결정과 격차 식별까지).

---

## 8. host/create 통합 방식

### 8-1. 핵심 — "정문 → 기능"으로 격하
- `/host/create`는 더 이상 로그인 직후 화면이 아니다. **상단 네비 `이벤트 등록하기`를 통해 도달하는 하나의 기능**으로 재배치.
- 기존 생성 플로우는 보존: `host/create`(폼 + 에이전트 패널) → `host/preview/[draftId]`(발행 전 미리보기, 승인 게이트) → `host/events/[draftId]`(호스트 대시보드, 신청자 승인/거절). 미들웨어 `/host` 보호는 유지.

### 8-2. 미인증 유저의 등록 시도
- 미인증 상태에서 `이벤트 등록하기` 클릭 → `/login?next=/host/create`(딥링크 보존). 로그인 후 의도했던 생성 화면으로 정확히 복귀.

### 8-3. 디자인 일관성
- host/create의 에이전트 패널(`@ggui-ai/react`, MCP 백엔드)은 화이트 미니멀 톤 유지. Airbnb 룩 채택 시 전역 토큰 변경이 자동 전파되되, 생성 워크벤치 내부의 GGUI 다크 테마는 사용 안 함(현 정책 유지).

---

## 9. NOT-a-merchant 불변식 (반드시 보존)

아워리얼트립은 **결제를 받지 않는다**. 우리는 의향을 모으고 외부 판매처로 잇는 커뮤니티 워크스페이스이지 커머스가 아니다.

- **금지**: Reserve/예약 확정 CTA, 결제·체크아웃, 일괄결제, 묶음 단일 예약 CTA, 큰 가격표 상품 카드, merchant 플로우. (근거: `app/discover/page.tsx:12-15` negative spec, `docs/COMMERCE_MODEL.md`, `docs/DESIGN_BRIEF.md` 하드 금지, 금지문구 소스 `lib/copy/banned-phrases.ts`)
- **치환**: Airbnb reservation-card의 "Reserve/결제" 패턴 → **"참여 신청 / 관심"**(`DESIGN_SYSTEM_AIRBNB.md:234`). "N명 참여의향"은 "N명 예약"으로 오인되지 않게.
- **외부 판매처 연결**은 `/go/[product_link_id]` 추적 후 302로만(우리 안에서 결제 0건).
- **마이리얼트립 공식 오인 UI 금지**, 필수 고지(`/disclosure`, DisclosureBanner)는 유지.
- Airbnb 문서는 **룩앤필 층만 supersede**(액센트 hue·타입 절제·소프트 형태·단일 그림자); DESIGN_BRIEF의 **행동/반-merchant 층은 supersede되지 않는다**(no Reserve/checkout, 좁은 컬럼, 도메인 시맨틱 컬러). 둘은 adoption-spec에서 **병합**하며 한쪽이 다른 쪽을 통째로 대체하지 않는다(`DESIGN_SYSTEM_AIRBNB.md:229-234`).

---

## 10. 성공 기준

### 10-1. 정성 (1차)
- 로그인 직후 사용자가 **메인 페이지**를 본다 — `/host/create` 강제 착지 0건(딥링크 제외).
- 전역 상단 네비/푸터가 **모든 주요 공개 페이지**(메인/trips/category/login 포함)에 일관 렌더.
- `이벤트 등록하기`가 네비의 한 항목으로 존재하고, 호스트가 아닌 사용자는 강제로 생성 화면에 노출되지 않는다.
- 배포 URL이 stale 정적 랜딩이 아니라 로컬 재배포된 실제 앱을 보여준다(`__NEXT_DATA__` 존재, 실제 라우트 링크 동작).

### 10-2. 시각/불변식 (검증 항목)
- 브랜드 액센트가 Rausch로 통일되고 블루 잔재(focus ring·shadow-focus의 `rgba(37,99,235,...)`)가 제거됨.
- 결제/Reserve/카트 UI 0건, 금지 문구 0건(`lib/copy/banned-phrases.ts` 기준 lint 통과).
- 다크 모드는 범위 밖 — 라이트 단일 채택으로 회귀 없음.

### 10-3. 측정 방식
- 라우팅 변경은 정적 코드(`safeNext.ts` 기본값·콜백·미들웨어) + 빌드/typecheck로 1차 검증, **로그인 착지 실측은 OAuth/Supabase 실환경에서 end-to-end**(키 게이트 — 후속).
- 디자인 채택은 adoption-spec의 토큰 매핑 + call-site census로 마이그레이션 표면을 정량화.
- 타인 산출물(공용 디자인 토큰·전역 셸)에 영향을 주므로 구현 완료 후 `code-reviewer`/`verifier` 분리 패스 권장.

---

## 11. 열린 질문 (Vivi 결정 필요)

> 아래는 코드/문서로 확정할 수 없는 **제품 결정**이다. 본 PRD는 결정을 강제하지 않고 선택지를 제시한다.

- **Q1. 메인 페이지에 무엇을 담나?**
  - (a) Discover 피드(현 카테고리/인기 트립/커뮤니티)를 Airbnb 룩으로 재단장한 것 그대로
  - (b) 추천/큐레이션된 이벤트 + Discover 피드 진입 카드
  - (c) Airbnb형 글로벌 검색 바(Where/When/Who 매핑) + 피드
  - (d) 위 조합 — 어떤 블록을, 어떤 순서로?

- **Q2. 로그인 후 착지점은 메인인가, 개인 대시보드인가?**
  - (a) 메인(홈) — 로그인/비로그인 동일 정문, 가장 단순
  - (b) 개인 대시보드(내 관심 트립/내가 만든 이벤트/참여 신청 현황) — 단, 대시보드는 net-new 구축 필요(비목표였던 범위 확장)
  - (c) 메인이되 로그인 사용자에겐 상단에 개인 요약 스트립만 얹기(절충)

- **Q3. 브랜드 워드마크 · 로고**
  - 메인 상단 네비 좌측 워드마크를 무엇으로? 현재 메타 title은 "아워리얼트립"뿐(로고 에셋 부재). 워드마크 텍스트/로고 이미지/Rausch 컬러 적용 범위 결정 필요.

- **Q4. 기존 `/discover`와 메인의 관계**
  - (a) 메인 = 새 Discover(현 `app/page.tsx:7` 별칭 구조 유지, Discover만 재단장)
  - (b) 메인은 큐레이션 허브로 신설 + `/discover`는 전체 탐색 피드로 분리(별칭 해제 → `app/page.tsx` 재작성 필요)
  - (c) 메인과 Discover를 합쳐 단일 화면으로(별도 `/discover` 폐기)

- **Q5. 상단 네비 항목 확정 (선택)**
  - 이벤트/캘린더/탐색 3탭을 실제 라우트로 만들지(현재 전부 `/discover`), `캘린더`를 placeholder로 둘지, 비기능 장식(`GMT+9`·`⌕`·`♢`)을 제거할지. + 푸터에 어떤 정책/고지 링크를 둘지.

---

## 12. 가정 (Assumptions)

1. 진행 중인 "로그인 검증 + MCP" 작업이 본 리부트보다 먼저 완료되며, 본 PRD 구현은 그 이후 착수한다(Vivi 명시).
2. 배포본 교체는 "로컬 repo를 그대로 재배포"를 의미하며, stale 정적 랜딩(landing v3)은 폐기 대상이다. (배포본이 이 repo에서 빌드된 것인지 별도 작성인지는 git history 미확인 — UNKNOWN이나 교체 방향에는 영향 없음.)
3. 로그인 착지점 변경의 단일 지점은 `lib/auth/safeNext.ts`의 `DEFAULT_NEXT`이며, 가드(open-redirect 방지)·딥링크 복귀(`middleware.ts:19-23`)는 그대로 유지한다.
4. Discover의 데이터 소스는 당분간 seed+local 집계 유지(Supabase 전환은 별도 작업).
5. 폰트는 Inter로 이미 정렬되어 추가 폰트 작업은 line-height 미세 튜닝(~2%) 외 불필요(`DESIGN_SYSTEM_AIRBNB.md:98`).
6. 다크 모드 Rausch 팔레트는 본 채택 범위 밖이며, 라이트 단일 채택으로 진행한다.
7. 토큰 단위 매핑·call-site 마이그레이션·DESIGN_BRIEF 병합 규칙은 후속 design-system-adoption-spec에서 확정한다.
8. NOT-a-merchant 불변식(결제/Reserve/카트 0건)은 협상 불가이며 모든 화면에 적용된다.
9. 본 PRD는 코드를 변경하지 않는 계획 산출물이다. `/api/*` 스키마·`next.config` rewrites·런타임 착지 실측은 구현 단계에서 확인할 UNKNOWN으로 남긴다.
