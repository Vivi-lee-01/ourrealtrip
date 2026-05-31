# OurRealTrip / 아워리얼트립 — Architecture (Next.js App Router)

> 이 문서는 `PRD.md`(단일 진실 원천)에서 도출된 구현 아키텍처다.
> 충돌 시 PRD가 우선이며, 본 문서는 PRD를 코드 구조로 내린 것이다.
> 대상 단계: **Phase 1 (Static / Manual MVP)**. Phase 2~4(API/MCP·AI MD·Performance Learning) 진입점은
> 확장 가능한 형태로 폴더를 비워두되, MVP 구현은 manual flow에 집중한다.

---

## 0. 스택 요약 (PRD 22절 권장 스택)

| 영역 | 선택 |
|------|------|
| Framework | Next.js App Router (RSC 기본, Server Actions 사용) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS (모바일 우선) |
| DB | Supabase PostgreSQL |
| Auth | Supabase Auth — **host/admin만**. 참여자는 로그인 없는 익명 쿠키 세션 |
| Deploy | Vercel |
| Click Tracking | `/go/[product_link_id]` redirect 기반 |

핵심 설계 결정 3개:
1. **공개 읽기/익명 쓰기**는 RLS + anon client로, **host 관리 쓰기**는 인증 세션(host) + RLS로, **service-role**은 redirect insert 같은 RLS 우회 서버 경로에만 제한적으로 쓴다.
2. 참여자는 절대 로그인하지 않는다. 식별은 `participant_session_id` HttpOnly 쿠키뿐이며 이름/이메일은 수집하지 않는다(확정 결정 4).
3. 라우트 트리는 PRD 12절 MVP 화면과 1:1로 매핑한다. 라우트가 화면보다 많거나 적으면 안 된다.

---

## 1. 전체 폴더 트리

```
ourrealtrip/
├── app/                                  # Next.js App Router 루트 (라우트 = PRD 12절 MVP 화면과 1:1)
│   ├── layout.tsx                        # 루트 레이아웃: <html lang="ko">, 모바일 viewport, 전역 폰트, DisclosureBanner 마운트 슬롯
│   ├── globals.css                       # Tailwind base/components/utilities + 디자인 토큰
│   ├── page.tsx                          # "/" 랜딩 + 공개(visibility=public) proposal 리스트
│   │
│   ├── trips/
│   │   └── [slug]/
│   │       ├── page.tsx                  # "/trips/[slug]" 중심 화면 (Trip Proposal Detail). unlisted slug 접근
│   │       ├── opengraph-image.tsx       # 공유용 OG 이미지 (공식 오인/패키지 문구 금지 — 카피 검증 거침)
│   │       └── respond/
│   │           └── page.tsx              # "/trips/[slug]/respond" RSVP 전용 라우트(노스크립트 폴백/직링크)
│   │                                     #   1차 UX는 detail 안의 RsvpPanel 모달, 이 라우트는 동일 server action 재사용 폴백
│   │
│   ├── go/
│   │   └── [product_link_id]/
│   │       └── route.ts                  # "/go/[id]" Route Handler: click_event INSERT 후 302 redirect (UI 없음)
│   │
│   ├── disclosure/
│   │   └── page.tsx                      # "/disclosure" 고지/정책 (필수 고지 6종 정식 페이지)
│   │
│   ├── host/                             # host/admin 영역 — Supabase Auth 보호 (확정 결정 1)
│   │   ├── layout.tsx                    # host 세션 가드: 미인증 시 로그인으로. host용 네비
│   │   ├── page.tsx                      # "/host" dashboard (의도 반응 태그 포함, PRD 11절)
│   │   ├── login/
│   │   │   └── page.tsx                  # host 로그인 (Supabase Auth). 참여자에겐 노출 안 함
│   │   └── trips/
│   │       ├── new/
│   │       │   └── page.tsx              # "/host/trips/new" proposal 생성 (의도 질문 4개, PRD 10절)
│   │       └── [proposal_id]/
│   │           └── page.tsx              # "/host/trips/[proposal_id]" proposal 관리·상태 변경·option/link 관리
│   │
│   └── actions/                          # Server Actions (mutation 진입점, route segment 아님 — 호출용 모듈)
│       ├── rsvp.ts                       # interest/vote/question INSERT (anon, 익명 세션 쿠키)
│       ├── proposal.ts                   # host: proposal CRUD + 상태 전환 (인증 필요)
│       ├── travel-option.ts             # host: TravelOption CRUD
│       └── product-link.ts              # host: ProductLink CRUD (manual URL + nullable myrealtrip_product_id)
│
├── app/api/                              # Agent/API 접근 표면 — UI와 동일한 도메인 action을 schema 기반으로 노출
│   ├── agent/
│   │   ├── proposal-drafts/route.ts      # POST create_proposal_draft: 에이전트/호스트가 draft 생성 (발행 아님)
│   │   ├── activity-programs/route.ts    # POST compose_activity_program: MyRealTrip TNA 기반 3-액티비티 프로그램 초안
│   │   ├── participant-questions/route.ts # POST generate_participant_questions: RSVP/투표 질문 초안
│   │   └── interest-summary/route.ts     # GET summarize_interest_signals: 참여 신호 요약
│   └── myrealtrip/
│       └── activities/route.ts           # GET/POST search_myrealtrip_activities: 서버 전용 API 키로 TNA 검색
│
├── components/                           # UI 컴포넌트 (서버/클라이언트 명시)
│   ├── proposal/
│   │   ├── ProposalHero.tsx              # Hero: 제목/host/community/컨셉/날짜/가격대/상태/공유 CTA
│   │   ├── HostLedTrust.tsx              # Host-led Trust: 누가 왜 제안하는지, trust_note, 과거 활동
│   │   ├── WhyThisTrip.tsx               # Why This Trip + '우리 커뮤니티에 왜 의미 있는가'(의도 4필드 번역 카피)
│   │   ├── RsvpPanel.tsx                 # (client) 관심/날짜/가격/투표/질문 패널 — 모달 또는 inline
│   │   ├── TravelOptionCard.tsx          # A/B/C 운영안 카드 (community_intent_fit·relationship_depth 등 의도 차원)
│   │   ├── TravelOptionSet.tsx           # TravelOptionCard 묶음 컨테이너
│   │   ├── ProductLinkSection.tsx        # booking_open 이후 flight/stay/tna **독립 CTA** 섹션 (단일 CTA 불가능 구조)
│   │   ├── ProductLinkCard.tsx           # 개별 상품 카드: source/title/price_hint/caution/checked_at + /go 링크
│   │   ├── DecisionHelpers.tsx           # 가격대/일정난이도/리스크/추천·비추천/checked_at
│   │   └── ShareCta.tsx                  # 커뮤니티 공유 문안 (공식·패키지 오인 문구 검증 통과한 카피)
│   │
│   ├── disclosure/
│   │   ├── DisclosureBanner.tsx          # 전역 하단/상품섹션용 고지 배너 (필수 고지 6종 중 핵심 노출)
│   │   └── DisclosureList.tsx            # /disclosure 페이지 본문: 고지 6종 전체 렌더 (lib/copy 단일 출처)
│   │
│   ├── host/
│   │   ├── HostDashboard.tsx             # 기본 지표 + 의도 반응 태그/집계 컨테이너
│   │   ├── IntentResonanceChart.tsx      # intent_resonance/objection_type 태그·막대 시각화
│   │   ├── ProposalStatusBadge.tsx       # 8절 상태 모델 배지 (draft~archived)
│   │   ├── IntentQuestionFields.tsx      # 생성 폼의 의도 질문 4개 (번역 카피, skip 가능)
│   │   ├── TravelOptionEditor.tsx        # option 입력/수정 (의도 차원 필드 포함)
│   │   └── ProductLinkEditor.tsx         # product link 입력 (manual URL, type별 독립 추가)
│   │
│   └── ui/                               # 원자 단위 공통 UI (디자인 시스템)
│       ├── Button.tsx                    # CTA 기본 단위 — "전체 예약" variant 자체가 존재하지 않음
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Modal.tsx                     # (client) RsvpPanel 모달 셸
│       ├── Field.tsx                     # 폼 필드 래퍼
│       └── EmptyState.tsx
│
├── lib/                                  # 비-UI 로직 (데이터 액세스·도메인·유틸)
│   ├── supabase/
│   │   ├── server.ts                     # 인증된 host용 server client (쿠키 세션 → RLS host 컨텍스트)
│   │   ├── anon.ts                       # 공개 읽기/익명 insert용 server client (anon key, RLS 적용)
│   │   ├── admin.ts                      # service-role client (RLS 우회 — /go redirect insert 전용, 서버에서만)
│   │   ├── client.ts                     # (client) 브라우저용 anon client (host 로그인 등 제한적)
│   │   └── types.ts                      # Supabase 생성 타입 re-export + 도메인 별칭
│   │
│   ├── data/                             # 데이터 액세스 레이어 (쿼리 함수 모음 — 컴포넌트는 여기만 호출)
│   │   ├── proposals.ts                  # getPublicProposals / getProposalBySlug / host CRUD
│   │   ├── travel-options.ts            # option 조회/CRUD
│   │   ├── product-links.ts             # link 조회/CRUD + getProductLinkForRedirect
│   │   ├── interest-signals.ts          # 익명 signal insert/집계
│   │   ├── click-events.ts              # click_event insert (redirect 경로)
│   │   └── performance.ts               # PerformanceSnapshot 집계 (의도 태그 롤업 포함)
│   │
│   ├── session/
│   │   └── participant.ts                # participant_session_id 쿠키 발급/재사용 헬퍼
│   │
│   ├── tracking/
│   │   └── click.ts                      # UTM/referrer/device/browser 파싱 → ClickEvent 페이로드 빌더
│   │
│   ├── copy/
│   │   ├── disclosures.ts                # 필수 고지 6종 문자열 단일 출처 (배너·페이지·OG가 공유)
│   │   ├── banned-phrases.ts            # 금지 문구 목록 + assert 헬퍼 (빌드/테스트 가드)
│   │   └── intent-labels.ts             # 내부 전략어 → 사용자 번역 카피 매핑 (철학어 노출 차단)
│   │
│   ├── domain/
│   │   ├── status.ts                     # ProposalStatus enum + 전이 규칙 (8절)
│   │   ├── product-type.ts              # flight/stay/tna enum + 라벨 (독립 CTA 단위)
│   │   └── enums.ts                      # relationship_depth/objection_type 등 공통 enum
│   │
│   └── utils/
│       ├── cn.ts                         # Tailwind className 병합
│       └── env.ts                        # 환경변수 로딩·검증 (값 없으면 throw, 키 누락 조기 감지)
│
├── middleware.ts                         # 익명 세션 쿠키 보장 + host 라우트 보호 (Edge)
│
├── supabase/                             # Supabase 프로젝트 자산 (DB as code)
│   ├── migrations/                       # SQL 마이그레이션 (엔티티 9-1~9-8 테이블 + RLS 정책)
│   │   ├── 0001_core_entities.sql        # host/community/trip_proposal/travel_option/product_link
│   │   ├── 0002_signals_events.sql       # interest_signal/click_event/performance_snapshot
│   │   └── 0003_rls_policies.sql         # 공개 읽기·익명 insert·host write RLS
│   ├── seed.sql                          # 데모 커뮤니티 4건 seed (확정 결정 2)
│   └── config.toml                       # Supabase 로컬 설정
│
├── public/                               # 정적 자산 (아이콘·OG 폴백 등)
├── docs/
│   └── ARCHITECTURE.md                   # 본 문서
├── PRD.md                                # 단일 진실 원천
├── .env.local                            # 로컬 비밀 (git ignore) — 값 없는 .env.example만 커밋
├── .env.example                          # 환경변수 키 템플릿 (값 없음, 공개)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 디렉토리 역할 요약

| 디렉토리 | 역할 |
|----------|------|
| `app/` | 라우트(RSC) + Route Handler(`/go`) + Server Actions. 화면은 PRD 12절과 1:1. |
| `app/actions/` | mutation 진입점. 컴포넌트는 직접 DB를 쓰지 않고 여기 server action만 호출. |
| `components/proposal/` | 중심 화면(`/trips/[slug]`)의 8개 섹션 컴포넌트. |
| `components/host/` | host dashboard·생성/관리 폼. 인증 영역 전용. |
| `components/disclosure/` | 고지 배너·고지 페이지. 문구는 `lib/copy/disclosures.ts` 단일 출처. |
| `components/ui/` | 원자 UI. "전체 예약" 같은 금지 CTA variant 자체가 없음. |
| `lib/supabase/` | 4종 client 분리(server/anon/admin/client). 권한 경계의 물리적 분리 지점. |
| `lib/data/` | 데이터 액세스 레이어. SQL/쿼리는 전부 여기로 격리. |
| `lib/session/` | 익명 participant 세션 쿠키 발급·재사용. |
| `lib/tracking/` | 클릭 추적 페이로드(UTM/referrer/device) 빌더. |
| `lib/copy/` | 고지 6종·금지 문구·번역 카피의 단일 출처(negative spec 강제 지점). |
| `lib/domain/` | enum·상태 전이 규칙. |
| `supabase/` | 마이그레이션·seed·RLS — DB as code. |
| `middleware.ts` | 익명 세션 쿠키 보장 + host 라우트 보호. |

---

## 2. 라우트 트리 ↔ MVP 화면 매핑 (PRD 12절과 정확 일치)

| # | 라우트 | 파일 | PRD 화면 | 데이터 경로 | 비고 |
|---|--------|------|----------|-------------|------|
| 1 | `/` | `app/page.tsx` | landing + 공개 proposal 리스트 | anon read `getPublicProposals()` | `visibility=public`만 노출 |
| 2 | `/trips/[slug]` | `app/trips/[slug]/page.tsx` | Trip Proposal Detail (**중심 화면**) | anon read `getProposalBySlug()` | unlisted slug 접근 키 |
| 3 | `/trips/[slug]/respond` + RsvpPanel 모달 | `app/trips/[slug]/respond/page.tsx` + `RsvpPanel.tsx` | RSVP/Interest | anon insert `actions/rsvp.ts` | 모달 1차, 라우트는 폴백/직링크 |
| 4 | `/go/[product_link_id]` | `app/go/[product_link_id]/route.ts` | 클릭 기록 후 redirect | admin insert + 302 | UI 없음, Route Handler |
| 5 | `/disclosure` | `app/disclosure/page.tsx` | 고지/정책 | static (lib/copy) | 고지 6종 전체 |
| 6 | `/host` | `app/host/page.tsx` | host dashboard (의도 태그) | host read `performance.ts` | Auth 보호 |
| 7 | `/host/trips/new` | `app/host/trips/new/page.tsx` | proposal 생성 (의도 질문 4개) | host insert `actions/proposal.ts` | Auth 보호 |
| 8 | `/host/trips/[proposal_id]` | `app/host/trips/[proposal_id]/page.tsx` | proposal 관리·상태·option/link | host CRUD | Auth 보호 |
| A1 | `/api/agent/proposal-drafts` | `app/api/agent/proposal-drafts/route.ts` | agent-accessible draft 생성 | `create_proposal_draft` | draft만 허용, 발행은 승인 필요 |
| A2 | `/api/agent/activity-programs` | `app/api/agent/activity-programs/route.ts` | 3-액티비티 프로그램 조합 | `compose_activity_program` | MyRealTrip fact + LLM 추론 분리 |
| A3 | `/api/myrealtrip/activities` | `app/api/myrealtrip/activities/route.ts` | TNA 검색 프록시 | `search_myrealtrip_activities` | API key 서버 전용 |
| A4 | `/api/agent/participant-questions` | `app/api/agent/participant-questions/route.ts` | RSVP/투표 질문 생성 | `generate_participant_questions` | host 검토 전 초안 |
| A5 | `/api/agent/interest-summary` | `app/api/agent/interest-summary/route.ts` | 참여 신호 요약 | `summarize_interest_signals` | read-only |
| A6 | `/api/agent/booking-summary` | `app/api/agent/booking-summary/route.ts` | 예약 신호 퍼널 요약 + 다음 액션 추천 | `summarize_booking_signals` | read-only, 외부 발송·발행은 승인 게이트 |
| B1 | `/api/booking-progress` | `app/api/booking-progress/route.ts` | 예약 진행 자가표시(POST)·집계 조회(GET) | Booking Signal Sync (PRD 9-9) | 익명 세션, 외부검증 status 세팅 불가 |
| B2 | `/api/booking-progress/host-confirm` | `app/api/booking-progress/host-confirm/route.ts` | 호스트 수동 확인(host_confirmed_booked) | COMMERCE_MODEL 6-5 | host 인증 영역, Phase 1 선택 |

추가 보조 라우트(MVP 화면 외, 운영 필수): `/host/login`(host 인증 진입). 참여자 동선에는 일절 노출하지 않는다.

RSVP 설계 메모: PRD 12절 3번이 "modal 또는 `/trips/[slug]/respond`"이므로 **둘 다** 둔다.
- 1차 UX: `/trips/[slug]` 안의 `RsvpPanel`을 `Modal`로 띄움 (페이지 이탈 없이 관심/투표).
- 폴백: `/trips/[slug]/respond` 라우트가 동일한 `actions/rsvp.ts` server action을 재사용 (JS 미동작·딥링크 공유 대응).
- 두 진입점이 같은 server action을 쓰므로 검증/익명 세션 처리 로직이 한 곳에 모인다.

---

## 3. 데이터 액세스 레이어 (Supabase client 분리)

권한 경계를 **client 종류로 물리 분리**한다. 컴포넌트/액션은 자기 권한에 맞는 client만 import 한다.

| client | 파일 | key | 실행 위치 | 용도 | RLS |
|--------|------|-----|-----------|------|-----|
| **server (host)** | `lib/supabase/server.ts` | anon key + 쿠키 세션 | Server (host 영역) | host/admin 인증 read/write | 적용 (host 정책) |
| **anon** | `lib/supabase/anon.ts` | anon key | Server (공개 영역) | 공개 proposal read, 익명 signal insert | 적용 (public/anon 정책) |
| **admin** | `lib/supabase/admin.ts` | service-role key | Server only (`/go` 등) | RLS 우회가 필요한 시스템 insert | **우회** |
| **client** | `lib/supabase/client.ts` | anon key | Browser | host 로그인 등 제한적 브라우저 호출 | 적용 |

원칙:
- **service-role key는 서버 모듈에서만 import**되며, `lib/supabase/admin.ts` 단일 파일에 격리한다. 절대 client 컴포넌트·middleware·브라우저 번들에 들어가지 않는다.
- service-role의 유일한 정당한 사용처는 `/go/[id]` 클릭 INSERT처럼 **익명 사용자가 직접 쓰면 안 되지만 시스템이 기록해야 하는** 경로다. (anon에게 click_event insert를 직접 허용하면 위조 가능 → admin 경유)
- 공개 화면(`/`, `/trips/[slug]`)은 **항상 anon client**로 읽는다. host 데이터(미공개 draft 등)가 새지 않도록 RLS가 `visibility=public` 또는 slug 일치 조건을 강제한다.
- host 화면은 **server(host) client**로만 읽고 쓴다. RLS는 `host_id = auth.uid()` 소유 정책으로 본인 proposal만 다루게 한다.
- 컴포넌트는 SQL을 직접 쓰지 않는다. 모든 쿼리는 `lib/data/*`를 통과한다(레이어 단일화 → 테스트·캐싱·로깅 한 곳).

RLS 정책 골격(`0003_rls_policies.sql`):
- `trip_proposal`: anon select 허용 단 `visibility='public' OR slug = <요청 slug>`; host insert/update/delete는 `host_id = auth.uid()`.
- `travel_option`, `product_link`: 부모 proposal이 공개/대상 slug일 때 anon select; host write는 소유 proposal 한정.
- `interest_signal`: anon insert 허용(세션 쿠키 값 기록), select는 host(소유 proposal)만.
- `click_event`, `performance_snapshot`: anon select/insert 불가. insert는 service-role(서버), select는 host만.

---

## 4. 익명 세션 처리 (participant_session_id)

확정 결정 1·4: 참여자는 로그인하지 않으며 이름/이메일을 수집하지 않는다. 식별은 `participant_session_id` 쿠키뿐이다.

발급/재사용 전략 — **middleware 1차, server action 안전망**:

1. `middleware.ts`가 모든 참여자 라우트(`/`, `/trips/*`, `/go/*`) 요청에서 `participant_session_id` 쿠키 존재를 확인한다.
   - 없으면 `crypto.randomUUID()`로 생성해 응답에 `Set-Cookie`로 발급한다.
   - 쿠키 속성: `HttpOnly`, `Secure`(prod), `SameSite=Lax`, `Path=/`, 만료 1년. JS에서 읽을 수 없어 위조/추적 노출을 줄인다.
2. `lib/session/participant.ts`의 `getOrCreateParticipantSessionId()`가 server action/Route Handler에서 안전망 역할을 한다.
   - 요청 쿠키에 값이 있으면 그대로 사용, 없으면(=middleware 미적용 경로/경합) 새로 발급하고 set.
   - RSVP insert(`actions/rsvp.ts`)와 click insert(`/go`) 모두 이 헬퍼로 동일한 세션 값을 얻어 같은 참여자의 관심→클릭을 한 세션으로 잇는다.
3. 개인정보 미수집 원칙: 쿠키 값은 무작위 UUID이며 PII가 아니다. `InterestSignal`에는 세션 id + 선택 코멘트만 저장하고 이름/이메일 필드 자체를 두지 않는다.

요약: middleware가 "최초 1회 발급"을 보장하고, server action 헬퍼가 "쓰기 시점 재확인"으로 누락을 메운다. 두 계층이 같은 쿠키 키를 공유하므로 발급/재사용이 일관된다.

---

## 5. 클릭 추적 redirect 플로우 (`/go/[product_link_id]`)

`app/go/[product_link_id]/route.ts` (GET Route Handler, UI 없음):

```
GET /go/{product_link_id}?utm_source=...&utm_*=...
  1. params.product_link_id 검증
  2. lib/data/product-links.getProductLinkForRedirect(id)
       → source_url(필수) + mylink_url(있으면 우선) + product_type + proposal_id + option_id 조회
       → 없거나 status가 redirect 불가면 안전한 폴백(예: 해당 proposal 또는 /)로 처리
  3. lib/session/participant.getOrCreateParticipantSessionId() 로 세션 확보
  4. lib/tracking/click.buildClickEvent(request, link) 로 페이로드 구성
       - referrer:   request.headers 'referer'
       - device_type/browser: User-Agent 파싱
       - utm_*:      query string의 utm_source/medium/campaign/term/content
       - clicked_at: now()
       - proposal_id / option_id / product_link_id / product_type
       - redirect_url: 최종 이동 대상(mylink_url ?? source_url)
  5. lib/supabase/admin (service-role) 로 click_event INSERT  ← anon 위조 차단 위해 admin 경유
  6. return NextResponse.redirect(redirect_url, 302)
```

설계 포인트:
- **기록 → 302** 순서. insert 실패가 사용자 이동을 막지 않도록 insert는 best-effort(실패해도 redirect는 수행, 에러 로깅)로 처리한다.
- 302(temporary)를 쓴다(영구 캐시되어 추적을 건너뛰는 301 회피).
- redirect 대상은 항상 외부 판매처(마이리얼트립/제휴 링크). 아워리얼트립이 예약을 대행하지 않는다는 고지(필수 고지 4·6)와 정합.
- `device_type`/`browser`는 UA 기반 best-effort 분류이며 PII가 아니다.
- **Booking Signal Sync 연동(PRD 9-9·COMMERCE_MODEL 6-4)**: `/go`는 click_event INSERT에 더해 (`participant_session_id`, `product_link_id`) 키로 `BookingProgress` upsert(`status=clicked_booking_link`, `source=redirect_tracking`)를 best-effort로 수행한다. 이미 더 진행된 상태(booking_intent/self_reported_booked/host_confirmed_booked/externally_confirmed_booked)는 되돌리지 않는다. 클릭은 결제가 아니다 — `clicked_booking_link`는 의도 신호일 뿐이며 어떤 경우에도 결제완료로 승격되지 않는다.

---

## 6. 모바일 우선 Tailwind 전략

- **모바일 베이스라인 우선**: 기본 클래스는 모바일 레이아웃, `sm:`/`md:`/`lg:`로 점진 확장(데스크톱 우선 역방향 금지).
- 중심 화면 `/trips/[slug]`는 세로 단일 컬럼 스크롤이 기본. 섹션 순서는 PRD 6절(Hero → Trust → Why → RSVP → Options → ProductLinks → DecisionHelpers → Share)을 그대로 따른다.
- **RsvpPanel·ProductLinkSection은 모바일에서 sticky/하단 고정** 패턴 후보 — 단, ProductLinkSection은 flight/stay/tna가 **각각 독립 카드+CTA**라 단일 sticky "예약" 바로 합쳐지지 않도록 한다(금지 방향 방어).
- 디자인 토큰은 `tailwind.config.ts`에 정의(컬러·spacing·radius·shadow). 임의 hex 남발 대신 토큰 사용.
- `components/ui/`가 디자인 시스템 원자. 화면 컴포넌트는 ui 원자를 조합해 일관성 유지.
- 접근성: 터치 타깃 최소 44px, `Button`/`Field`에 focus-visible·aria 기본 적용.

### 핵심 공통 컴포넌트 목록

| 컴포넌트 | 위치 | 역할 (PRD 6절 섹션) |
|----------|------|---------------------|
| `ProposalHero` | `components/proposal/ProposalHero.tsx` | Hero — 제목/host/community/컨셉/날짜/가격대/상태/공유 |
| `HostLedTrust` | `components/proposal/HostLedTrust.tsx` | Host-led Trust — 누가 왜, trust_note |
| `WhyThisTrip` | `components/proposal/WhyThisTrip.tsx` | Why This Trip + 의도 4필드(번역 카피) |
| `RsvpPanel` | `components/proposal/RsvpPanel.tsx` | Interest/RSVP — 관심/날짜/가격/투표/질문 |
| `TravelOptionCard` | `components/proposal/TravelOptionCard.tsx` | Travel Option Set — A/B/C 운영안(의도 차원) |
| `TravelOptionSet` | `components/proposal/TravelOptionSet.tsx` | 옵션 카드 컨테이너 |
| `ProductLinkSection` | `components/proposal/ProductLinkSection.tsx` | Product Link — flight/stay/tna **독립 CTA** |
| `ProductLinkCard` | `components/proposal/ProductLinkCard.tsx` | 개별 상품 카드 + `/go` 링크 + checked_at |
| `DecisionHelpers` | `components/proposal/DecisionHelpers.tsx` | 가격/일정난이도/리스크/추천·비추천 |
| `ShareCta` | `components/proposal/ShareCta.tsx` | 공유 문안 |
| `DisclosureBanner` | `components/disclosure/DisclosureBanner.tsx` | 전역/상품섹션 고지 배너 |
| `HostDashboard` | `components/host/HostDashboard.tsx` | host 지표 + 의도 반응 태그 |
| `IntentResonanceChart` | `components/host/IntentResonanceChart.tsx` | 의도 반응/거절 유형 시각화 |

---

## 7. 환경변수 목록 (`.env.example` — 값은 비워둠)

> 값은 절대 커밋하지 않는다. `.env.local`은 git ignore, `.env.example`만 키 템플릿으로 공개.

| 변수 | 노출 | 용도 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | anon key (공개 읽기/익명 insert·브라우저) |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | service-role (`/go` click insert 등 RLS 우회). 절대 `NEXT_PUBLIC_` 금지 |
| `NEXT_PUBLIC_SITE_URL` | 클라이언트 | 절대 URL 생성(OG·공유 링크·redirect 폴백) |
| `SUPABASE_DB_URL` | 서버/CI | 마이그레이션·seed 적용용 직접 연결 (로컬/CI) |

`lib/utils/env.ts`가 부팅 시 필수 키 존재를 검증하고, 누락이면 명확한 에러로 조기 실패시킨다. `SUPABASE_SERVICE_ROLE_KEY`는 server-only 모듈(`lib/supabase/admin.ts`)에서만 접근해 클라이언트 번들 유입을 차단한다.

---

## 8. Negative Spec의 컴포넌트 수준 보장 (1단락)

금지 방향(공식 오인·패키지·전체 예약 CTA)은 "주의해서 작성"이 아니라 **구조적으로 불가능하게** 막는다. `ProductLinkSection`은 항상 `product_type`(flight/stay/tna)별로 `ProductLinkCard`를 **개별 렌더**하며 자식 카드마다 독립 CTA를 두므로 단일 "전체 예약" 버튼을 만들 자리 자체가 없고, 공통 `ui/Button`에는 "전체 예약"·"패키지 구매" 같은 variant가 정의되어 있지 않다. 모든 고지 문구는 `lib/copy/disclosures.ts` 단일 출처에서만 나오고 `DisclosureBanner`가 상품 섹션과 전역에 항상 마운트되어 필수 고지 6종이 노출 누락 없이 표현되며, `lib/copy/banned-phrases.ts`의 금지 문구 목록을 테스트/빌드 가드로 검사해 "공식 추천·최저가 보장·전체 예약하기·패키지 구매하기" 등이 어떤 카피·OG·메타에도 등장하면 실패시킨다. 내부 전략어는 `lib/copy/intent-labels.ts`의 번역 매핑을 거친 사용자 카피만 화면에 들어가므로 "대학 언번들링" 같은 철학어가 노출되지 않고, redirect 대상은 항상 외부 판매처 링크라 아워리얼트립이 직접 판매·예약 대행으로 오인될 구조가 생기지 않는다.

---

## 9. Phase 2~4 확장 진입점 (MVP에서는 비워둠)

PRD 21절 단계 확장을 위한 자리만 표시. Phase 1 구현 범위 밖.

- **Phase 2 (API/MCP)**: `lib/myrealtrip/`(API/MCP 클라이언트), `lib/data/product-links.ts`에 `myrealtrip_product_id` 채우는 동기화 함수 추가. manual URL 구조는 그대로 두고 fact 출처만 확장.
- **Phase 3 (AI MD)**: `lib/ai/`(제목·초대문구·option A/B/C·fit/risk 생성). API fact / LLM 추론 / host 입력 / participant signal을 출처 태그로 구분.
- **Phase 4 (Performance Learning)**: `lib/data/performance.ts` 확장 + 커뮤니티별 취향/예산/의도 패턴 학습. host dashboard 개선.
- **Booking Signal Sync 외부 검증 ingestion (PRD 9-9-3·18-5 — 현재 stub)**: `lib/myrealtrip/conversion-ingest.ts`(가칭) 자리만 표시. MyRealTrip webhook/postback/`/v1/reservations`/`/v1/revenues`가 mylink 클릭을 익명 세션의 결제완료로 귀속 가능함이 실측 검증된 후에만 어댑터를 연결해 `externally_confirmed_booked`(source=external_api, confidence=verified)로 승격한다. 검증 전에는 이 경로가 존재하지 않으므로 어떤 입력으로도 외부검증 상태에 도달할 수 없다(구조적 차단). **외부 부작용/키 사용 — Vivi 확인 필요 단계**.

---

## 10. GGUI Host AI-create Cockpit (sidecar — 본체 재구현 아님)

> 핸드오프 2026-05-30 결정 + GGUI 트랙 스펙(`docs/GGUI_COCKPIT.md` SSOT). 본 절은 아키텍처 위치만 고정한다.

- **경계**: GGUI는 전체 앱을 대체하지 않는다. 기존 Next.js 앱(`/trips/[slug]` 등 참여자-facing)은 안정 본체로 유지. GGUI는 **호스트 AI-create cockpit**으로만 붙는다.
- **위치**: `/host/ai-create` 라우트 또는 별도 sidecar 데모(`ggui/` 디렉토리, `@ggui-ai/create-agentic-app@alpha` 부트스트랩). 에이전트 프레임워크는 **OpenAI Agents SDK**, LLM은 **OpenAI(BYOK — `OPENAI_API_KEY`)**.
- **역할**: 호스트가 자연어로 말하면 생성형 UI가 동적으로 뜨고, MCP 도구를 호출해 proposal 초안을 만든다. 멀티턴 수정 후 호스트 승인 시 기존 `/host/trips/[proposal_id]`로 핸드오프.
- **MCP 도구 표면**(cockpit이 호출): 무인증 MyRealTrip MCP(`search_myrealtrip_activities`/`compose_activity_program`) + OurRealTrip 액션(`create_proposal_draft`/`generate_participant_questions`/`summarize_interest_signals`/`summarize_booking_signals`). 발행·외부공유·booking_open·제휴링크 노출은 **사람 승인 게이트**(PRD 2-C).
- **안전경계**: cockpit이 만드는 것은 draft까지. `summarize_booking_signals`는 read-only이며 외부 검증 결제완료를 만들어내지 못한다(§9 ingestion stub). 시크릿은 BYOK env(`OPENAI_API_KEY`, `MYREALTRIP_API_KEY`)로만 다루고 클라이언트 번들·로그·프롬프트에 노출 금지.
