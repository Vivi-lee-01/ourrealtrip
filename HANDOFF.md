# OurRealTrip / 아워리얼트립 Handoff v0.1

최종 프로젝트명: 아워리얼트립 / OurRealTrip

주의: 이전 명칭 “팔릴여행”은 폐기된 과거 방향이다. 현재 제품은 MyRealTrip의 “My”를 커뮤니티/관계 기반의 “Our”로 확장하는 방향이다.

## North Star

아워리얼트립은 모임장/커뮤니티 운영자가 자기 커뮤니티를 위한 여행 제안 페이지를 만들고, 관심·투표·질문 같은 참여 신호를 모은 뒤, 실제 예약 가능한 마이리얼트립 여행상품 조합으로 전환하는 AI-native community travel commerce workspace다.

## 포지셔닝

- 마이리얼트립: 개인이 여행상품을 찾는 곳
- Luma: 사람들이 이벤트에 모이는 곳
- 아워리얼트립: 커뮤니티가 함께 갈 여행을 만들고, 참여 의향을 검증하고, 실제 상품 전환까지 닫는 곳

## 핵심 은유

Luma식 이벤트 생성/참여 구조 + 마이리얼트립 Open API/MCP 기반 실제 여행상품 + 커뮤니티 운영자의 취향 큐레이션/수요 검증 + 관심/투표/클릭/예약 성과학습.

즉 “여행상품 추천 서비스”가 아니라 “커뮤니티 여행 제안 → 수요 검증 → 상품 조합 → 예약 전환” 도구다.

## 상위 전략 인사이트: 의도를 가진 커뮤니티와 여행

참고 소스:
- YouTube: https://www.youtube.com/watch?v=Wx0C42-S5z4
- 00:29:50 AI 네이티브 탤런트의 정의와 꿈꾸는 사람들의 조건
- 00:33:33 대학 시스템의 언번들링과 커뮤니티 기반 학습
- 상세 노트: `/Users/vivi/ourrealtrip/INSIGHT_AI_NATIVE_COMMUNITIES_TRAVEL.md`

핵심 해석:
AI/LLM으로 실행 장벽이 낮아질수록 사람에게 남는 핵심 가치는 “의도”가 된다. 전공/산업/학위의 경계가 약해지고, 선발·교육·커뮤니티 기능이 기존 대학 시스템에서 언번들링되면서, 사람들은 더 의도적으로 커뮤니티를 선택하고 만든다. 이때 여행은 단순 소비재가 아니라 의도를 가진 커뮤니티가 오프라인에서 함께 움직이고, 배움·관계·창작·회복 같은 목적을 현실 행동으로 전환하는 장치가 될 수 있다.

OurRealTrip에 주는 의미:
아워리얼트립은 “어디 갈까?”를 묻는 여행 추천 서비스가 아니라, “우리는 어떤 의도를 가진 사람들이고, 이번에는 어디서 그 의도를 함께 실행할 것인가?”를 여행 제안으로 바꾸는 제품이다.

강화된 제품 정의:
아워리얼트립은 의도를 가진 커뮤니티가 여행을 통해 배움·관계·창작·회복 같은 목적을 오프라인 경험으로 실행하고, 그 경험을 실제 예약 가능한 상품 조합과 성과학습으로 연결하는 AI-native travel layer다.

제품에 반영할 원칙:
- Trip Proposal은 단순 여행 제안이 아니라 커뮤니티의 의도를 담아야 한다.
- Travel Option은 가격/일정뿐 아니라 `community_intent_fit`을 가져야 한다.
- 여행은 커뮤니티를 더 강하게 만드는 오프라인 접점으로 설계한다.
- 대학 언번들링/AI 네이티브 탤런트 같은 표현은 내부 전략 인사이트로만 쓰고, 사용자-facing copy에는 “우리 모임이 같이 움직일 이유”, “이 여행이 끝나고 남을 것”, “이번 여행의 목적”처럼 번역한다.
- 철학으로 흐르지 말고, 반드시 Trip Proposal, RSVP, Travel Option, Product Link, Click Tracking으로 구현 가능한 구조에 내려야 한다.

PRD에 추가할 필드 후보:
- TripProposal: `community_intent`, `intended_outcome`, `post_trip_artifact`, `relationship_depth`, `learning_or_creation_goal`
- TravelOption: `community_intent_fit`, `relationship_depth`, `learning_or_creation_potential`, `post_trip_artifact`
- InterestSignal: `response_reason`, `intent_resonance`, `objection_type`

Host creation flow에 추가할 질문:
1. 이 여행을 통해 커뮤니티가 얻고 싶은 것은 무엇인가? 예: 배움, 친밀감, 회복, 도전, 창작, 네트워킹, 탐험, 루틴 전환.
2. 이 여행이 끝난 뒤 커뮤니티에 남아야 하는 것은 무엇인가? 예: 사진/콘텐츠, 프로젝트 아이디어, 회고/발표, 다음 모임, 멤버 간 관계, 학습 결과물.
3. 왜 지금이어야 하는가? 예: 계절성, 행사/페스티벌, 프로젝트 타이밍, 커뮤니티 모멘텀, 번아웃/리셋 필요, 신규 멤버 유입 시점.

## 핵심 사용자

### 1차 사용자: 모임장 / 커뮤니티 운영자

모임장은 여행 전문가가 아니라 자기 사람들의 취향과 분위기를 잘 아는 host다.

예시:
- 사진/러닝/등산/와인/책/음악 등 취향 커뮤니티 운영자
- 소규모 크리에이터
- 살롱/스터디/동호회 운영자
- 회사/팀/동호회 총무
- “같이 갈 사람”을 모으고 싶은 커뮤니티 리더

모임장의 핵심 니즈:
- 커뮤니티에 공유해도 부끄럽지 않은 여행 제안 페이지
- 바로 예약을 강요하지 않고 먼저 관심을 확인하는 구조
- 날짜/예산/인원/취향 리스크를 줄이는 방법
- 실제 상품으로 연결 가능한 신뢰성
- 참여자 반응을 보고 다음 행동을 결정하는 dashboard

### 2차 사용자: 참여자 / 커뮤니티 멤버

참여자는 처음부터 예약하고 싶지 않다. 먼저 누가 여는지, 누구와 가는지, 왜 지금 가는지, 날짜/예산/취향이 맞는지, 다른 사람들도 관심 있는지 확인하고 싶다. 참여자 행동은 “예약”보다 먼저 “관심/투표/질문”으로 시작한다.

## 핵심 루프

1. 모임장이 여행 제안 페이지를 만든다.
2. 커뮤니티에 공유한다.
3. 참여자가 관심 있음 / 날짜 맞으면 갈래요 / 가격 맞으면 갈래요 / 옵션 투표 / 질문 등으로 반응한다.
4. AI가 참여 신호와 여행상품 데이터를 바탕으로 여행 option set을 정리한다.
5. 모임장이 booking_open 상태로 전환한다.
6. 참여자가 항공/숙소/투어·티켓 상품 링크를 독립적으로 확인한다.
7. 클릭/예약 성과가 다음 여행 제안에 반영된다.

## 중심 화면: Trip Proposal Page

제품 중심은 상품 리스트가 아니라 여행 제안 페이지다. 각 제안은 독립 URL을 가진다.

예:
- /trips/kyoto-photo-walk-june
- /trips/bangkok-reset-weekend
- /trips/taipei-whisky-night
- /trips/fukuoka-running-onsen-weekend

기본 구조:
1. Hero: 제목, host/community, 한 줄 컨셉, 예상 날짜, 예상 가격대, 상태, 공유 CTA
2. Host-led Trust: 누가 왜 제안하는지, 커뮤니티 적합 근거, 과거 활동, 제안 톤
3. Why This Trip: 왜 우리 커뮤니티에 맞는지, 왜 지금인지, 누구에게 맞고 누구에게 애매한지
4. Interest/RSVP: 관심 있어요, 날짜 맞으면 갈래요, 가격대 맞으면 갈래요, 옵션 투표, 질문, 알림
5. Travel Option Set: 상품 나열이 아니라 A/B/C 여행 운영안
6. Product Link Section: booking_open 이후 항공/숙소/TNA 독립 CTA
7. Decision Helpers: 가격대, 일정 난이도, 동선/취소/변경 리스크, 추천/비추천 대상, checked_at
8. Share CTA: 커뮤니티 공유용 문안

## Travel Option 예시

A안. 가볍게 다녀오는 기본형
- 항공: 금요일 퇴근 후 출발 가능한 항공
- 숙소: 교토역/가와라마치 접근 좋은 숙소
- 액티비티: 로컬 포토워크 또는 골목 투어
- 적합도: 처음 만나는 사람들과도 부담 낮음
- 예상 가격대: 60~80만원
- CTA: 이 안에 관심 표시 / 이 안으로 투표

B안. 사진에 진심인 몰입형
- 항공: 오전 도착 항공
- 숙소: 촬영 동선 중심 지역
- 액티비티: 새벽/야간 촬영 가능 코스
- 적합도: 카메라 들고 오래 걸을 사람
- 예상 가격대: 80~110만원
- CTA: 이 안에 투표

C안. 가격 낮춘 현실형
- 항공: 평일/저가 시간대
- 숙소: 중심지에서 조금 떨어진 곳
- 액티비티: 무료 산책 코스 중심
- 적합도: 예산 민감한 사람
- 예상 가격대: 45~65만원
- CTA: 가격 맞으면 갈래요

## Proposal 상태 모델

- draft: 초안 작성 중
- interest_check: 커뮤니티 공유 후 관심/날짜/예산 반응 수집 중
- option_refining: 참여 신호 기반 여행 option set 조정 중
- booking_open: 실제 상품 링크 확인 가능
- closed: 모집 종료
- cancelled: 취소
- archived: 과거 제안 보관

## 핵심 데이터 엔티티

- Host: host_id, name, profile_image_url, community_name, bio, trust_note
- Community: community_id, name, description, category, visibility
- TripProposal: proposal_id, host_id, community_id, slug, title, concept, target_audience, mood, expected_dates, expected_budget, destination_candidates, status, visibility, checked_at
- TravelOption: option_id, proposal_id, option_name, option_type(basic/premium/budget/experimental), description, estimated_budget, fit_reason, risk_note, sort_order
- ProductLink: product_link_id, option_id, product_type(flight/stay/tna), source, myrealtrip_product_id, title, price_hint, reason, caution, source_url, mylink_url, checked_at, status
- InterestSignal: signal_id, proposal_id, option_id nullable, participant_session_id, response_type(interested/date_dependent/price_dependent/voted_option/question/not_interested), preferred_dates, preferred_budget, comment
- ClickEvent: event_id, proposal_id, option_id, product_link_id, product_type, clicked_at, referrer, device_type, browser, utm fields, redirect_url
- PerformanceSnapshot: proposal_id, option_id, views, interested_count, vote_count, booking_clicks, product_clicks_by_type, top_option_id, conversion_notes

## MVP 화면

Public/Participant:
1. `/` landing/home: 서비스 소개 + 공개 여행 제안 리스트
2. `/trips/[slug]`: Trip Proposal Detail
3. RSVP/Interest modal 또는 `/trips/[slug]/respond`
4. `/go/[product_link_id]`: 클릭 기록 후 외부 링크 redirect
5. `/disclosure`: 고지/정책

Host:
6. `/host`: host dashboard
7. `/host/trips/new`: proposal 생성
8. `/host/trips/[proposal_id]`: proposal 관리, 상태 변경, option/product link 관리

## MVP 포함 범위

- 모바일 우선 웹앱
- Trip Proposal 생성
- Trip Proposal 공개 URL
- Host/Community 정보 표시
- 관심/투표/질문 수집
- Travel Option Set 표시
- booking_open 상태에서 상품별 독립 CTA
- 클릭 추적
- 제휴/경제적 이해관계 고지
- 마이리얼트립 상품 링크 연결 가능 구조
- host/admin용 간단 dashboard
- checked_at / 상태 관리

## MVP 제외 범위

- 앱스토어 네이티브 앱
- 결제
- 예약 대행
- 실시간 단체 예약 확정
- 크리에이터 정산
- 하위 파트너 모집
- 참여자 캐시백/리워드
- 실시간 최저가 보장
- 완전 자동 발행
- 마이리얼트립 공식 서비스처럼 보이는 UI/문구
- 전체 예약하기 CTA
- 패키지 상품 판매

## UX 원칙

1. Event-first: 상품보다 여행 제안이 먼저다.
2. Host-led: 누가 여는가가 신뢰의 핵심이다.
3. Interest before booking: 바로 예약이 아니라 관심/투표/질문을 먼저 받는다.
4. Option set, not product list: 상품 나열이 아니라 여행 운영안 A/B/C로 보여준다.
5. Independent product CTA: 항공/숙소/TNA는 각각 독립 CTA를 가진다.
6. Community signal matters: 관심 수, 투표, 질문, 예산 반응이 상품 조합 개선에 반영된다.
7. No official confusion: 마이리얼트립 공식 서비스처럼 보이면 안 된다.
8. No package confusion: 전체 예약/패키지 구매처럼 보이면 안 된다.

## 금지 방향

- 일반 여행 추천 앱
- AI 여행 챗봇
- 최저가 딜 앱
- 항공/숙소/TNA 단순 검색 UI
- Luma UI 클론
- 예쁜 여행 이벤트 랜딩페이지만 만드는 것
- 팬덤/낭만만 있는 여행 컨셉
- “여행 같이 가요” 커뮤니티 게시판
- 마이리얼트립 공식 서비스처럼 보이는 것
- 여행 패키지 모집처럼 보이는 것
- 수익 보장/부업 강의처럼 보이는 것
- API 호출만 보여주는 해커톤 데모

## 마이리얼트립 API/MCP 활용 방향

API/MCP는 단순 상품 가져오기가 아니라 커뮤니티의 여행 수요를 실제 예약 가능한 상품 조합으로 바꾸는 데 사용한다.

우선 활용 가능 영역:
- 투어·티켓·액티비티 검색
- 상품 상세
- 가격/예약 가능성 확인 가능 범위
- 마이링크/제휴 링크 구조
- 클릭/성과 추적 가능 구조
- 목적지/카테고리 기반 후보 추천

API 기반 사실, LLM 추론, Host 입력, Participant signal을 구분한다.

## 신뢰/고지 원칙

필수 고지:
1. 아워리얼트립은 마이리얼트립 공식 서비스가 아니다.
2. 일부 링크를 통해 예약이 발생할 경우 운영자에게 수익이 발생할 수 있다.
3. 상품 가격과 예약 가능 여부는 확인 시점 이후 변경될 수 있다.
4. 아워리얼트립은 항공·숙소·투어 상품을 직접 판매하거나 예약을 대행하지 않는다.
5. 조합형 여행안은 참고용 편성이며 패키지 상품이 아니다.
6. 각 상품은 판매처에서 독립적으로 확인하고 구매한다.

금지 문구:
- 공식 추천
- 단독 특가
- 최저가 보장
- 예약 가능 보장
- 전체 예약하기
- 패키지 구매하기
- 이 일정 그대로 예약하기
- 예약하면 수익 보장
- 누구나 여행으로 돈 번다
- 방문자 캐시백

## 성공 지표

Host:
- 생성된 Trip Proposal 수
- draft → interest_check 전환율
- interest_check → booking_open 전환율
- host 재사용률
- proposal 공유 수
- dashboard 재방문률

Participant:
- proposal page view
- interest click rate
- vote participation rate
- question/comment rate
- booking_open 이후 product link CTR

Commerce:
- product link clicks
- option별 click rate
- product_type별 click rate: flight / stay / tna
- 마이링크 클릭 수
- 제휴 성과 리포트 연결 가능성

Trust:
- 고지 노출 누락 0건
- 전체 예약 CTA 0건
- 공식 오인 문구 0건
- 패키지 오인 문구 0건
- 오래된 checked_at 상품 표시

## 구현 우선순위

### Phase 1. Static/Manual MVP
API 완전 연동 전 core UX 검증.
- Trip Proposal 수동 생성
- Travel Option 수동 입력
- ProductLink 수동 입력
- RSVP/interest/vote 수집
- 클릭 추적
- Host dashboard 기본 지표
- 고지 페이지

### Phase 2. MYR API/MCP 연동
- 목적지/카테고리 기반 상품 검색
- TNA 상품 연결
- product link 자동 후보 생성
- checked_at 관리
- API 기반 사실과 LLM 추론 분리

### Phase 3. AI MD / Option Generation
- 여행 제안 제목 생성
- 초대 문구 생성
- option A/B/C 생성
- 상품별 fit reason/risk note 생성
- 참여 반응 기반 다음 액션 추천

### Phase 4. Performance Learning
- option별 관심/클릭 성과
- product type별 CTR
- host dashboard 개선
- 다음 여행 제안 추천
- 커뮤니티별 취향/예산 패턴 학습

## 권장 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth: host/admin만
- 공개 참여자: 로그인 없는 익명 세션
- Vercel 배포
- `/go/[product_link_id]` redirect 기반 클릭 추적

## 구현 에이전트 최상위 지시문

```text
You are implementing OurRealTrip / 아워리얼트립.

Do not implement a generic travel recommendation app.
Do not implement a Luma clone.
Do not implement a package travel booking service.

The product is a community travel commerce workspace:
hosts/community organizers create trip proposal pages, collect interest/votes/questions from their communities, then convert validated demand into independently clickable travel product links.

Core loop:
host creates trip proposal → community responds → travel options are refined → booking links open → product clicks are tracked → performance informs the next proposal.

Build mobile-first.
The central page is /trips/[slug], not a product listing.
Prioritize interest/vote before booking.
Show travel options as A/B/C operating plans, not a flat product list.
Product links must be independent CTAs.
Never show “book all”, “package purchase”, or “official MyRealTrip” language.
Include disclosure that this is not an official MyRealTrip service, not a package seller, and some links may generate revenue.

Start with a manual MVP:
manual trip proposals, manual travel options, manual product links, RSVP/interest collection, click tracking, and basic host dashboard.
API integration can come after the core loop works.
```

## 남은 결정 질문

1. 첫 MVP는 host 로그인을 넣을까, 아니면 admin-only로 host 역할까지 대체할까?
   - 추천: host/admin 로그인은 넣되, 참여자는 익명.
2. 첫 demo용 trip proposal 샘플은 어떤 커뮤니티로 잡을까?
   - 추천: 사진 커뮤니티 x 교토, 러닝 크루 x 후쿠오카, 와인/바 커뮤니티 x 타이베이, 리셋/번아웃 회복 모임 x 방콕.
3. 마이리얼트립 API 연동 전 product links는 어떤 형태로 둘까?
   - 추천: manual URL + `myrealtrip_product_id` nullable.
4. 참여자 정보는 어디까지 받을까?
   - 추천: MVP에서는 이름/이메일 없이 익명 세션 + 선택 코멘트.
5. community_only 접근 제어를 MVP에 넣을까?
   - 추천: 초기에는 unlisted URL로 충분.
