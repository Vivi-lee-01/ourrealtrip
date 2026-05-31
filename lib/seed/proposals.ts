// Phase 1 데모 시드 데이터 (docs/SEED_PROPOSALS.md, PRD 9절 엔티티 형태)
//
// 그라운딩 원칙(PRD 18-1): 목적지·커뮤니티는 host 큐레이션, 상품은 MCP/API 그라운딩.
// 교토·발리 TNA ProductLink는 실제 experiences.myrealtrip.com/products/{id} URL +
// myrealtrip_product_id. 하와이는 manual 폴백(myrealtrip_product_id=null).
//
// 제3자 상품 제목의 특가·프로모션 강조 문구는 중립화함(PRD 17-2). 평점/리뷰 수치는
// 별도 price_hint/reason로 표기하고 title 자체에는 마케팅 강조어를 넣지 않는다.
//
// checked_at = '2026-05-30' (시드 스냅샷 시점).

import type {
  Host,
  Community,
  TripProposal,
  TravelOption,
  ProductLink,
  Itinerary,
} from "@/lib/types";

const CHECKED_AT = "2026-05-30";

/** seed 단위 묶음: proposal + host + community + (option + links) + 일정표 + 카테고리 */
export interface SeedProposal {
  proposal: TripProposal;
  host: Host;
  community: Community;
  options: Array<{
    option: TravelOption;
    product_links: ProductLink[];
  }>;
  /** 일정표(Day1/Day2). 없으면 null */
  itinerary: Itinerary | null;
  /** Discover 카테고리 key (lib/seed/categories.ts의 key와 정합) */
  category_key: string | null;
}

// ════════════════════════════════════════════════════════════
// 1. 고즈넉한 사진 촬영 커뮤니티 × 교토  〔API 그라운딩〕
// ════════════════════════════════════════════════════════════

const kyotoHost: Host = {
  host_id: "host-kyoto-rino",
  name: "리노",
  profile_image_url: null,
  community_name: "필름워크 서울",
  bio: "격주로 도시 골목을 걷고 필름으로 기록하는 모임",
  trust_note: "3년간 서울·부산 포토워크 40회 운영",
};

const kyotoCommunity: Community = {
  community_id: "comm-filmwalk-seoul",
  name: "필름워크 서울",
  description: "도시 골목을 걷고 필름으로 기록하는 사진/기록 커뮤니티",
  category: "사진/기록",
  visibility: "unlisted",
};

const kyotoProposal: TripProposal = {
  proposal_id: "prop-kyoto",
  host_id: kyotoHost.host_id,
  community_id: kyotoCommunity.community_id,
  slug: "kyoto-quiet-photo-walk",
  title: "교토, 사람 적은 시간대에 골목을 천천히 찍는 3일",
  concept: "관광이 아니라 빛과 골목을 기록하러 가는 여행",
  target_audience:
    "카메라 들고 오래 걸을 수 있는 사람 / 빡빡한 일정 싫은 사람에겐 비추",
  mood: "고즈넉, 느림, 기록",
  expected_dates: "2026-06-12(금)~06-14(일)",
  expected_budget: "1인 60~90만원",
  destination_candidates: ["교토"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 외부 커버 이미지 없음 → coverGradient(category)로 대체 (lib/cover.ts)
  cover_image_url: null,
  recruit_capacity: 8,
  requires_approval: false,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 여행의 목적 — 각자 찍은 걸 모아 함께 보는 것",
  intended_outcome: "창작 · 친밀감",
  post_trip_artifact: "공동 사진 셀렉 + 짧은 회고 전시",
  relationship_depth: "mid",
  learning_or_creation_goal: "각자 한 컷씩 '내 교토'를 완성",
  why_now: "초여름 신록 + 관광 피크 전 평일",
};

const kyotoOptionA: TravelOption = {
  option_id: "opt-kyoto-a",
  proposal_id: kyotoProposal.proposal_id,
  option_name: "A안 — 가볍게 골목만",
  option_type: "basic",
  description: "처음 합류하는 멤버도 부담 없이 같이 찍는 기본형",
  estimated_budget: "60~75만원",
  fit_reason: "처음 합류하는 멤버도 부담 낮음",
  risk_note: null,
  sort_order: 0,
  community_intent_fit: "부담 없이 같이 찍기",
  relationship_depth: "low",
  learning_or_creation_potential: null,
  post_trip_artifact: "사진 공유·짧은 회고",
  schedule_difficulty: "low",
};

const kyotoOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-kyoto-a-tna",
    option_id: kyotoOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3425896",
    title: "아라시야마·금각사·청수사 교토 버스투어 (사진 촬영 포함)",
    price_hint: "46,550원~ · 평점 4.9 (리뷰 2,925)",
    reason: "주요 촬영지를 하루에 도는 입문용 동선",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3425896",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-kyoto-a-flight",
    option_id: kyotoOptionA.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→KIX 6/12-14 왕복",
    price_hint: "왕복 최저가 신호 ~₩52,000대 (변동)",
    reason: "금요일 출발 가능한 시간대",
    caution: "조회 시점 운임 변동",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-kyoto-a-stay",
    option_id: kyotoOptionA.option_id,
    product_type: "stay",
    source: "마이리얼트립 숙소",
    myrealtrip_product_id: null,
    title: "교토역/가와라마치 도보권 숙소",
    price_hint: null,
    reason: "이동 동선 짧은 중심지",
    caution: "빌드 시 searchStays로 그라운딩 필요",
    source_url: "https://stay.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const kyotoOptionB: TravelOption = {
  option_id: "opt-kyoto-b",
  proposal_id: kyotoProposal.proposal_id,
  option_name: "B안 — 촬영에 진심인 몰입형",
  option_type: "premium",
  description: "새벽·야간 촬영까지 포함하는 몰입형",
  estimated_budget: "80~110만원",
  fit_reason: "새벽·야간 촬영까지 함께할 사람",
  risk_note: "이른 새벽 일정으로 체력 소모 큼",
  sort_order: 1,
  community_intent_fit: "작품 만들기",
  relationship_depth: "high",
  learning_or_creation_potential: "작품 셀렉 + 귀국 후 전시·발표",
  post_trip_artifact: "작품 셀렉 + 귀국 후 전시·발표",
  schedule_difficulty: "high",
};

const kyotoOptionBLinks: ProductLink[] = [
  {
    product_link_id: "pl-kyoto-b-tna1",
    option_id: kyotoOptionB.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3154184",
    title: "오사카·교토 버스투어 (프로 사진작가 동반)",
    price_hint: "44,900원~ · 평점 4.8 (리뷰 1,380)",
    reason: "작가 동반으로 촬영 노하우 학습",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3154184",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-kyoto-b-tna2",
    option_id: kyotoOptionB.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "4333857",
    title: "오사카 출발 1일 교토 버스투어 (사진 촬영)",
    price_hint: "42,750원~ · 평점 5.0 (리뷰 195)",
    reason: "교토 집중 촬영 동선",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/4333857",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-kyoto-b-flight",
    option_id: kyotoOptionB.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→KIX 오전 도착 항공",
    price_hint: "왕복 최저가 신호 (변동)",
    reason: "오전 도착으로 첫날 촬영 확보",
    caution: "조회 시점 운임 변동",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-kyoto-b-stay",
    option_id: kyotoOptionB.option_id,
    product_type: "stay",
    source: "마이리얼트립 숙소",
    myrealtrip_product_id: null,
    title: "촬영 동선 중심 지역 숙소",
    price_hint: null,
    reason: "새벽 촬영지 접근성 우선",
    caution: "빌드 시 searchStays로 그라운딩 필요",
    source_url: "https://stay.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const kyotoOptionC: TravelOption = {
  option_id: "opt-kyoto-c",
  proposal_id: kyotoProposal.proposal_id,
  option_name: "C안 — 예산 낮춘 현실형",
  option_type: "budget",
  description: "무료 산책 코스 중심으로 예산을 낮춘 현실형",
  estimated_budget: "45~65만원",
  fit_reason: "예산 민감한 사람",
  risk_note: "이동 시간 길어질 수 있음",
  sort_order: 2,
  community_intent_fit: "부담 없이 다음을 기약",
  relationship_depth: "mid",
  learning_or_creation_potential: null,
  post_trip_artifact: "다음 모임 약속",
  schedule_difficulty: "low",
};

const kyotoOptionCLinks: ProductLink[] = [
  {
    product_link_id: "pl-kyoto-c-flight",
    option_id: kyotoOptionC.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→KIX 평일/저가 시간대",
    price_hint: "변동",
    reason: "저가 시간대로 비용 절감",
    caution: "조회 시점 운임 변동",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-kyoto-c-tna",
    option_id: kyotoOptionC.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: null,
    title: "무료 산책 코스 중심 + 입장권 1개",
    price_hint: null,
    reason: "비용 최소화한 도보 촬영",
    caution: "빌드 시 searchTnas로 그라운딩 필요",
    source_url: "https://experiences.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

// 일정표 — 일부 item에 기존 product_link 연결 (PRD 6절 6·9-10)
const kyotoItinerary: Itinerary = {
  itinerary_id: "itin-kyoto",
  proposal_id: kyotoProposal.proposal_id,
  days: [
    {
      day_no: 1,
      date: "2026-06-12",
      title: "도착과 가벼운 골목 워밍업",
      items: [
        { time: "14:00", title: "KIX 도착 · 시내 이동" },
        { time: "16:30", title: "가와라마치 체크인" },
        { time: "18:30", title: "기온 골목 산책 · 저녁" },
        { time: "20:00", title: "야경 촬영 짧게" },
      ],
    },
    {
      day_no: 2,
      date: "2026-06-13",
      title: "주요 촬영지 하루 동선",
      items: [
        {
          time: "09:00",
          title: "교토 버스투어 (아라시야마·금각사·청수사)",
          // A안 TNA와 연결
          product_link_id: "pl-kyoto-a-tna",
        },
        { time: "13:00", title: "니시키 시장 점심 · 거리 촬영" },
        { time: "17:00", title: "후시미이나리 늦은 오후 빛" },
        { time: "20:00", title: "숙소 모여 셀렉 공유" },
      ],
    },
  ],
};

const kyotoSeed: SeedProposal = {
  proposal: kyotoProposal,
  host: kyotoHost,
  community: kyotoCommunity,
  options: [
    { option: kyotoOptionA, product_links: kyotoOptionALinks },
    { option: kyotoOptionB, product_links: kyotoOptionBLinks },
    { option: kyotoOptionC, product_links: kyotoOptionCLinks },
  ],
  itinerary: kyotoItinerary,
  category_key: "photography",
};

// ════════════════════════════════════════════════════════════
// 2. AI 빌더 무브+해커톤 리트릿 × 발리(우붓·짱구)  〔API 그라운딩〕
// ════════════════════════════════════════════════════════════
// 카피 주의(PRD 17-4): 커뮤니티 자체 용어 "랄프루프(자율 코딩 루프 해커톤)"는
// 커뮤니티 컨셉 설명에만 쓰고, 외부 노출 카피는 "낮엔 같이 만들고, 아침엔 같이 뛰고,
// 사이엔 비운다"처럼 번역한다. 철학어 노출 금지.

const baliHost: Host = {
  host_id: "host-bali-doyun",
  name: "도윤",
  profile_image_url: null,
  community_name: "빌드앤무브",
  bio: "평일 밤엔 같이 만들고, 주말엔 같이 뛰는 빌더 모임",
  trust_note: "국내 빌더 해커톤·런클럽 12회 운영",
};

const baliCommunity: Community = {
  community_id: "comm-build-and-move",
  name: "빌드앤무브",
  description:
    "낮엔 같이 만들고, 아침엔 같이 뛰고, 사이엔 비우는 빌더 무브먼트 커뮤니티",
  category: "AI 빌더/무브먼트",
  visibility: "unlisted",
};

const baliProposal: TripProposal = {
  proposal_id: "prop-bali",
  host_id: baliHost.host_id,
  community_id: baliCommunity.community_id,
  slug: "bali-builder-move-retreat",
  title: "발리에서 같이 만들고, 같이 뛰고, 사이엔 비우는 빌더 위크",
  concept: "낮엔 자율 코딩 루프(랄프루프) 해커톤, 아침엔 런클럽·헬스, 사이엔 우붓 명상",
  target_audience: "직접 만드는 사람 / 아침 운동 같이 할 사람 / 관광만 원하면 비추",
  mood: "몰입, 회복, 외부 자극",
  expected_dates: "2026-06-15(월)~06-19(금)",
  expected_budget: "1인 110~160만원",
  destination_candidates: ["발리(우붓/짱구)"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  cover_image_url: null,
  recruit_capacity: 12,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: true,
  community_intent: "이번 여행의 목적 — 일상에서 못 내는 몰입을 외부에서 한 번에",
  intended_outcome: "창작 · 도전 · 회복 · 네트워킹",
  post_trip_artifact: "각자 데모 1개 + 마지막 날 발표 세션",
  relationship_depth: "high",
  learning_or_creation_goal: "혼자 못 끝낸 사이드프로젝트를 데모까지",
  why_now: "상반기 마무리 + 번아웃 리셋 타이밍",
};

const baliOptionA: TravelOption = {
  option_id: "opt-bali-a",
  proposal_id: baliProposal.proposal_id,
  option_name: "A안 — 우붓 베이스 집중형",
  option_type: "basic",
  description: "조용한 환경에서 만들기 + 명상에 집중하는 우붓 베이스",
  estimated_budget: "110~135만원",
  fit_reason: "조용한 환경에서 만들기+명상",
  risk_note: null,
  sort_order: 0,
  community_intent_fit: "만들기+비우기",
  relationship_depth: "high",
  learning_or_creation_potential: "데모 + 회고",
  post_trip_artifact: "데모 + 회고",
  schedule_difficulty: "low",
};

const baliOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-bali-a-tna1",
    option_id: baliOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "5905388",
    title: "우붓 몽키포레스트 + 뜨갈랄랑 계단식 논 + 티르타 엠풀 전일 투어",
    price_hint: "92,073원~ · 평점 4.9 (리뷰 247)",
    reason: "우붓 핵심 명소를 하루에 도는 전일 투어",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/5905388",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-bali-a-tna2",
    option_id: baliOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "4139355",
    title:
      "우붓 프라이빗 투어 (왕궁·몽키포레스트·티르타엠풀·폭포·스윙)",
    price_hint: "20,008원~ · 평점 5.0 (리뷰 546)",
    reason: "소규모로 일정 조절이 자유로운 프라이빗",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/4139355",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-bali-a-flight",
    option_id: baliOptionA.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→DPS 6/15-19 왕복",
    price_hint: "왕복 최저가 신호 ~₩80,000대 (변동)",
    reason: "일정에 맞는 직항 신호",
    caution: "조회 시점 운임 변동",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-bali-a-stay",
    option_id: baliOptionA.option_id,
    product_type: "stay",
    source: "마이리얼트립 숙소",
    myrealtrip_product_id: null,
    title: "우붓 빌라/코워킹 가능 숙소",
    price_hint: null,
    reason: "낮 작업 환경 확보",
    caution: "빌드 시 searchStays로 그라운딩 필요",
    source_url: "https://stay.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const baliOptionB: TravelOption = {
  option_id: "opt-bali-b",
  proposal_id: baliProposal.proposal_id,
  option_name: "B안 — 짱구 무브+빌드 하이브리드",
  option_type: "experimental",
  description: "아침 런클럽·서핑 + 낮 빌드를 묶은 짱구 하이브리드",
  estimated_budget: "120~150만원",
  fit_reason: "아침 런클럽·서핑 + 낮 빌드",
  risk_note: "이동 많아 일정 관리 필요",
  sort_order: 1,
  community_intent_fit: "몸 깨우고 만들기",
  relationship_depth: "high",
  learning_or_creation_potential: "데모 + 러닝 인증",
  post_trip_artifact: "데모 + 러닝 인증",
  schedule_difficulty: "mid",
};

const baliOptionBLinks: ProductLink[] = [
  {
    product_link_id: "pl-bali-b-tna",
    option_id: baliOptionB.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: null,
    title: "짱구 요가 클래스 (브런치 포함)",
    price_hint: "24,551원~ · 평점 5.0 (리뷰 3)",
    reason: "아침 무브 루틴에 어울리는 클래스",
    caution: "빌드 시 searchTnas('발리 요가')로 URL 그라운딩 후 채움",
    source_url: "https://experiences.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-bali-b-flight",
    option_id: baliOptionB.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→DPS 왕복",
    price_hint: "왕복 최저가 신호 (변동)",
    reason: "짱구 접근 동선",
    caution: "조회 시점 운임 변동",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-bali-b-stay",
    option_id: baliOptionB.option_id,
    product_type: "stay",
    source: "마이리얼트립 숙소",
    myrealtrip_product_id: null,
    title: "짱구 서프·코워킹 가능 숙소",
    price_hint: null,
    reason: "서핑·작업 동선 모두 확보",
    caution: "빌드 시 searchStays로 그라운딩 필요",
    source_url: "https://stay.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const baliOptionC: TravelOption = {
  option_id: "opt-bali-c",
  proposal_id: baliProposal.proposal_id,
  option_name: "C안 — 주말+α 짧게",
  option_type: "budget",
  description: "휴가 짧은 사람을 위한 압축 일정",
  estimated_budget: "95~120만원",
  fit_reason: "휴가 짧은 사람",
  risk_note: "일정 짧아 빌드 시간 제한",
  sort_order: 2,
  community_intent_fit: "짧게라도 같이 몰입",
  relationship_depth: "mid",
  learning_or_creation_potential: null,
  post_trip_artifact: null,
  schedule_difficulty: "low",
};

const baliOptionCLinks: ProductLink[] = [
  {
    product_link_id: "pl-bali-c-flight",
    option_id: baliOptionC.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→DPS 주말 포함 단기 일정",
    price_hint: "변동",
    reason: "짧은 휴가에 맞춘 일정",
    caution: "조회 시점 운임 변동",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-bali-c-stay",
    option_id: baliOptionC.option_id,
    product_type: "stay",
    source: "마이리얼트립 숙소",
    myrealtrip_product_id: null,
    title: "우붓 또는 짱구 단기 숙소",
    price_hint: null,
    reason: "단기 체류에 적합",
    caution: "빌드 시 searchStays로 그라운딩 필요",
    source_url: "https://stay.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

// 일정표 — "낮엔 만들고, 아침엔 뛰고, 사이엔 비운다" 번역 카피로 노출 (철학어 금지)
const baliItinerary: Itinerary = {
  itinerary_id: "itin-bali",
  proposal_id: baliProposal.proposal_id,
  days: [
    {
      day_no: 1,
      date: "2026-06-15",
      title: "도착 · 베이스 세팅 · 첫 빌드",
      items: [
        { time: "13:00", title: "DPS 도착 · 우붓 이동" },
        { time: "16:00", title: "빌라/코워킹 체크인 · 작업 환경 세팅" },
        { time: "19:00", title: "킥오프 · 각자 이번 주 만들 것 공유" },
        { time: "20:30", title: "첫 빌드 세션" },
      ],
    },
    {
      day_no: 2,
      date: "2026-06-16",
      title: "아침엔 같이 뛰고, 낮엔 같이 만들고",
      items: [
        { time: "06:30", title: "라이스필드 모닝 런" },
        {
          time: "10:00",
          title: "우붓 핵심 명소 전일 투어 (사이에 비우기)",
          // A안 전일 투어와 연결
          product_link_id: "pl-bali-a-tna1",
        },
        { time: "16:00", title: "오후 빌드 세션" },
        { time: "21:00", title: "데일리 데모 · 회고" },
      ],
    },
  ],
};

const baliSeed: SeedProposal = {
  proposal: baliProposal,
  host: baliHost,
  community: baliCommunity,
  options: [
    { option: baliOptionA, product_links: baliOptionALinks },
    { option: baliOptionB, product_links: baliOptionBLinks },
    { option: baliOptionC, product_links: baliOptionCLinks },
  ],
  itinerary: baliItinerary,
  category_key: "builder",
};

// ════════════════════════════════════════════════════════════
// 3. 서핑·액티비티 커뮤니티 × 하와이  〔manual URL 폴백 시연〕
// ════════════════════════════════════════════════════════════
// 마이리얼트립 TNA 0건·항공 고가 → host가 ProductLink를 직접 입력하는 manual 경로.
// 모든 myrealtrip_product_id = null (확정 결정 3).

const hawaiiHost: Host = {
  host_id: "host-hawaii-haena",
  name: "해나",
  profile_image_url: null,
  community_name: "파도살롱",
  bio: "국내외 서프 트립을 같이 다니는 살롱",
  trust_note: "양양·발리 서프 트립 8회",
};

const hawaiiCommunity: Community = {
  community_id: "comm-wave-salon",
  name: "파도살롱",
  description: "국내외 서프 트립을 같이 다니는 서핑/액티비티 커뮤니티",
  category: "서핑/액티비티",
  visibility: "unlisted",
};

const hawaiiProposal: TripProposal = {
  proposal_id: "prop-hawaii",
  host_id: hawaiiHost.host_id,
  community_id: hawaiiCommunity.community_id,
  slug: "hawaii-surf-week",
  title: "오아후에서 파도와 일주일 — 초보도 같이",
  concept: "아침 서핑, 낮엔 각자, 저녁엔 모여 회고",
  target_audience:
    "서핑 입문~중급 / 비행 길고 예산 큰 트립 감안 가능한 사람",
  mood: "에너지, 입문 환영",
  expected_dates: "2026-06-13(토)~06-20(토)",
  expected_budget: "1인 200~300만원+",
  destination_candidates: ["하와이(오아후)"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  cover_image_url: null,
  recruit_capacity: 10,
  requires_approval: false,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 여행의 목적 — 같이 입문하고 같이 늘기",
  intended_outcome: "도전 · 친밀감",
  post_trip_artifact: "서핑 영상 모음 + 다음 트립 약속",
  relationship_depth: "mid",
  learning_or_creation_goal: null,
  why_now: "여름 시즌 · 멤버 휴가 정렬",
};

const hawaiiOptionA: TravelOption = {
  option_id: "opt-hawaii-a",
  proposal_id: hawaiiProposal.proposal_id,
  option_name: "A안 — 와이키키 베이스 입문형",
  option_type: "basic",
  description: "초보 강습 중심 와이키키 베이스",
  estimated_budget: "200~260만원",
  fit_reason: "초보 강습 중심",
  risk_note: "장거리·고운임, 예산 합의 먼저",
  sort_order: 0,
  community_intent_fit: "같이 입문",
  relationship_depth: "mid",
  learning_or_creation_potential: null,
  post_trip_artifact: null,
  schedule_difficulty: "low",
};

const hawaiiOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-hawaii-a-flight",
    option_id: hawaiiOptionA.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→HNL 6/13-20 왕복",
    price_hint: "왕복 ~₩836K대 신호 (고가·변동)",
    reason: "오아후 직행 신호",
    caution: "장거리·고운임, 예산 합의 먼저",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-hawaii-a-stay",
    option_id: hawaiiOptionA.option_id,
    product_type: "stay",
    source: "host 수동 입력",
    myrealtrip_product_id: null,
    title: "와이키키 도보권 숙소",
    price_hint: null,
    reason: "서프 포인트 접근성",
    caution: "host 수동 입력 — 판매처에서 직접 확인",
    source_url: "https://www.google.com/search?q=waikiki+hotel",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-hawaii-a-tna",
    option_id: hawaiiOptionA.option_id,
    product_type: "tna",
    source: "host 수동 입력 (비-마이리얼트립)",
    myrealtrip_product_id: null,
    title: "오아후 서프 스쿨 (입문 강습)",
    price_hint: null,
    reason: "초보 입문 강습",
    caution: "마이리얼트립 미취급 — 외부 판매처 직접 확인",
    source_url: "https://www.google.com/search?q=oahu+surf+school",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const hawaiiOptionB: TravelOption = {
  option_id: "opt-hawaii-b",
  proposal_id: hawaiiProposal.proposal_id,
  option_name: "B안 — 노스쇼어 포함 몰입형",
  option_type: "premium",
  description: "노스쇼어까지 포함하는 몰입형",
  estimated_budget: "260~330만원",
  fit_reason: "중급 이상 / 파도 욕심 있는 사람",
  risk_note: "노스쇼어 파도 시즌·이동 변수",
  sort_order: 1,
  community_intent_fit: "같이 늘기",
  relationship_depth: "high",
  learning_or_creation_potential: null,
  post_trip_artifact: "서핑 영상 + 회고",
  schedule_difficulty: "mid",
};

const hawaiiOptionBLinks: ProductLink[] = [
  {
    product_link_id: "pl-hawaii-b-flight",
    option_id: hawaiiOptionB.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→HNL 왕복",
    price_hint: "고가·변동",
    reason: "오아후 직행 신호",
    caution: "장거리·고운임, 예산 합의 먼저",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-hawaii-b-stay",
    option_id: hawaiiOptionB.option_id,
    product_type: "stay",
    source: "host 수동 입력",
    myrealtrip_product_id: null,
    title: "노스쇼어 접근 숙소",
    price_hint: null,
    reason: "노스쇼어 파도 접근성",
    caution: "host 수동 입력 — 판매처에서 직접 확인",
    source_url: "https://www.google.com/search?q=north+shore+oahu+stay",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const hawaiiOptionC: TravelOption = {
  option_id: "opt-hawaii-c",
  proposal_id: hawaiiProposal.proposal_id,
  option_name: "C안 — 숙소 공유로 비용 절감",
  option_type: "budget",
  description: "숙소 공유로 비용을 낮춘 현실형",
  estimated_budget: "180~230만원",
  fit_reason: "예산 민감 / 인원 모이면",
  risk_note: "숙소 공유 합의 필요",
  sort_order: 2,
  community_intent_fit: "비용 나눠 같이 가기",
  relationship_depth: "mid",
  learning_or_creation_potential: null,
  post_trip_artifact: null,
  schedule_difficulty: "low",
};

const hawaiiOptionCLinks: ProductLink[] = [
  {
    product_link_id: "pl-hawaii-c-flight",
    option_id: hawaiiOptionC.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→HNL 저가 시간대 탐색",
    price_hint: "고가·변동",
    reason: "비용 절감 시간대",
    caution: "장거리·고운임, 예산 합의 먼저",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-hawaii-c-stay",
    option_id: hawaiiOptionC.option_id,
    product_type: "stay",
    source: "host 수동 입력",
    myrealtrip_product_id: null,
    title: "공유형 숙소(다인실/하우스)",
    price_hint: null,
    reason: "인원 분담으로 비용 절감",
    caution: "host 수동 입력 — 판매처에서 직접 확인",
    source_url: "https://www.google.com/search?q=oahu+shared+house",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

// 일정표 — 입문 강습은 host 수동 입력 TNA(pl-hawaii-a-tna)와 연결
const hawaiiItinerary: Itinerary = {
  itinerary_id: "itin-hawaii",
  proposal_id: hawaiiProposal.proposal_id,
  days: [
    {
      day_no: 1,
      date: "2026-06-13",
      title: "장거리 도착 · 와이키키 적응",
      items: [
        { time: "오전", title: "HNL 도착 · 와이키키 체크인" },
        { time: "오후", title: "보드 렌탈 · 해변 적응" },
        { time: "저녁", title: "모여서 이번 주 목표 정하기" },
      ],
    },
    {
      day_no: 2,
      date: "2026-06-14",
      title: "같이 입문 · 첫 강습",
      items: [
        {
          time: "07:00",
          title: "오아후 서프 스쿨 입문 강습",
          // 입문 강습 TNA(host 수동 입력)와 연결
          product_link_id: "pl-hawaii-a-tna",
        },
        { time: "12:00", title: "각자 점심 · 휴식" },
        { time: "16:00", title: "자유 서핑 · 서로 촬영" },
        { time: "19:00", title: "저녁 모여 영상 보며 회고" },
      ],
    },
  ],
};

const hawaiiSeed: SeedProposal = {
  proposal: hawaiiProposal,
  host: hawaiiHost,
  community: hawaiiCommunity,
  options: [
    { option: hawaiiOptionA, product_links: hawaiiOptionALinks },
    { option: hawaiiOptionB, product_links: hawaiiOptionBLinks },
    { option: hawaiiOptionC, product_links: hawaiiOptionCLinks },
  ],
  itinerary: hawaiiItinerary,
  category_key: "surf",
};

// ════════════════════════════════════════════════════════════
// 4. Ouroboros × 서울 원데이 (이재규)  〔랜딩 데모 시드〕
// ════════════════════════════════════════════════════════════
// 랜딩(OurRealTrip landing v3) 파일럿 카드를 Discover 시드로 승격.
// 호스트 일러스트는 public/demo-assets/ 에 복사되어 cover_image_url로 연결한다
// (파일럿 7건은 메인 PilotCarousel에 featured 노출 — lib/data/discover.ts).
// 상품은 데모 문구이며 빌드 시 MCP/API 그라운딩으로 확정 필요(PRD 18-1, footer 명시).

const ouroborosHost: Host = {
  host_id: "host-seoul-leejaegyu",
  name: "이재규님",
  // 호스트 일러스트는 카드 byline 아바타로 사용(커버는 테마 사진)
  profile_image_url: "/demo-assets/leejaegyu-illustration.png",
  community_name: "Ouroboros",
  bio: "무한순환과 자기완결의 가치를 서울 루트로 풀어내는 호스트",
  trust_note: "서울 도슨트·창작·야경 루트 큐레이션",
};

const ouroborosCommunity: Community = {
  community_id: "comm-ouroboros",
  name: "Ouroboros",
  description: "무한순환과 자기완결의 가치를 함께 체험하는 커뮤니티",
  category: "도슨트·창작·야경",
  visibility: "unlisted",
};

const ouroborosProposal: TripProposal = {
  proposal_id: "prop-ouroboros-seoul",
  host_id: ouroborosHost.host_id,
  community_id: ouroborosCommunity.community_id,
  slug: "ouroboros-seoul-oneday",
  title: "이재규님과 함께하는 Ouroboros 서울 원데이 투어",
  concept:
    "창경궁의 흔적을 야경으로 걷고, 강남 화실에서 각자 한 컷을 그리고, 한강에서 모여 회고하는 서울 하루. 관광이 아니라 '한 바퀴 돌아 더 단단해진 나'를 만나는 자기완결의 루트입니다. 빡빡한 코스 대신 사색·창작·야경을 한 호흡으로 잇습니다.",
  target_audience:
    "서울의 흔적·창작·야경 루트를 천천히 걷고 싶은 사람 / 빡빡한 관광 싫은 사람에겐 비추",
  mood: "사색, 창작, 야경",
  expected_dates: "서울 1일 루트 (원데이)",
  expected_budget: null,
  destination_candidates: ["서울"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 커버 — 확정 카드는 인물중심 호스트 일러스트로 복구(Vivi 요청 2026-05-31)
  cover_image_url: "/demo-assets/leejaegyu-illustration.png",
  recruit_capacity: null,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent:
    "이번 여행의 목적 — 서울 루트의 끝에서 한층 더 발전한 나를 발견하는 것",
  intended_outcome: "사색 · 창작 · 친밀감",
  post_trip_artifact: "각자의 서울 한 컷 + 짧은 회고",
  relationship_depth: "mid",
  learning_or_creation_goal: "서울의 흔적·창작·야경을 한 호흡으로 잇기",
  why_now: "서울 야경 시즌 · 원데이로 가볍게",
};

const ouroborosOptionA: TravelOption = {
  option_id: "opt-ouroboros-a",
  proposal_id: ouroborosProposal.proposal_id,
  option_name: "A안 — 흔적·창작·야경 원데이 루트",
  option_type: "basic",
  description: "서울 도슨트·클래스·야경을 하루에 잇는 원데이 루트",
  estimated_budget: null,
  fit_reason: "처음 합류하는 멤버도 부담 없이 하루에 마무리",
  risk_note: "원데이 동선이라 이동 페이스 빠를 수 있음",
  sort_order: 0,
  community_intent_fit: "서울 루트로 자기완결 체험",
  relationship_depth: "mid",
  learning_or_creation_potential: "각자 한 컷·한 회고 남기기",
  post_trip_artifact: "서울 한 컷 + 회고",
  schedule_difficulty: "mid",
};

const ouroborosOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-ouroboros-a-tna",
    option_id: ouroborosOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3827796",
    title: "창경야행 창경궁 야경투어",
    price_hint: "19,900원~ · 평점 4.9 (리뷰 62)",
    reason: "서울의 흔적을 야경으로 잇는 도슨트형 야간 투어",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3827796",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-ouroboros-a-tna2",
    option_id: ouroborosOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3827568",
    title: "그림소녀화실에서 그려보는 그림 클래스 (사진 촬영 포함)",
    price_hint: "45,000원~ · 평점 5.0 (리뷰 6)",
    reason: "각자 한 컷을 만드는 강남 창작 클래스",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3827568",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-ouroboros-a-tna3",
    option_id: ouroborosOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "4725391",
    title: "서울의 중심 한강에서 즐기는 길거리음식과 야경 피크닉",
    price_hint: "60,000원~",
    reason: "야경 루트의 마무리 — 한강에서 모여 회고",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/4725391",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const ouroborosItinerary: Itinerary = {
  itinerary_id: "itin-ouroboros-seoul",
  proposal_id: ouroborosProposal.proposal_id,
  days: [
    {
      day_no: 1,
      title: "서울의 흔적 · 창작 · 야경 원데이",
      items: [
        {
          time: "오후",
          title: "창경궁 야경투어 — 흔적을 따라 걷기",
          product_link_id: "pl-ouroboros-a-tna",
        },
        {
          time: "저녁",
          title: "그림 클래스 · 각자 한 컷 만들기",
          product_link_id: "pl-ouroboros-a-tna2",
        },
        {
          time: "밤",
          title: "한강 야경 피크닉 · 모여서 회고",
          product_link_id: "pl-ouroboros-a-tna3",
        },
      ],
    },
  ],
};

const ouroborosSeed: SeedProposal = {
  proposal: ouroborosProposal,
  host: ouroborosHost,
  community: ouroborosCommunity,
  options: [{ option: ouroborosOptionA, product_links: ouroborosOptionALinks }],
  itinerary: ouroborosItinerary,
  category_key: "photography",
};

// ════════════════════════════════════════════════════════════
// 5. 북경 1박 2일 만두 투어 (이웅재)  〔랜딩 데모 시드〕
// ════════════════════════════════════════════════════════════

const beijingHost: Host = {
  host_id: "host-beijing-leewoongjae",
  name: "이웅재님",
  // 호스트 일러스트는 카드 byline 아바타로 사용(커버는 테마 사진)
  profile_image_url: "/demo-assets/leewoongjae-illustration.png",
  community_name: "북경",
  bio: "북경에서 스킬로 만두를 시켜먹는 1박 2일 호스트",
  trust_note: "북경 항공+호텔+만두 동선 큐레이션",
};

const beijingCommunity: Community = {
  community_id: "comm-beijing",
  name: "북경",
  description: "북경 1박 2일 만두 투어 커뮤니티",
  category: "해외 여행/미식",
  visibility: "unlisted",
};

const beijingProposal: TripProposal = {
  proposal_id: "prop-beijing-mandu",
  host_id: beijingHost.host_id,
  community_id: beijingCommunity.community_id,
  slug: "beijing-mandu-2d1n",
  title: "이웅재님과 북경 1박 2일 만두 투어",
  concept:
    "주말+α면 충분한 1박 2일, 북경에서 진짜 만두 한 그릇을 같이 비우러 갑니다. 현지인 미식 동선으로 로컬 만두집을 돌고, 사이엔 자금성·천안문 도슨트로 북경을 한 입 깊게 맛봅니다. 거창한 관광 대신 '같이 먹는 즐거움'에 집중한 가벼운 해외 미식 트립입니다.",
  target_audience: "짧게 다녀오는 해외 미식 트립 좋아하는 사람",
  mood: "가볍게, 미식, 동행",
  expected_dates: "1박 2일",
  expected_budget: null,
  destination_candidates: ["북경"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 커버 — 확정 카드는 인물중심 호스트 일러스트로 복구(Vivi 요청 2026-05-31)
  cover_image_url: "/demo-assets/leewoongjae-illustration.png",
  recruit_capacity: null,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 여행의 목적 — 짧게라도 같이 만두 한 그릇",
  intended_outcome: "미식 · 동행",
  post_trip_artifact: "북경 만두 맛집 리스트",
  relationship_depth: "mid",
  learning_or_creation_goal: null,
  why_now: "주말+α로 가볍게 다녀오기",
};

const beijingOptionA: TravelOption = {
  option_id: "opt-beijing-a",
  proposal_id: beijingProposal.proposal_id,
  option_name: "A안 — 항공+호텔+만두 패키지",
  option_type: "basic",
  description: "항공·숙소·식사 동선을 묶은 1박 2일 패키지 (존웍 포함)",
  estimated_budget: null,
  fit_reason: "처음 가는 사람도 동선 걱정 없이 합류",
  risk_note: "1박 2일이라 일정이 압축적",
  sort_order: 0,
  community_intent_fit: "같이 만두 먹으러 가기",
  relationship_depth: "mid",
  learning_or_creation_potential: null,
  post_trip_artifact: "만두 맛집 리스트",
  schedule_difficulty: "mid",
};

const beijingOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-beijing-a-tna",
    option_id: beijingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "4882033",
    title: "13년차 현지인이 추천하는 베이징 프라이빗 미식투어",
    price_hint: "79,200원~",
    reason: "현지인과 함께 도는 북경 미식(만두·로컬 맛집) 동선",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/4882033",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-beijing-a-tna2",
    option_id: beijingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3886753",
    title: "SUNNY가 들려주는 천안문 & 자금성 이야기 (오전 10시)",
    price_hint: "30,000원~ · 평점 5.0 (리뷰 179)",
    reason: "만두 사이에 끼워 도는 북경 핵심 도슨트",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3886753",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-beijing-a-flight",
    option_id: beijingOptionA.option_id,
    product_type: "flight",
    source: "마이리얼트립 항공",
    myrealtrip_product_id: null,
    title: "ICN→PEK 1박 2일 왕복",
    price_hint: "왕복 최저가 신호 (변동)",
    reason: "1박 2일 일정에 맞는 직항 신호",
    caution: "조회 시점 운임 변동 · 빌드 시 그라운딩 필요",
    source_url: "https://flights.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-beijing-a-stay",
    option_id: beijingOptionA.option_id,
    product_type: "stay",
    source: "마이리얼트립 숙소",
    myrealtrip_product_id: null,
    title: "북경 시내 1박 숙소",
    price_hint: null,
    reason: "만두 동선 접근성 좋은 시내",
    caution: "빌드 시 searchStays로 그라운딩 필요",
    source_url: "https://stay.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const beijingSeed: SeedProposal = {
  proposal: beijingProposal,
  host: beijingHost,
  community: beijingCommunity,
  options: [{ option: beijingOptionA, product_links: beijingOptionALinks }],
  itinerary: null,
  category_key: "food",
};

// ════════════════════════════════════════════════════════════
// 6. 내 여친 드로잉 체험 (조재표)  〔랜딩 데모 시드〕
// ════════════════════════════════════════════════════════════

const drawingHost: Host = {
  host_id: "host-drawing-chojaepyo",
  name: "조재표님",
  // 호스트 일러스트는 카드 byline 아바타로 사용(커버는 테마 사진)
  profile_image_url: "/demo-assets/chojaepyo-illustration.png",
  community_name: "Hent-ai",
  bio: "취향과 캐릭터 상상을 드로잉으로 꺼내는 창작 호스트",
  trust_note: "드로잉·아트 클래스 큐레이션",
};

const drawingCommunity: Community = {
  community_id: "comm-hent-ai",
  name: "Hent-ai",
  description: "각자의 취향과 캐릭터 상상을 드로잉으로 꺼내보는 창작 커뮤니티",
  category: "창작형/드로잉·아트",
  visibility: "unlisted",
};

const drawingProposal: TripProposal = {
  proposal_id: "prop-drawing-girlfriend",
  host_id: drawingHost.host_id,
  community_id: drawingCommunity.community_id,
  slug: "my-girlfriend-drawing",
  title: "조재표님과 함께하는 내 여친 드로잉 체험",
  concept:
    "머릿속에만 있던 취향과 캐릭터 상상을, 펜과 종이로 직접 한 장에 꺼내보는 창작 이벤트입니다. 그림을 한 번도 안 그려봤어도 호스트가 한 컷씩 함께 완성하도록 이끌어줍니다. 잘 그리는 게 목적이 아니라 '내가 좋아하는 걸 손으로 만드는' 몰입의 시간을 같이 즐기는 자리입니다.",
  target_audience: "그림으로 취향·상상을 표현하고 싶은 사람",
  mood: "창작, 몰입, 가볍게",
  expected_dates: null,
  expected_budget: null,
  destination_candidates: null,
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 커버 — 확정 카드는 인물중심 호스트 일러스트로 복구(Vivi 요청 2026-05-31)
  cover_image_url: "/demo-assets/chojaepyo-illustration.png",
  recruit_capacity: null,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 이벤트의 목적 — 상상을 드로잉으로 함께 꺼내보기",
  intended_outcome: "창작 · 친밀감",
  post_trip_artifact: "각자 완성한 드로잉",
  relationship_depth: "mid",
  learning_or_creation_goal: "취향·캐릭터 상상을 한 장의 그림으로",
  why_now: null,
};

const drawingOptionA: TravelOption = {
  option_id: "opt-drawing-a",
  proposal_id: drawingProposal.proposal_id,
  option_name: "A안 — 드로잉·아트 클래스 체험",
  option_type: "basic",
  description: "클래스형 체험 — 난이도/장소 후보 확인 후 진행",
  estimated_budget: null,
  fit_reason: "처음 그려보는 사람도 부담 없이 합류",
  risk_note: "난이도/장소 후보 확인 필요",
  sort_order: 0,
  community_intent_fit: "상상을 그림으로 함께",
  relationship_depth: "mid",
  learning_or_creation_potential: "각자 드로잉 1점 완성",
  post_trip_artifact: "완성 드로잉",
  schedule_difficulty: "low",
};

const drawingOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-drawing-a-tna",
    option_id: drawingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3827568",
    title: "그림소녀화실에서 그려보는 그림 클래스 (사진 촬영 포함)",
    price_hint: "45,000원~ · 평점 5.0 (리뷰 6)",
    reason: "초보도 가능 — 취향·캐릭터 상상을 한 장으로",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3827568",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-drawing-a-tna2",
    option_id: drawingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3827622",
    title: "여행의 추억을 그림으로 남겨봐요! 펜 드로잉 클래스",
    price_hint: "45,000원~ · 평점 5.0 (리뷰 2)",
    reason: "펜 드로잉으로 가볍게 시작하는 창작",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3827622",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-drawing-a-tna3",
    option_id: drawingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3827596",
    title: "아이패드 드로잉 원데이 클래스",
    price_hint: "50,000원~ · 평점 4.7 (리뷰 3)",
    reason: "디지털 드로잉으로 캐릭터 상상 구현",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3827596",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const drawingSeed: SeedProposal = {
  proposal: drawingProposal,
  host: drawingHost,
  community: drawingCommunity,
  options: [{ option: drawingOptionA, product_links: drawingOptionALinks }],
  itinerary: null,
  category_key: "builder",
};

// ════════════════════════════════════════════════════════════
// 7. K-국뽕 국중박 도슨트 투어 (Jeffrey)  〔랜딩 데모 시드〕
// ════════════════════════════════════════════════════════════

const docentHost: Host = {
  host_id: "host-docent-jeffrey",
  name: "Jeffrey님",
  // 호스트 일러스트는 카드 byline 아바타로 사용(커버는 테마 사진)
  profile_image_url: "/demo-assets/jeffrey-illustration.png",
  community_name: "K-스킬",
  bio: "국립중앙박물관을 해설로 안내하는 도슨트 호스트",
  trust_note: "박물관 가이드 투어 · 키즈/부모 분리 운영",
};

const docentCommunity: Community = {
  community_id: "comm-k-skill",
  name: "K-스킬",
  description: "박물관 가이드 투어를 함께 즐기는 도슨트 커뮤니티",
  category: "도슨트형/박물관 가이드",
  visibility: "unlisted",
};

const docentProposal: TripProposal = {
  proposal_id: "prop-jeffrey-docent",
  host_id: docentHost.host_id,
  community_id: docentCommunity.community_id,
  slug: "jeffrey-gukjungbak-docent",
  title: "Jeffrey님과 K-국뽕 가득 국중박 도슨트 투어",
  concept:
    "국립중앙박물관을 그냥 '보는' 게 아니라 Jeffrey님의 해설로 '읽어내는' 가족형 도슨트 투어입니다. 아이는 눈높이 체험으로, 부모는 깊이 있는 해설로 — 키즈/부모를 따로 운영해 각자의 속도로 전시를 즐깁니다. 한국사 한 토막을 제대로 알고 나오는, 국뽕 차오르는 하루입니다.",
  target_audience: "아이와 함께 박물관 해설을 듣고 싶은 부모 / 키즈 동반 가족",
  mood: "배움, 가족, 해설",
  expected_dates: null,
  expected_budget: null,
  destination_candidates: ["국립중앙박물관(국중박), 서울"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 커버 — 확정 카드는 인물중심 호스트 일러스트로 복구(Vivi 요청 2026-05-31)
  cover_image_url: "/demo-assets/jeffrey-illustration.png",
  recruit_capacity: null,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 이벤트의 목적 — 키즈/부모 함께, 따로 또 같이 즐기기",
  intended_outcome: "배움 · 가족",
  post_trip_artifact: "관람 후 가족 회고",
  relationship_depth: "mid",
  learning_or_creation_goal: "박물관 해설로 한층 깊게 보기",
  why_now: null,
};

const docentOptionA: TravelOption = {
  option_id: "opt-docent-a",
  proposal_id: docentProposal.proposal_id,
  option_name: "A안 — 국중박 도슨트 가이드 투어",
  option_type: "basic",
  description: "국립중앙박물관 도슨트 해설 — 키즈/부모 분리 운영",
  estimated_budget: null,
  fit_reason: "키즈 동반 가족도 부모는 해설, 아이는 관람",
  risk_note: "키즈 동반 조건 확인 필요",
  sort_order: 0,
  community_intent_fit: "가족이 따로 또 같이",
  relationship_depth: "mid",
  learning_or_creation_potential: "해설로 전시 깊게 보기",
  post_trip_artifact: "가족 회고",
  schedule_difficulty: "low",
};

const docentOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-docent-a-tna",
    option_id: docentOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3880354",
    title: "[아이와함께] 국립중앙박물관 원데이 도슨트 투어",
    price_hint: "27,900원~ · 평점 4.9 (리뷰 243)",
    reason: "아이와 함께 듣는 국중박 해설 — 가족형 입문",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3880354",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-docent-a-tna2",
    option_id: docentOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3852748",
    title: "[키즈/부모분리] 국립중앙박물관 그리스로마전 어린이 체험학습 역사 도슨트",
    price_hint: "34,900원~ · 평점 4.7 (리뷰 118)",
    reason: "키즈/부모 분리 운영 — 컨셉에 정확히 부합",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3852748",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-docent-a-tna3",
    option_id: docentOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3880363",
    title: "[키즈] 흥미진진 이해쏙쏙 국립중앙박물관 초등 역사 도슨트 투어",
    price_hint: "34,900원~ · 평점 4.9 (리뷰 462)",
    reason: "초등 역사 해설 중심 — 키즈 동반 가족",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3880363",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const docentSeed: SeedProposal = {
  proposal: docentProposal,
  host: docentHost,
  community: docentCommunity,
  options: [{ option: docentOptionA, product_links: docentOptionALinks }],
  itinerary: null,
  category_key: "photography",
};

// ════════════════════════════════════════════════════════════
// 8. 랄프우드 발리 짱구편 (정구봉)  〔랜딩 데모 시드〕
// ════════════════════════════════════════════════════════════

const cangguHost: Host = {
  host_id: "host-canggu-junggoobong",
  name: "정구봉님",
  // 호스트 일러스트는 카드 byline 아바타로 사용(커버는 테마 사진)
  profile_image_url: "/demo-assets/junggoobong-illustration-clean.png",
  community_name: "랄프우드",
  bio: "취향 맞는 프로그램으로 삼삼오오 떠나는 발리 짱구 웰니스 호스트",
  trust_note: "발리 짱구 웰니스·숙소·액티비티 큐레이션",
};

const cangguCommunity: Community = {
  community_id: "comm-ralphwood",
  name: "랄프우드",
  description: "취향 맞는 프로그램으로 삼삼오오 떠나는 발리 짱구 웰니스 커뮤니티",
  category: "웰니스/해외 웰니스",
  visibility: "unlisted",
};

const cangguProposal: TripProposal = {
  proposal_id: "prop-canggu-wellness",
  host_id: cangguHost.host_id,
  community_id: cangguCommunity.community_id,
  slug: "ralphwood-bali-canggu",
  title: "정구봉님과 함께하는 랄프우드 발리 짱구편",
  concept:
    "발리에서 가장 힙한 해변 마을 짱구에서, 취향이 맞는 사람끼리 삼삼오오 떠나는 웰니스 트립입니다. 아침 요가와 서핑으로 몸을 깨우고, 스파·마사지로 회복하는 루틴을 각자 취향대로 조합합니다. 빡센 단체 일정 대신 '나에게 맞는 회복'을 같이 설계하는 느슨하고 단단한 동행입니다.",
  target_audience: "취향 맞는 사람끼리 삼삼오오 발리 웰니스 떠나고 싶은 사람",
  mood: "회복, 웰니스, 동행",
  expected_dates: null,
  expected_budget: null,
  destination_candidates: ["발리 짱구(Bali Canggu)"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 커버 — 테마 매칭 실제 사진(MRT 짱구 요가 클래스 5542578 CloudFront 이미지)
  cover_image_url:
    "https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2025/12/11/wMaQ/rPN5KTbiuU.jpg?width=480&quality=70",
  recruit_capacity: null,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 여행의 목적 — 취향 맞는 프로그램으로 같이 회복",
  intended_outcome: "회복 · 친밀감",
  post_trip_artifact: "짱구 웰니스 루틴 회고",
  relationship_depth: "mid",
  learning_or_creation_goal: null,
  why_now: null,
};

const cangguOptionA: TravelOption = {
  option_id: "opt-canggu-a",
  proposal_id: cangguProposal.proposal_id,
  option_name: "A안 — 짱구 웰니스 조합형",
  option_type: "basic",
  description: "숙소·운동·사우나를 취향대로 조합하는 짱구 웰니스",
  estimated_budget: null,
  fit_reason: "취향 맞는 프로그램으로 삼삼오오 합류",
  risk_note: "해외형 상품 조합 — 숙소/운동/사우나 링크 분리 필요",
  sort_order: 0,
  community_intent_fit: "취향대로 같이 회복",
  relationship_depth: "mid",
  learning_or_creation_potential: null,
  post_trip_artifact: "웰니스 루틴 회고",
  schedule_difficulty: "mid",
};

const cangguOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-canggu-a-tna",
    option_id: cangguOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "5542578",
    title: "짱구 요가 클래스 (브런치 포함)",
    price_hint: "24,683원~ · 평점 5.0 (리뷰 3)",
    reason: "아침 무브 루틴에 어울리는 짱구 요가",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/5542578",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-canggu-a-tna2",
    option_id: cangguOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "5542528",
    title: "[짱구] 짱구 올드 맨스 비치 서핑 클래스 (발리)",
    price_hint: "34,340원~ · 평점 5.0 (리뷰 4)",
    reason: "취향대로 고르는 짱구 액티비티 — 서핑",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/5542528",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-canggu-a-tna3",
    option_id: cangguOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "5542423",
    title: "[짱구] 발리 짱구 스바하 바투 볼롱 스파 & 마사지",
    price_hint: "24,907원~",
    reason: "운동 뒤 회복 — 스파·마사지로 마무리",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/5542423",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-canggu-a-stay",
    option_id: cangguOptionA.option_id,
    product_type: "stay",
    source: "마이리얼트립 숙소",
    myrealtrip_product_id: null,
    title: "짱구 웰니스 숙소",
    price_hint: null,
    reason: "운동·사우나 동선 접근성",
    caution: "빌드 시 searchStays로 그라운딩 필요",
    source_url: "https://stay.myrealtrip.com/",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const cangguSeed: SeedProposal = {
  proposal: cangguProposal,
  host: cangguHost,
  community: cangguCommunity,
  options: [{ option: cangguOptionA, product_links: cangguOptionALinks }],
  itinerary: null,
  category_key: "wellness",
};

// ════════════════════════════════════════════════════════════
// 9. 조/중/석 1일 3소개팅 랜덤소개팅  〔랜딩 데모 시드 · 이미지 없음〕
// ════════════════════════════════════════════════════════════

const datingHost: Host = {
  host_id: "host-dating-random",
  name: "한강보트 · 미술관 도슨트 · 사격 · 야구 관람",
  profile_image_url: null,
  community_name: "랜덤소개팅",
  bio: "취향 맞는 액티비티로 운명의 짝을 찾는 3:3 랜덤소개팅",
  trust_note: "아침/점심/저녁 액티비티 3종 조합 운영",
};

const datingCommunity: Community = {
  community_id: "comm-random-dating",
  name: "랜덤소개팅",
  description: "취향에 맞는 액티비티 & 프로그램으로 운명의 짝을 찾는 소개팅 커뮤니티",
  category: "액티비티 묶음/소개팅",
  visibility: "unlisted",
};

const datingProposal: TripProposal = {
  proposal_id: "prop-random-dating",
  host_id: datingHost.host_id,
  community_id: datingCommunity.community_id,
  slug: "random-dating-3activity",
  title: "조/중/석 1일 3소개팅 액티비티 랜덤소개팅",
  concept:
    "어색한 마주 앉기 대신, 하루 동안 한강 보트·드로잉·사격 같은 액티비티를 함께하며 자연스럽게 가까워지는 3:3 랜덤소개팅입니다. 아침·점심·저녁 세 가지 활동을 거치는 동안 말보다 '같이 하는 경험'으로 서로를 알아갑니다. 부담 없이 설렘만 챙겨 가는, 활동형 만남의 하루입니다.",
  target_audience: "취향 맞는 액티비티로 자연스럽게 만나고 싶은 사람",
  mood: "설렘, 액티비티, 가볍게",
  expected_dates: "1일 (아침/점심/저녁 시간대별)",
  expected_budget: null,
  destination_candidates: ["서울 (한강 / 미술관 / 사격장 / 야구장)"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 커버 — 테마 매칭 실제 사진(MRT 한강 세빛섬 보트투어 4585907 CloudFront 이미지)
  cover_image_url:
    "https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2025/05/30/9Q6Z/T86zd4lDDc.jpg?width=480&quality=70",
  recruit_capacity: null,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 이벤트의 목적 — 액티비티로 자연스럽게 운명의 짝 찾기",
  intended_outcome: "설렘 · 만남",
  post_trip_artifact: null,
  relationship_depth: "low",
  learning_or_creation_goal: null,
  why_now: null,
};

const datingOptionA: TravelOption = {
  option_id: "opt-dating-a",
  proposal_id: datingProposal.proposal_id,
  option_name: "A안 — 아침/점심/저녁 액티비티 3종 묶음",
  option_type: "experimental",
  description: "3:3 랜덤소개팅 — 시간대별 액티비티 조합 (조/중/석)",
  estimated_budget: null,
  fit_reason: "활동하며 자연스럽게 만나고 싶은 사람",
  risk_note: "시간대별 액티비티 3종 조합 조율 필요",
  sort_order: 0,
  community_intent_fit: "액티비티로 자연스러운 만남",
  relationship_depth: "low",
  learning_or_creation_potential: null,
  post_trip_artifact: null,
  schedule_difficulty: "mid",
};

const datingOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-dating-a-tna",
    option_id: datingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "4585907",
    title: "[서울] 골든블루마리나 반포 세빛섬 무지개보트투어",
    price_hint: "18,900원~",
    reason: "아침 — 한강 보트로 가볍게 시작",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/4585907",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-dating-a-tna2",
    option_id: datingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3827568",
    title: "그림소녀화실에서 그려보는 그림 클래스 (사진 촬영 포함)",
    price_hint: "45,000원~ · 평점 5.0 (리뷰 6)",
    reason: "점심 — 함께 그리며 자연스러운 대화",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3827568",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-dating-a-tna3",
    option_id: datingOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: null,
    title: "[서울 종로] 리얼샷 사격양궁장",
    price_hint: "4,000원~ · 평점 5.0 (리뷰 4)",
    reason: "저녁 — 사격·양궁으로 설레는 액티비티",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://www.myrealtrip.com/offers/81904",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const datingSeed: SeedProposal = {
  proposal: datingProposal,
  host: datingHost,
  community: datingCommunity,
  options: [{ option: datingOptionA, product_links: datingOptionALinks }],
  itinerary: null,
  category_key: "run",
};

// ════════════════════════════════════════════════════════════
// 10. 피부고민 밋업  〔랜딩 데모 시드 · 이미지 없음 · 여성 전용〕
// ════════════════════════════════════════════════════════════

const beautyHost: Host = {
  host_id: "host-beauty-meetup",
  name: "한남 · 청담 · 신사 · 목동 · 운정",
  profile_image_url: null,
  community_name: "여성 전용",
  bio: "비슷한 피부 고민을 가진 사람들과 경험을 나누는 뷰티 밋업",
  trust_note: "여성 전용 · 피부고민 밋업 + 뷰티 케어 운영",
};

const beautyCommunity: Community = {
  community_id: "comm-women-only-beauty",
  name: "여성 전용",
  description: "비슷한 피부 고민을 가진 사람들과 경험을 나누는 여성 전용 뷰티 커뮤니티",
  category: "뷰티 밋업/여성 전용",
  visibility: "unlisted",
};

const beautyProposal: TripProposal = {
  proposal_id: "prop-beauty-meetup",
  host_id: beautyHost.host_id,
  community_id: beautyCommunity.community_id,
  slug: "skin-concern-beauty-meetup",
  title: "피부고민 밋업 — 시술과 고민 해결 한 큐에",
  concept:
    "여드름·탄력·미백 — 혼자 검색하던 피부 고민을, 같은 고민을 가진 사람들과 마주 앉아 솔직하게 나누는 여성 전용 밋업입니다. 경험담을 주고받는 데서 끝나지 않고, 그 자리에서 페이셜 케어까지 받아 '얘기하고 바로 관리받는' 한 큐의 흐름을 만듭니다. 정보와 케어를 동시에 챙겨 가는 실속 모임입니다.",
  target_audience: "비슷한 피부 고민을 나누고 케어까지 받고 싶은 여성",
  mood: "공감, 케어, 여성 전용",
  expected_dates: null,
  expected_budget: null,
  destination_candidates: ["한남 · 청담 · 신사 · 목동 · 운정"],
  status: "interest_check",
  visibility: "unlisted",
  checked_at: CHECKED_AT,
  // 커버 — 테마 매칭 실제 사진(MRT 페이셜 케어 프로그램 3887946 CloudFront 이미지)
  cover_image_url:
    "https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2024/11/27/Q7Ef/HflP1w2sGw.jpg?width=480&quality=70",
  recruit_capacity: null,
  requires_approval: true,
  timezone: "GMT+09:00 서울",
  waitlist_enabled: false,
  community_intent: "이번 밋업의 목적 — 고민 나누고 즉시 케어까지 함께",
  intended_outcome: "공감 · 케어",
  post_trip_artifact: null,
  relationship_depth: "mid",
  learning_or_creation_goal: null,
  why_now: null,
};

const beautyOptionA: TravelOption = {
  option_id: "opt-beauty-a",
  proposal_id: beautyProposal.proposal_id,
  option_name: "A안 — 피부고민 밋업 + 즉시 케어",
  option_type: "basic",
  description: "여성 전용 · 피부고민 공유 밋업 + 즉시 효과 뷰티 케어",
  estimated_budget: null,
  fit_reason: "비슷한 고민을 나누며 케어까지 받고 싶은 사람",
  risk_note: "지역(한남/청담/신사/목동/운정)별 케어 상품 연결 확인 필요",
  sort_order: 0,
  community_intent_fit: "고민 나누고 케어까지",
  relationship_depth: "mid",
  learning_or_creation_potential: null,
  post_trip_artifact: null,
  schedule_difficulty: "low",
};

const beautyOptionALinks: ProductLink[] = [
  {
    product_link_id: "pl-beauty-a-tna",
    option_id: beautyOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3887946",
    title: "페이셜 케어 프로그램 (기본관리)",
    price_hint: "120,000원~",
    reason: "피부고민 밋업과 연결되는 기본 페이셜 케어",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3887946",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-beauty-a-tna2",
    option_id: beautyOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3887947",
    title: "페이셜 케어 프로그램 (여드름 관리)",
    price_hint: "120,000원~",
    reason: "여드름 고민 맞춤 케어",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3887947",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
  {
    product_link_id: "pl-beauty-a-tna3",
    option_id: beautyOptionA.option_id,
    product_type: "tna",
    source: "마이리얼트립",
    myrealtrip_product_id: "3887950",
    title: "페이셜 케어 프로그램 (탄력 관리)",
    price_hint: "120,000원~",
    reason: "탄력 고민 맞춤 케어",
    caution: "가격·예약 가능은 확인 시점 이후 변동될 수 있음",
    source_url: "https://experiences.myrealtrip.com/products/3887950",
    mylink_url: null,
    checked_at: CHECKED_AT,
    status: "active",
  },
];

const beautySeed: SeedProposal = {
  proposal: beautyProposal,
  host: beautyHost,
  community: beautyCommunity,
  options: [{ option: beautyOptionA, product_links: beautyOptionALinks }],
  itinerary: null,
  category_key: "wellness",
};

// ════════════════════════════════════════════════════════════
// export
// ════════════════════════════════════════════════════════════

/** Phase 1 데모 시드 (교토·발리·하와이 + 랜딩 파일럿 7건) */
export const SEED_PROPOSALS: readonly SeedProposal[] = [
  kyotoSeed,
  baliSeed,
  hawaiiSeed,
  ouroborosSeed,
  beijingSeed,
  drawingSeed,
  docentSeed,
  cangguSeed,
  datingSeed,
  beautySeed,
] as const;
