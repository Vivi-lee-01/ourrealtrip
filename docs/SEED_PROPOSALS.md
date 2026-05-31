# OurRealTrip — Seed Proposals (Phase 1 데모 시드)

> Phase 1 manual MVP의 시드 데이터 원천. 엔티티 정의는 `PRD.md` 9절, 결정은 20절 기준.
> **그라운딩 원칙(PRD 18-1)**: 목적지·커뮤니티는 host가 큐레이션, 상품은 마이리얼트립 MCP/API로 그라운딩.
> 아래 TNA 상품·URL·가격은 2026-05-30 무인증 MCP(`mcp-servers.myrealtrip.com/mcp`)로 실조회한 값.
> 항공 운임은 조회 시점 최저가 신호(왕복/구성에 따라 변동) — 정확 총액 아님. 가격·예약가능은 확인 시점 이후 변경될 수 있음(고지 3).
> 제3자 상품 제목의 특가 강조 문구는 표기 시 중립화함(PRD 17-2).

공통 고지(모든 proposal 페이지 하단, PRD 17-1):
1. 아워리얼트립은 마이리얼트립 공식 서비스가 아닙니다.
2. 일부 링크를 통해 예약이 발생하면 운영자에게 수익이 생길 수 있습니다.
3. 상품 가격·예약 가능 여부는 확인 시점 이후 바뀔 수 있습니다.
4. 아워리얼트립은 항공·숙소·투어를 직접 판매하거나 예약 대행하지 않습니다.
5. 조합형 여행안은 참고용 편성이며 패키지 상품이 아닙니다.
6. 각 상품은 판매처에서 독립적으로 확인·구매합니다.

---

## 1. 고즈넉한 사진 촬영 커뮤니티 × 교토  〔API 그라운딩〕

- **slug**: `/trips/kyoto-quiet-photo-walk`
- **status**: `interest_check`
- **Host**: name="리노", community_name="필름워크 서울", bio="격주로 도시 골목을 걷고 필름으로 기록하는 모임", trust_note="3년간 서울·부산 포토워크 40회 운영"
- **Community**: name="필름워크 서울", category="사진/기록", visibility=`unlisted`

**TripProposal**
- title: "교토, 사람 적은 시간대에 골목을 천천히 찍는 3일"
- concept: "관광이 아니라 빛과 골목을 기록하러 가는 여행"
- target_audience: "카메라 들고 오래 걸을 수 있는 사람 / 빡빡한 일정 싫은 사람에겐 비추"
- mood: "고즈넉, 느림, 기록"
- expected_dates: "2026-06-12(금)~06-14(일)"
- expected_budget: "1인 60~90만원"
- destination_candidates: ["교토"]
- **community_intent**: "이번 여행의 목적 — 각자 찍은 걸 모아 함께 보는 것"
- **intended_outcome**: "창작 · 친밀감"
- **post_trip_artifact**: "공동 사진 셀렉 + 짧은 회고 전시"
- **relationship_depth**: `mid`
- **learning_or_creation_goal**: "각자 한 컷씩 '내 교토'를 완성"
- **why_now**: "초여름 신록 + 관광 피크 전 평일"

**TravelOptions**

A안 `basic` — "가볍게 골목만" / fit_reason: 처음 합류하는 멤버도 부담 낮음 / relationship_depth `low~mid` / community_intent_fit "부담 없이 같이 찍기" / post_trip_artifact "사진 공유·짧은 회고" / schedule_difficulty `low` / estimated_budget 60~75만원
- ProductLink(tna): "사진 촬영 포함 아라시야마·금각사·청수사 교토 버스투어" ⭐4.9(2925) 46,550원~ · source_url=`https://experiences.myrealtrip.com/products/3425896` · myrealtrip_product_id=`3425896` · checked_at=2026-05-30
- ProductLink(flight): ICN→KIX 6/12-14 · price_hint="왕복 최저가 신호 ~₩52,000대(변동)" · source_url=`https://flights.myrealtrip.com/` · myrealtrip_product_id=null · caution="조회 시점 운임 변동"
- ProductLink(stay): "교토역/가와라마치 도보권 숙소" · 빌드 시 `searchStays`로 그라운딩 · myrealtrip_product_id=null

B안 `premium` — "촬영에 진심인 몰입형" / fit_reason: 새벽·야간 촬영까지 / relationship_depth `high` / community_intent_fit "작품 만들기" / post_trip_artifact "작품 셀렉 + 귀국 후 전시·발표" / learning_or_creation_potential `high` / schedule_difficulty `mid~high` / estimated_budget 80~110만원
- ProductLink(tna): "프로사진작가 촬영 동반 오사카·교토 버스투어" ⭐4.8(1380) 44,900원~ · source_url=`https://experiences.myrealtrip.com/products/3154184` · myrealtrip_product_id=`3154184` · checked_at=2026-05-30
- ProductLink(tna): "오사카 출발 1일 교토 버스투어(사진 촬영)" ⭐5(195) 42,750원~ · source_url=`https://experiences.myrealtrip.com/products/4333857` · myrealtrip_product_id=`4333857` · checked_at=2026-05-30
- ProductLink(flight/stay): 동일 패턴, 촬영 동선 중심 숙소

C안 `budget` — "예산 낮춘 현실형" / fit_reason: 예산 민감 / relationship_depth `mid` / post_trip_artifact "다음 모임 약속" / schedule_difficulty `low` / estimated_budget 45~65만원
- ProductLink(flight): 평일/저가 시간대 · price_hint="변동" · myrealtrip_product_id=null
- ProductLink(tna): 무료 산책 코스 중심 + 입장권 1개

---

## 2. AI 빌더 무브+해커톤 리트릿 × 발리(우붓·짱구)  〔API 그라운딩〕

- **slug**: `/trips/bali-builder-move-retreat`
- **status**: `interest_check`
- **Host**: name="도윤", community_name="빌드앤무브", bio="평일 밤엔 같이 만들고, 주말엔 같이 뛰는 빌더 모임", trust_note="국내 빌더 해커톤·런클럽 12회 운영"
- **Community**: name="빌드앤무브", category="AI 빌더/무브먼트", visibility=`unlisted`

**TripProposal**
- title: "발리에서 같이 만들고, 같이 뛰고, 사이엔 비우는 빌더 위크"
- concept: "낮엔 자율 코딩 루프(랄프루프) 해커톤, 아침엔 런클럽·헬스, 사이엔 우붓 명상"
- target_audience: "직접 만드는 사람 / 아침 운동 같이 할 사람 / 관광만 원하면 비추"
- mood: "몰입, 회복, 외부 자극"
- expected_dates: "2026-06-15(월)~06-19(금)"
- expected_budget: "1인 110~160만원"
- destination_candidates: ["발리(우붓/짱구)"]
- **community_intent**: "이번 여행의 목적 — 일상에서 못 내는 몰입을 외부에서 한 번에"
- **intended_outcome**: "창작 · 도전 · 회복 · 네트워킹"
- **post_trip_artifact**: "각자 데모 1개 + 마지막 날 발표 세션"
- **relationship_depth**: `high`
- **learning_or_creation_goal**: "혼자 못 끝낸 사이드프로젝트를 데모까지"
- **why_now**: "상반기 마무리 + 번아웃 리셋 타이밍"

**TravelOptions**

A안 `basic` — "우붓 베이스 집중형" / fit_reason: 조용한 환경에서 만들기+명상 / relationship_depth `mid~high` / community_intent_fit "만들기+비우기" / post_trip_artifact "데모 + 회고" / learning_or_creation_potential `high` / schedule_difficulty `low` / estimated_budget 110~135만원
- ProductLink(tna): "우붓 몽키포레스트 + 뜨갈랄랑 계단식 논 + 티르타 엠풀 전일 투어" ⭐4.9(247) 92,073원~ · source_url=`https://experiences.myrealtrip.com/products/5905388` · myrealtrip_product_id=`5905388` · checked_at=2026-05-30
- ProductLink(tna): "우붓 프라이빗 투어(왕궁·몽키포레스트·티르타엠풀·폭포·스윙)" ⭐5(546) 20,008원~ · source_url=`https://experiences.myrealtrip.com/products/4139355` · myrealtrip_product_id=`4139355` · checked_at=2026-05-30
- ProductLink(flight): ICN→DPS 6/15-19 · price_hint="왕복 최저가 신호 ~₩80,000대(변동)" · source_url=`https://flights.myrealtrip.com/` · myrealtrip_product_id=null
- ProductLink(stay): "우붓 빌라/코워킹 가능 숙소" · 빌드 시 `searchStays` 그라운딩 · myrealtrip_product_id=null

B안 `experimental` — "짱구 무브+빌드 하이브리드" / fit_reason: 아침 런클럽·서핑 + 낮 빌드 / relationship_depth `high` / community_intent_fit "몸 깨우고 만들기" / post_trip_artifact "데모 + 러닝 인증" / schedule_difficulty `mid` / estimated_budget 120~150만원
- ProductLink(tna): "짱구 요가 클래스(브런치 포함)" ⭐5(3) 24,551원~ · 빌드 시 `searchTnas("발리 요가")`로 URL 그라운딩 · myrealtrip_product_id=null(그라운딩 후 채움)
- ProductLink(flight/stay): 짱구 서프·코워킹 숙소

C안 `budget` — "주말+α 짧게" / fit_reason: 휴가 짧은 사람 / relationship_depth `mid` / schedule_difficulty `low` / estimated_budget 95~120만원

> 카피 주의(PRD 17-4): "랄프루프/자율 코딩 루프"는 커뮤니티 자체 용어로만 쓰고, 외부 노출 카피는 "낮엔 같이 만들고, 아침엔 같이 뛰고, 사이엔 비운다"처럼 번역. 철학어("AI 네이티브 탤런트" 등) 노출 금지.

---

## 3. 서핑·액티비티 커뮤니티 × 하와이  〔manual URL 폴백 시연〕

- **slug**: `/trips/hawaii-surf-week`
- **status**: `interest_check`
- **Host**: name="해나", community_name="파도살롱", bio="국내외 서프 트립을 같이 다니는 살롱", trust_note="양양·발리 서프 트립 8회"
- **Community**: name="파도살롱", category="서핑/액티비티", visibility=`unlisted`

**TripProposal**
- title: "오아후에서 파도와 일주일 — 초보도 같이"
- concept: "아침 서핑, 낮엔 각자, 저녁엔 모여 회고"
- target_audience: "서핑 입문~중급 / 비행 길고 예산 큰 트립 감안 가능한 사람"
- mood: "에너지, 입문 환영"
- expected_dates: "2026-06-13(토)~06-20(토)"
- expected_budget: "1인 200~300만원+"
- destination_candidates: ["하와이(오아후)"]
- **community_intent**: "이번 여행의 목적 — 같이 입문하고 같이 늘기"
- **intended_outcome**: "도전 · 친밀감"
- **post_trip_artifact**: "서핑 영상 모음 + 다음 트립 약속"
- **relationship_depth**: `mid~high`
- **why_now**: "여름 시즌 · 멤버 휴가 정렬"

> ⚠️ 그라운딩 메모(PRD 18-2 커버리지): 2026-05-30 기준 마이리얼트립 TNA 검색에 **하와이 상품 0건**, ICN→HNL 항공도 고가(~₩836K대 신호). 따라서 이 proposal은 **host가 ProductLink를 직접 입력하는 manual 경로**(확정 결정 3)를 시연한다 — `myrealtrip_product_id`는 모두 null.

**TravelOptions**

A안 `basic` — "와이키키 베이스 입문형" / fit_reason: 초보 강습 중심 / relationship_depth `mid` / community_intent_fit "같이 입문" / schedule_difficulty `low` / estimated_budget 200~260만원
- ProductLink(flight): ICN→HNL 6/13-20 · price_hint="왕복 ~₩836K대 신호(고가·변동)" · source_url=`https://flights.myrealtrip.com/` · myrealtrip_product_id=null · caution="장거리·고운임, 예산 합의 먼저"
- ProductLink(stay): "와이키키 도보권 숙소" · source_url=(host 수동 입력) · myrealtrip_product_id=null
- ProductLink(tna): "오아후 서프 스쿨(입문 강습)" · source_url=(host 수동 입력, 비-마이리얼트립 가능) · myrealtrip_product_id=null · caution="마이리얼트립 미취급 — 외부 판매처 직접 확인"

B안 `premium` — "노스쇼어 포함 몰입형" / relationship_depth `high` / post_trip_artifact "서핑 영상 + 회고" / schedule_difficulty `mid`
C안 `budget` — "숙소 공유로 비용 절감" / relationship_depth `mid` / schedule_difficulty `low`

---

## 시드 적용 노트 (빌드용)

- 교토·발리 TNA ProductLink는 실제 `experiences.myrealtrip.com/products/{gid}` URL + 실가격. flight/stay는 빌드 시 MCP(`searchInternationalFlights`·`searchStays`)로 최신 그라운딩 후 `checked_at` 갱신.
- 하와이는 의도적으로 manual 폴백 케이스 — "host가 마이리얼트립 밖 상품도 붙일 수 있다"는 제품 유연성을 시연.
- 모든 ProductLink는 **독립 CTA**(PRD 17-3). 단일 "전체 예약" 버튼 금지.
- 가격·평점은 2026-05-30 스냅샷 — 데모 표기 시 `checked_at` 함께 노출.
