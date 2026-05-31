// 아워리얼트립 핵심 데이터 엔티티 타입 (PRD.md 9절)
//
// 주의(PRD 9절): 인사이트 노트에서 도출된 의도/커뮤니티 필드는 모두 정식 엔티티
// 필드로 승격되었으며, 의도/커뮤니티 필드는 nullable(미입력 허용)이다.
// Phase 1은 백엔드 없이 seed에서 읽으므로 id는 string으로 둔다(uuid 호환).

// ──────────────────────────────────────────────────────────
// 공통 유니온 타입
// ──────────────────────────────────────────────────────────

/** Proposal 상태 모델 (PRD 8절) */
export type ProposalStatus =
  | "draft"
  | "interest_check"
  | "option_refining"
  | "booking_open"
  | "closed"
  | "cancelled"
  | "archived";

/** 노출 범위 (PRD 9-2/9-3) — Phase 1은 unlisted 중심 */
export type Visibility = "public" | "unlisted";

// ── v2.1 create UX 필드 (Luma 번역, host-create) ──
// 단일 출처: 아래 타입들은 lib/host-create/agentPayload.ts 가 재사용한다.

/** UI 공개 범위 2-way. public=공개(탐색 노출) / private=비공개(링크 받은 사람만) */
export type EventAudience = "public" | "private";

/** 장소 공개 수준 (P1-5) */
export type LocationVisibility =
  | "exact" // 정확한 주소
  | "area" // 대략적 지역
  | "after_approval" // 승인 후 공개
  | "online" // 온라인 링크
  | "tbd"; // 미정

/** 분위기/테마 프리셋 (P1-4) */
export type MoodPreset =
  | "quiet" // 조용한 취향 모임
  | "casual" // 가볍게 합류
  | "deep" // 깊은 대화
  | "active" // 액티브
  | "local" // 로컬 여행
  | "premium"; // 프리미엄 큐레이션

/** 일정 후보 1건 (P2-1 foundation) */
export interface ScheduleCandidate {
  label: string;
  date_text: string;
  pros: string | null;
  cons: string | null;
}

/** 이벤트 옵션 A/B/C 1건 — draft 단계 경량 표현 (P2-2 foundation) */
export interface DraftOption {
  option_name: string;
  option_type: OptionType | null;
  description: string | null;
  estimated_budget: string | null;
  fit_reason: string | null;
  risk_note: string | null;
  schedule_difficulty: ScheduleDifficulty | null;
}

/** 관계 깊이 (PRD 9-3/9-4) */
export type RelationshipDepth = "low" | "mid" | "high";

/** 일정 난이도 (PRD 9-4) */
export type ScheduleDifficulty = "low" | "mid" | "high";

/** 옵션 유형 (PRD 9-4) */
export type OptionType = "basic" | "premium" | "budget" | "experimental";

/** 상품 유형 — 독립 CTA 단위 (PRD 9-5) 항공/숙소/투어·티켓·액티비티 */
export type ProductType = "flight" | "stay" | "tna";

/** ProductLink 상태 (PRD 9-5) */
export type ProductLinkStatus = "active" | "inactive" | "expired";

/** 참여 반응 유형 (PRD 9-6) — 이름/이메일 미수집, 익명 세션 */
export type ResponseType =
  | "interested"
  | "date_dependent"
  | "price_dependent"
  | "voted_option"
  | "question"
  | "not_interested";

/** 거절·망설임 유형 (PRD 9-6) */
export type ObjectionType =
  | "date"
  | "budget"
  | "destination"
  | "companions"
  | "other";

/**
 * 그룹 예약 진행 상태 (PRD 9-9-1, COMMERCE_MODEL 3-2) — Booking Signal Sync 7-state.
 * BookingProgress는 booking_open 이후의 **예약 퍼널**만 담는다.
 * (interested/voted 같은 관심·투표 신호는 InterestSignal에 산다.)
 *
 * ⚠️ 안전경계: 아워리얼트립은 affiliate이며 merchant가 아니다. 외부 검증된 결제완료
 * (`externally_confirmed_booked`)는 MyRealTrip 전환 API/postback ingestion이 연결될
 * 때만 도달 가능하다(PRD 9-9-3·18-5). 자가표시/클릭/호스트확인 어디서도 세팅 불가.
 */
export type BookingProgressStatus =
  | "pending" // 미진행 (행 미존재도 pending 간주)
  | "clicked_booking_link" // /go redirect 발생 (클릭 ≠ 결제)
  | "booking_intent" // 예약하러 감/예약 예정 자가표시
  | "self_reported_booked" // 참여자 "예약했어요" 자가표시 (≠ 외부 검증)
  | "host_confirmed_booked" // 호스트 수동 확인 (사람 판단, ≠ 외부 검증)
  | "externally_confirmed_booked" // 외부 ingestion 전용 — 현재 미연결(stub)
  | "cancelled_or_refunded"; // 취소/환불 (어느 상태에서든 분기)

/**
 * 진행 신호 출처 (PRD 9-9-2). status가 어디서 왔는지 — UI에 항상 표시.
 */
export type BookingProgressSource =
  | "internal" // OurRealTrip 내부 상태(pending 등)
  | "redirect_tracking" // /go 클릭 추적
  | "participant_self_report" // 참여자 자가 입력
  | "host_manual" // 호스트 수동 확인
  | "external_api"; // MyRealTrip 외부 전환 API/postback/리포트 (현재 미연결)

/** 진행 신호 신뢰도 (PRD 9-9-2). `verified`는 source=external_api에서만. */
export type BookingProgressConfidence = "low" | "medium" | "high" | "verified";

// ──────────────────────────────────────────────────────────
// 9-1. Host
// ──────────────────────────────────────────────────────────
export interface Host {
  host_id: string;
  name: string;
  profile_image_url: string | null;
  community_name: string;
  bio: string | null;
  /** 신뢰 근거(과거 활동/제안 톤) */
  trust_note: string | null;
}

// ──────────────────────────────────────────────────────────
// 9-2. Community
// ──────────────────────────────────────────────────────────
export interface Community {
  community_id: string;
  name: string;
  description: string | null;
  /** 카테고리(사진/러닝/와인 등) */
  category: string | null;
  visibility: Visibility;
}

// ──────────────────────────────────────────────────────────
// 9-3. TripProposal
// ──────────────────────────────────────────────────────────
export interface TripProposal {
  proposal_id: string;
  host_id: string;
  community_id: string;
  /** URL slug (unlisted 접근 키) */
  slug: string;
  title: string;
  /** 한 줄 컨셉 */
  concept: string;
  /** 누구에게 맞고 누구에게 애매한지 */
  target_audience: string | null;
  /** 제안 톤/분위기 */
  mood: string | null;
  expected_dates: string | null;
  expected_budget: string | null;
  destination_candidates: string[] | null;
  status: ProposalStatus;
  visibility: Visibility;
  /** 정보 확인 시점 */
  checked_at: string | null;

  // ── v2 신규: 루마 create 대응 필드 (PRD 9-3) ──
  /** 커버이미지 (루마 create 대응). 외부 이미지 없을 땐 coverGradient 헬퍼로 대체 */
  cover_image_url: string | null;
  /** 모집인원 (루마 Capacity 대응) */
  recruit_capacity: number | null;
  /** 참여 승인 여부 (루마 Approval 대응). Phase 1은 표시·기록만 */
  requires_approval: boolean | null;
  /** 이벤트 시간대 */
  timezone: string | null;
  /** 정원 초과 시 대기자 명단 허용 여부 */
  waitlist_enabled: boolean | null;

  // ── 인사이트 통합 필드 (PRD 9-3, 사용자 노출은 번역 카피) ──
  /** 이번 여행의 목적 */
  community_intent: string | null;
  /** 이 여행으로 우리 모임이 얻고 싶은 것 */
  intended_outcome: string | null;
  /** 이 여행이 끝나고 커뮤니티에 남아야 할 것 */
  post_trip_artifact: string | null;
  /** 이 여행이 지향하는 관계 깊이 */
  relationship_depth: RelationshipDepth | null;
  /** 이 여행에서 배우거나 만들고 싶은 것 */
  learning_or_creation_goal: string | null;
  /** 왜 지금인가 */
  why_now: string | null;
}

// ──────────────────────────────────────────────────────────
// 9-4. TravelOption
// ──────────────────────────────────────────────────────────
export interface TravelOption {
  option_id: string;
  proposal_id: string;
  /** 옵션명(A/B/C 등) */
  option_name: string;
  option_type: OptionType;
  description: string | null;
  estimated_budget: string | null;
  /** 적합 근거 */
  fit_reason: string | null;
  /** 동선/취소/변경 리스크 */
  risk_note: string | null;
  sort_order: number;

  // ── 인사이트 통합 필드 (PRD 9-4) ──
  /** 이 안이 커뮤니티 목적에 얼마나 맞는지 */
  community_intent_fit: string | null;
  /** 이 안이 만드는 관계 깊이 */
  relationship_depth: RelationshipDepth | null;
  /** 이 안의 배움/창작 잠재력 */
  learning_or_creation_potential: string | null;
  /** 이 안에서 남을 산출물 */
  post_trip_artifact: string | null;
  /** 일정 난이도 */
  schedule_difficulty: ScheduleDifficulty | null;
}

// ──────────────────────────────────────────────────────────
// 9-5. ProductLink
// ──────────────────────────────────────────────────────────
export interface ProductLink {
  product_link_id: string;
  option_id: string;
  /** 상품 유형 (항공/숙소/투어·티켓·액티비티) */
  product_type: ProductType;
  /** 판매처 */
  source: string;
  /** API 연동 전에는 null (확정 결정 3) */
  myrealtrip_product_id: string | null;
  title: string;
  price_hint: string | null;
  reason: string | null;
  caution: string | null;
  /** manual 입력 URL (확정 결정 3) */
  source_url: string;
  /** 마이링크/제휴 링크 */
  mylink_url: string | null;
  /** 가격/예약가능 확인 시점 */
  checked_at: string | null;
  status: ProductLinkStatus;
}

// ──────────────────────────────────────────────────────────
// 9-6. InterestSignal
// ──────────────────────────────────────────────────────────
export interface InterestSignal {
  signal_id: string;
  proposal_id: string;
  /** 대상 옵션(옵션 투표 시) */
  option_id: string | null;
  /** 익명 세션 식별자 (확정 결정 1·4) */
  participant_session_id: string;
  response_type: ResponseType;
  preferred_dates: string | null;
  preferred_budget: string | null;
  /** 선택 코멘트 (이름/이메일 미수집) */
  comment: string | null;

  // ── 인사이트 통합 필드 (PRD 9-6) ──
  /** 왜 그렇게 반응했는지 (참여/거절 사유) */
  response_reason: string | null;
  /** 어떤 의도/목적에 공감했는지 */
  intent_resonance: string | null;
  /** 거절·망설임의 유형 */
  objection_type: ObjectionType | null;
}

// ──────────────────────────────────────────────────────────
// 9-7. ClickEvent
// ──────────────────────────────────────────────────────────
export interface ClickEvent {
  event_id: string;
  proposal_id: string;
  option_id: string | null;
  product_link_id: string;
  product_type: ProductType;
  clicked_at: string;
  referrer: string | null;
  device_type: string | null;
  browser: string | null;
  /** utm 필드 묶음 */
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  /** redirect 대상 */
  redirect_url: string;
}

// ──────────────────────────────────────────────────────────
// 9-9. BookingProgress (v2 신규 — 그룹 예약 진행)
// ──────────────────────────────────────────────────────────
// 그룹이 수렴한 옵션에 대해 각 참여자가 항목별로 어디까지 진행했는지 추적한다.
// 유니크 키 = (participant_session_id, product_link_id) (COMMERCE_MODEL 5-1).
export interface BookingProgress {
  progress_id: string;
  proposal_id: string;
  /** 수렴된 옵션 */
  option_id: string;
  /** 대상 상품 링크 */
  product_link_id: string;
  /** 익명 세션 식별자 (확정 결정 1·4) */
  participant_session_id: string;
  /** 진행 상태 (7-state, PRD 9-9-1) */
  status: BookingProgressStatus;
  /** 신호 출처 (PRD 9-9-2) — UI에 status와 함께 표시 */
  source: BookingProgressSource;
  /** 신호 신뢰도 (PRD 9-9-2). verified는 source=external_api에서만 */
  confidence: BookingProgressConfidence;
  /** host_confirmed/external 입력 근거 메모(선택) */
  note: string | null;
  /** 갱신 시각 */
  updated_at: string;
}

// ──────────────────────────────────────────────────────────
// 9-10. Itinerary / ItineraryDay (v2 신규 — 일정표)
// ──────────────────────────────────────────────────────────

/** 일정표의 한 항목 (각 item은 product_link_id로 상품과 연결될 수 있음) */
export interface ItineraryItem {
  /** 시간(미정 허용) — 예: "18:30" */
  time?: string;
  title: string;
  /** 연결된 상품 링크(선택) */
  product_link_id?: string;
}

/** 일정표의 하루 (Day1/Day2 …) */
export interface ItineraryDay {
  /** Day 번호(Day1/Day2 …) */
  day_no: number;
  /** 해당 날짜(미정 허용) */
  date?: string;
  /** 그 날 타이틀 */
  title: string;
  /** 항목 배열 */
  items: ItineraryItem[];
}

/** 일정표 (proposal에 1:1) */
export interface Itinerary {
  itinerary_id: string;
  proposal_id: string;
  days: ItineraryDay[];
}

// ──────────────────────────────────────────────────────────
// 9-11. DiscoverCategory (v2 신규 — Discover 택소노미)
// ──────────────────────────────────────────────────────────
export interface DiscoverCategory {
  category_id: string;
  /** 카테고리 키 = /c/[category] slug (사진/빌더/러닝/웰니스/미식/서핑 등) */
  key: string;
  /** 표시 라벨 */
  label: string;
  /** 아이콘 (이모지 또는 아이콘셋 key) */
  icon?: string;
  /** 정렬 순서 */
  sort_order: number;
}

// ──────────────────────────────────────────────────────────
// 조합 타입 — seed/data 레이어가 반환하는 중첩 구조
// ──────────────────────────────────────────────────────────

/** ProductLink가 부착된 TravelOption */
export interface TravelOptionWithLinks extends TravelOption {
  product_links: ProductLink[];
}

/** Host/Community/Option(+Link)까지 모두 채운 proposal 상세 */
export interface TripProposalDetail extends TripProposal {
  host: Host;
  community: Community;
  options: TravelOptionWithLinks[];
  /** 일정표 (v2 신규, 없으면 null) */
  itinerary: Itinerary | null;
  /** Discover 카테고리 key (DiscoverCategory.key와 정합, 미매핑 시 null) */
  category_key: string | null;
}

/** DiscoverCategory + 노출 대상 proposal 건수 (Discover 칩 표시용 파생) */
export interface DiscoverCategoryWithCount extends DiscoverCategory {
  count: number;
}

// ──────────────────────────────────────────────────────────
// BookingProgress 집계 (GET /api/booking-progress 응답, COMMERCE_MODEL 6-2)
// 개별 participant_session_id는 노출하지 않는다(익명 보존, 확정 결정 4).
// ──────────────────────────────────────────────────────────

/** 상품 링크별 진행 상태 분포 (7-state) */
export interface BookingProgressByLink {
  product_link_id: string;
  product_type: ProductType;
  pending: number;
  clicked_booking_link: number;
  booking_intent: number;
  self_reported_booked: number;
  host_confirmed_booked: number;
  externally_confirmed_booked: number;
  cancelled_or_refunded: number;
}

/** 옵션별 예약 완료 참여자 집계 (신뢰도 계층별 분리) */
export interface BookingProgressByOption {
  option_id: string;
  /** 자가보고 예약완료(medium) 참여자 */
  self_reported_booked_participants: number;
  /** 호스트 확인(high) 참여자 */
  host_confirmed_participants: number;
  /** 외부 검증(verified) 참여자 — 현재 ingestion 미연결이라 항상 0 */
  externally_confirmed_participants: number;
  total_participants: number;
}

/** 그룹 진행현황 집계(장바구니 뷰·host dashboard 입력) */
export interface BookingProgressAggregate {
  /** "참여자 자가보고 + 클릭추적 기준" 문구 — 항상 함께 렌더하도록 강제 */
  basis: string;
  by_product_link: BookingProgressByLink[];
  by_option: BookingProgressByOption[];
}
