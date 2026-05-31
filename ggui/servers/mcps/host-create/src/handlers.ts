/**
 * MCP tool registrations for the host-create MCP server.
 *
 * Three tools backing the "agent drafts a proposal → human host reviews +
 * applies" flow. NONE of them perform a side effect:
 *
 *   - `host_create_apply`        — accept + echo a validated structured
 *                                  HostCreateAgentPayload for the host to
 *                                  apply to the create-event form.
 *   (상품 추천은 실제 MyRealTrip MCP searchTnas가 담당 — 샘플 스텁 제거됨)
 *   - `host_safety_check`        — flag risky merchant/booking phrasing and
 *                                  suggest neutral rewrites.
 *
 * ★ 안전 불변식: aworrealtrip는 merchant가 아니다. price_hint는 표시 전용,
 *   예약은 외부 판매처에서 각자. externally_confirmed_booked 같은 외부검증
 *   상태는 이 서버로 세팅하지 않는다. 발행/booking_open/외부 공유는
 *   사람이 승인한다.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { hostCreateAgentPayloadSchema, MAX_PRODUCT_LINKS } from './schema.js';
import type { HostCreateAuthContext } from './auth.js';
import { requireScope } from './auth.js';
import {
  createDraftFromPayload,
  getOwnedDraft,
  listOwnedDrafts,
  publishOwnedDraft,
  updateDraftFromPayload,
} from './store.js';

/** host_safety_check가 잡아내는 위험 표현 + 중립 대체 제안. */
const RISKY_PHRASES: ReadonlyArray<{ pattern: string; suggestion: string }> = [
  { pattern: '결제 완료', suggestion: '신청 접수 / 외부 판매처에서 직접 결제' },
  { pattern: '예약 확정', suggestion: '일정 제안 / 호스트 검토 후 안내' },
  { pattern: '확정가', suggestion: '예상 가격 / 외부 판매처 표시가 참고' },
  { pattern: '묶음결제', suggestion: '각 상품은 외부 판매처에서 개별 예약' },
  { pattern: '소개팅', suggestion: '커뮤니티 여행 모임 / 함께 떠나는 여행' },
];

export function registerHostCreateTools(server: McpServer, auth: HostCreateAuthContext): void {
  // ── host_create_apply ──────────────────────────────────────────────
  server.registerTool(
    'host_create_apply',
    {
      title: 'Host Create · Apply Draft',
      description:
        'Submit a STRUCTURED draft proposal for a community travel event so the human host can review it and apply it to the create-event form. ' +
        'The agent only DRAFTS — it does not publish, does not open booking, and does not share externally; the host approves every change. ' +
        'aworrealtrip is NOT a merchant: product_links are DISPLAY-ONLY (price_hint is a reference figure, booking happens per-seller on the external source_url). ' +
        'Never use payment/booking-confirmation language and never set any externally_confirmed_booked state. ' +
        'Pass only the fields you have gathered; everything is optional. Invalid product_type values are coerced to "tna" and product_links are capped at 10. ' +
        'Returns the validated payload echoed back ({ applied: true, payload }) for the host to confirm.',
      inputSchema: {
        payload: hostCreateAgentPayloadSchema.describe(
          'The structured event-draft payload. Mirrors the host-create form fields. All fields optional.',
        ),
      },
      outputSchema: {
        applied: z.boolean(),
        payload: hostCreateAgentPayloadSchema,
      },
    },
    async (input) => {
      // 검증된 payload를 그대로 echo. 부작용 없음 — clamp만 적용.
      const payload = { ...input.payload };
      if (payload.product_links && payload.product_links.length > MAX_PRODUCT_LINKS) {
        payload.product_links = payload.product_links.slice(0, MAX_PRODUCT_LINKS);
      }
      const result = { applied: true as const, payload };
      return {
        structuredContent: result,
        content: [
          {
            type: 'text',
            text: '초안 제안을 준비했어요. 호스트가 검토 후 폼에 반영할 수 있습니다. (발행·예약은 아직 일어나지 않았습니다.)',
          },
        ],
      };
    },
  );

  // ── side-effect tools: PAT scope + owner gate ───────────────────────
  server.registerTool(
    'host_create_draft',
    {
      title: 'Host Create · Save Draft',
      description:
        'Create and persist a host event draft from a validated payload. Requires write scope. This does NOT publish or open booking.',
      inputSchema: {
        payload: hostCreateAgentPayloadSchema.describe('Draft payload to save.'),
      },
      outputSchema: {
        draft_id: z.string(),
        slug: z.string(),
        preview_url: z.string(),
        status: z.enum(['draft', 'published']),
      },
    },
    async (input) => {
      requireScope(auth, 'write');
      const draft = await createDraftFromPayload(input.payload, auth);
      const result = {
        draft_id: draft.draft_id,
        slug: draft.slug,
        preview_url: `/host/preview/${draft.draft_id}`,
        status: draft.status,
      };
      return {
        structuredContent: result,
        content: [{ type: 'text', text: `초안을 저장했습니다: ${result.preview_url}` }],
      };
    },
  );

  server.registerTool(
    'host_update_draft',
    {
      title: 'Host Create · Update Draft',
      description:
        'Update an owned unpublished draft. Requires write scope. Published events cannot be edited by this MCP tool.',
      inputSchema: {
        draft_id: z.string().uuid(),
        payload: hostCreateAgentPayloadSchema.describe('Fields to merge into the draft.'),
      },
      outputSchema: {
        draft_id: z.string(),
        slug: z.string(),
        preview_url: z.string(),
        status: z.enum(['draft', 'published']),
      },
    },
    async (input) => {
      requireScope(auth, 'write');
      const draft = await updateDraftFromPayload(input.draft_id, input.payload, auth);
      if (!draft) throw new Error('draft not found or not owned by token user');
      const result = {
        draft_id: draft.draft_id,
        slug: draft.slug,
        preview_url: `/host/preview/${draft.draft_id}`,
        status: draft.status,
      };
      return {
        structuredContent: result,
        content: [{ type: 'text', text: `초안을 업데이트했습니다: ${result.preview_url}` }],
      };
    },
  );

  server.registerTool(
    'host_get_draft',
    {
      title: 'Host Create · Get Draft',
      description: 'Read one owned draft. Requires read scope.',
      inputSchema: { draft_id: z.string().uuid() },
      outputSchema: { draft: z.unknown().nullable() },
    },
    async (input) => {
      requireScope(auth, 'read');
      const draft = await getOwnedDraft(input.draft_id, auth);
      return {
        structuredContent: { draft },
        content: [{ type: 'text', text: draft ? `초안을 찾았습니다: ${draft.title}` : '초안을 찾지 못했습니다.' }],
      };
    },
  );

  server.registerTool(
    'host_list_my_events',
    {
      title: 'Host Create · List My Events',
      description: 'List drafts/events owned by the token user. Requires read scope.',
      inputSchema: {},
      outputSchema: { drafts: z.array(z.unknown()) },
    },
    async () => {
      requireScope(auth, 'read');
      const drafts = await listOwnedDrafts(auth);
      return {
        structuredContent: { drafts },
        content: [{ type: 'text', text: `이벤트 ${drafts.length}건을 찾았습니다.` }],
      };
    },
  );

  server.registerTool(
    'host_publish_event',
    {
      title: 'Host Create · Publish Event',
      description:
        'Publish an owned draft so /e/[slug] becomes visible. Requires publish scope. Use only when the human host has explicitly approved publishing.',
      inputSchema: {
        draft_id: z.string().uuid(),
        human_approved: z.boolean().describe('Must be true only after explicit host approval.'),
      },
      outputSchema: {
        draft_id: z.string(),
        slug: z.string(),
        public_url: z.string(),
        status: z.enum(['draft', 'published']),
      },
    },
    async (input) => {
      requireScope(auth, 'publish');
      if (!input.human_approved) throw new Error('human_approved=true is required to publish');
      const draft = await publishOwnedDraft(input.draft_id, auth);
      if (!draft) throw new Error('draft not found or not owned by token user');
      const result = {
        draft_id: draft.draft_id,
        slug: draft.slug,
        public_url: `/e/${draft.slug}`,
        status: draft.status,
      };
      return {
        structuredContent: result,
        content: [{ type: 'text', text: `이벤트를 발행했습니다: ${result.public_url}` }],
      };
    },
  );

  // ── host_safety_check ──────────────────────────────────────────────
  // ★ 상품 추천은 실제 MyRealTrip MCP(searchTnas/searchStays)가 담당한다.
  //   샘플 스텁(host_recommend_products)은 이미지가 없어 커버를 못 채워 제거됨.
  server.registerTool(
    'host_safety_check',
    {
      title: 'Host Create · Safety Check',
      description:
        'Lint draft copy for risky merchant/booking phrasing before it reaches the host. ' +
        'Flags phrases that wrongly imply aworrealtrip handles payment, confirms bookings, sets confirmed prices, bundles checkout, or frames the event as a dating meetup — and suggests a neutral rewrite for each. ' +
        'Use on any title/description/notes you drafted. Returns a findings array; empty means the copy is clean.',
      inputSchema: {
        text: z.string().min(1).describe('Draft copy to lint (title, description, safety notes, etc.).'),
      },
      outputSchema: {
        findings: z.array(
          z.object({
            phrase: z.string(),
            suggestion: z.string(),
          }),
        ),
        ok: z.boolean(),
      },
    },
    async (input) => {
      const text = String(input.text);
      const findings = RISKY_PHRASES.filter((r) => text.includes(r.pattern)).map((r) => ({
        phrase: r.pattern,
        suggestion: r.suggestion,
      }));
      const ok = findings.length === 0;
      return {
        structuredContent: { findings, ok },
        content: [
          {
            type: 'text',
            text: ok
              ? '위험 표현이 발견되지 않았어요.'
              : `검토 필요한 표현 ${findings.length}건을 찾았어요. 결제·예약 확정 뉘앙스를 중립 표현으로 바꿔주세요.`,
          },
        ],
      };
    },
  );
}

