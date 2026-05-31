# OurRealTrip 검증 핸드오프 — 2026-05-30

## 목적

다른 에이전트가 현재 OurRealTrip 전략/PRD/아키텍처 변경을 독립 검증하도록 넘기는 문서다. 이번 검증은 구현 코드 리뷰라기보다 **제품 방향·요구사항 일관성·해커톤 적합성·안전 경계 검증**이다.

## 현재 프로젝트

- repo: `/Users/vivi/ourrealtrip`
- 프로젝트명: 아워리얼트립 / OurRealTrip
- 기존 컨셉: Luma식 커뮤니티 이벤트 생성/참여 구조 + MyRealTrip 실제 여행상품 그라운딩
- 유지해야 할 중심:
  - Luma + MyRealTrip 컨셉 유지
  - 피봇 아님
  - 커뮤니티 + 액티비티는 디테일/대표 유스케이스
  - 사람과 에이전트가 함께 쓰는 생성 레이어

## 최근 사용자 결정

1. MyRealTrip 사용 확정
   - 마케팅 파트너 가입 완료
   - API 키 확보됨
   - 키는 `/Users/vivi/ourrealtrip/.env.local`에 `MYREALTRIP_API_KEY`로 저장됨
   - 실제 키는 이 문서/프롬프트/로그에 절대 포함하지 말 것

2. 제품 방향
   - 피봇하지 않는다.
   - OurRealTrip의 Luma + MyRealTrip 컨셉을 유지한다.
   - “커뮤니티 + 액티비티”를 디테일로 가져간다.
   - 랜덤소개팅형/취향기반 액티비티 프로그램은 대표 유스케이스일 뿐 전체 제품을 하루짜리 소개팅 앱으로 제한하지 않는다.

3. 기간/프로그램 구조
   - “하루짜리”로 제한하면 안 된다.
   - 호스트가 기간을 선택할 수 있어야 한다.
   - 현재 명세상 기간 유형:
     - 당일형
     - 1박 2일
     - 2박 3일
     - 직접 설정
   - 3개 액티비티는 MVP 기본 프로그램 구조다.
   - 당일형/근교형/도심형은 TNA만으로도 가능.
   - 숙박형/해외형은 숙소·항공을 보조 ProductLink로 붙일 수 있다.

4. Agent/API 접근성
   - 이 제품은 사람만 쓰는 SaaS가 아니다.
   - 사람과 에이전트가 같이 사용한다.
   - 사람이 Luma식 UI로 행사/여행을 만들 수 있어야 한다.
   - 그와 더불어 **에이전트도 사람과 동등한 생성 주체로 행사/여행을 만들 수 있어야 한다.** 에이전트는 단순 보조/추천자가 아니라, 승인 게이트 전까지 draft를 생성하고 프로그램을 조합하는 operator다.
   - 에이전트도 자체 API 또는 MCP wrapper로 같은 schema를 사용해 draft 생성, 상품 조회, 3-액티비티 프로그램 조합, 질문 생성, 신호 요약을 할 수 있어야 한다.
   - 단, 발행/공유/booking_open/제휴링크 노출은 사람 승인 게이트가 필요하다.

5. GGUI 사용 방향
   - GGUI는 사용하는 쪽이 맞다.
   - 단, 전체 앱을 GGUI로 갈아엎지 않는다.
   - 기존 OurRealTrip Next.js 앱은 본체로 유지한다.
   - GGUI는 호스트 생성/에이전트 조작 화면, 즉 `AI-create cockpit` 또는 sidecar 데모로 붙인다.
   - 목표는 GGUI Track Award와 메인 트랙 API 활용도를 동시에 강화하는 것.
   - 참여자-facing 공개 페이지(`/trips/[slug]`)는 안정적인 기존 UI로 유지한다. GGUI 알파를 최종 공개/예약/고지 화면에 쓰지 않는다.

## 최근 수정 파일

### `/Users/vivi/ourrealtrip/PRD.md`

추가/수정 요지:

- North Star/포지셔닝 인근에 추가 핵심 원칙 삽입:
  - 사람과 에이전트가 함께 쓰는 여행/이벤트 생성 레이어
  - 에이전트는 API/MCP로 행사·여행 제안 생성, 상품 조회·조합, 초안/옵션/공유문안 준비 가능
  - 외부 영향 액션은 승인 게이트

- `## 2-C. Agent/API 접근성 — 사람과 에이전트가 함께 쓰는 생성 레이어` 추가
  - 에이전트가 할 수 있어야 하는 것
  - 승인 게이트
  - API/MCP 표면 원칙
  - 최소 action surface:
    - `create_proposal_draft`
    - `search_myrealtrip_activities`
    - `compose_activity_program`
    - `generate_participant_questions`
    - `publish_proposal_after_host_approval`
    - `summarize_interest_signals`
  - source attribution 원칙:
    - `host_input | myrealtrip_api | participant_signal | llm_inference`

- `## 7-A. 액티비티 패키지 디테일 — 호스트 선택형 3-액티비티 프로그램 + 랜덤소개팅형 편성` 추가/수정
  - 피봇이 아니라 구체 유스케이스
  - 제품 중심은 계속 Luma식 커뮤니티 이벤트 생성/참여 구조 + MyRealTrip 실제 상품 그라운딩
  - 3개 액티비티 프로그램
  - 기간은 하루 제한 아님
  - 호스트가 기간 유형 선택
  - 랜덤소개팅은 내부/데모용 강한 표현, user-facing은 “취향 기반 액티비티 프로그램”, “새로운 사람들과 함께하는 커뮤니티 여행” 등으로 완화
  - 매칭 성공/연애 성사/개인정보 기반 궁합 판단 금지
  - 결제/정산/패키지 판매 금지 유지

### `/Users/vivi/ourrealtrip/docs/HOST_AI_CREATE.md`

수정 요지:

- AI 그라운딩 파이프라인에 액티비티 패키지형 단계 추가
- `searchTnas` 중심
- 숙소/항공은 숙박형/해외형일 때만 보조 사용
- `2-A) 액티비티 패키지형이면 TNA 3개를 선택 기간 안에서 날짜/시간대별 프로그램으로 편성`
- `activity_program` 성격의 TravelOption으로 정의
- ProductLink 3개를 선택 기간에 배치하되 결제는 각 상품별 독립 예약

### `/Users/vivi/ourrealtrip/docs/ARCHITECTURE.md`

수정 요지:

- `app/api/` agent/API 접근 표면 추가
- 추가 라우트 설계:
  - `/api/agent/proposal-drafts` → `create_proposal_draft`
  - `/api/agent/activity-programs` → `compose_activity_program`
  - `/api/myrealtrip/activities` → `search_myrealtrip_activities`
  - `/api/agent/participant-questions` → `generate_participant_questions`
  - `/api/agent/interest-summary` → `summarize_interest_signals`
- API key는 서버 전용이어야 함
- draft 생성은 허용하되 발행은 승인 필요

### GGUI 조합 전략

GGUI 문서/노션 정보 기준:

- GGUI는 오픈소스 레포 + MCP 클라우드 서버 + 샘플 소스코드 패키지를 제공한다.
- 트랙: **GGUI Track Award — 생성형 UI 기반 에이전틱 앱 개발**
- BYOK 방식. 사용할 LLM/외부 API 키를 직접 넣는다.
- 부트스트랩: `npx @ggui-ai/create-agentic-app@alpha`
- 사용할 에이전트 프레임워크: Google ADK / Claude Agent SDK / OpenAI Agents SDK 중 선택
- 평가 기준:
  - 생성형 UI 활용도: 컨텍스트에 반응하는 동적 UI인지
  - 멀티턴 일관성: 여러 턴에 걸쳐 UI를 자연스럽게 사용 가능한지
  - MCP 도구 사용: 생성된 UI로 MCP 도구를 잘 사용할 수 있었는지
  - 아이디어/완성도: 복잡한 앱이 에이전틱 앱으로 전환되어 경험이 좋아지는지

OurRealTrip 적용 판단:

- GGUI 사용은 추천한다.
- 단, 전체 앱을 GGUI로 재구현하지 않는다.
- 기존 Next.js 공개 앱은 본체로 유지한다.
- GGUI는 `/host/ai-create` 또는 별도 sidecar 데모로 붙인다.
- 역할은 “AI-create cockpit”: 호스트가 자연어로 말하면 상황에 맞는 생성형 UI가 뜨고, MyRealTrip/OurRealTrip 도구를 호출해 초안을 만든다.
- 참여자-facing 공개 페이지, 예약 링크, 고지/정책 화면은 기존 안정 UI로 유지한다.

추천 GGUI 데모 플로우:

1. 호스트가 자연어 입력:
   - 예: “서울에서 새로운 사람들과 취향 기반 액티비티 프로그램을 만들고 싶어. 당일형, 12명, 가볍게 대화가 잘 생기는 구성으로.”
2. GGUI가 동적 UI 생성:
   - 기간 선택
   - 목적지/지역 선택
   - 커뮤니티 성격 선택
   - 모집인원/승인 여부
   - 액티비티 후보 카드
   - 3-액티비티 프로그램 편성 UI
   - RSVP 질문 추천 UI
   - 발행 전 승인 UI
3. GGUI가 MCP/API 도구 호출:
   - `search_myrealtrip_activities`
   - `compose_activity_program`
   - `create_proposal_draft`
4. 멀티턴 수정:
   - 예: “소개팅 느낌 좀 줄이고 취향 모임 느낌으로 바꿔줘.”
   - GGUI가 카피/질문/구성 수정
5. 호스트 승인 후 기존 OurRealTrip `/trips/[slug]` 페이지로 연결

GGUI에서 실제 구현할 최소 MCP/API 도구:

1. `search_myrealtrip_activities`
2. `compose_activity_program`
3. `create_proposal_draft`

후순위 또는 mock/schema demo 가능:

- `generate_participant_questions`
- `summarize_interest_signals`
- `publish_proposal_after_host_approval`

발표용 포지션:

> OurRealTrip은 Luma처럼 사람이 커뮤니티 여행/액티비티 이벤트를 만들 수 있고, GGUI를 통해 에이전트도 상황에 맞는 생성형 UI를 띄워 MyRealTrip 상품을 검색·조합·초안 생성까지 수행하는 agent-addressable travel event layer입니다.

주의:

- GGUI를 메인 제품으로 착각시키면 안 된다. GGUI는 host AI-create cockpit이다.
- GGUI 알파를 참여자-facing 최종 화면에 쓰면 안정성 리스크가 크다.
- BYOK + MyRealTrip API 키 모두 서버/환경변수로만 다루고, 발표/로그/클라이언트에 노출하지 않는다.
- GGUI 트랙 욕심 때문에 구현 범위가 퍼지지 않도록 실제 구현 action은 2~3개로 제한한다.

### `/Users/vivi/ourrealtrip/.env.example`

- `MYREALTRIP_API_KEY=` 항목 추가
- 실제 키 없음

### `/Users/vivi/Documents/Obsidian Vault/raw/manual/OBA.md`

- OBA 전략 메모에 결정사항 반영
- MyRealTrip 실제 사용, 마케팅 파트너 가입 완료, API 키 확보
- 커뮤니티 + 액티비티로 디테일 좁힘
- 하루 제한 금지
- Luma + MyRealTrip 유지
- Agent/API 접근성 중요 결정 반영

## 유지해야 할 hard constraints

1. 결제/정산/패키지 판매 금지
   - OurRealTrip은 merchant가 아니다.
   - 묶음 단일결제 금지.
   - 우리 결제수취 금지.
   - 호스트 정산 금지.
   - 결제/예약은 항상 각 상품별·각자·판매처에서 진행.

2. 공식 오인 금지
   - MyRealTrip 공식 서비스처럼 보이면 안 됨.
   - 마케팅 파트너/제휴/외부 상품 고지를 유지해야 함.

3. Luma UI 클론 금지
   - Luma의 패턴/anatomy는 차용하되 UI/카피/브랜드 클론 금지.

4. 랜덤소개팅 안전 경계
   - 개인정보/연애상태/성별/연령 과수집 금지.
   - 매칭 성공/연애 성사/궁합 판단 약속 금지.
   - user-facing은 완화된 카피 사용.

5. API key 보안
   - `MYREALTRIP_API_KEY`는 서버 전용.
   - 클라이언트 번들/로그/프롬프트/문서에 노출 금지.
   - 다른 에이전트는 실제 키를 출력하지 말 것.

6. Agent approval gate
   - 에이전트는 draft/검색/조합/요약까지 가능.
   - 발행, 외부 공유, booking_open, 제휴 링크 노출은 사람 승인 필요.

## 검증자가 특히 봐야 할 질문

1. 제품 정의가 여전히 Luma + MyRealTrip인가?
   - 액티비티/랜덤소개팅 디테일이 제품을 “소개팅 앱”으로 오해시키지 않는가?
   - 하루짜리 제약이 남아 있지 않은가?

2. Agent/API 접근성이 설계에 충분히 반영되었는가?
   - UI와 API가 같은 도메인 모델을 공유한다는 점이 명확한가?
   - action surface가 너무 많거나 부족하지 않은가?
   - 승인 게이트가 충분히 분리되어 있는가?

3. 해커톤 심사 기준에 맞는가?
   - 기술 완성도/실행력/API 활용도/사업 가능성에 유리한 설명인가?
   - “MyRealTrip API를 쓴 앱”을 넘어 “에이전트가 쓸 수 있는 새 API surface를 만든 앱”으로 보이는가?

4. 안전/법적 경계가 유지되는가?
   - 패키지 판매/묶음결제/정산으로 오해될 표현이 있는가?
   - 랜덤소개팅 카피가 개인정보/연애/매칭 약속 리스크를 만들지 않는가?
   - API key 보안이 충분한가?

5. 구현 가능성이 있는가?
   - 48시간 해커톤 기준으로 우선 구현할 최소 루프가 선명한가?
   - 너무 많은 API route를 만들기로 해서 데모 범위가 산만해지지 않는가?
   - MVP에서는 어떤 action만 실제 구현하고 어떤 action은 schema/demo로 둘지 구분해야 하는가?

## 권장 검증 산출물

다른 에이전트는 아래 형식으로 답변하면 좋다.

```json
{
  "verdict": "pass | needs_revision | risky",
  "summary": "한 문장 총평",
  "critical_issues": [
    "반드시 고쳐야 할 문제"
  ],
  "product_consistency": [
    "Luma + MyRealTrip / 커뮤니티 + 액티비티 / 에이전트 공동사용 관점 평가"
  ],
  "safety_or_legal_risks": [
    "결제/정산/공식오인/랜덤소개팅/개인정보/API key 관련 리스크"
  ],
  "hackathon_strategy_notes": [
    "OBA 심사/피어리뷰/API 활용도 관점 메모"
  ],
  "recommended_edits": [
    {
      "file": "수정 파일 경로",
      "issue": "문제",
      "suggested_change": "수정 제안"
    }
  ],
  "implementation_scope_recommendation": "지금 바로 구현할 최소 루프 제안"
}
```
