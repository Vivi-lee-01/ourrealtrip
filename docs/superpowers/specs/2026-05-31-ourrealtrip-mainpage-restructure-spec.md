---
title: 아워리얼트립 메인 페이지 재구성 + host/create 네비 통합 — 구현 SPEC
date: 2026-05-31
status: plan
---

# 아워리얼트립 메인 페이지 재구성 + host/create 네비 통합 — 구현 SPEC

> 본 문서는 **구현 SPEC**(planning 산출물)이다. 코드를 변경하지 않는다.
> 근거 PRD: `docs/PRD-ourrealtrip-main-product.md`. 모든 라우팅·토큰 사실은 코드 직접 확인(file:line) 기준.
> 디자인 시각 언어 채택(Rausch 토큰 1:1 매핑·call-site census)은 별도 **design-system-adoption-spec**(미작성)에서 확정한다. 본 SPEC은 그것을 **Task1(디자인)** 로 부르고, 충돌 지점과 구현 순서만 명시한다.

---

## 0. 범위 / 비범위

### 범위 (이 SPEC이 다루는 것)
- **Phase 1**: 새 메인/홈 페이지 신설 또는 `app/page.tsx` 재구성
- **Phase 2**: 로그인 후 착지점 변경 (`/host/create` 직행 → 메인). next-param 기본값·`requireHostAuthContext`·`middleware` 영향 분석
- **Phase 3**: `AppTopNav` "이벤트 등록하기" 진입 정비 (이미 존재하는 `/host/create` 링크 활용 + 깨진 네비 정리)
- **Phase 4**: `host/create`를 nav-accessed 플로우로 위치 조정 (정문 → 기능 격하)
- 각 Phase 검증 = `typecheck` + `build` + 라우팅 E2E

### 비범위
- Rausch 토큰 1:1 매핑, `text-brand`/`bg-brand` call-site census — **Task1(design-system-adoption-spec)**
- 개인 대시보드(내 관심 트립/내가 만든 이벤트) 신규 구축 — PRD §4-2 비목표
- Discover 데이터 소스의 Supabase 전환 — PRD §4-2 비목표
- 다크 모드 Rausch 팔레트 도출 — PRD §4-2 비목표
- 결제/Reserve/카트 — 영구 비목표 (NOT-a-merchant 불변식)

---

## 1. Grounding — 코드 직접 확인 사실 (file:line)

| 사실 | 근거 |
|---|---|
| `"/"`는 별도 홈이 아니라 Discover를 그대로 재노출(별칭) | `app/page.tsx:7` `export { default } from "@/app/discover/page"` |
| 로그인 기본 착지의 단일 출처 = `DEFAULT_NEXT` | `lib/auth/safeNext.ts:4` `const DEFAULT_NEXT = "/host/create"` |
| 로그인 페이지가 next 미지정 시에도 `safeNextPath(next)`로 `/host/create` 계산 | `app/login/page.tsx:19` |
| OAuth 콜백이 `safeNextPath(...)` 후 `${origin}${next}`로 302 | `app/auth/callback/route.ts:8,31` |
| 콜백은 `getSiteUrl`이 아니라 **request origin** 고정(쿠키 호스트 정합) | `app/auth/callback/route.ts:9-12,31` |
| 로그인 버튼이 `redirectTo={site}/auth/callback?next={nextPath}` 설정 | `components/auth/GoogleLoginButton.tsx:19` |
| `requireHostAuthContext`는 미인증 시 호출부가 넘긴 `nextPath`로 `/login?next=` 리다이렉트 (자체 기본값 없음) | `lib/auth/host.ts:34-38` |
| 미들웨어 보호 프리픽스 = `/host` 전체, 미인증 시 `/login?next={pathname+search}` | `middleware.ts:4,19-23` |
| 미들웨어는 Supabase 미설정(`!configured`)·비보호 경로·user 존재 시 그대로 통과 | `middleware.ts:17` |
| `AppTopNav` 3탭(이벤트/캘린더/탐색)이 전부 `href="/discover"` | `components/AppTopNav.tsx:10-14` |
| `calendar` 키는 active union(`"events"\|"create"\|"discover"`)에 없어 절대 강조 불가 | `components/AppTopNav.tsx:7,12` |
| `GMT+9`·`⌕`·`♢`는 비기능 장식 | `components/AppTopNav.tsx:42-44,53-58` |
| 미로그인 "로그인" 버튼이 `/login?next=/host/create`로 고정 | `components/AppTopNav.tsx:72-77` |
| `이벤트 만들기` nav 링크는 이미 `/host/create` 존재 (label "이벤트 만들기") | `components/AppTopNav.tsx:45-52` |
| `AppTopNav`는 layout이 아니라 3개 페이지가 개별 import: host/create·host/preview·e/[slug] | `app/host/create/page.tsx:23`, `app/host/preview/[draftId]/page.tsx:82`, `app/e/[slug]/page.tsx:55` |
| 루트 레이아웃은 최소 셸(html/body + 폰트)만, 전역 헤더/푸터/네비 없음 | `app/layout.tsx:46-58` |
| Discover 화면은 AppTopNav import 없음 (상단 네비 부재) | `app/discover/page.tsx` (네비 import 없음) |
| Discover는 seed + local 집계만, Supabase 미호출 | `app/discover/page.tsx:10,32-42` |
| 브랜드 액센트 = 블루 `#2563eb` (Rausch 아님) | `app/globals.css:25-29` |
| `next.config.ts`(transpilePackages) + `next.config.mjs`(reactStrictMode) **두 파일 공존** | `next.config.ts:8-18`, `next.config.mjs:3-5` |
| 두 config 어디에도 rewrites/redirects 없음 → `/` 의미는 순수 파일 기반 | 위 두 파일 전수 확인 |
| Footer 컴포넌트는 어디에도 없음 (grep 0건) | `components/`·`app/` 전수 grep 결과 0 |
| 빌드 스크립트: `typecheck`=`tsc --noEmit`, `build`=`next build`, `dev`=`next dev` | `package.json:6-9` |
| 금지 문구·고지 카피 단일 출처 | `lib/copy/banned-phrases.ts`, `lib/copy/disclosures.ts` |

### UNKNOWN (구현 단계 확인 필요)
- **두 `next.config` 파일 공존**: Next.js는 둘을 **병합하지 않고 하나만 선택**한다. 어느 파일이 실제 로드되는지 UNKNOWN. `next.config.ts`만 로드되면 `reactStrictMode`가, `.mjs`만 로드되면 `transpilePackages`(GGUI 빌드 의존)가 누락된다. 빌드는 통과하지만 **잠재 함정** → 본 SPEC 착수 전 진단 권고(§9 리스크).
- `/trips`(slug 없는 인덱스) 직접 진입 동작 — 매칭 page 부재로 추정 404 (rewrites 없음 확인했으므로 404 확정에 가까움, 단 런타임 미실측).
- 로그인 착지 end-to-end 실측은 OAuth/Supabase 실환경(키 게이트)에서만 가능 — 본 SPEC은 정적 코드 추적.
- `/api/rsvp`·`/api/booking-progress`의 HTTP 메서드/스키마 미확인 (본 작업과 무관).

---

## 2. Task1(디자인)과의 파일 충돌 지점 + 구현 순서 권고

### 2-1. 충돌 파일 (두 작업이 같은 파일을 만진다)

| 파일 | 본 SPEC(구조)이 하는 일 | Task1(디자인)이 하는 일 | 충돌 성격 |
|---|---|---|---|
| `app/page.tsx` | `"/"` 의미 재정의 (별칭 해제 또는 메인 신설) — **구조/라우팅** | Airbnb 룩으로 재단장되는 화면의 진입점 — **시각** | **HIGH**: 동일 파일 동시 재작성. 한쪽이 다른 쪽을 덮어쓸 위험 |
| `components/AppTopNav.tsx` | 깨진 탭 정리·"이벤트 등록하기" 정비·layout 승격 — **구조** | Rausch 액센트·타입 절제·로고 워드마크 — **시각** | **HIGH**: 동일 컴포넌트. 마크업 구조 변경 + 클래스 변경이 겹침 |
| `app/layout.tsx` | 전역 셸(네비+푸터) 끌어올리기 — **구조** | 토큰은 globals/tailwind에 있어 layout 자체 시각 변경은 적음 | **LOW**: 본 SPEC이 주로 만짐 |
| `app/globals.css` / `tailwind.config.ts` | 본 SPEC은 토큰 미변경 | Rausch hue·radius 32px·단일 그림자 토큰 — **시각 전용** | **NONE**: Task1 단독 영역 (본 SPEC은 읽기만) |
| `components/discover/TripCard.tsx`, `components/ui/Button|Card|Badge` | 본 SPEC 미변경 | 재스타일 핵심 표적 | **NONE**: Task1 단독 |

### 2-2. 구현 순서 권고 — **디자인 토큰 먼저(Task1) → 구조 나중(본 SPEC)**

**권고: 디자인 토큰 레이어를 먼저 확정한다.** 근거:

| 결정 | 근거 |
|---|---|
| **토큰 먼저** | `globals.css`/`tailwind.config.ts`의 토큰 변경은 마크업을 안 건드리고 전역 전파(survey "token-level restyle propagates to ALL components without touching markup"). 본 SPEC이 새로 만드는 메인 페이지·layout 셸·정비된 AppTopNav가 처음부터 Rausch 토큰 위에서 그려지므로 **재작업(블루로 짠 뒤 빨강으로 재교체) 0회** |
| **구조를 토큰 뒤에** | `app/page.tsx`·`AppTopNav.tsx` 마크업 구조 변경(HIGH 충돌 2개)은 토큰이 고정된 뒤 1회만 수행. 토큰이 흔들리는 상태에서 마크업을 짜면 색·radius·shadow 클래스를 두 번 손봐야 함 |
| **HIGH 충돌 2파일은 직렬화** | `app/page.tsx`·`AppTopNav.tsx`는 두 작업이 동시 편집 금지. **Task1이 시각 패스 → 본 SPEC이 구조 패스** 순서로 같은 파일을 한 번씩만 만진다. git이 없으므로(§8) 병렬 편집 시 머지 불가 |

> 단, 토큰 레이어(globals/tailwind)와 본 SPEC의 layout 셸 신설(`app/layout.tsx`, 신규 `components/AppShell` 류)은 **충돌 없는 독립 영역**이므로 병렬 가능. 충돌은 오직 `app/page.tsx`·`AppTopNav.tsx` 두 파일에 한정된다.

### 2-3. 예외 — 구조 먼저가 정당한 경우
PRD §11-Q1/Q4(메인에 무엇을 담나, /discover와의 관계)가 미결이면 메인 페이지 **레이아웃 골격**조차 못 짠다. 이 결정들은 **Task1·본 SPEC 어느 쪽보다 먼저** Vivi가 내려야 하는 선행 게이트다(§7).

---

## 3. Phase 1 — 메인/홈 페이지 신설 또는 `app/page.tsx` 재구성

### 3-1. 목표
`"/"`를 Discover 별칭(`app/page.tsx:7`)에서 **제품의 정문(메인 페이지)** 으로 승격한다. 로그인 여부와 무관하게 처음 보는 화면.

### 3-2. 선행 게이트 (구현 전 Vivi 결정 필수 — §7로 분리)
- **Q4**: `"/"`와 `/discover`의 관계 — 별칭 유지(a) / 큐레이션 허브 신설 + 별칭 해제(b) / 합쳐 단일화(c). 이 결정이 아래 구현 분기를 가른다.

### 3-3. 구현 분기 (Q4 결정에 따라 택1)

**분기 A — 메인 = 새 Discover (별칭 구조 유지)**
- `app/page.tsx`는 그대로 `app/discover/page.tsx` 재노출 유지.
- `app/discover/page.tsx`를 Airbnb 룩 + 메인 정문 카피로 재단장(Task1과 협업).
- 변경 파일: `app/discover/page.tsx`(시각·카피), `app/page.tsx` 무변경.
- 장점: 최소 변경, 단일 출처 유지. 단점: "메인"과 "탐색"이 같은 화면.

**분기 B — 메인 신설 + /discover 별칭 해제**
- `app/page.tsx`를 재노출 한 줄에서 **독립 서버 컴포넌트**로 재작성(메인 = 큐레이션/추천 허브 + Discover 진입 카드).
- `/discover`는 기존 전체 탐색 피드로 분리 존속.
- 변경 파일: `app/page.tsx`(전면 재작성), `app/discover/page.tsx`(존속, 시각만 Task1).
- 장점: 정문/탐색 역할 분리. 단점: net-new 화면 설계, 중복 컴포넌트 census 필요.

**분기 C — 메인과 Discover 단일화 (/discover 폐기)**
- `app/page.tsx`를 독립 메인으로, `app/discover/` 디렉토리 제거 또는 `/`로 redirect.
- 미들웨어 matcher·기존 `/discover` 링크(AppTopNav 3탭·discover 하단 링크 등) 전수 정리 필요.
- 변경 파일 범위 가장 큼. 권고하지 않음(별칭 해제 부담 + 링크 census).

### 3-4. NOT-a-merchant 불변식 (모든 분기 공통)
- 결제·Reserve·카트·일괄결제·큰 가격표 상품 카드 0건.
- "N명 참여의향"이 "N명 예약"으로 오인되지 않게.
- 금지 문구 0건 — `lib/copy/banned-phrases.ts` 기준 lint 통과.
- 외부 판매처는 `/go/[product_link_id]` 추적 후 302로만.

### 3-5. Phase 1 검증
- `npm run typecheck` (tsc --noEmit) 통과.
- `npm run build` (next build) 통과 — 단, 선행으로 §9 next.config 공존 리스크 진단.
- 라우팅 E2E: `/` 진입 시 메인 렌더 확인. 분기 B/C면 `/discover` 동작도 확인.
- 시각 회귀: 블루 잔재 없음(Task1 선행 시), DisclosureBanner·고지 링크 유지.

---

## 4. Phase 2 — 로그인 후 착지점 변경

### 4-1. 목표
명시 next 없을 때 `/host/create` 직행을 폐기하고 **메인으로 착지**. 딥링크(보호 경로 직접 진입)는 보존.

### 4-2. 단일 변경 지점 + 전파 구조 (코드 추적 결과)
**`lib/auth/safeNext.ts:4`의 `DEFAULT_NEXT`를 `/host/create` → 메인 경로(`"/"` 또는 Q4 결정 경로)로 바꾸면, 아래 모든 진입 경로가 한 번에 메인 착지로 수렴한다:**

| 진입 경로 | 현재 동작 | `DEFAULT_NEXT` 교체 후 |
|---|---|---|
| `/login` 직접 진입(next 없음) | `app/login/page.tsx:19` `safeNextPath(next)` → `/host/create` | → 메인 |
| OAuth 콜백(next 없음) | `app/auth/callback/route.ts:8` `safeNextPath(...)` → `/host/create` | → 메인 |
| 이미 인증된 유저가 `/login` 재방문 | `app/login/page.tsx:21` `redirect(nextPath)` → `/host/create` | → 메인 |

### 4-3. `requireHostAuthContext` 영향 — **변경 불필요**
- `lib/auth/host.ts:34-38`은 호출부가 넘긴 `nextPath`로 `/login?next=`를 만든다. **자체 하드코딩 기본값이 없다.**
- 호스트 보호 페이지(host/create 등)가 `requireHostAuthContext("/host/...")`를 호출하면 그 깊은 경로가 next로 박힌다 → 로그인 후 정확히 그 경로 복귀(딥링크 보존). **이 동작은 의도된 것이므로 유지**.

### 4-4. `middleware` 영향 — **변경 불필요**
- `middleware.ts:19-23`은 보호 경로(`/host/*`) 직접 진입 시 `/login?next={pathname+search}`로 보낸다. 여기 next는 **원래 노린 경로**이지 `DEFAULT_NEXT`가 아니다.
- 따라서 `DEFAULT_NEXT` 교체가 미들웨어 딥링크 동작에 영향 없음. 보호 프리픽스(`/host`)도 그대로.

### 4-5. AppTopNav 로그인 버튼 정리 (Phase 3과 겹침)
- `components/AppTopNav.tsx:73`의 `/login?next=/host/create`는 "로그인하면 곧 호스트" 인상을 준다.
- **선택**: (a) `/login`(next 미지정 → `DEFAULT_NEXT`=메인으로 수렴) 또는 (b) `/login?next=/`(명시 메인). 둘 다 메인 착지로 동일 결과.
- 이 편집은 Phase 3(AppTopNav 정비)에서 함께 처리(같은 파일 1회 편집 원칙).

### 4-6. safeNext 가드 보존 (회귀 금지)
- `safeNextPath`의 open-redirect 가드(`!startsWith("/")`, `//`, `/\\` 차단 — `lib/auth/safeNext.ts:7-13`)는 **그대로 유지**. 기본값만 교체.

### 4-7. Phase 2 검증
- `npm run typecheck` 통과.
- 정적 코드 검증: `safeNext.ts`의 `DEFAULT_NEXT`가 메인 경로, 콜백·로그인 페이지가 그 값을 참조.
- 라우팅 E2E(정적 추적): `/login`(next 없음) → 메인, `/login?next=/host/events/abc` → 그 경로 복귀(딥링크).
- **실측 한계 명시**: OAuth 실착지는 Supabase 키 게이트 — end-to-end는 후속 실환경 검증으로 이월(PRD §10-3).

---

## 5. Phase 3 — AppTopNav "이벤트 등록하기" 진입 정비

### 5-1. 목표
이미 존재하는 `/host/create` 링크(`AppTopNav.tsx:45-52`, 현 label "이벤트 만들기")를 **네비의 정식 한 항목**으로 정비하고, 깨진 네비를 정리한다.

### 5-2. 현 깨진 부분 (정비 대상)
| 문제 | 근거 | 정비 방향 |
|---|---|---|
| 3탭 전부 `/discover` 동일 링크 | `AppTopNav.tsx:10-14` | 실제 라우트로 분기 or 미구현 탭 제거/placeholder 명시 (PRD §11-Q5 결정 의존) |
| `calendar` 키가 active union에 없어 강조 불가 | `AppTopNav.tsx:7,12` | active union에 추가하거나 `calendar` 탭 자체를 보류(캘린더 기능은 비목표 — PRD §4-2) |
| `GMT+9`·`⌕`·`♢` 비기능 장식 | `AppTopNav.tsx:42-44,53-58` | 제거 or 실기능화 (PRD §11-Q5) |
| "이벤트 만들기" label | `AppTopNav.tsx:51` | PRD 용어 "이벤트 등록하기"로 통일 검토 (PRD §4-1 #3, §6-4) |

### 5-3. 라벨 통일 주의
- PRD는 "이벤트 등록하기"(§4-1 #3, §6-4)를 쓰고, 현 코드는 "이벤트 만들기"(`AppTopNav.tsx:51`), host/create 페이지 헤더도 "이벤트 만들기"(`app/host/create/page.tsx:26`).
- 용어 통일 시 **Grep 전수 검색**으로 잔여물 정리(HR 룰 "장르 전환·rename 후 Grep 전수"). 대상: AppTopNav 라벨, host/create 헤더, metadata title(`app/host/create/page.tsx:13`).
- **결정 필요**: "등록하기"로 통일 vs "만들기" 유지 (PRD §11-Q5 범위). 통일 안 하면 라우팅엔 영향 없으나 용어 불일치 잔존.

### 5-4. 미인증 등록 시도 동선 (유지)
- 미인증 상태 `이벤트 등록하기` 클릭 → `/login?next=/host/create`(딥링크 보존) → 로그인 후 생성 화면 복귀.
- 이 동선은 `AppTopNav.tsx:46`의 `/host/create` 링크 + 미들웨어 `/host` 보호(`middleware.ts:4`)로 이미 성립. **별도 신규 로직 불필요.**

### 5-5. Phase 3 검증
- `npm run typecheck` 통과 (active union 타입 변경 시 특히).
- `npm run build` 통과.
- 라우팅 E2E: 네비 각 항목이 의도 경로로 이동. `이벤트 등록하기` → `/host/create`(인증) / `/login?next=/host/create`(미인증).
- jsx-lint: `react/no-unescaped-entities` 회귀 없음(한글 라벨이라 위험 낮으나 변경 파일 lint 권장).

---

## 6. Phase 4 — host/create를 nav-accessed 플로우로 위치 조정

### 6-1. 목표
`/host/create`를 "로그인 직후 강제 화면"에서 **상단 네비를 통해 도달하는 하나의 기능**으로 격하. Phase 2(착지 변경) + Phase 3(네비 정비)의 자연스러운 귀결.

### 6-2. 핵심 — 생성 플로우 자체는 보존
- `host/create`(폼 + GGUI 에이전트 패널) → `host/preview/[draftId]`(발행 전 미리보기, 승인 게이트) → `host/events/[draftId]`(호스트 대시보드, 신청자 승인/거절) 체인 **변경 없음**.
- 미들웨어 `/host` 보호(`middleware.ts:4`) **유지**.
- GGUI 에이전트 패널의 화이트 미니멀 톤 유지(GGUI 다크 테마 미사용 — 현 정책).

### 6-3. 전역 셸 도입 — host/create의 AppTopNav 중복 제거
- 현재 AppTopNav는 host/create·host/preview·e/[slug] 3페이지가 **개별 import**(`app/host/create/page.tsx:23` 등).
- Phase 1에서 전역 셸(layout 네비)을 도입하면 이 3페이지의 개별 `<AppTopNav .../>` 호출은 **중복**이 된다.
- **정비**: layout 셸 도입 시 3페이지의 개별 AppTopNav 렌더를 제거하고, layout이 단일 네비를 그린다. 단 `active` prop(현 페이지 강조)을 layout 레벨에서 어떻게 결정할지 설계 필요(pathname 기반 또는 페이지별 prop 전달).
- **주의**: layout이 네비를 그리려면 `user`(HostAuthContext)를 layout에서 조회해야 함 → `getHostAuthContext()`를 layout async 컴포넌트로 끌어올림. 이는 모든 페이지에 인증 조회를 부과하므로 성능·캐싱 영향 검토(Discover는 현재 인증 미조회).

### 6-4. 전역 셸 vs 페이지별 네비 — 결정 분기
| 옵션 | 방법 | trade-off |
|---|---|---|
| **전역 layout 네비** | `app/layout.tsx`에서 AppTopNav + Footer 렌더, 3페이지 개별 import 제거 | 일관성 최상. 단 layout에서 인증 조회(모든 페이지에 비용), `active` 결정 로직 필요 |
| **세그먼트 layout** | `app/(main)/layout.tsx` 등 라우트 그룹별 셸 | 공개/호스트 영역 분리 가능. 단 디렉토리 재구성 부담 |
| **현 페이지별 유지 + 메인에만 추가** | 메인·trips·category·login에 AppTopNav 추가 import | 변경 최소. 단 산발 구조 유지(PRD §3-2 문제 미해결) |

PRD §4-1 #4는 "전역 셸을 layout 레벨로"를 목표로 명시 → **전역 layout 네비 권고**. 단 인증 조회 비용·`active` 결정은 구현 시 설계.

### 6-5. Footer (net-new)
- Footer 컴포넌트는 현재 **존재하지 않음**(grep 0건 확인). 도입 시 net-new.
- 고지 의무는 현재 DisclosureBanner 인라인으로 충족(`app/discover/page.tsx:137`). Footer 도입 시 `/disclosure` 정책 링크 배치 정리(PRD §6-3, §11-Q5).

### 6-6. Phase 4 검증
- `npm run typecheck` 통과.
- `npm run build` 통과.
- 라우팅 E2E: 메인 → 네비 `이벤트 등록하기` → `/host/create` 자발 진입. 로그인 직후 강제 `/host/create` 착지 0건.
- 중복 네비 제거 확인: host/create·host/preview·e/[slug]에 네비가 **한 번만** 렌더(layout 셸 도입 시).
- NOT-a-merchant lint: `lib/copy/banned-phrases.ts` 기준 0건.

---

## 7. 선행 게이트 — Vivi 결정 필요 (구현 착수 전)

> 코드/문서로 확정 불가한 **제품 결정**. 미결 시 Phase 1·4 골격을 못 짠다. PRD §11에서 이관.

| ID | 질문 | 영향 Phase | 비고 |
|---|---|---|---|
| **Q4** | `"/"`와 `/discover` 관계 — 별칭 유지(A)/허브 신설(B)/단일화(C) | Phase 1 | §3-3 분기 결정. **최우선** |
| **Q2** | 로그인 후 착지 = 메인(a) / 개인 대시보드(b) / 메인+요약스트립(c) | Phase 2 | (b)는 net-new 대시보드(범위 확장). PRD §4-2는 (b) 비목표 → 기본 (a) |
| **Q1** | 메인에 담을 블록·순서 (피드/추천/검색바 조합) | Phase 1 | 메인 골격 |
| **Q5** | 네비 항목 확정 (3탭 실라우트화·캘린더 placeholder·장식 제거·라벨 "등록하기" 통일·Footer 링크) | Phase 3·4 | §5-2, §5-3, §6-5 |
| **Q3** | 워드마크/로고 (텍스트 vs 이미지, Rausch 적용) | Phase 3(Task1 겹침) | 로고 에셋 부재 |

---

## 8. git 부재 → 단계별 스냅샷 권고

> repo에 git이 없다(`Is directory a git repo: No`). 각 Phase는 되돌릴 수 없는 직접 편집이므로 스냅샷 필수.

- 각 Phase **착수 직전** 변경 대상 파일을 타임스탬프 백업: 예 `cp app/page.tsx app/page.tsx.bak-20260531_phase1`. 또는 디렉토리 단위 `cp -r app components ~/ourrealtrip-snapshots/YYYYMMDD_HHMM_phaseN/`.
- **HIGH 충돌 2파일**(`app/page.tsx`, `components/AppTopNav.tsx`)은 Task1↔본 SPEC 패스 전환 시점마다 스냅샷.
- 각 Phase 검증(typecheck+build+E2E) 통과 후 다음 Phase 진입 — 실패 시 스냅샷 롤백.
- 가능하면 **본 작업 착수 전 `git init` + 초기 커밋**을 Vivi에게 제안(스냅샷보다 안전). git push는 비범위(자율 금지).

---

## 9. 리스크

| 리스크 | 영향 | 완화 |
|---|---|---|
| **두 `next.config` 공존**(`.ts`+`.mjs`) — Next는 하나만 로드, 병합 안 함 | `.mjs`만 로드되면 `transpilePackages` 누락 → GGUI(`@ggui-ai/*`) 빌드 깨질 수 있음. `.ts`만이면 `reactStrictMode` 누락 | **착수 전 진단**: 어느 파일이 로드되는지 확인 후 단일 파일로 통합(`reactStrictMode`+`transpilePackages` 병합). 본 SPEC 범위 밖이나 build 검증 전제 조건 |
| **layout에서 인증 조회** 도입(전역 셸) | Discover 등 공개 페이지에 `getHostAuthContext()` 비용 부과, 캐싱·렌더 영향 | 인증 조회를 클라이언트 경계로 미루거나, 세그먼트 layout으로 호스트 영역만 인증 |
| **HIGH 충돌 2파일 동시 편집** | Task1·본 SPEC 병렬 시 머지 불가(git 없음) | §2-2 직렬화: Task1 시각 패스 → 본 SPEC 구조 패스. 파일당 1회씩 |
| **`DEFAULT_NEXT` 교체가 호스트 워크플로우 깨뜨림** | 호스트가 로그인 후 메인 착지 → create까지 클릭 1회 추가 | 의도된 변경(PRD §3-1). 딥링크는 보존되므로 호스트가 보호 경로 노리면 그대로 복귀 |
| **라벨 rename 잔여물**("만들기"↔"등록하기") | 용어 불일치 | Grep 전수 검색 후 scoped edit (replace_all 금물 — 섹션별) |
| **블루 잔재**(focus ring `rgba(37,99,235,...)` 등) | Rausch 채택 후 블루 magic literal 잔존 | Task1 영역이나 본 SPEC 검증 시 cross-check(PRD §10-2) |
| **OAuth 착지 실측 불가**(키 게이트) | Phase 2 end-to-end 미검증 | 정적 코드 추적으로 1차 검증, 실환경 검증 후속 이월 명시 |
| **분기 C(단일화) 채택 시 링크 census 누락** | `/discover` 링크 잔존 → 404 | 채택 시 `/discover` 전수 grep(AppTopNav 3탭·discover 하단 링크·미들웨어 matcher) |
| **타인 산출물 영향**(공용 토큰·전역 셸) | 자기확증 편향 | 구현 완료 후 `code-reviewer`/`verifier` 분리 패스(PRD §10-3, HR 룰) |

---

## 10. 검증 매트릭스 (Phase × 명령)

| Phase | typecheck | build | 라우팅 E2E | 추가 |
|---|---|---|---|---|
| 1 | ✓ | ✓(+next.config 진단) | `/` 메인 렌더, 분기 B/C면 `/discover` | DisclosureBanner·고지 링크 유지, 금지문구 0 |
| 2 | ✓ | — | `/login`(next없음)→메인, 딥링크 복귀 | safeNext 가드 보존, OAuth 실측 이월 |
| 3 | ✓(active union) | ✓ | 네비 각 항목 의도 경로 | jsx-lint, 라벨 통일 grep |
| 4 | ✓ | ✓ | 강제 create 착지 0, 자발 진입 | 중복 네비 제거, 금지문구 0 |

검증 명령: `npm run typecheck` / `npm run build` / `npm run dev`(E2E 수동). 각 Phase 통과 후 다음 진입.
