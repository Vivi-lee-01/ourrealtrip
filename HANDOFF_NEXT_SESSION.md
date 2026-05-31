# OurRealTrip / 아워리얼트립 다음 세션 핸드오프 — 2026-05-30

---

## ⭐ 이번 세션 진행 요약 (2026-05-30, 최신 — 여기부터 읽을 것)

> 최종 목표: **아워리얼트립 프로덕트 빌딩**. 피봇 없음. 아래 그 일부로 3갈래 진행됨.
> 프로젝트 구조: `/Users/vivi/ourrealtrip/`(Next.js 본체) + 그 안 `ggui/`(호스트 AI-create cockpit, sidecar). **둘 다 아워리얼트립이다 — 별개 프로젝트 아님.**

### A. Booking Signal Sync 문서화 — ✅ 완료
- `PRD.md` 9-9: BookingProgress를 **7-state**로 확장 (9-9-1 status / 9-9-2 source·confidence / 9-9-3 외부검증 게이트). 6절 화면10·11절 dashboard·2-C agent action(`summarize_booking_signals`)·18-5 외부 전환 ingestion 안전경계 추가.
- `docs/COMMERCE_MODEL.md`: 상태 전이도 7-state, 엔티티(source/confidence/note), API 6-1 허용 status·6-5 host-confirm, 체크리스트 갱신.
- `docs/ARCHITECTURE.md`: booking 라우트(A6/B1/B2)·/go 연동·conversion-ingest stub·GGUI cockpit(10절) 반영.
- `docs/GGUI_COCKPIT.md`: 신규 — GGUI 트랙 사실관계·부트스트랩·MCP 도구표면·안전경계.

### C. Booking Signal Sync 코드 — ✅ 완료 (tsc·next build 통과, verifier 독립검수 통과)
- `lib/types.ts`: `BookingProgressStatus` 7-state(`pending`/`clicked_booking_link`/`booking_intent`/`self_reported_booked`/`host_confirmed_booked`/`externally_confirmed_booked`/`cancelled_or_refunded`) + `BookingProgressSource`/`Confidence` + 집계 타입 재정의.
- `lib/domain/booking-progress.ts`: 신규. source→confidence 규칙, `isExternallyConfirmedForbidden` 가드, `wouldDowngrade`, 라벨.
- `lib/store/local.ts`: recordBookingProgress(가드+source/confidence), getBookingProgress 7-state 집계.
- `app/api/booking-progress/route.ts`: 참여자 자가표시 허용 status 4종으로 제한.
- `app/go/[product_link_id]/route.ts`: clicked → `clicked_booking_link`(source=redirect_tracking).
- 컴포넌트(BookingProgressBar/BookingItemControls/SharedCart) 7-state 반영.
- ★ 안전경계 핵심: `externally_confirmed_booked`(외부검증 결제완료)는 자가표시·/go·호스트확인 어디서도 세팅 불가. MyRealTrip 전환 API ingestion(미연결 stub)으로만 도달. "결제완료 자동 반영" 과장 구조적 차단됨.

### B. GGUI 호스트 AI-create cockpit — ✅ 완료 (2026-05-30 후속 세션, E2E 검증)
> 상세는 `/Users/vivi/ourrealtrip/ggui/HANDOFF_GGUI.md` 참조. 요약:
- `ggui/` = `create-agentic-app@0.2.0-alpha.4` + **claude-agent-sdk 단일벤더** 스캐폴드.
- 구동: `cd /Users/vivi/ourrealtrip/ggui && pnpm dev --verbose` (web=6890, agent=6790, ggui=6781, todo=6782).
- ★ 크레딧 우회: Claude 구독 OAuth 토큰을 `CLAUDE_CODE_OAUTH_TOKEN`에 주입(API 키 비활성).
- ✅ **마지막 10% 해결**: searchTnas 권한 에러 0, `getCategoryList→searchTnas→ggui_handshake→ggui_render→ggui_consume` 전체 사이클 통과, render props에 실상품(제목/가격/평점) 구조화 주입 확인. 검증 프로브: `ggui/scripts/probe-searchtnas.sh`(agent 직접 POST→SSE 캡처).
- ★ 핵심 원인: agent 추론 모델 `claude-haiku-4-5`는 searchTnas는 부르되 `ggui_render`를 생략(텍스트만 응답). `MODEL=claude-sonnet-4-6`으로 올리니 즉시 카드 렌더. (`ggui/.env.local`의 `MODEL`로 고정. SYSTEM_PROMPT에 "텍스트 나열 금지, 반드시 ggui_render" 지시도 강화함.)
- `docs/GGUI_COCKPIT.md` 5·6·8절 실측 갱신 완료.

### 다음 세션 첫 작업 (B 마무리 → 이후 프로덕트 빌딩 계속)
1. `ggui/HANDOFF_GGUI.md` 읽고 서버 상태 확인(안 떠있으면 `pnpm dev`).
2. localhost:6890 "+New" → "서울 클래스, 서울 투어 같은 실제 마이리얼트립 액티비티 상품을 검색해서 후보 카드로 보여줘" → 백엔드 로그에서 searchTnas outcome 확인. ERROR면 claude-agent-sdk(@0.2.76) permissionMode 옵션 재확인 또는 canUseTool 콜백.
3. 실상품 카드 뜨면 → `docs/GGUI_COCKPIT.md` 5·6절 실측 갱신.
4. 이후 아워리얼트립 본체 프로덕트 빌딩 계속(참여자 화면 디자인, host dashboard 등 PRD 우선순위).

### 주의
- 외부 발행/배포/키사용/공개공유 전 Vivi 확인. `MYREALTRIP_API_KEY`·OAuth 토큰 출력 금지.
- 이번 세션 후반 도구호출 분절 발생 → 다음 세션은 한 번에 한 스텝씩.

---

## (이하 기존 핸드오프 — 제품 방향·제약 원본 보존)

## 한 줄 요약

아워리얼트립은 **Luma식 커뮤니티 이벤트/여행 생성 + MyRealTrip 실제 액티비티 상품 그라운딩 + 사람/에이전트 공동 생성 + 예약 전환 신호 학습**을 결합한 agent-addressable travel event layer다.

## 현재 상태

- repo: `/Users/vivi/ourrealtrip`
- git: 아직 git repo 아님
- 스택: Next.js 15 + React 19 + TypeScript + Tailwind + App Router
- 로컬 실행: `cd /Users/vivi/ourrealtrip && npm run dev` → `localhost:3000`
- 주요 산출물:
  - `PRD.md` — v2 계열 제품/요구사항 SSOT
  - `HANDOFF.md` — 초기 제품 핸드오프/히스토리
  - `HANDOFF_FOR_VERIFIER.md` — 전략/요구사항 독립 검증용 핸드오프
  - `docs/ARCHITECTURE.md`
  - `docs/HOST_AI_CREATE.md`
  - `docs/COMMERCE_MODEL.md`
  - `docs/DESIGN_BRIEF.md`
  - `docs/DISCOVER.md`
  - `supabase/migrations/0001_init.sql`
  - `app/`, `lib/`, `components/` — 참여자 화면과 로컬 데이터 구조 구현됨
- MyRealTrip 관련:
  - Vivi는 마케팅 파트너 가입 및 API 키 확보 완료
  - 실제 키는 `/Users/vivi/ourrealtrip/.env.local`의 `MYREALTRIP_API_KEY`로만 다룬다
  - 키를 채팅/문서/로그에 출력하지 말 것

## 지금까지 결정된 제품 방향

### 1. 피봇하지 않는다

- 이전 이름/방향인 “팔릴여행”은 폐기.
- 현재 프로젝트명은 **아워리얼트립 / OurRealTrip**.
- MyRealTrip의 “My”를 커뮤니티/관계 기반의 “Our”로 확장한다.
- 커뮤니티 + 액티비티는 대표 유스케이스/디테일이지, 전체 제품을 “소개팅 앱”이나 “하루짜리 액티비티 앱”으로 피봇하는 것이 아니다.

### 2. North Star

아워리얼트립은 모임장/커뮤니티 운영자가 자기 커뮤니티를 위한 여행·액티비티 제안 페이지를 만들고, 관심·투표·질문 같은 참여 신호를 모은 뒤, 실제 예약 가능한 MyRealTrip 상품 조합으로 전환하는 AI-native community travel commerce workspace다.

더 압축하면:

> 커뮤니티의 의도 → 여행/액티비티 제안 → 참여 신호 → 실제 상품 조합 → 예약 전환 신호 → 다음 제안 학습

### 3. 사람과 에이전트가 동등한 생성 주체

핵심 최신 결정:

- 사람이 Luma식 UI로 행사/여행을 만들 수 있어야 한다.
- 그와 더불어 **에이전트도 사람과 동등한 생성 주체로 행사/여행을 만들 수 있어야 한다.**
- 에이전트는 단순 추천자/보조자가 아니라, 승인 게이트 전까지 draft를 생성하고 프로그램을 조합하는 operator다.
- 같은 schema/action surface를 사람 UI와 에이전트 API/MCP가 공유해야 한다.

최소 agent-facing actions:

- `create_proposal_draft`
- `search_myrealtrip_activities`
- `compose_activity_program`
- `generate_participant_questions`
- `summarize_interest_signals`
- `publish_proposal_after_host_approval`

안전 원칙:

- draft 생성, 상품 검색, option/program 조합, 카피/질문 초안, 내부 요약은 에이전트가 수행 가능
- public URL 발행, 외부 공유, `booking_open`, 제휴 링크 노출, 가격/재고/예약 확정처럼 보이는 문구는 사람 승인 필요

### 4. GGUI는 host AI-create cockpit으로 사용

- GGUI는 사용하는 방향이 맞다.
- 단, 전체 앱을 GGUI로 재구현하지 않는다.
- 기존 Next.js 앱은 본체로 유지한다.
- GGUI는 `/host/ai-create` 또는 sidecar 데모로 붙인다.
- 역할은 “AI-create cockpit”: 호스트가 자연어로 말하면 상황에 맞는 생성형 UI가 뜨고, MyRealTrip/OurRealTrip 도구를 호출해 초안을 만든다.
- 참여자-facing 공개 페이지(`/trips/[slug]`), 예약 링크, 고지/정책 화면은 안정적인 기존 UI로 유지한다.

추천 GGUI 데모 플로우:

1. 호스트 자연어 입력
   - 예: “서울에서 새로운 사람들과 취향 기반 액티비티 프로그램을 만들고 싶어. 당일형, 12명, 가볍게 대화가 잘 생기는 구성으로.”
2. GGUI가 동적 UI 생성
   - 기간 선택
   - 지역/목적지 선택
   - 커뮤니티 성격 선택
   - 모집인원/승인 여부
   - 액티비티 후보 카드
   - 3-액티비티 프로그램 편성 UI
   - RSVP 질문 추천 UI
   - 발행 전 승인 UI
3. 도구 호출
   - `search_myrealtrip_activities`
   - `compose_activity_program`
   - `create_proposal_draft`
4. 멀티턴 수정
   - 예: “소개팅 느낌 줄이고 취향 모임 느낌으로 바꿔줘.”
5. 호스트 승인 후 기존 `/trips/[slug]` 페이지로 연결

### 5. 호스트 선택형 3-액티비티 프로그램

- `3개 액티비티`는 MVP 기본 프로그램 구조로 유효하다.
- 하지만 하루짜리로 제한하지 않는다.
- 호스트가 기간을 선택한다:
  - 당일형
  - 1박 2일
  - 2박 3일
  - 직접 설정
- 당일형/도심형/근교형은 TNA 중심으로 가능.
- 숙박형/해외형은 숙소·항공을 보조 ProductLink로 붙일 수 있다.
- 랜덤소개팅형/취향 기반 프로그램은 데모 hook으로 좋지만, user-facing copy는 완화한다:
  - “취향 기반 액티비티 프로그램”
  - “새로운 사람들과 함께하는 커뮤니티 여행”
  - “관심사가 맞는 사람들과 오프라인 경험”
- 매칭 성공/연애 성사/궁합 판단/민감 개인정보 기반 매칭을 약속하지 않는다.

## 최신 추가 논점: Booking Signal Sync / Conversion Feedback Loop

Vivi가 제안한 기능:

> 참여자가 각각 MyRealTrip에 접속해서 결제를 하면 해당 결제 정보가 OurRealTrip에 반영되어 “결제완료” 등으로 떠있게 하는 기능.

판단:

- 제품 방향으로는 매우 좋다.
- 아워리얼트립을 단순 큐레이션/링크아웃이 아니라 “성과학습이 닫힌 운영 레이어”로 만든다.
- 단, MVP에서 “자동 결제완료 반영”이라고 단정하면 위험하다.
- MyRealTrip이 webhook/postback/partner reporting API/reservation status lookup을 제공해야 외부 검증된 결제완료를 알 수 있다.
- API가 없다면 OurRealTrip이 확실히 알 수 있는 것은 링크 클릭, 예약 의사, 참여자 자가보고, 호스트 확인 정도다.

권장 명칭:

- `Booking Signal Sync`
- `Conversion Feedback Loop`

권장 상태 모델:

| 상태 | 의미 | 소스 |
|---|---|---|
| `interested` | 관심 있음 | OurRealTrip 내부 |
| `voted` | 옵션/날짜 투표 | OurRealTrip 내부 |
| `clicked_booking_link` | MyRealTrip 링크 클릭 | OurRealTrip redirect tracking |
| `booking_intent` | 예약 예정/예약하러 감 | OurRealTrip 내부 확인 |
| `self_reported_booked` | 참여자가 “예약했어요” 체크 | 참여자 자가 입력 |
| `host_confirmed_booked` | 호스트가 참여자 예약 완료를 확인 | 호스트 수동 확인 |
| `externally_confirmed_booked` | MyRealTrip postback/report/API로 확인 | 외부 API/리포트 |
| `cancelled_or_refunded` | 취소/환불 확인 | 외부 API 또는 자가/호스트 입력 |

핵심 원칙:

- `clicked_booking_link` ≠ `paid`
- `self_reported_booked` ≠ `externally_confirmed_booked`
- “결제완료”는 외부 검증 전에는 단정하지 않는다.
- UI에는 source/confidence를 표시한다.

MVP 구현 추천:

1. `/go/[product_link_id]` redirect 기반 클릭 추적
2. 참여자용 “예약했어요” 자가보고 버튼
3. 호스트 대시보드의 예약 신호 퍼널
   - 관심 / 투표 / 링크 클릭 / 예약의사 / 자가 예약완료 / 외부검증 예약완료
4. 에이전트가 신호를 요약하고 다음 액션 추천
   - “A 옵션은 클릭은 높지만 예약완료 자가보고가 낮음”
   - “3명만 더 필요하니 리마인드 문안 초안 생성”
5. 추후 MyRealTrip conversion API/postback이 확인되면 `externally_confirmed_booked`로 승격

피치 문장:

> OurRealTrip은 참여자의 관심 신호에서 끝나지 않습니다. booking_open 이후 각 참여자의 클릭, 예약의사, 예약완료 신호를 proposal에 다시 반영해 호스트와 에이전트가 실제 모집 상황을 운영할 수 있게 합니다. MyRealTrip의 전환 리포트나 postback이 연결되면 결제완료 상태는 자동 verified 상태로 승격됩니다.

## 엄수해야 할 hard constraints

### Commerce / legal

- OurRealTrip은 merchant가 아니다.
- 묶음 단일결제 금지.
- 우리 결제수취 금지.
- 호스트 정산 금지.
- 패키지 판매 금지.
- 결제/예약은 각 상품별·각자·판매처에서 진행.
- “3개 액티비티”는 프로그램 카드/함께보기/운영안이지 번들 상품이 아니다.

### MyRealTrip 공식 오인 금지

- MyRealTrip 공식 서비스처럼 보이면 안 된다.
- 제휴/파트너/외부 상품 고지를 유지한다.
- 상품 가격/재고/예약 가능 여부는 checked_at 기준이며 변동될 수 있음을 표시한다.

### Agent approval gate

- 에이전트는 draft/검색/조합/요약까지 가능.
- 발행, 외부 공유, booking_open, 제휴 링크 노출은 사람 승인 필요.

### Secret handling

- `MYREALTRIP_API_KEY`는 서버 전용.
- 클라이언트 번들, 로그, 문서, 프롬프트에 노출 금지.
- 필요하면 `.env.local`에서 읽되 값은 절대 출력하지 않는다.

## 현재 다음 작업 후보

우선순위 추천:

1. `PRD.md`, `docs/HOST_AI_CREATE.md`, `docs/ARCHITECTURE.md`, `docs/COMMERCE_MODEL.md`에 Booking Signal Sync를 정확히 반영
   - “결제완료 자동 반영” 과장 금지
   - 상태 모델/소스 구분 추가
   - host dashboard 및 agent summary에 반영
2. 호스트 AI-create / GGUI cockpit 구현 범위 확정
   - 실제 구현 action은 2~3개로 제한
   - `search_myrealtrip_activities`, `compose_activity_program`, `create_proposal_draft` 우선
3. 참여자 화면 디자인 피드백 반영
   - `/trips/[slug]`는 안정 UI 유지
   - RSVP/interest/booking signal 퍼널이 자연스럽게 보이도록 정리
4. 외부 트리거는 확인 후 진행
   - Supabase 클라우드 적용
   - Vercel 배포
   - git init/push
   - 공개 URL 발행

## 다음 세션에서 먼저 해야 할 일

1. 이 문서와 기존 문서 읽기:
   - `/Users/vivi/ourrealtrip/HANDOFF_NEXT_SESSION.md`
   - `/Users/vivi/ourrealtrip/HANDOFF_FOR_VERIFIER.md`
   - `/Users/vivi/ourrealtrip/PRD.md`
   - `/Users/vivi/ourrealtrip/docs/HOST_AI_CREATE.md`
   - `/Users/vivi/ourrealtrip/docs/ARCHITECTURE.md`
   - `/Users/vivi/ourrealtrip/docs/COMMERCE_MODEL.md`
2. Booking Signal Sync가 이미 문서에 반영됐는지 검색:
   - `booking`, `결제`, `payment`, `self_reported_booked`, `externally_confirmed_booked`, `conversion`
3. 부족하면 문서부터 패치.
4. 구현을 시작한다면, 먼저 작은 범위로:
   - participant booking signal state/type 추가
   - `/api/booking-progress` 또는 관련 store 확장
   - host dashboard/agent summary 반영
5. 외부 발행/배포/키 사용/공개 공유 전에는 Vivi 확인을 받는다.

## 다음 세션 프롬프트 요약

다음 세션에는 별도 프롬프트 파일 `/Users/vivi/ourrealtrip/NEXT_SESSION_PROMPT.md`를 붙여 시작하면 된다.
