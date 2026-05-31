/**
 * Zod 스키마 — `HostCreateAgentPayload` 미러 (단일 계약).
 *
 * 이 스키마는 Next 앱의 `lib/host-create/agentPayload.ts`에 정의된
 * `HostCreateAgentPayload` 인터페이스를 그대로 반영한다. 필드명·enum이
 * 일치해야 클라이언트 브리지(applyPayload)가 그대로 폼에 반영할 수 있다.
 *
 * ★ 안전 불변식 (merchant 아님):
 *   - product_links는 표시(price_hint/외부 URL) 전용. 결제 금액/PG/정산 필드 없음.
 *   - externally_confirmed 같은 외부검증 상태는 이 payload로 세팅 불가.
 *   - 발행/booking_open/외부 공유는 이 payload로 트리거하지 않는다.
 *
 * 검증 규칙:
 *   - 잘못된 product_type은 "tna" fallback (transform)
 *   - product_links는 최대 10개로 제한 (handler에서 clamp)
 *   - recruit_capacity는 finite positive integer만 허용
 */
import { z } from 'zod';

/** UI 레벨 공개 범위 — 공개/비공개 2-way. 권장값 'public' | 'private'. 구 값
 *  (unlisted/draft)도 관용 수용하고 클라이언트가 public/private로 정규화한다. */
export const visibilitySchema = z.enum(['public', 'private', 'unlisted', 'draft']);

/** 장소 공개 수준 */
export const locationVisibilitySchema = z.enum([
  'exact',
  'area',
  'after_approval',
  'online',
  'tbd',
]);

/** 분위기/테마 프리셋 key */
export const moodSchema = z.enum([
  'quiet',
  'casual',
  'deep',
  'active',
  'local',
  'premium',
]);

const PRODUCT_TYPES = ['tna', 'stay', 'flight'] as const;

/**
 * product_type: 잘못된 값은 "tna" fallback. zod preprocess로 입력을
 * 정규화하므로 LLM이 enum 밖의 값을 줘도 검증이 통과한다.
 */
export const productTypeSchema = z.preprocess(
  (v) => (typeof v === 'string' && (PRODUCT_TYPES as readonly string[]).includes(v) ? v : 'tna'),
  z.enum(PRODUCT_TYPES),
);

/** 에이전트가 제안하는 연결 상품 1건 (표시 전용) */
export const productLinkSchema = z.object({
  title: z.string().min(1).describe('상품 표시 제목. 필수.'),
  price_hint: z
    .string()
    .nullable()
    .optional()
    .describe('표시용 가격 힌트 텍스트(예: "1인 89,000원~"). 결제 금액이 아님, 외부 판매처 기준 표시값.'),
  source_url: z
    .string()
    .nullable()
    .optional()
    .describe('외부 판매처(예: MyRealTrip) 상품 링크. 호스트/참여자가 직접 열어 예약하는 외부 URL.'),
  product_type: productTypeSchema.describe('"tna" | "stay" | "flight". 잘못된 값은 "tna"로 보정됨.'),
  reason: z.string().nullable().optional().describe('왜 이 상품을 붙였는지 (선택).'),
  caution: z.string().nullable().optional().describe('주의 고지 (선택).'),
});

/** 일정 후보 1건 */
export const scheduleCandidateSchema = z.object({
  label: z.string().min(1).describe('표시 라벨(예: "후보 A"). 필수.'),
  date_text: z.string().min(1).describe('일시 표시 문자열. 필수.'),
  pros: z.string().nullable().optional(),
  cons: z.string().nullable().optional(),
});

/** 옵션 A/B/C 1건 */
export const travelOptionSchema = z.object({
  option_name: z.string().min(1).describe('옵션 이름(예: "기본형"). 필수.'),
  option_type: z.enum(['basic', 'premium', 'budget', 'experimental']).optional(),
  description: z.string().nullable().optional(),
  estimated_budget: z
    .string()
    .nullable()
    .optional()
    .describe('예상 예산 표시 텍스트. 결제 청구액이 아닌 참고용.'),
  fit_reason: z.string().nullable().optional(),
  risk_note: z.string().nullable().optional(),
  schedule_difficulty: z.enum(['low', 'mid', 'high']).optional(),
  product_links: z.array(productLinkSchema).optional(),
});

/**
 * 에이전트 → 페이지 반영 payload. 모든 필드는 optional —
 * 에이전트가 채운 부분만 호스트 승인 후 반영된다.
 */
export const hostCreateAgentPayloadSchema = z.object({
  // ── P0 코어 ──
  title: z.string().optional(),
  concept: z.string().optional(),
  description: z.string().optional(),
  date_text: z.string().optional(),
  timezone: z.string().optional(),
  location_text: z.string().optional(),
  cover_image_url: z.string().optional(),
  visibility: visibilitySchema.optional(),
  community_id: z.string().optional(),
  requires_approval: z.boolean().optional(),
  recruit_capacity: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('모집 정원. 양의 정수만 허용.'),
  waitlist_enabled: z.boolean().optional(),
  participation_questions: z.array(z.string()).optional(),
  product_links: z.array(productLinkSchema).optional(),
  safety_notes: z.array(z.string()).optional(),

  // ── P1 확장 ──
  location_visibility: locationVisibilitySchema.optional(),
  mood: moodSchema.optional(),

  // ── P2 foundation ──
  schedule_candidates: z.array(scheduleCandidateSchema).optional(),
  options: z.array(travelOptionSchema).optional(),
});

export type HostCreateAgentPayload = z.infer<typeof hostCreateAgentPayloadSchema>;

/** product_links 최대 개수 (handoff P0-2). */
export const MAX_PRODUCT_LINKS = 10;
