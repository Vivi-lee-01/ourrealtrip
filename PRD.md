# OurRealTrip / 아워리얼트립 — Build PRD v2.0

> 이 문서가 빌드용 단일 진실 원천(single source of truth)이며, `HANDOFF.md`는 히스토리 참고용이다.

최종 프로젝트명: 아워리얼트립 / OurRealTrip

주의: 이전 명칭 "팔릴여행"은 폐기된 과거 방향이다. 현재 제품은 MyRealTrip의 "My"를 커뮤니티/관계 기반의 "Our"로 확장하는 방향이다.

> **v2.0 변경 요약**: 흩어진 개별 상품 CTA UX가 그룹 여행에 맞지 않는다는 사용자 피드백을 반영해 루마(luma.com)의 discover/이벤트페이지/create UX를 적극 채택했다. 핵심은 그룹이 한 TravelOption으로 수렴하면 그 옵션의 ProductLink 묶음을 **"우리 여행 장바구니"(코디네이션·함께보기 뷰)**로 보여주는 공동 장바구니 모델이다. 단, 마이리얼트립은 affiliate(상품검색 + `/v1/mylink` 제휴딥링크)만 제공하고 장바구니/주문생성/묶음결제 API가 없어 **아워리얼트립은 merchant가 아니다** — "묶음 단일결제"·"우리 결제수취"·"호스트 정산"은 여행업 등록·PG·배상책임이 필요한 다른 회사가 되므로 절대 금지다. 결제·예약은 항상 상품별·각자·판매처에서 진행한다. 신규 엔티티(BookingProgress·Itinerary/ItineraryDay·DiscoverCategory)와 일정표(Day1/Day2), 그룹 예약 진행현황(자가보고 + 클릭추적 기준), 호스트 루마식 AI-create 플로우를 추가하고, AI 옵션생성을 무인증 MCP 검증을 근거로 Phase 1-2로 앞당겼다. 기존 자산(데모 커뮤니티 3건=교토/발리/하와이, 18절 실 API/MCP, 17절 고지, 9절 엔티티)은 모두 보존한다.

---

## 1. North Star

아워리얼트립은 모임장/커뮤니티 운영자가 자기 커뮤니티를 위한 여행 제안 페이지를 만들고, 관심·투표·질문 같은 참여 신호를 모은 뒤, 실제 예약 가능한 마이리얼트립 여행상품 조합으로 전환하는 AI-native community travel commerce workspace다.

강화된 제품 정의: 아워리얼트립은 같이 움직일 이유가 있는 커뮤니티가 여행을 통해 배움·관계·창작·회복 같은 목적을 오프라인 경험으로 실행하고, 그 경험을 실제 예약 가능한 상품 조합과 성과학습으로 연결하는 AI-native travel layer다.

---

## 2. 포지셔닝

| 서비스 | 역할 |
|--------|------|
| 마이리얼트립 | 개인이 여행상품을 찾는 곳 |
| Luma | 사람들이 이벤트에 모이는 곳 |
| 아워리얼트립 | 커뮤니티가 함께 갈 여행을 만들고, 참여 의향을 검증하고, 실제 상품 전환까지 닫는 곳 |

핵심 은유: Luma식 이벤트 생성/참여 구조 + 마이리얼트립 Open API/MCP 기반 실제 여행상품 + 커뮤니티 운영자의 취향 큐레이션/수요 검증 + 관심/투표/클릭/예약 성과학습.

즉 "여행상품 추천 서비스"가 아니라 "커뮤니티 여행 제안 → 수요 검증 → 상품 조합 → 예약 전환" 도구다.

추가 핵심 원칙: 이 제품은 **사람만 쓰는 SaaS가 아니라, 사람과 에이전트가 함께 쓰는 여행/이벤트 생성 레이어**다. 사람 호스트는 Luma처럼 화면에서 제안을 만들고 수정한다. 에이전트는 API/MCP를 통해 행사·여행 제안을 생성하고, MyRealTrip 상품을 조회·조합하고, 초안/옵션/공유문안을 준비할 수 있어야 한다. 단, 발행·외부 공유·예약 링크 전환·상태 변경 같은 외부 영향 액션은 승인 게이트를 둔다.

---

## 2-A. 커머스 모델 — 공동 여행 장바구니 (v2 신규)

> 핵심 제약: 마이리얼트립은 affiliate(상품검색 + `/v1/mylink` 제휴딥링크)만 제공하고 **장바구니/주문생성/묶음결제 API가 없다**. 따라서 아워리얼트립은 merchant가 아니며, "묶음 단일결제"·"우리 결제수취"·"호스트 정산"은 여행업 등록·PG·배상책임이 필요한 다른 회사가 되므로 **절대 금지**다. 그 대신 아래 "공동 장바구니(코디네이션)" 모델을 채택한다.

- 그룹이 한 TravelOption(A/B/C)으로 수렴하면, 그 옵션의 ProductLink 묶음이 **"우리 여행 장바구니"**로 표시된다.
- 장바구니는 **코디네이션/함께보기 뷰**이지 체크아웃이 아니다. 아워리얼트립은 결제를 받지 않는다.
- 멤버 전원이 **동일한 장바구니**를 본다: 1인 예상총액, 포함내역(항공/숙소/TNA), "N명이 이 안을 담음".
- **각자 예약 가이드**: 항목별 "내 예약" 버튼 → `/go/[product_link_id]` 제휴 redirect → 복귀 후 "예약 완료" 자가표시 → 그룹 진행현황(BookingProgress) 갱신. 결제·예약은 상품별·각자·판매처에서 진행한다.
- 진행현황은 affiliate 구조라 실제 결제확인이 불가하므로, **"참여자 자가보고 + 클릭추적" 기준**임을 화면에 명시한다.
- Cart는 **별도 테이블이 아니다** — "수렴된 `option_id` + `InterestSignal(voted_option)` 집계 + BookingProgress"로 파생되는 뷰다(9절 참조).

---

## 2-B. 루마(luma.com) 실측 패턴 — 채택 근거 (v2 신규)

> 아래는 루마의 discover / 이벤트페이지 / create UX를 실측해 우리가 차용하는 패턴이다. 단, "Luma UI 클론"은 금지(16절) — 패턴·anatomy를 차용하되 커뮤니티 여행 커머스 도메인에 맞춰 재구성한다.

- **discover**: Browse by Category(Tech/AI/Food/Arts/Fitness/Wellness… 아이콘 + 건수) + Popular Events(도시별 커버카드 + 참여수) + Featured Calendars(커뮤니티 구독). 서울 인기 목록에 "BD RUN(런클럽)"·"AI 해커하우스"가 실재 → 우리 빌더/런 커뮤니티 수요를 검증한다.
- **이벤트페이지**: 커버이미지, "Hosted by", 날짜/위치, Register/RSVP, About, 일정 세부(18:30/19:00…), "N Going" + 아바타.
- **create**: 단일 폼(테마/커버, 이벤트명, Start/End, Location, Description, Options[Ticket/Approval/Capacity/Waitlist]).

이 실측이 6절(이벤트페이지 anatomy)·10절(create 단일 폼)·12절(discover)의 근거다.

---

## 2-C. Agent/API 접근성 — 사람과 에이전트가 함께 쓰는 생성 레이어

OurRealTrip은 UI-first 제품이지만, 내부 구조는 처음부터 **agent-addressable**해야 한다. 목표는 사람이 Luma식 create 화면에서 만드는 것과 동일한 행위를 에이전트도 안전하게 수행할 수 있게 하는 것이다.

### 에이전트가 할 수 있어야 하는 것

- 행사/여행 제안 초안 생성: 커뮤니티, 목적, 기간, 목적지, 모집인원, 승인 여부, 공개범위 입력
- MyRealTrip 상품 조회/조합: TNA 중심 3-액티비티 프로그램 생성, 필요 시 숙소·항공 보조 링크 제안
- 옵션 A/B/C 생성: 추천 이유, 리스크, 예산 힌트, 프로그램 구성, 커뮤니티 적합도 포함
- 참여자용 질문/RSVP UI 초안 생성: 관심, 날짜, 예산, 옵션 투표, 질문
- 호스트용 요약 생성: 어떤 옵션이 왜 좋은지, 어떤 리스크가 있는지, 무엇을 확인해야 하는지
- 제출/공유 전 검토 체크리스트 생성

### 승인 게이트

에이전트가 자동으로 해도 되는 일:

- 초안 생성
- 상품 검색/조회
- 옵션 조합
- 내부 저장 상태의 `draft` 생성
- 카피/일정/프로그램 제안

사람 승인이 필요한 일:

- `draft → interest_check` 발행
- 공개 URL 공유
- 커뮤니티/Slack/메일 등 외부 메시지 전송
- `booking_open` 전환
- 제휴 링크를 참여자에게 노출
- 상품/가격/일정이 확정된 것처럼 보이는 카피 게시

### API/MCP 표면 원칙

- 내부 API는 화면 전용이 아니라 에이전트도 호출 가능한 명확한 action surface로 설계한다.
- 최소 action surface:
  - `create_proposal_draft`
  - `search_myrealtrip_activities`
  - `compose_activity_program`
  - `generate_participant_questions`
  - `publish_proposal_after_host_approval`
  - `summarize_interest_signals`
  - `summarize_booking_signals` — booking_open 이후 BookingProgress 퍼널(클릭/예약의사/자가 예약완료/호스트 확인)을 요약하고 다음 액션을 추천(예: "A옵션은 클릭은 높으나 자가 예약완료가 낮음", "3명 더 필요 — 리마인드 문안 초안 생성"). 읽기·요약·초안까지만, 외부 발송·발행은 승인 게이트.
- 각 action은 입력/출력 schema, permission, approval requirement, source attribution을 가진다.
- 외부 에이전트 접근을 위해 후속 단계에서 OpenAPI 또는 MCP wrapper로 노출 가능해야 한다.
- 모든 agent-generated output은 `source = host_input | myrealtrip_api | participant_signal | llm_inference`를 구분한다.

---

## 3. 전략 인사이트의 제품 반영 (내부용)

> 아래 인사이트는 **내부 전략 기준**이다. 사용자-facing copy에는 "대학 언번들링", "AI 네이티브 탤런트" 같은 철학어를 직접 쓰지 않는다. 사용자에게는 "우리 모임이 같이 움직일 이유", "이 여행이 끝나고 남을 것", "이번 여행의 목적"처럼 **번역해서** 노출한다.

핵심 해석: AI/LLM으로 실행 장벽이 낮아질수록 사람에게 남는 핵심 가치는 "의도"다. 사람들은 더 의도적으로 커뮤니티를 선택하고 만든다. 이때 여행은 단순 소비재가 아니라, 같이 움직일 이유가 있는 커뮤니티가 오프라인에서 함께 움직이고 배움·관계·창작·회복 같은 목적을 현실 행동으로 전환하는 장치가 된다.

OurRealTrip에 주는 의미: 아워리얼트립은 "어디 갈까?"를 묻는 여행 추천 서비스가 아니라, "우리는 어떤 사람들이고, 이번에는 어디서 그 목적을 함께 실행할 것인가?"를 여행 제안으로 바꾸는 제품이다.

제품에 반영할 원칙:
- Trip Proposal은 단순 여행 제안이 아니라 커뮤니티의 의도(목적)를 담아야 한다.
- Travel Option은 가격/일정뿐 아니라 `community_intent_fit`을 가져야 한다.
- 여행은 커뮤니티를 더 강하게 만드는 오프라인 접점으로 설계한다.
- 철학으로 흐르지 말고, 반드시 Trip Proposal, RSVP, Travel Option, Product Link, Click Tracking으로 구현 가능한 구조에 내린다.

이 인사이트에서 도출된 필드는 모두 아래 9절 "핵심 데이터 엔티티"에 **정식 엔티티 필드로 승격**되었다. (후보가 아니라 확정 정의)

---

## 4. 핵심 사용자

### 4-1. 1차 사용자: 모임장 / 커뮤니티 운영자

모임장은 여행 전문가가 아니라 자기 사람들의 취향과 분위기를 잘 아는 host다.

예시:
- 사진/러닝/등산/와인/책/음악 등 취향 커뮤니티 운영자
- 소규모 크리에이터
- 살롱/스터디/동호회 운영자
- 회사/팀/동호회 총무
- "같이 갈 사람"을 모으고 싶은 커뮤니티 리더

모임장의 핵심 니즈:
- 커뮤니티에 공유해도 부끄럽지 않은 여행 제안 페이지
- 바로 예약을 강요하지 않고 먼저 관심을 확인하는 구조
- 날짜/예산/인원/취향 리스크를 줄이는 방법
- 실제 상품으로 연결 가능한 신뢰성
- 참여자 반응을 보고 다음 행동을 결정하는 dashboard

### 4-2. 2차 사용자: 참여자 / 커뮤니티 멤버

참여자는 처음부터 예약하고 싶지 않다. 먼저 누가 여는지, 누구와 가는지, 왜 지금 가는지, 날짜/예산/취향이 맞는지, 다른 사람들도 관심 있는지 확인하고 싶다. 참여자 행동은 "예약"보다 먼저 "관심/투표/질문"으로 시작한다.

---

## 5. 핵심 루프

1. 모임장이 여행 제안 페이지를 만든다.
2. 커뮤니티에 공유한다.
3. 참여자가 관심 있음 / 날짜 맞으면 갈래요 / 가격 맞으면 갈래요 / 옵션 투표 / 질문 등으로 반응한다.
4. AI가 참여 신호와 여행상품 데이터를 바탕으로 여행 option set을 정리한다.
5. 모임장이 `booking_open` 상태로 전환하고, 그룹이 한 TravelOption(A/B/C)으로 **수렴**한다.
6. 수렴된 옵션의 ProductLink 묶음이 **"우리 여행 장바구니"(함께보기 뷰)**로 멤버 전원에게 동일하게 표시된다.
7. 참여자가 항공/숙소/투어·티켓 링크를 **각각 독립적으로** 각자·판매처에서 예약하고, 복귀 후 "예약 완료"를 자가표시해 그룹 진행현황(BookingProgress)을 갱신한다. (아워리얼트립은 결제를 받지 않는다.)
8. 클릭/자가보고 성과가 다음 여행 제안에 반영된다.

---

## 6. 중심 화면: Trip Proposal Page

제품 중심은 상품 리스트가 아니라 **여행 제안 페이지**다. 각 제안은 독립 URL(`/trips/[slug]`)을 가진다.

예:
- `/trips/kyoto-quiet-photo-walk`
- `/trips/bali-builder-move-retreat`
- `/trips/hawaii-surf-week`

기본 구조 (v2 재설계 — 루마 이벤트페이지 anatomy: cover → host → RSVP-first → guest count → schedule):

1. **Cover**: 커버이미지(`cover_image_url`), 제목, 한 줄 컨셉, 날짜/목적지, 상태
2. **Host**: "Hosted by" — 누가 왜 제안하는지, 커뮤니티 적합 근거, 과거 활동, 제안 톤(`trust_note`)
3. **RSVP/Interest (먼저)**: 관심 있어요, 날짜 맞으면 갈래요, 가격대 맞으면 갈래요, 옵션 투표, 질문, 알림. 상품보다 **먼저** 배치한다.
4. **소셜프루프**: "N명 참여의향" + 아바타 ("N Going" 차용). InterestSignal 집계 기반.
5. **Why This Trip**: 왜 우리 커뮤니티에 맞는지, 왜 지금인지, 누구에게 맞고 누구에게 애매한지
   - **'우리 커뮤니티에 왜 의미 있는가' 섹션 (정식 포함)**: `community_intent`(이번 여행의 목적), `intended_outcome`(이 여행으로 우리 모임이 얻고 싶은 것), `post_trip_artifact`(이 여행이 끝나고 남을 것), `why_now`(왜 지금인가)를 사용자-facing 번역 카피로 표시한다. 내부 전략어(대학 언번들링 등)는 노출 금지.
6. **일정표 (Day1/Day2)**: Itinerary/ItineraryDay 기반 일정 세부(예: 18:30/19:00…). 각 item은 `product_link_id`로 상품과 연결될 수 있다.
7. **Travel Option Set**: 상품 나열이 아니라 A/B/C 여행 운영안. 각 안은 가격/일정뿐 아니라 `community_intent_fit`, `relationship_depth`, `learning_or_creation_potential`, `post_trip_artifact`, `schedule_difficulty`를 함께 표현
8. **공동 여행 장바구니 (수렴 옵션)**: 그룹이 수렴한 TravelOption의 ProductLink 묶음을 **함께보기 뷰**로 표시 — 1인 예상총액, 포함내역(항공/숙소/TNA), "N명이 이 안을 담음". 체크아웃이 아니며 단일 묶음결제 버튼 금지.
9. **각자 예약 가이드**: 항목별 "내 예약" 버튼 → `/go/[product_link_id]` 제휴 redirect → 복귀 후 "예약 완료" 자가표시. 항공/숙소/TNA는 **각각 독립 CTA**(단일 "전체 예약" CTA 금지).
10. **그룹 진행현황 (BookingProgress / Booking Signal Sync)**: 항목별 예약 퍼널 집계(클릭 → 예약의사 → 자가 예약완료 → 호스트 확인). 각 신호에 **출처/신뢰도(source/confidence)**를 병기하고, "참여자 자가보고 + 클릭추적 기준"임을 명시(실 결제확인 불가). 외부 검증 결제완료는 MyRealTrip 전환 API 연결 시에만 표시.
11. **Decision Helpers**: 가격대, 일정 난이도, 동선/취소/변경 리스크, 추천/비추천 대상, `checked_at`
12. **고지 + Share CTA**: 필수 고지(17절, 장바구니 함께보기용 고지 포함) + 커뮤니티 공유용 문안

---

## 7. Travel Option 예시

각 안은 가격/일정 차원과 함께 **커뮤니티 의도 차원**(관계 깊이·여행 후 산출물·배움/창작 잠재력)을 표현한다.

**A안. 가볍게 다녀오는 기본형**
- 항공: 금요일 퇴근 후 출발 가능한 항공
- 숙소: 교토역/가와라마치 접근 좋은 숙소
- 액티비티: 로컬 포토워크 또는 골목 투어
- 적합도(fit_reason): 처음 만나는 사람들과도 부담 낮음
- 관계 깊이(relationship_depth): 낮음~중간
- 여행 후 남을 것(post_trip_artifact): 사진 공유 / 짧은 회고
- 예상 가격대: 60~80만원
- 일정 난이도(schedule_difficulty): 낮음
- CTA: 이 안에 관심 표시 / 이 안으로 투표

**B안. 사진에 진심인 몰입형**
- 항공: 오전 도착 항공
- 숙소: 촬영 동선 중심 지역
- 액티비티: 새벽/야간 촬영 가능 코스
- 적합도(fit_reason): 카메라 들고 오래 걸을 사람
- 관계 깊이(relationship_depth): 높음
- 여행 후 남을 것(post_trip_artifact): 작품 셀렉 / 전시·발표 세션
- 예상 가격대: 80~110만원
- 일정 난이도(schedule_difficulty): 중간~높음
- CTA: 이 안에 투표

**C안. 가격 낮춘 현실형**
- 항공: 평일/저가 시간대
- 숙소: 중심지에서 조금 떨어진 곳
- 액티비티: 무료 산책 코스 중심
- 적합도(fit_reason): 예산 민감한 사람
- 관계 깊이(relationship_depth): 중간
- 여행 후 남을 것(post_trip_artifact): 다음 모임 약속
- 예상 가격대: 45~65만원
- 일정 난이도(schedule_difficulty): 낮음~중간
- CTA: 가격 맞으면 갈래요

---

## 7-A. 액티비티 패키지 디테일 — 호스트 선택형 3-액티비티 프로그램 + 랜덤소개팅형 편성

> 이 절은 피봇이 아니라 OurRealTrip 안에 포함되는 **구체 유스케이스/상품 구성 방식**이다. 제품의 중심은 계속 **Luma식 커뮤니티 이벤트 생성/참여 구조 + MyRealTrip 실제 여행상품 그라운딩**이다. 여기서는 그중 투어·티켓·액티비티(TNA)를 전면에 둔 프로그램형 제안을 정의한다.

### 정의

커뮤니티 호스트가 기간·목적지·모임 의도를 선택하면, 아워리얼트립이 마이리얼트립 액티비티 상품을 바탕으로 **3개 액티비티 프로그램**을 구성한다. 프로그램 기간은 하루로 제한하지 않는다. 호스트가 `당일형 / 1박 2일 / 2박 3일 / 직접 설정` 중 선택하고, 선택한 기간 안에서 3개 액티비티를 시간대/날짜별로 배치한다. 참여자는 여행 전체를 예약하기 전에 “이 프로그램이면 가고 싶다 / 이 조합이면 만나보고 싶다”는 신호를 남긴다.

### 대표 포맷: 랜덤소개팅형 액티비티 프로그램

- 대상: 새로운 사람을 만나고 싶은 싱글/친구 그룹/취향 커뮤니티
- 구조: 같은 목적의 참여자들이 선택된 기간 동안 3가지 액티비티를 함께 하며 자연스럽게 대화·취향·텐션을 확인
- 예시 프로그램:
  1. 첫 액티비티: 가벼운 아이스브레이킹 액티비티 또는 워킹투어
  2. 두 번째 액티비티: 취향이 드러나는 체험형 클래스/원데이 액티비티
  3. 마지막 액티비티: 소규모 식사/야경/공연/바 투어 등 마무리 액티비티
- 핵심은 “데이트앱 매칭”이 아니라 **실제 오프라인 경험을 같이 하며 사람을 알아가는 Luma형 커뮤니티 여행 프로그램**이다.

### 기존 TravelOption과의 관계

- 기존 A/B/C TravelOption은 유지한다.
- 액티비티 패키지형 옵션은 `product_type='tna'` ProductLink 3개를 중심으로 구성된다.
- 항공/숙소는 필수가 아니다. 당일형/근교형/도심형 프로그램에서는 TNA만으로도 제안이 완결될 수 있고, 숙박형/해외형 프로그램에서는 숙소·항공을 보조 ProductLink로 붙일 수 있다.
- “공동 장바구니”는 3개 액티비티를 함께보기용 프로그램 카드로 보여준다. 단일 묶음결제는 여전히 금지한다.

### Host create 입력

- 기간 유형: `당일형 / 1박 2일 / 2박 3일 / 직접 설정`
- 목적지/지역
- 액티비티 개수: MVP 기본값 3개. 후순위에서 호스트가 증감 가능
- 프로그램 성격: 취향 기반 / 랜덤소개팅형 / 러닝·웰니스 / 사진·창작 / 빌더 리트릿 등
- 승인/모집인원/공개범위: Luma식 event create 패턴 유지
- 생성 주체: 사람 호스트뿐 아니라 에이전트도 동일 schema로 초안을 만들 수 있어야 한다. UI 입력과 API 입력은 같은 도메인 모델을 공유한다.

### 화면 표현

- “3-액티비티 프로그램” 섹션을 Travel Option Set 안에 표시한다.
- 각 액티비티에는 날짜/시간대, 역할, 추천 이유, 가격 힌트, 예약 링크를 붙인다.
- 참여자는 개별 액티비티보다 **프로그램 조합 전체**에 RSVP/투표한다.
- 호스트는 참여 신호를 보고 프로그램을 확정하거나 액티비티를 교체한다.

### 안전/카피 원칙

- “랜덤소개팅”은 내부/데모용 강한 표현으로 쓸 수 있으나, 사용자-facing 카피에서는 “취향 기반 액티비티 프로그램”, “새로운 사람들과 함께하는 커뮤니티 여행”, “관심사가 맞는 사람들과의 오프라인 경험”처럼 완화한다.
- 매칭 성공, 연애 성사, 개인정보 기반 궁합 판단을 약속하지 않는다.
- 참여자 개인정보·성별·연령·연애상태를 과도하게 수집하지 않는다. MVP에서는 관심사/참여 의향/선호 시간대 정도만 받는다.
- 여행업/결제/정산 금지 원칙은 동일하게 유지한다.

### 해커톤 데모에서의 의미

이 디테일은 OurRealTrip을 “여행 추천 페이지”가 아니라 “Luma처럼 커뮤니티 이벤트를 만들되, MyRealTrip의 실제 액티비티 상품으로 실행 가능한 프로그램까지 구성하는 도구”로 선명하게 만든다. 하루짜리로 제한하지 않고 호스트가 기간을 선택하게 함으로써 Luma + MyRealTrip 컨셉을 유지하면서도, 데모에서는 TNA 검색·조회·링크 생성에 집중해 구현 리스크를 낮춘다.

---

## 8. Proposal 상태 모델

| 상태 | 의미 |
|------|------|
| `draft` | 초안 작성 중 |
| `interest_check` | 커뮤니티 공유 후 관심/날짜/예산 반응 수집 중 |
| `option_refining` | 참여 신호 기반 여행 option set 조정 중 |
| `booking_open` | 실제 상품 링크 확인 가능 |
| `closed` | 모집 종료 |
| `cancelled` | 취소 |
| `archived` | 과거 제안 보관 |

---

## 9. 핵심 데이터 엔티티 (정식 정의)

> 인사이트 노트에서 도출된 의도/커뮤니티 필드는 모두 아래에 **정식 엔티티 필드로 승격**되었다. "추가할 필드 후보" 같은 임시 표현은 더 이상 사용하지 않는다. 타입힌트는 구현 참고용이며, 의도/커뮤니티 필드는 모두 nullable(미입력 허용)로 둔다.

### 9-1. Host

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| Host | `host_id` | uuid PK | host 식별자 |
| Host | `name` | text | host 표시명 |
| Host | `profile_image_url` | text? | 프로필 이미지 |
| Host | `community_name` | text | 커뮤니티명 |
| Host | `bio` | text? | 소개 |
| Host | `trust_note` | text? | 신뢰 근거(과거 활동/제안 톤) |

### 9-2. Community

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| Community | `community_id` | uuid PK | 커뮤니티 식별자 |
| Community | `name` | text | 커뮤니티명 |
| Community | `description` | text? | 설명 |
| Community | `category` | text? | 카테고리(사진/러닝/와인 등) |
| Community | `visibility` | enum(`public`/`unlisted`) | 노출 범위 (Phase 1은 unlisted 중심) |

### 9-3. TripProposal

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| TripProposal | `proposal_id` | uuid PK | 제안 식별자 |
| TripProposal | `host_id` | uuid FK | 작성 host |
| TripProposal | `community_id` | uuid FK | 대상 커뮤니티 |
| TripProposal | `slug` | text unique | URL slug (unlisted 접근 키) |
| TripProposal | `title` | text | 제안 제목 |
| TripProposal | `concept` | text | 한 줄 컨셉 |
| TripProposal | `target_audience` | text? | 누구에게 맞고 누구에게 애매한지 |
| TripProposal | `mood` | text? | 제안 톤/분위기 |
| TripProposal | `expected_dates` | text? | 예상 날짜 |
| TripProposal | `expected_budget` | text? | 예상 가격대 |
| TripProposal | `destination_candidates` | text[]? | 목적지 후보 |
| TripProposal | `status` | enum | 8절 상태 모델 |
| TripProposal | `visibility` | enum(`unlisted`/`public`) | 노출 범위 |
| TripProposal | `checked_at` | timestamptz? | 정보 확인 시점 |
| **TripProposal** | **`cover_image_url`** | **text?** | **커버이미지 (루마 create 대응). v2 신규** |
| **TripProposal** | **`recruit_capacity`** | **int?** | **모집인원 (루마 Capacity 대응). v2 신규** |
| **TripProposal** | **`requires_approval`** | **bool?** | **참여 승인 여부 (루마 Approval 대응). Phase 1은 표시·기록만. v2 신규** |
| **TripProposal** | **`community_intent`** | **text?** | **이번 여행의 목적 (사용자 노출: "이번 여행의 목적"). 인사이트 통합 필드** |
| **TripProposal** | **`intended_outcome`** | **text?** | **이 여행으로 우리 모임이 얻고 싶은 것 (배움/친밀감/회복/도전/창작/네트워킹/탐험/루틴 전환 등). 인사이트 통합 필드** |
| **TripProposal** | **`post_trip_artifact`** | **text?** | **이 여행이 끝나고 커뮤니티에 남아야 할 것 (사진/콘텐츠/프로젝트 아이디어/회고·발표/다음 모임/관계/학습 결과물). 인사이트 통합 필드** |
| **TripProposal** | **`relationship_depth`** | **enum?(`low`/`mid`/`high`)** | **이 여행이 지향하는 관계 깊이. 인사이트 통합 필드** |
| **TripProposal** | **`learning_or_creation_goal`** | **text?** | **이 여행에서 배우거나 만들고 싶은 것. 인사이트 통합 필드** |
| **TripProposal** | **`why_now`** | **text?** | **왜 지금인가 (계절성/행사/프로젝트 타이밍/모멘텀/번아웃·리셋/신규 멤버 유입). 인사이트 통합 필드** |

### 9-4. TravelOption

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| TravelOption | `option_id` | uuid PK | 옵션 식별자 |
| TravelOption | `proposal_id` | uuid FK | 소속 제안 |
| TravelOption | `option_name` | text | 옵션명(A/B/C 등) |
| TravelOption | `option_type` | enum(`basic`/`premium`/`budget`/`experimental`) | 옵션 유형 |
| TravelOption | `description` | text? | 옵션 설명 |
| TravelOption | `estimated_budget` | text? | 예상 가격대 |
| TravelOption | `fit_reason` | text? | 적합 근거 |
| TravelOption | `risk_note` | text? | 동선/취소/변경 리스크 |
| TravelOption | `sort_order` | int | 정렬 순서 |
| **TravelOption** | **`community_intent_fit`** | **text?** | **이 안이 커뮤니티 목적에 얼마나 맞는지. 인사이트 통합 필드** |
| **TravelOption** | **`relationship_depth`** | **enum?(`low`/`mid`/`high`)** | **이 안이 만드는 관계 깊이. 인사이트 통합 필드** |
| **TravelOption** | **`learning_or_creation_potential`** | **text?** | **이 안의 배움/창작 잠재력. 인사이트 통합 필드** |
| **TravelOption** | **`post_trip_artifact`** | **text?** | **이 안에서 남을 산출물(사진/데모/회고/다음 모임 등). 인사이트 통합 필드** |
| **TravelOption** | **`schedule_difficulty`** | **enum?(`low`/`mid`/`high`)** | **일정 난이도. 인사이트 통합 필드** |

### 9-5. ProductLink

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| ProductLink | `product_link_id` | uuid PK | 링크 식별자 |
| ProductLink | `option_id` | uuid FK | 소속 옵션 |
| ProductLink | `product_type` | enum(`flight`/`stay`/`tna`) | 상품 유형 (항공/숙소/투어·티켓·액티비티) |
| ProductLink | `source` | text | 판매처 |
| ProductLink | `myrealtrip_product_id` | text? **nullable** | API 연동 전에는 null. 확정 결정 3 참조 |
| ProductLink | `title` | text | 상품 표시명 |
| ProductLink | `price_hint` | text? | 가격 힌트 |
| ProductLink | `reason` | text? | 추천 사유 |
| ProductLink | `caution` | text? | 주의사항 |
| ProductLink | `source_url` | text | manual 입력 URL (확정 결정 3) |
| ProductLink | `mylink_url` | text? | 마이링크/제휴 링크 |
| ProductLink | `checked_at` | timestamptz? | 가격/예약가능 확인 시점 |
| ProductLink | `status` | enum | 링크 상태 |

### 9-6. InterestSignal

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| InterestSignal | `signal_id` | uuid PK | 신호 식별자 |
| InterestSignal | `proposal_id` | uuid FK | 대상 제안 |
| InterestSignal | `option_id` | uuid FK? nullable | 대상 옵션(옵션 투표 시) |
| InterestSignal | `participant_session_id` | text | 익명 세션 식별자 (확정 결정 1·4) |
| InterestSignal | `response_type` | enum(`interested`/`date_dependent`/`price_dependent`/`voted_option`/`question`/`not_interested`) | 반응 유형 |
| InterestSignal | `preferred_dates` | text? | 선호 날짜 |
| InterestSignal | `preferred_budget` | text? | 선호 예산 |
| InterestSignal | `comment` | text? | 선택 코멘트 (이름/이메일 미수집) |
| **InterestSignal** | **`response_reason`** | **text?** | **왜 그렇게 반응했는지 (참여/거절 사유). 인사이트 통합 필드** |
| **InterestSignal** | **`intent_resonance`** | **text?** | **어떤 의도/목적에 공감했는지 (host dashboard 의도 태그 집계 입력). 인사이트 통합 필드** |
| **InterestSignal** | **`objection_type`** | **enum?(`date`/`budget`/`destination`/`companions`/`other`)** | **거절·망설임의 유형. 인사이트 통합 필드** |

### 9-7. ClickEvent

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| ClickEvent | `event_id` | uuid PK | 이벤트 식별자 |
| ClickEvent | `proposal_id` | uuid FK | 대상 제안 |
| ClickEvent | `option_id` | uuid FK? | 대상 옵션 |
| ClickEvent | `product_link_id` | uuid FK | 클릭된 링크 |
| ClickEvent | `product_type` | enum(`flight`/`stay`/`tna`) | 상품 유형 |
| ClickEvent | `clicked_at` | timestamptz | 클릭 시각 |
| ClickEvent | `referrer` | text? | 유입 경로 |
| ClickEvent | `device_type` | text? | 기기 유형 |
| ClickEvent | `browser` | text? | 브라우저 |
| ClickEvent | `utm_*` | text? | utm 필드 묶음 |
| ClickEvent | `redirect_url` | text | redirect 대상 |

### 9-8. PerformanceSnapshot

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| PerformanceSnapshot | `proposal_id` | uuid FK | 대상 제안 |
| PerformanceSnapshot | `option_id` | uuid FK? | 대상 옵션 |
| PerformanceSnapshot | `views` | int | 조회 수 |
| PerformanceSnapshot | `interested_count` | int | 관심 수 |
| PerformanceSnapshot | `vote_count` | int | 투표 수 |
| PerformanceSnapshot | `booking_clicks` | int | 예약 클릭 수 |
| PerformanceSnapshot | `product_clicks_by_type` | jsonb | flight/stay/tna별 클릭 |
| PerformanceSnapshot | `top_option_id` | uuid? | 최다 반응 옵션 |
| PerformanceSnapshot | `conversion_notes` | text? | 전환 메모 |
| **PerformanceSnapshot** | **`intent_resonance_tags`** | **jsonb?** | **어떤 의도/목적에 반응이 집중됐는지 집계 (InterestSignal.intent_resonance 롤업). host dashboard 의도 태그용. 인사이트 통합 필드** |

### 9-9. BookingProgress (v2 신규 — 그룹 예약 진행 / Booking Signal Sync)

> 그룹이 수렴한 옵션에 대해 각 참여자가 항목별로 어디까지 진행했는지 추적한다. 이것은 **Booking Signal Sync / Conversion Feedback Loop**의 저장 단위다 — 관심 신호에서 끝나지 않고 booking_open 이후 클릭·예약의사·예약완료 신호를 proposal로 되먹여 호스트·에이전트가 실제 모집 상황을 운영하게 한다.
>
> **핵심 안전경계(절대 침범 금지):** 아워리얼트립은 affiliate 구조이며 merchant가 아니다. MyRealTrip이 webhook/postback/partner reporting API/reservation status lookup을 제공하기 전에는 **외부 검증된 결제완료를 알 수 없다.** 따라서 시스템이 확실히 아는 것은 링크 클릭, 예약 의사, 참여자 자가보고, 호스트 확인까지다. `externally_confirmed_booked`(외부 검증 결제완료)는 **외부 전환 API/postback이 실제 연결될 때만** 도달 가능하며, 그 전까지는 어떤 사용자/호스트 입력으로도 강제할 수 없다(§9-9-3). "결제완료"를 외부 검증 없이 단정하지 않는다.

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| BookingProgress | `progress_id` | uuid PK | 진행 식별자 |
| BookingProgress | `proposal_id` | uuid FK | 대상 제안 |
| BookingProgress | `option_id` | uuid FK | 수렴된 옵션 |
| BookingProgress | `product_link_id` | uuid FK | 대상 상품 링크 |
| BookingProgress | `participant_session_id` | text | 익명 세션 식별자 |
| BookingProgress | `status` | enum(§9-9-1) | 진행 상태 |
| BookingProgress | `source` | enum(§9-9-2) | 신호 출처 (이 status가 어디서 왔는지) |
| BookingProgress | `confidence` | enum(`low`/`medium`/`high`/`verified`) | 신호 신뢰도. `verified`는 `source=external_api`일 때만 |
| BookingProgress | `note` | text? | host_confirmed/external 입력 시 근거 메모(선택) |
| BookingProgress | `updated_at` | timestamptz | 갱신 시각 |

#### 9-9-1. status enum (7-state — 핸드오프 2026-05-30 확정)

> `interested`/`voted`(관심·옵션투표)는 이 엔티티가 아니라 **InterestSignal**(9-6)에 산다. BookingProgress는 booking_open 이후의 **예약 퍼널**만 담는다.

| status | 의미 | 도달 가능 출처(source) |
|--------|------|------------------------|
| `pending` | 미진행 (장바구니에 있으나 클릭/예약 안 함). 행 미존재도 pending으로 간주 | internal |
| `clicked_booking_link` | `/go/[product_link_id]` 제휴 redirect 발생 (MyRealTrip 링크 클릭) | redirect_tracking |
| `booking_intent` | 예약하러 감/예약 예정 — 참여자가 의사 표시 | participant_self_report |
| `self_reported_booked` | 참여자가 "예약했어요" 자가표시 | participant_self_report |
| `host_confirmed_booked` | 호스트가 참여자 예약 완료를 수동 확인 | host_manual |
| `externally_confirmed_booked` | MyRealTrip postback/reporting API/reservation lookup으로 검증된 결제완료 | **external_api 전용** |
| `cancelled_or_refunded` | 취소/환불 확인 | participant_self_report / host_manual / external_api |

원칙(불변):
- `clicked_booking_link` ≠ `paid`. 클릭은 의도 신호일 뿐 결제가 아니다.
- `self_reported_booked` ≠ `externally_confirmed_booked`. 자가보고는 외부 검증이 아니다.
- `host_confirmed_booked`도 외부 검증이 아니다(호스트의 사람 판단). `externally_confirmed_booked`보다 낮은 신뢰도.
- 단조 전진이 기본이나 `cancelled_or_refunded`는 어느 상태에서든 분기 가능. 자가표시 취소(self_reported → clicked/intent 역행)는 허용, `pending` 직접 역행은 두지 않는다.

#### 9-9-2. source enum (신호 출처 — UI에 항상 표시)

| source | 의미 | 신뢰도 상한 |
|--------|------|-------------|
| `internal` | OurRealTrip 내부 상태(pending 등) | low |
| `redirect_tracking` | `/go` 클릭 추적 | medium |
| `participant_self_report` | 참여자 자가 입력 | medium |
| `host_manual` | 호스트 수동 확인 | high |
| `external_api` | MyRealTrip 외부 전환 API/postback/리포트 | verified |

- UI(장바구니·host dashboard)는 status뿐 아니라 **source/confidence를 함께 렌더**한다. "예약완료(자가보고)"와 "예약완료(외부검증)"를 시각적으로 구분한다.
- `confidence=verified` 배지는 `source=external_api`에서만 표시 가능.

#### 9-9-3. 외부 검증 ingestion 경계 (Phase 게이트 — 현재 미연결)

- `externally_confirmed_booked` + `source=external_api`로의 전이는 **오직** 외부 전환 ingestion 경로(MyRealTrip webhook/postback/reporting API/reservation status lookup)를 통해서만 일어난다.
- **현재 그 API의 존재가 확인되지 않았다.** 따라서 이 경로는 코드상 stub(미연결)로 두고, 자가표시 API(`/api/booking-progress`)·`/go`·호스트 확인 어디서도 `externally_confirmed_booked`를 **세팅할 수 없다**(거부). 구조적으로 "결제완료 자동 반영" 과장을 차단한다.
- MyRealTrip conversion API/postback의 존재·스펙이 **실측 검증되면**(PRD 18절 갱신과 함께) ingestion 어댑터를 연결하고, 그때 비로소 `externally_confirmed_booked`로 승격한다. 그 전까지 호스트 dashboard 최상위 검증 상태는 `host_confirmed_booked`(high)다.

### 9-10. Itinerary / ItineraryDay (v2 신규 — 일정표)

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| Itinerary | `itinerary_id` | uuid PK | 일정표 식별자 |
| Itinerary | `proposal_id` | uuid FK | 소속 제안 |
| ItineraryDay | `day_no` | int | Day 번호(Day1/Day2 …) |
| ItineraryDay | `date` | date? | 해당 날짜(미정 허용) |
| ItineraryDay | `title` | text | 그 날 타이틀 |
| ItineraryDay | `items` | jsonb[] | 항목 배열 — 각 item: `{ time?, title, product_link_id? }` |

### 9-11. DiscoverCategory (v2 신규 — Discover 택소노미)

| 엔티티 | 필드 | 타입힌트 | 설명 |
|--------|------|----------|------|
| DiscoverCategory | `category_id` | uuid PK | 카테고리 식별자 |
| DiscoverCategory | `key` | text | 카테고리 키(사진/빌더/러닝/웰니스/미식/서핑 등) |
| DiscoverCategory | `label` | text | 표시 라벨 |
| DiscoverCategory | `icon` | text? | 아이콘 |
| DiscoverCategory | `sort_order` | int | 정렬 순서 |

### 9-12. Cart (파생 — 별도 테이블 아님)

> Cart는 **별도 테이블이 아니라 파생 뷰**다. "수렴된 `option_id` + `InterestSignal(voted_option)` 집계 + `BookingProgress`"로 계산해서 공동 여행 장바구니(2-A절)를 구성한다. 별도 cart 테이블·체크아웃·주문 엔티티를 만들지 않는다(merchant 아님).

---

## 10. Host Creation Flow (정식 — v2 전면 개정: 루마 /create식 + AI-create)

proposal 생성 화면(`/host/trips/new`)은 루마 `/create`식 **단일 화면 폼**으로 재설계한다. 원칙은 **"사람이 큐레이션, API가 그라운딩"** — AI는 실재하는 상품만 가져오고, 최종 결정(셀렉/편집/제외)은 호스트가 한다.

### 10-1. 단일 화면 폼 입력 항목 (루마 create 차용)

| 입력 | 저장 필드 | 비고 |
|------|-----------|------|
| 커버이미지 / 테마 | `cover_image_url` | 루마 테마/커버 대응 |
| 트립명 (컨셉) | `title` / `concept` | |
| 시작일 · 종료일 | `expected_dates` (+ Itinerary 날짜) | Start/End |
| 목적지 | `destination_candidates` | AI 그라운딩 입력 |
| 일정 개요 | Itinerary/ItineraryDay 초안 | Day1/Day2 구조 |
| 모집인원 | `recruit_capacity` | 루마 Capacity |
| 승인 여부 | `requires_approval` | 루마 Approval (Phase 1은 표시·기록만) |

**의도 질문 4개 (정식 — 폼 내 포함, 선택/skip 가능, 번역 카피로 노출):**

| # | 사용자 노출 질문(번역 카피) | 저장 필드 | 보기 예시 |
|---|----------------------------|-----------|-----------|
| 1 | 이 여행으로 우리 모임이 얻고 싶은 게 뭔가요? (`intended_outcome`) | `intended_outcome` (+ `community_intent`) | 배움 / 친밀감 / 회복 / 도전 / 창작 / 네트워킹 / 탐험 / 루틴 전환 |
| 2 | 이 여행은 누구에게 열려 있나요? (`target_audience`) | `target_audience` | 기존 멤버만 / 비슷한 관심사의 신규 멤버 / 초대받은 사람만 / 공개 모집 |
| 3 | 이 여행이 끝나고 우리 모임에 남았으면 하는 건 뭔가요? (`post_trip_artifact`) | `post_trip_artifact` | 사진·콘텐츠 / 프로젝트 아이디어 / 회고·발표 / 다음 모임 / 멤버 간 관계 / 학습 결과물 |
| 4 | 왜 지금인가요? (`why_now`) | `why_now` | 계절성 / 행사·페스티벌 / 프로젝트 타이밍 / 모임 모멘텀 / 번아웃·리셋 / 신규 멤버 유입 |

주의: 질문 2의 보기 중 "기존 멤버만 / 초대받은 사람만"은 Phase 1에서 **표시·기록만** 한다. 실제 접근 제어(community_only)는 후순위다(확정 결정 5).

### 10-2. AI 그라운딩 파이프라인 (생성 submit 시)

호스트가 폼을 submit하면 아래 그라운딩 파이프라인이 실행된다. 무인증 MCP(`mcp-servers.myrealtrip.com/mcp`, 18절)만으로 동작한다.

1. 목적지로 `getCategoryList(city)` 호출 → 유효 카테고리 확보
2. `searchTnas(query, category)` / `searchStays(keyword, checkIn, checkOut)` / `searchInternationalFlights(ICN→공항)` 로 **실상품·실가격** 조회
3. 실데이터로 A/B/C TravelOption 조합을 **자동 생성** (옵션마다 ProductLink 후보 묶음 포함)
4. 호스트가 **셀렉 / 편집 / 제외** (사람이 최종 큐레이션)
5. 발행 (`draft → interest_check`)

원칙: **사람이 큐레이션, API가 그라운딩.** AI는 실재 상품만 가져오고, 목적지·커뮤니티·최종 옵션 구성은 호스트가 결정한다.

---

## 11. Host Dashboard (정식)

`/host` dashboard는 관심 신호 수치뿐 아니라 **"어떤 의도/목적에 반응했는지"를 보는 태그/집계**를 정식 포함한다.

- 기본 지표: proposal별 view, 관심 수, 투표 수, 질문 수, booking_open 이후 product link CTR
- **의도 반응 태그/집계 (정식)**: `InterestSignal.intent_resonance` + `response_reason` + `objection_type`을 집계해, 참여자가 어떤 목적(배움/친밀감/회복/창작 등)에 가장 반응했는지, 어떤 사유로 망설였는지(날짜/예산/목적지/동행)를 태그·막대로 보여준다. `PerformanceSnapshot.intent_resonance_tags`로 롤업.
- **카트/예약 진행현황 (v2 신규 — Booking Signal Sync)**: 어떤 옵션이 장바구니로 수렴됐는지, 항목별 BookingProgress 예약 퍼널(클릭 → 예약의사 → 자가 예약완료 → 호스트 확인 → [외부검증])을 **출처/신뢰도(source/confidence) 병기**로 보여준다. "참여자 자가보고 + 클릭추적 기준"임을 명시한다. 호스트는 자가보고를 **수동 확인(host_confirmed_booked)**으로 승격할 수 있으나, 외부 검증(externally_confirmed_booked)은 MyRealTrip 전환 API 연결 전에는 표시되지 않는다(§9-9-3).
- 이 집계는 다음 proposal의 option set 조정과 카피 수정의 입력이 된다.

---

## 12. MVP 화면

**Public / Participant**
1. `/discover` (또는 `/`를 discover로): 루마 discover 차용 — **카테고리**(사진/빌더/러닝/웰니스/미식/서핑 등 아이콘+건수) + **도시별 인기 트립**(커버카드+참여수) + **커뮤니티 구독**(Featured Calendars). DiscoverCategory 기반.
2. `/trips/[slug]`: Trip Proposal Detail — v2 재설계(6절 anatomy): 커버 → 호스트 → RSVP/관심 먼저 → "N명 참여의향" 소셜프루프 → Why This Trip → 일정표(Day1/Day2) → 공동 장바구니(수렴 옵션) + 각자예약 가이드 + 그룹 진행현황 → Decision Helpers → 고지
3. RSVP/Interest modal 또는 `/trips/[slug]/respond`
4. `/go/[product_link_id]`: 클릭 기록 후 외부 링크 redirect (복귀 후 "예약 완료" 자가표시로 BookingProgress 갱신)
5. `/disclosure`: 고지/정책

**Host**
6. `/host`: host dashboard (의도 반응 태그 + 카트/예약 진행현황 포함, 11절)
7. `/host/trips/new`: proposal 생성 — 루마 create식 단일 폼 + AI-create 그라운딩 (10절)
8. `/host/trips/[proposal_id]`: proposal 관리, 상태 변경, option/product link 관리

---

## 13. MVP 포함 범위

- 모바일 우선 웹앱
- Discover 화면 (카테고리 + 도시별 인기 트립 + 커뮤니티 구독)
- Trip Proposal 생성 (루마 create식 단일 폼 + 의도 질문 4개 포함)
- Trip Proposal 공개 URL (unlisted slug)
- Host/Community 정보 표시 (커버이미지 포함)
- 관심/투표/질문 수집 (익명 세션) + "N명 참여의향" 소셜프루프
- Travel Option Set 표시 (커뮤니티 의도 차원 포함)
- 일정표 (Day1/Day2)
- 공동 여행 장바구니 (수렴 옵션 함께보기 뷰) + 각자예약 가이드
- 그룹 예약 진행현황 (BookingProgress — 자가보고 + 클릭추적 기준)
- booking_open 상태에서 상품별 **독립 CTA** (단일 묶음결제 버튼 없음)
- 클릭 추적
- 제휴/경제적 이해관계 고지 (장바구니 함께보기용 고지 포함)
- 마이리얼트립 상품 링크 연결 가능 구조
- host/admin용 간단 dashboard (의도 반응 태그 + 카트/예약 진행현황 포함)
- checked_at / 상태 관리

---

## 14. MVP 제외 범위

- 앱스토어 네이티브 앱
- 결제 (아워리얼트립의 결제 수취 일절 금지 — merchant 아님)
- 단일 묶음결제 / 묶음 단일결제 버튼
- 호스트 정산 (타인 돈 수취)
- 예약 대행
- 실시간 단체 예약 확정
- 크리에이터 정산
- 하위 파트너 모집
- 참여자 캐시백/리워드
- 실시간 최저가 보장
- 완전 자동 발행
- 마이리얼트립 공식 서비스처럼 보이는 UI/문구
- "전체 예약하기" 단일 CTA
- 패키지 상품 판매
- 별도 cart 테이블 / 체크아웃 / 주문 엔티티 (장바구니는 파생 뷰일 뿐)
- community_only 접근 제어 (후순위, 확정 결정 5)

---

## 15. UX 원칙

1. **Event-first**: 상품보다 여행 제안이 먼저다.
2. **Host-led**: 누가 여는가가 신뢰의 핵심이다.
3. **Interest before booking**: 바로 예약이 아니라 관심/투표/질문을 먼저 받는다.
4. **Option set, not product list**: 상품 나열이 아니라 여행 운영안 A/B/C로 보여준다.
5. **Shared cart, individual booking**: 수렴된 옵션의 상품 묶음을 **공동 장바구니(함께보기 뷰)**로 묶어 보여주되, 결제·예약은 항공/숙소/TNA **각각 독립 CTA로 상품별·각자·판매처에서** 진행한다. 단일 묶음결제 버튼·우리 결제수취는 금지.
6. **Not a merchant**: 아워리얼트립은 결제를 받지 않는다. 장바구니는 코디네이션이지 체크아웃이 아니며, 진행현황은 자가보고 + 클릭추적 기준이다.
7. **Community signal matters**: 관심 수, 투표, 질문, 예산 반응, **의도 반응**이 상품 조합 개선에 반영된다.
8. **No official confusion**: 마이리얼트립 공식 서비스처럼 보이면 안 된다.
9. **No package confusion**: 전체 예약/패키지 구매처럼 보이면 안 된다.
10. **Intent, translated**: 의도/목적은 노출하되 철학어가 아니라 사용자 언어로 번역해서 보여준다.
11. **Human-curated, data-grounded**: 목적지·커뮤니티는 host의 판단이 정한다. API/MCP는 그 선택을 실제 예약 가능한 상품·가격으로 **그라운딩**하는 레이어이지, 목적지를 *고르는* 도구가 아니다.

---

## 16. 금지 방향 (Negative Spec — 반드시 준수)

다음 방향은 절대 구현 금지다.

- 일반 여행 추천 앱
- AI 여행 챗봇
- 최저가 딜 앱
- 항공/숙소/TNA 단순 검색 UI
- Luma UI 클론
- 예쁜 여행 이벤트 랜딩페이지만 만드는 것
- 팬덤/낭만만 있는 여행 컨셉
- "여행 같이 가요" 커뮤니티 게시판
- 마이리얼트립 공식 서비스처럼 보이는 것 (공식 오인)
- 여행 패키지 모집처럼 보이는 것 (패키지 오인)
- 수익 보장 / 부업 강의처럼 보이는 것
- API 호출만 보여주는 해커톤 데모
- 철학만 있고 구현 안 되는 컨셉 (반드시 엔티티/플로우로 내려야 함)
- **merchant / PG로 동작하는 것** (아워리얼트립은 merchant가 아니다 — 결제 수취·여행업 등록·배상책임 영역 진입 금지)
- **단일 묶음결제 / 묶음 단일결제** (마이리얼트립에 장바구니/주문생성/묶음결제 API가 없음)
- **호스트 정산 (타인 돈 수취)** — 호스트가 멤버 돈을 받아 대신 결제하는 구조 금지

---

## 17. 신뢰/고지 원칙 (Negative Spec — 반드시 준수)

### 17-1. 필수 고지 7종 (반드시 표현 가능해야 함)

1. 아워리얼트립은 마이리얼트립 공식 서비스가 아니다.
2. 일부 링크를 통해 예약이 발생할 경우 운영자에게 수익이 발생할 수 있다.
3. 상품 가격과 예약 가능 여부는 확인 시점 이후 변경될 수 있다.
4. 아워리얼트립은 항공·숙소·투어 상품을 직접 판매하거나 예약을 대행하지 않는다.
5. 조합형 여행안은 참고용 편성이며 패키지 상품이 아니다.
6. 각 상품은 판매처에서 독립적으로 확인하고 구매한다.
7. **장바구니는 함께 보기용입니다. 결제·예약은 각 판매처에서 개별적으로 진행되며, 아워리얼트립은 결제를 받지 않습니다.** (v2 신규)

### 17-2. 금지 문구 (어느 산출물에도 등장 금지)

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

> 제3자(마이리얼트립) **상품 제목·설명에 포함된 프로모션·특가 강조 문구**는 OurRealTrip 화면에 표기할 때 **중립화**한다 — 우리가 그 주장을 하는 것처럼 보이면 안 된다. (실데이터 그라운딩에서 실제 상품 제목에 특가 강조 문구가 포함된 사례 확인됨. 2026-05-30.)

### 17-3. CTA 규칙 (v2 정교화)

- 수렴된 옵션의 상품 묶음은 **공동 장바구니(함께보기 뷰)**로 묶어 보여주되, **결제는 상품별·각자·판매처에서** 진행한다.
- 항공/숙소/TNA는 **각각 독립 CTA**(항목별 "내 예약" 버튼 → `/go/[product_link_id]`)를 가진다.
- **단일 묶음결제 버튼·우리 결제수취는 금지**다. ("전체 예약" 단일 CTA 금지의 정교화 — 이전 "독립 CTA만 / 전체예약 금지"를 장바구니 모델에 맞춰 갱신.)

### 17-4. 사용자-facing 카피 규칙

- 내부 전략어("대학 언번들링", "AI 네이티브 탤런트")는 사용자 화면·복사·메타에 절대 노출 금지.
- 의도/목적은 "우리 모임이 같이 움직일 이유", "이 여행이 끝나고 남을 것", "이번 여행의 목적"처럼 번역해서 쓴다.

---

## 18. 마이리얼트립 API/MCP 활용 방향 (실측 기준 2026-05-30)

> 아래는 추정이 아니라 `docs.myrealtrip.com` 공개 문서 + 무인증 MCP 서버를 직접 호출·검증한 결과다. Phase 2 "API 연동"은 막힌 가정이 아니라 **문서화된 검증 경로**다.

### 18-1. 원칙: 사람이 큐레이션, API가 그라운딩

목적지·커뮤니티는 host의 판단이 정한다. API/MCP는 그 선택을 **실제 예약 가능한 상품·가격으로 받쳐주는 그라운딩 레이어**이지, 목적지를 *고르는* 도구가 아니다. API 기반 사실 / LLM 추론 / Host 입력 / Participant signal을 명확히 구분한다.

### 18-2. 무인증 MCP 서버 (Phase 1부터 사용 가능, 키 불필요)

- 엔드포인트: `https://mcp-servers.myrealtrip.com/mcp` (Streamable HTTP JSON-RPC, **별도 인증 없이** 연결)
- 도구: `searchTnas(query[,category,sort])`, `getCategoryList(city)`, `getTnaDetail/Options`, `searchStays(keyword,checkIn,checkOut,…)`, `getStayDetail`, `searchInternationalFlights/Domestic`, `flightsFareCalendar`, `getPromotionAirlines`, `getCurrentTime`
- 용도: proposal 작성 시 목적지의 실제 상품·가격·운임을 조회해 Travel Option/ProductLink 후보를 그라운딩.
- ⚠️ 검색은 **키워드-리터럴**(의미 기반 아님). 커뮤니티 니치 의도를 verbatim 검색하지 말고 `{도시}+광역 카테고리`로 질의 후 큐레이션. `getCategoryList(city)`로 유효 category 확보 → `searchTnas(query, category)` 필터.
- `searchTnas` 응답은 widget UI 트리 → 상품 제목/가격은 Text 노드, 상품 URL은 item `onClickAction.url`(=`experiences.myrealtrip.com/products/{gid}`)에서 추출.
- ⚠️ 커버리지: 마리트는 **아시아 outbound 중심**. 미국령(하와이 등)은 TNA 0건일 수 있음 → 그런 목적지는 ProductLink를 manual URL로 채운다(확정 결정 3).

### 18-3. Partner External API (파트너 키 필요, Phase 2+)

- base: `https://partner-ext-api.myrealtrip.com`, 인증 `Authorization: Bearer <API_KEY>`
- 상품검색: `POST /v1/products/{tna,accommodation,flight}/...`
- **수익화: `POST /v1/mylink`** (targetUrl≤2000자 → 제휴 단축링크 `myrealt.rip/XXX`) → `ProductLink.mylink_url` 채움
- 성과: `GET /v1/revenues`, `/v1/reservations`
- productCategory enum(ACCOMMODATION/HOTEL_V2/TOUR/ACTIVITY/TICKET/PACKAGE/FLIGHT/TRANSPORTATION_V2/THEME_PARK…) ↔ `ProductLink.product_type`(flight/stay/tna) 매핑

### 18-4. 실세계 의존성 (Vivi 액션 필요)

- API 키 = **마이리얼트립 마케팅 파트너 계정** 식별자. `partner.myrealtrip.com` 가입·승인 후 발급. 마이링크 생성·수익 리포트(=실제 제휴 수익)는 이 키가 있어야 동작.
- Phase 1(데모/그라운딩)은 **무인증 MCP로 충분** → 키 없이 진행 가능. 키는 실제 수익화 시점에 확보.

### 18-5. 외부 전환 검증 ingestion (Booking Signal Sync `externally_confirmed_booked` 게이트)

> `BookingProgress.status=externally_confirmed_booked`(§9-9-3)는 **이 경로를 통해서만** 도달 가능하다. 그 전까지는 어떤 입력으로도 세팅 불가(코드상 stub).

후보 경로(파트너 키 필요, 18-3):
- `GET /v1/reservations` — 예약 상태 조회 (reservation status lookup 후보)
- `GET /v1/revenues` — 제휴 전환/수익 리포트 (postback/reporting 후보)

⚠️ **미검증 — 단정 금지.** 위 엔드포인트가 존재한다는 것과, 그것이 **OurRealTrip이 발급한 mylink 클릭을 특정 참여자 세션의 결제완료로 귀속(attribution)**시켜 돌려줄 수 있는지는 별개다. 다음이 실측 확인되어야 ingestion 어댑터를 연결한다:
1. mylink별/캠페인별 전환을 식별 가능한 식별자(우리가 `/go`에서 심는 ref)가 리포트에 되돌아오는가
2. 응답이 결제완료/취소·환불을 구분하는가
3. 개인 식별정보 없이 익명 세션 단위로 매칭 가능한가 (확정 결정 4 — 익명성 보존)

확인 전: ingestion 어댑터는 stub(미연결). 호스트 dashboard 최상위 검증 상태는 `host_confirmed_booked`(high). 확인 후: 어댑터 연결 + 18절 갱신 + `externally_confirmed_booked`(verified) 승격. 이 단계는 **외부 부작용/키 사용 — Vivi 확인 필요**.

---

## 19. 성공 지표

**Host**
- 생성된 Trip Proposal 수
- `draft → interest_check` 전환율
- `interest_check → booking_open` 전환율
- host 재사용률
- proposal 공유 수
- dashboard 재방문률

**Participant**
- proposal page view
- interest click rate
- vote participation rate
- question/comment rate
- booking_open 이후 product link CTR

**Commerce**
- product link clicks
- option별 click rate
- product_type별 click rate: flight / stay / tna
- 마이링크 클릭 수
- 제휴 성과 리포트 연결 가능성

**Trust (Negative Spec 검증 지표 — 모두 0건이어야 함)**
- 고지 노출 누락 0건
- "전체 예약" CTA 0건
- 공식 오인 문구 0건
- 패키지 오인 문구 0건
- 오래된 `checked_at` 상품을 명확히 표시

**Intent (인사이트 반영 지표)**
- 의도 질문 4개 입력률
- 의도 반응 태그 수집률 (intent_resonance)

---

## 20. 확정된 결정

> HANDOFF.md의 "남은 결정 질문" 5건은 아래 확정 결정으로 **대체**되었다. 더 이상 열린 질문이 아니다.

| # | 영역 | 확정 결정 |
|---|------|-----------|
| 1 | 인증 | host/admin은 **Supabase Auth 로그인**. 참여자는 **로그인 없는 익명 세션**(쿠키 기반 `participant_session_id`). |
| 2 | 데모 커뮤니티 3건 | (1) 고즈넉한 사진 촬영 커뮤니티 × 교토 (2) AI 빌더 무브+해커톤 리트릿 × 발리(우붓/짱구) (3) 서핑·액티비티 커뮤니티 × 하와이. **목적지는 host가 큐레이션, 상품은 MCP/API로 그라운딩**(15절 원칙 10·18절). 실데이터 검증 완료(2026-05-30). |
| 3 | API 연동 전 ProductLink | **manual URL**(`source_url`) + `myrealtrip_product_id` **nullable**. API 연동 시 채운다. |
| 4 | 참여자 정보 | **이름/이메일 수집 안 함.** 익명 세션 + **선택 코멘트만**. |
| 5 | 접근 제어 | Phase 1은 **unlisted URL(slug)로 충분**. `community_only` 접근 제어는 **후순위**. |

### 데모 커뮤니티 3건 상세 (실데이터 그라운딩 2026-05-30)

| 커뮤니티 (의도) | 목적지 | 그라운딩 경로 | 예시 slug |
|----------------|--------|--------------|-----------|
| 고즈넉한 사진 촬영 커뮤니티 | 교토 | ✅ **API 그라운딩** — TNA 풍부(사진촬영 포함 버스투어 ⭐4.9·46,550원~), ICN→KIX 운임 확보 | `/trips/kyoto-quiet-photo-walk` |
| AI 빌더 무브+해커톤 리트릿 (자율 코딩 루프 해커톤 + 런클럽/헬스/명상) | 발리 우붓·짱구 | ✅ **API 그라운딩** — 우붓 전일투어 92,073원·우붓 프라이빗 20,008원·짱구 요가 24,551원, ICN→DPS 운임 확보 | `/trips/bali-builder-move-retreat` |
| 서핑·액티비티 커뮤니티 | 하와이 오아후 | ⚠️ **manual URL 폴백 시연** — 마리트 TNA 0건·항공 고가(ICN→HNL ~₩836K). ProductLink는 host 수동 입력(서핑스쿨 등, `myrealtrip_product_id=null`) | `/trips/hawaii-surf-week` |

> 발리 커뮤니티 메모: "랄프우드"는 host가 운영하는 빌더 모임의 행사 컨셉 — **자율 코딩 루프 기반 해커톤 + 사전 운동(런클럽/헬스)·명상**을 발리 우붓/짱구에서 묶는다. 인사이트 노트의 "AI 빌더가 외부 자극을 받으러 발리로" 예시와 동일 결. 사용자-facing 카피는 철학어 없이 "낮엔 같이 만들고, 아침엔 같이 뛰고, 사이엔 비우는 빌더들의 발리 위크"처럼 번역.

---

## 21. 구현 우선순위 (Phase 1~4 — v2 조정)

> v2 조정: 기존 Phase 3의 AI 옵션생성을 **Phase 1-2로 당겼다.** 무인증 MCP가 키 없이 실상품·실가격을 반환함이 검증됐기 때문(18절). Phase 1은 공동장바구니·진행현황·일정표·discover·호스트 create(수동), Phase 2는 AI-create 그라운딩 자동조합 + mylink(파트너키)이다.

### Phase 1. Static / Manual MVP + 공동 장바구니 core UX
API 완전 연동 전 core UX 검증. 호스트 create는 **수동** 입력 흐름.
- Discover 화면 (카테고리 + 도시별 인기 트립 + 커뮤니티 구독)
- Trip Proposal 수동 생성 (루마 create식 단일 폼 + 의도 질문 4개 포함, 호스트 수동 큐레이션)
- Travel Option 수동 입력 (커뮤니티 의도 차원 포함)
- ProductLink 수동 입력 (manual URL + myrealtrip_product_id nullable)
- 일정표 (Day1/Day2, Itinerary/ItineraryDay)
- **공동 여행 장바구니** (수렴 옵션 함께보기 뷰) + 각자예약 가이드
- **그룹 예약 진행현황** (BookingProgress — 자가보고 + 클릭추적)
- RSVP / interest / vote 수집 (익명 세션, response_reason·intent_resonance·objection_type 포함) + "N명 참여의향" 소셜프루프
- 클릭 추적
- Host dashboard 기본 지표 + 의도 반응 태그 + 카트/예약 진행현황
- 고지 페이지 (장바구니 함께보기용 고지 포함)
- 데모 커뮤니티 3건 seed (교토·발리·하와이, 20절)

### Phase 2. AI-create 그라운딩 자동조합 + MYR API/MCP 연동
- **AI-create 그라운딩 파이프라인 (10-2절)**: 목적지 → `getCategoryList(city)` → `searchTnas`/`searchStays`/`searchInternationalFlights` → 실상품·실가격으로 A/B/C 옵션 **자동 조합** → 호스트 셀렉/편집/제외 → 발행
- 목적지/카테고리 기반 상품 검색 (무인증 MCP)
- TNA 상품 연결
- product link 자동 후보 생성 (myrealtrip_product_id 채우기)
- **mylink(파트너키)**: `POST /v1/mylink`로 제휴 단축링크 생성 → `ProductLink.mylink_url` 채움 (파트너 키 확보 시)
- checked_at 관리
- API 기반 사실과 LLM 추론 분리

### Phase 3. AI MD / Copy Generation
- 여행 제안 제목 생성
- 초대 문구 생성
- 옵션별 community_intent_fit·fit reason / risk note 생성 보강
- 참여 반응(의도 태그 포함) 기반 다음 액션 추천

### Phase 4. Performance Learning
- option별 관심/클릭 성과
- product type별 CTR
- host dashboard 개선
- 다음 여행 제안 추천
- 커뮤니티별 취향/예산/**의도 패턴** 학습

---

## 22. 권장 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth: **host/admin만** (확정 결정 1)
- 공개 참여자: 로그인 없는 익명 세션 (쿠키 `participant_session_id`)
- Vercel 배포
- `/go/[product_link_id]` redirect 기반 클릭 추적

---

## 23. 구현 에이전트 최상위 지시문

```text
You are implementing OurRealTrip / 아워리얼트립.

Do not implement a generic travel recommendation app.
Do not implement a Luma clone.
Do not implement a package travel booking service.

The product is a community travel commerce workspace:
hosts/community organizers create trip proposal pages, capture their community's
intent (purpose, intended outcome, what should remain after the trip, why now),
collect interest/votes/questions from their communities, then — once the group
converges on one option — show that option's product bundle as a SHARED TRIP CART
(a coordination / view-together surface, NOT a checkout).

Commerce model — NOT a merchant:
MyRealTrip provides affiliate only (product search + /v1/mylink deep links); there
is NO cart / order-creation / bundled-payment API. So OurRealTrip is NOT a merchant.
NEVER take payment. NEVER implement bundled single payment or host settlement
(receiving other people's money). Payment and booking always happen per-product,
individually, at the seller. The shared cart shows per-person estimated total,
included items (flight/stay/tna), and "N people added this option". Booking
progress is tracked by participant self-report + click tracking (real payment
cannot be confirmed under affiliate). Do NOT create a separate cart table,
checkout, or order entity — the cart is a derived view (converged option_id +
voted_option signals + BookingProgress).

Core loop:
host creates trip proposal → community responds → travel options are refined →
booking_open + group converges on one option → that option's product bundle shows
as a shared trip cart → each member books per-product at the seller via /go and
self-marks "booked" → BookingProgress updates → performance (clicks + self-report,
including which intent resonated) informs the next proposal.

Build mobile-first.
Adopt Luma's discover / event-page / create UX patterns (cover → host → RSVP-first
→ guest count → schedule), but do NOT build a Luma UI clone.
The central page is /trips/[slug], not a product listing.
Prioritize interest/vote before booking.
Show travel options as A/B/C operating plans (with community_intent_fit,
relationship_depth, post_trip_artifact, schedule_difficulty), not a flat product list.
Include an itinerary (Day1/Day2) and a /discover screen (categories + popular trips
by city + community subscriptions).
Product links must be independent CTAs (flight / stay / tna) — show them bundled in
the shared cart but each books separately at the seller.
Never show a single "book all" or bundled-payment CTA. OurRealTrip never receives payment.
Never show "book all", "package purchase", or "official MyRealTrip" language.
Never expose internal strategy terms (e.g. "university unbundling",
"AI-native talent") in user-facing copy. Translate intent into user language:
"우리 모임이 같이 움직일 이유", "이 여행이 끝나고 남을 것", "이번 여행의 목적".
Include disclosure that this is not an official MyRealTrip service, not a package
seller, some links may generate revenue, and that the cart is view-together only —
payment/booking happens individually at each seller and OurRealTrip takes no payment.

Auth: host/admin via Supabase Auth; participants are anonymous cookie sessions
(participant_session_id). Do not collect participant name or email — optional
comment only. Phase 1 access control is unlisted URL (slug); community_only is deferred.

Phase 1 (manual MVP + shared-cart core UX): manual trip proposals via a Luma-style
single-screen create form (with the 4 intent questions, host curates manually),
manual travel options, manual product links (manual URL + nullable
myrealtrip_product_id), itinerary (Day1/Day2), the shared trip cart + per-product
booking guide, group BookingProgress (self-report + click tracking), /discover,
RSVP/interest collection + "N going" social proof, click tracking, and a basic host
dashboard (intent-resonance tags + cart/booking progress).

Phase 2 (AI-create grounding, pulled forward — the unauthenticated MCP returns real
products/prices with no key): on create submit, run getCategoryList(city) →
searchTnas/searchStays/searchInternationalFlights (mcp-servers.myrealtrip.com/mcp)
→ auto-compose A/B/C options from real products/prices → host selects/edits/excludes
→ publish. Then /v1/mylink (partner key) fills mylink_url. Principle: humans curate,
the API grounds — AI only fetches real products; the host makes the final call.

Seed 3 demo communities (destinations are host-curated; products are grounded
via the MyRealTrip MCP/API, not chosen by the API):
- quiet-photography community × Kyoto (API-grounded)
- AI-builder move+hack retreat (autonomous-coding-loop hackathon + run club /
  gym / meditation) × Bali, Ubud/Canggu (API-grounded)
- surf & activity community × Hawaii (manual-URL fallback — MyRealTrip has no
  TNA coverage there; product links are entered manually).
```
