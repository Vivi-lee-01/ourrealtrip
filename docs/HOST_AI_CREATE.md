# OurRealTrip / 아워리얼트립 — Host AI-Create 플로우

> 이 문서는 `PRD.md`(단일 진실 원천) **10절(Host Creation Flow)·18절(MCP/API)·21절(Phase)** 을 구현 명세로 내린 것이다.
> 충돌 시 PRD가 우선이며, 본 문서는 PRD를 "호스트가 트립을 만드는 한 화면 + AI 그라운딩 파이프라인"으로 구체화한다.
> 대상 화면: `/host/trips/new` (PRD 12절 화면 7). 대상 단계: **Phase 1(수동 큐레이션) + Phase 2(AI-create 그라운딩 자동조합)**.
> MCP 도구명·파라미터·widget 트리 파싱 주의는 2026-05-30 무인증 MCP(`mcp-servers.myrealtrip.com/mcp`) 실호출 검증값 기준이다.

---

## 0. 한 문장 정의

호스트가 **루마(luma.com) `/create`식 단일 화면 폼** 하나를 채워 submit하면, 그 목적지로 **무인증 MCP를 호출해 실재 상품·실가격을 그라운딩**하고, 그 실데이터로 **A/B/C TravelOption 조합을 자동 생성**한 뒤, 호스트가 **셀렉/편집/제외**해서 **발행**(`draft → interest_check`)하는 플로우다.

핵심 원칙(PRD 15절 원칙 11 · 18-1절): **사람이 큐레이션, API가 그라운딩.** 목적지·커뮤니티는 호스트의 판단이 정한다. MCP/API는 그 선택을 실제 예약 가능한 상품·가격으로 받쳐주는 레이어이지, 목적지를 *고르는* 도구가 아니다. AI는 실재 상품만 가져오고, 최종 결정(셀렉/편집/제외)은 호스트가 한다.

> ⚠️ negative-spec 경계(PRD 16·17절): 이 플로우의 산출물은 ProductLink 묶음이지 주문/장바구니/패키지가 아니다. AI-create는 상품을 **제안**할 뿐, 묶음결제·우리 결제수취·호스트 정산·예약 대행을 만들지 않는다. AI가 가져온 상품 제목에 특가 강조 문구가 있으면 화면 표기 시 **중립화**한다(PRD 17-2, `lib/copy/banned-phrases.ts`).

---

## 1. 화면: 루마 /create식 단일 폼 (`/host/trips/new`)

PRD 10-1절을 따른다. 한 화면에 아래 입력이 세로로 배치되고, 하단에 단일 **"AI로 옵션 만들어보기"** 액션과 **"빈 채로 직접 만들기"**(수동 큐레이션) 보조 액션을 둔다. 인증 영역(Supabase Auth host, 확정 결정 1)이다.

### 1-1. 입력 항목 → 저장 필드 매핑 (PRD 10-1)

| # | 입력 (사용자 노출) | 저장 필드 (`TripProposal`/하위) | 루마 대응 | AI 그라운딩 입력? |
|---|--------------------|----------------------------------|-----------|-------------------|
| 1 | 커버이미지 / 테마 | `cover_image_url` | Theme/Cover | — |
| 2 | 트립명 (컨셉) | `title` / `concept` | Event Name | 보조(키워드 힌트) |
| 3 | 시작일 · 종료일 | `expected_dates` (+ `Itinerary` 날짜) | Start / End | ✅ `checkIn`/`checkOut`, 항공 일자 |
| 4 | 목적지 | `destination_candidates`(text[]) | Location | ✅ **주 입력** (city) |
| 5 | 일정 개요 | `Itinerary`/`ItineraryDay` 초안 (Day1/Day2) | Description | — |
| 6 | 모집인원 | `recruit_capacity`(int?) | Capacity | — |
| 7 | 승인 여부 | `requires_approval`(bool?) | Approval | — (Phase 1은 표시·기록만) |

### 1-2. 의도 질문 4개 (PRD 10-1, 폼 내 포함 · 선택/skip 가능 · 번역 카피로 노출)

| # | 사용자 노출 질문(번역 카피) | 저장 필드 | 보기 예시 |
|---|----------------------------|-----------|-----------|
| 1 | 이 여행으로 우리 모임이 얻고 싶은 게 뭔가요? | `intended_outcome` (+ `community_intent`) | 배움 / 친밀감 / 회복 / 도전 / 창작 / 네트워킹 / 탐험 / 루틴 전환 |
| 2 | 이 여행은 누구에게 열려 있나요? | `target_audience` | 기존 멤버만 / 비슷한 관심사의 신규 멤버 / 초대받은 사람만 / 공개 모집 |
| 3 | 이 여행이 끝나고 우리 모임에 남았으면 하는 건 뭔가요? | `post_trip_artifact` | 사진·콘텐츠 / 프로젝트 아이디어 / 회고·발표 / 다음 모임 / 멤버 간 관계 / 학습 결과물 |
| 4 | 왜 지금인가요? | `why_now` | 계절성 / 행사·페스티벌 / 프로젝트 타이밍 / 모임 모멘텀 / 번아웃·리셋 / 신규 멤버 유입 |

주의(PRD 10-1 + 확정 결정 5): 질문 2의 보기 중 "기존 멤버만 / 초대받은 사람만"은 **Phase 1에서 표시·기록만** 한다. 실제 접근 제어(`community_only`)는 후순위다. Phase 1 접근 제어는 unlisted slug로 충분.

카피 규칙(PRD 17-4): 폼 라벨·placeholder·도움말에 내부 전략어("대학 언번들링", "AI 네이티브 탤런트")를 절대 쓰지 않는다. 의도는 "우리 모임이 같이 움직일 이유", "이 여행이 끝나고 남을 것", "이번 여행의 목적"으로 번역한다.

---

## 2. AI 그라운딩 파이프라인 (submit 시 실행)

호스트가 폼을 submit하면 아래 5단계가 실행된다. **무인증 MCP(`https://mcp-servers.myrealtrip.com/mcp`)만으로 동작**하며 파트너 키가 필요 없다(PRD 18-2). 이것이 Phase 2를 Phase 3에서 앞당긴 근거다 — 키 없이 실상품·실가격이 반환됨이 2026-05-30 검증됨.

```
[submit] 폼(목적지·날짜·트립명·의도 4개)
   │
   ▼
1) getCategoryList(city)                    ← 목적지의 유효 카테고리 확보
   │
   ▼
2) 병렬 그라운딩 (실상품·실가격 조회)
   ├─ searchTnas(query, category)           ← 투어·티켓·액티비티
   ├─ searchStays(keyword, checkIn, checkOut) ← 숙소 (숙박형 제안일 때만)
   └─ searchInternationalFlights(ICN→공항)  ← 항공 운임 신호 (해외/숙박형 제안일 때만)
   │
   ▼
2-A) 액티비티 패키지형이면 TNA 3개를 선택 기간 안에서 날짜/시간대별 프로그램으로 편성
   │
   ▼
3) 실데이터 → A/B/C TravelOption 자동 조합   ← 옵션마다 ProductLink 후보 묶음
   │
   ▼
4) 호스트 셀렉 / 편집 / 제외                 ← 사람이 최종 큐레이션
   │
   ▼
5) 발행 (draft → interest_check)
```

원칙 재확인: 1~3은 **그라운딩(기계)**, 4는 **큐레이션(사람)**, 5는 **호스트 결정으로만** 일어난다. AI가 자동 발행하지 않는다(PRD 14절 "완전 자동 발행" 제외).

### 2-1. 단계별 상세

| 단계 | 호출 | 입력 (폼에서 파생) | 출력 → 매핑 |
|------|------|---------------------|-------------|
| 1 | `getCategoryList(city)` | 목적지(`destination_candidates[0]`) → city 문자열 | 유효 category 목록 → 2단계 `searchTnas`의 `category` 필터로 사용 |
| 2a | `searchTnas(query, category)` | `query = "{도시} {광역 카테고리}"`, `category`=1단계 결과 | TNA 상품(제목/가격/평점/URL) → ProductLink(`product_type='tna'`) 후보. **액티비티 패키지형은 TNA 3개를 선택 기간 안에서 날짜/시간대별 프로그램으로 편성** |
| 2b | `searchStays(keyword, checkIn, checkOut)` | `keyword="{도시}"`, `checkIn/checkOut`=시작/종료일 | 숙박형 제안일 때만 숙소 → ProductLink(`product_type='stay'`) 후보 |
| 2c | `searchInternationalFlights(ICN→공항)` | 출발/도착 공항코드, 날짜=시작/종료일 | 해외/숙박형 제안일 때만 운임 신호 → ProductLink(`product_type='flight'`) 후보 (price_hint, URL=`https://flights.myrealtrip.com/`) |
| 2-A | (프로그램 편성, MCP 아님) | TNA 후보 + 의도 4필드 + 기간 유형/날짜/시간대 | `activity_program` 성격의 TravelOption. ProductLink 3개를 선택 기간에 배치하되 결제는 각 상품별 독립 예약 |
| 3 | (LLM 조합, MCP 아님) | 2단계 실상품 + 의도 4필드 | A/B/C `TravelOption` + 각 옵션의 `product_links[]` |
| 4 | (UI, 호스트) | 3단계 초안 | 호스트가 셀렉/편집/제외 |
| 5 | (Server Action) | 4단계 확정 | `TripProposal.status` `draft → interest_check` |

> ⚠️ 검색 의미론(PRD 18-2): MCP 검색은 **키워드-리터럴**(의미 기반 아님)이다. 커뮤니티의 니치 의도("자율 코딩 루프 해커톤" 등)를 verbatim으로 검색하면 0건이 나온다. 반드시 **`{도시} + 광역 카테고리`**(예: "발리 요가", "교토 버스투어")로 질의하고, 의도 매칭은 4단계 호스트 큐레이션에서 한다.

---

## 3. 실제 MCP 도구명 · 파라미터 (2026-05-30 무인증 검증)

> 엔드포인트: `https://mcp-servers.myrealtrip.com/mcp` — **Streamable HTTP JSON-RPC, 별도 인증 없이 연결**(PRD 18-2). 파트너 키는 Phase 2의 `mylink`(수익화) 단계에서만 필요(PRD 18-3·18-4).

### 3-1. AI-create가 직접 쓰는 도구 (그라운딩 핵심 3+1)

| 도구 | 파라미터 | 용도 | 비고 |
|------|----------|------|------|
| `getCategoryList(city)` | `city` | 목적지의 유효 카테고리 확보 | **`searchTnas`보다 먼저** 호출해 `category` 필터값을 얻는다 |
| `searchTnas(query[, category, sort])` | `query`(필수), `category`(선택), `sort`(선택) | 투어·티켓·액티비티 검색 | `query`는 `{도시}+광역` 키워드. 응답은 **widget UI 트리**(§4 파싱 주의) |
| `searchStays(keyword, checkIn, checkOut[, …])` | `keyword`, `checkIn`, `checkOut` | 숙소 검색 | 날짜는 폼 시작/종료일에서 파생 |
| `searchInternationalFlights(ICN→공항)` | 출발/도착 공항코드, 날짜 | 국제선 운임 신호 | 출발은 `ICN` 고정(Phase 1). 도착은 목적지 공항코드 |

### 3-2. 보조 도구 (옵션 보강·검증용, 같은 무인증 MCP)

| 도구 | 파라미터 | 용도 |
|------|----------|------|
| `getTnaDetail` / `getTnaOptions` | TNA 식별자 | 선택한 TNA의 상세·옵션 보강 |
| `getStayDetail` | 숙소 식별자 | 숙소 상세 보강 |
| `searchDomestic` (국내선) | 공항코드·날짜 | 국내 목적지용 |
| `flightsFareCalendar` | 노선·기간 | 저렴한 출발일 탐색(일정 난이도 보조) |
| `getPromotionAirlines` | — | 항공 프로모션 — **표기 시 특가 문구 중립화 대상**(PRD 17-2) |
| `getCurrentTime` | — | `checked_at` 기준 시각 |

> 도구 시그니처는 PRD 18-2절에 열거된 실측 목록과 일치시킨다. 도구명·필수 파라미터를 추측하지 말고, 호출 전 `tools/list`(JSON-RPC)로 현재 노출 도구를 확인한다.

### 3-3. Phase 2+ 수익화 (파트너 키 필요 — AI-create 그라운딩과 별개 축)

- base: `https://partner-ext-api.myrealtrip.com`, 인증 `Authorization: Bearer <API_KEY>`
- **`POST /v1/mylink`** (targetUrl ≤ 2000자 → 제휴 단축링크 `myrealt.rip/XXX`) → `ProductLink.mylink_url` 채움.
- 키는 `partner.myrealtrip.com` 가입·승인 후 발급(PRD 18-4, **Vivi 액션 필요**). **무인증 MCP 그라운딩(§3-1)은 키 없이 동작**하므로 AI-create 자체는 키 없이 완결된다. `mylink_url`은 키 확보 후 채우는 후속 보강.

---

## 4. widget 트리 파싱 주의 (실측 기준 — 추측 금지)

`searchTnas` 응답은 평탄한 상품 배열이 아니라 **마이리얼트립 앱의 widget UI 트리**다(PRD 18-2). 상품 정보는 트리 노드에 흩어져 있으므로 아래 규칙으로 추출한다. **추측한 JSON 경로로 파싱하지 말고, 한 응답을 떠서 트리 모양을 확인한 뒤 추출기를 작성한다.**

### 4-1. 추출 규칙

| 필요한 값 | 추출 위치 | → ProductLink 필드 |
|-----------|-----------|--------------------|
| 상품 제목 | **Text 노드**의 텍스트 | `title` (특가 문구는 중립화) |
| 가격 | **Text 노드**의 가격 텍스트 | `price_hint` (예: "46,550원~") |
| 평점/리뷰수 | Text 노드(⭐4.9(2925) 형태) | `reason` 또는 표시용 메타 |
| **상품 URL** | item의 **`onClickAction.url`** | `source_url` |
| **상품 ID(gid)** | `source_url` 끝의 `{gid}` | `myrealtrip_product_id` |

상품 URL 형식: **`onClickAction.url` = `https://experiences.myrealtrip.com/products/{gid}`**. 끝의 `{gid}`가 `myrealtrip_product_id`다.

검증된 실예(SEED_PROPOSALS.md, 2026-05-30 실조회):
- 교토 — "사진 촬영 포함 아라시야마·금각사·청수사 교토 버스투어" → `.../products/3425896` → `myrealtrip_product_id=3425896`, `price_hint="46,550원~"`
- 발리 — "우붓 몽키포레스트…전일 투어" → `.../products/5905388` → `myrealtrip_product_id=5905388`, `price_hint="92,073원~"`

### 4-2. 파싱 함정 (반복 사고 지점)

1. **상품을 Text 노드 기준으로만 묶지 말 것** — 제목과 가격이 서로 다른 Text 노드에 있다. item(클릭 단위) 경계로 묶어야 제목·가격·URL이 한 상품으로 정합된다.
2. **`onClickAction.url`이 없는 노드는 상품이 아님** — 헤더·배너·필터 칩 같은 UI 위젯이 섞여 있다. URL 없는 노드는 ProductLink 후보에서 제외한다.
3. **트리 스키마는 변할 수 있음** — widget 트리는 앱 UI용이라 버전에 따라 키가 바뀔 수 있다. 키 경로를 하드코딩하기 전에 응답을 한 번 떠서 확인하고, 추출 실패 시 그 노드를 조용히 skip(전체 실패 금지)한다.
4. **가격은 "신호"이지 확정 총액 아님** — `price_hint`로 저장하고 `checked_at`을 함께 기록한다. 항공은 특히 왕복/구성에 따라 변동(PRD 18-2, SEED 노트).
5. **특가·프로모션 강조 문구 중립화** — 상품 제목·설명에 "특가/단독/최저가" 류가 포함된 실사례 확인됨(PRD 17-2). 화면 표기 전 `lib/copy/banned-phrases.ts`의 가드를 통과시키고, 우리가 그 주장을 하는 것처럼 보이지 않게 중립 표현으로 바꾼다.

---

## 5. 출력 매핑: MCP 결과 → A/B/C 옵션 조합 (3단계)

3단계(LLM 조합)는 §4에서 추출한 실상품을 PRD 9-4/9-5 엔티티로 내린다. 옵션 유형은 `OptionType`(`basic`/`premium`/`budget`/`experimental`, `lib/types.ts`)을 쓴다.

### 5-1. A/B/C 조합 규칙 (PRD 7절 패턴 차용)

| 옵션 | `option_type` | 조합 의도 | 그라운딩 소스 |
|------|---------------|-----------|----------------|
| A안 | `basic` | 가볍게/부담 낮음 | 평점 높은 대표 TNA 1개 + 접근성 좋은 stay + 합리 운임 flight |
| B안 | `premium` | 몰입형 | 테마 적합 TNA 1~2개 + 동선 중심 stay + 편한 시간대 flight |
| C안 | `budget` | 예산 낮춘 현실형 | 무료/저가 코스 중심 + 외곽 stay + 저가 시간대 flight |

각 `TravelOption`에는 가격/일정 차원뿐 아니라 **커뮤니티 의도 차원**을 채운다(PRD 9-4): `community_intent_fit`, `relationship_depth`, `learning_or_creation_potential`, `post_trip_artifact`, `schedule_difficulty`. 이 값들은 LLM 추론이며 **MCP 사실이 아니다** — 출처를 구분해 보강한다(PRD 18-1: API 사실 / LLM 추론 / Host 입력 / Participant signal 분리).

### 5-2. ProductLink 채우기 (PRD 9-5 · 확정 결정 3)

| 필드 | AI-create가 채우는 값 |
|------|------------------------|
| `product_type` | `flight` / `stay` / `tna` |
| `source` | 판매처(마이리얼트립 등) |
| `myrealtrip_product_id` | TNA는 `{gid}`(§4), 항공/숙소 검색결과는 **null 허용**(확정 결정 3) |
| `title` | widget Text 노드(특가 문구 중립화) |
| `price_hint` | 가격 텍스트 + "(변동)" 신호 |
| `source_url` | `onClickAction.url` 또는 `https://flights.myrealtrip.com/` |
| `mylink_url` | **Phase 1/그라운딩 단계에서는 null** — 파트너 키 확보 후 `POST /v1/mylink`로 채움 |
| `checked_at` | `getCurrentTime` 또는 서버 now() |
| `status` | `active` |

### 5-3. 그라운딩 실패/0건 폴백 (커버리지 함정)

마이리얼트립은 **아시아 outbound 중심**이라 일부 목적지는 TNA 0건이다(PRD 18-2). 미국령(하와이 등)이 대표 사례 — 2026-05-30 기준 TNA 0건·항공 고가(ICN→HNL ~₩836K 신호).

- TNA 0건이면 그 `product_type`을 비우고, 호스트가 **manual URL**(`source_url` 직접 입력, 비-마이리얼트립 판매처 허용)로 채우게 한다. `myrealtrip_product_id=null`(확정 결정 3).
- AI-create는 0건을 에러로 죽이지 말고 "이 목적지는 마이리얼트립 상품이 적어 직접 입력이 필요해요" 안내로 4단계(호스트 큐레이션)에 넘긴다.
- 이 폴백은 데모 커뮤니티 3건 중 **하와이(`/trips/hawaii-surf-week`)** 가 의도적으로 시연한다(PRD 20절, SEED_PROPOSALS.md §3).

---

## 6. Phase 분리 (PRD 21절 정합)

| 항목 | Phase 1 (수동 MVP) | Phase 2 (AI-create 그라운딩) |
|------|---------------------|------------------------------|
| 폼(루마 create식 단일 화면 + 의도 4개) | ✅ 호스트 **수동** 입력 | ✅ 동일 폼, submit 시 자동 그라운딩 |
| TravelOption 입력 | ✅ 수동 | ✅ A/B/C **자동 조합** → 호스트 셀렉/편집/제외 |
| ProductLink | ✅ manual URL + `myrealtrip_product_id=null` | ✅ MCP 그라운딩으로 `gid`·URL 채움 |
| MCP 호출 | — | ✅ `getCategoryList`/`searchTnas`/`searchStays`/`searchInternationalFlights` (무인증) |
| `mylink_url` | — | ✅ `POST /v1/mylink`(파트너 키) |
| 발행 | ✅ 호스트 `draft → interest_check` | ✅ 동일(자동 발행 아님) |

Phase 1 폼과 Phase 2 폼은 **같은 화면**이다. Phase 2는 "submit 시 그라운딩 파이프라인이 붙는다"는 차이뿐이며, 그라운딩 실패 시 항상 Phase 1의 수동 입력으로 graceful fallback 한다(§5-3). 구현 진입점은 ARCHITECTURE.md 9절 "Phase 2 확장 진입점"(`lib/myrealtrip/` MCP 클라이언트, `lib/data/product-links.ts` 동기화 함수)에 둔다.

---

## 7. Negative-spec 체크 (이 플로우가 반드시 지키는 것)

PRD 16·17절 + ARCHITECTURE.md 8절을 AI-create 맥락에서 재확인한다.

- [ ] AI-create는 상품을 **제안**할 뿐, 묶음결제·우리 결제수취·호스트 정산·예약 대행·패키지 판매를 만들지 않는다(merchant 아님).
- [ ] 자동 발행 금지 — 발행은 항상 호스트의 명시적 액션(4→5단계).
- [ ] 그라운딩으로 가져온 상품 제목·설명의 특가/프로모션 문구는 화면 표기 전 **중립화**하고 `assertNoBanned()` 가드를 통과시킨다(`lib/copy/banned-phrases.ts`).
- [ ] 금지 문구("공식 추천/단독 특가/최저가 보장/예약 가능 보장/전체 예약하기/패키지 구매하기/이 일정 그대로 예약하기/예약하면 수익 보장/누구나 여행으로 돈 번다/방문자 캐시백")가 AI 생성 카피·옵션 설명·OG·메타 어디에도 등장하지 않는다.
- [ ] 내부 전략어("대학 언번들링", "AI 네이티브 탤런트")가 폼 라벨·AI 생성 카피에 노출되지 않는다 — 의도는 사용자 언어로 번역.
- [ ] ProductLink는 항상 `product_type`(flight/stay/tna)별 **독립 항목**으로 남는다. AI가 "전체 예약"·단일 묶음 CTA를 만들 자리를 두지 않는다(ARCHITECTURE 8절 구조적 차단과 정합).
- [ ] API 사실 / LLM 추론 / Host 입력 / Participant signal을 구분해 저장·표시한다(PRD 18-1). 가격은 신호이며 `checked_at`을 함께 기록한다.
- [ ] 목적지·커뮤니티는 호스트가 정한다. MCP는 그라운딩 레이어이지 목적지 선택 도구가 아니다(PRD 15절 원칙 11).

---

## 8. 참조

- `PRD.md` 10절(Host Creation Flow), 18절(MCP/API 실측), 21절(Phase), 16·17절(negative spec) — 단일 진실 원천
- `docs/ARCHITECTURE.md` 1절(폴더 트리: `host/trips/new`, `lib/myrealtrip/` 진입점), 8절(negative-spec 구조적 보장), 9절(Phase 2~4 확장)
- `docs/SEED_PROPOSALS.md` — 2026-05-30 실조회된 TNA `gid`·URL·가격(교토·발리 API 그라운딩, 하와이 manual 폴백 시연)
- `lib/types.ts` — `TripProposal`/`TravelOption`/`ProductLink` 정식 필드·enum
- `lib/copy/banned-phrases.ts` — `assertNoBanned()` / `findBanned()` 가드(중립화 강제 지점)
