// /host/preview/[draftId] — 생성 직후 이벤트 초안 미리보기 (발행 전 승인 게이트)
//
// draft를 Luma식 공개 이벤트 페이지 레이아웃(좌 커버/메타, 우 본문)으로 렌더한다.
// ★ 발행 아님: "초안" 배지 + 미리보기 고지를 항상 표시한다. 발행 버튼은 사람 승인
//   단계(다음 Phase: draft→TripProposal 승격)로, 현재는 자리표시만 둔다.
// ★ A방식: 상품은 price_hint 표시 + 판매처/확인시점 고지. 결제 수취 없음.

import { notFound } from "next/navigation";
import { getDraftById } from "@/lib/store/drafts";
import { getHostAuthContext } from "@/lib/auth/host";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publishDraftAction } from "@/app/host/preview/[draftId]/actions";
import AppTopNav from "@/components/AppTopNav";
import { coverGradient, coverInitial } from "@/lib/cover";
import {
  AUDIENCE_OPTIONS,
  COMMUNITY_OPTIONS,
  MOOD_PRESETS,
  LOCATION_VISIBILITY_OPTIONS,
} from "@/lib/host-create/presets";
import GuidanceCopy from "@/components/host/GuidanceCopy";
import type { ProductType, ProposalStatus } from "@/lib/types";

interface PageProps {
  params: Promise<{ draftId: string }>;
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tna: "투어·티켓·액티비티",
  stay: "숙소",
  flight: "항공",
};

// 운영 단계 라벨 (P2-3) — 초안 단계에서는 상태 표시만, 변경 컨트롤은 두지 않는다.
const LIFECYCLE_LABELS: Record<ProposalStatus, string> = {
  draft: "초안",
  interest_check: "관심 확인",
  option_refining: "옵션 조율",
  booking_open: "예약 열림",
  closed: "마감",
  cancelled: "취소",
  archived: "보관",
};

export default async function HostPreviewPage({ params }: PageProps) {
  const { draftId } = await params;
  const auth = await getHostAuthContext();
  if (isSupabaseConfigured() && !auth) notFound();
  const draft = await getDraftById(draftId, auth?.userId ?? null);
  if (!draft) notFound();

  const gradient = coverGradient(draft.title);
  const initial = coverInitial(draft.title);

  // 새 메타 라벨 (단일 출처 presets 참조)
  const audienceLabel =
    AUDIENCE_OPTIONS.find((a) => a.value === draft.audience)?.label ?? "비공개";
  const communityLabel =
    draft.community_id == null
      ? "개인"
      : COMMUNITY_OPTIONS.find((c) => c.value === draft.community_id)?.label ??
        "개인";
  const locationLevelLabel = draft.location_visibility
    ? LOCATION_VISIBILITY_OPTIONS.find(
        (l) => l.value === draft.location_visibility,
      )?.label ?? null
    : null;
  const moodLabel = draft.mood
    ? MOOD_PRESETS.find((m) => m.value === draft.mood)?.label ?? null
    : null;

  // 참여자 안내 문구에 넣을 장소 표시 — 공개 수준 반영(참여자에게 가는 문구이므로)
  const guidanceLocation =
    draft.location_visibility === "after_approval"
      ? "승인 후 안내"
      : draft.location_visibility === "tbd"
        ? "장소 미정"
        : draft.location_text;

  return (
    <>
      <AppTopNav user={auth} active="create" />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* 미리보기 고지 — 발행 아님 */}
        <div className="rounded-card border border-brand bg-brand-soft px-4 py-3 text-label text-brand-softfg">
          <strong>초안 미리보기</strong> · 이 페이지는 아직 공개되지 않았습니다.
          {draft.created_via === "agent" && " (Agent 보조로 생성됨)"} 발행하면
          참여자에게 노출됩니다.
        </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:gap-8">
        {/* ── 좌: 커버 + 메타 ── */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-card border border-surface-border">
            <div className="relative aspect-square w-full">
              {draft.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.cover_image_url}
                  alt={draft.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className={`absolute inset-0 flex items-center justify-center ${gradient}`}
                >
                  <span className="select-none font-mono text-7xl font-bold text-white/40">
                    {initial}
                  </span>
                </div>
              )}
            </div>
          </div>
          <dl className="space-y-2 rounded-card border border-surface-border p-4 text-label">
            <MetaItem label="공개 범위" value={audienceLabel} />
            <MetaItem label="주최" value={communityLabel} />
            <MetaItem
              label="승인"
              value={draft.requires_approval ? "참여 승인 필요" : "자유 참여"}
            />
            <MetaItem
              label="수용 인원"
              value={draft.recruit_capacity ? `${draft.recruit_capacity}명` : "무제한"}
            />
            {locationLevelLabel && (
              <MetaItem label="장소 공개" value={locationLevelLabel} />
            )}
          </dl>
        </aside>

        {/* ── 우: 본문 ── */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-surface-soft px-2.5 py-1 text-label font-medium text-ink-muted">
                초안
              </span>
              <span className="inline-flex items-center rounded-full bg-surface-soft px-2.5 py-1 text-label font-medium text-ink-muted">
                {LIFECYCLE_LABELS[draft.lifecycle]}
              </span>
              {moodLabel && (
                <span className="inline-flex items-center rounded-full bg-surface-soft px-2.5 py-1 text-label font-medium text-ink-muted">
                  {moodLabel}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-display font-bold text-ink">
              {draft.title}
            </h1>
            {draft.concept && (
              <p className="mt-1.5 text-h3 font-normal text-ink-muted">
                {draft.concept}
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-card border border-surface-border p-4 text-body">
            {draft.date_text && (
              <p className="flex gap-2">
                <span aria-hidden>🗓</span>
                <span>{draft.date_text}</span>
              </p>
            )}
            {draft.location_text && (
              <p className="flex gap-2">
                <span aria-hidden>📍</span>
                <span>{draft.location_text}</span>
              </p>
            )}
            {!draft.date_text && !draft.location_text && (
              <p className="text-ink-muted">일시·장소 미정</p>
            )}
          </div>

          {draft.description && (
            <div className="rounded-card border border-surface-border p-4">
              <h2 className="mb-2 text-h3 font-bold text-ink">이벤트 소개</h2>
              <p className="whitespace-pre-wrap text-body text-ink">
                {draft.description}
              </p>
            </div>
          )}

          {/* 참여 질문 (P1-6) — 승인 필요 시 신청자에게 물을 질문 */}
          {draft.requires_approval &&
            draft.participation_questions.length > 0 && (
              <div className="rounded-card border border-surface-border p-4">
                <h2 className="mb-2 text-h3 font-bold text-ink">참여 질문</h2>
                <ul className="space-y-1.5 text-body text-ink">
                  {draft.participation_questions.map((q, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-ink-muted">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* 일정 후보 (P2-1 foundation) */}
          {draft.schedule_candidates.length > 0 && (
            <div className="rounded-card border border-surface-border p-4">
              <h2 className="mb-2 text-h3 font-bold text-ink">일정 후보</h2>
              <ul className="space-y-2">
                {draft.schedule_candidates.map((sc, i) => (
                  <li key={i}>
                    <p className="text-body font-medium text-ink">
                      {sc.label}
                      {sc.date_text ? ` · ${sc.date_text}` : ""}
                    </p>
                    {(sc.pros || sc.cons) && (
                      <p className="mt-0.5 text-label text-ink-muted">
                        {sc.pros ? `좋은 점: ${sc.pros}` : ""}
                        {sc.pros && sc.cons ? " · " : ""}
                        {sc.cons ? `아쉬운 점: ${sc.cons}` : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 옵션 비교 (P2-2 foundation) — estimated_budget은 표시 힌트, 결제 아님 */}
          {draft.options.length > 0 && (
            <div className="rounded-card border border-surface-border p-4">
              <h2 className="mb-2 text-h3 font-bold text-ink">옵션 비교</h2>
              <ul className="space-y-2">
                {draft.options.map((opt, i) => (
                  <li
                    key={i}
                    className="rounded-card border border-surface-border bg-surface px-3 py-3"
                  >
                    <p className="text-body font-medium text-ink">
                      {opt.option_name}
                      {opt.estimated_budget ? ` · ${opt.estimated_budget}` : ""}
                    </p>
                    {opt.description && (
                      <p className="mt-0.5 text-label text-ink-muted">
                        {opt.description}
                      </p>
                    )}
                    {(opt.fit_reason || opt.risk_note) && (
                      <p className="mt-0.5 text-label text-ink-muted">
                        {opt.fit_reason ? `잘 맞는 이유: ${opt.fit_reason}` : ""}
                        {opt.fit_reason && opt.risk_note ? " · " : ""}
                        {opt.risk_note ? `유의: ${opt.risk_note}` : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 연결 상품 — A방식: 표시 + 고지 */}
          {draft.product_links.length > 0 && (
            <div className="rounded-card border border-surface-border p-4">
              <h2 className="mb-1 text-h3 font-bold text-ink">
                연결된 마이리얼트립 상품
              </h2>
              <p className="mb-3 text-label text-ink-muted">
                아워리얼트립은 판매자가 아닙니다. 결제는 각 상품 판매처에서 각자
                진행하며, 가격·재고는 확인 시점 기준입니다.
              </p>
              <ul className="space-y-2">
                {draft.product_links.map((pl, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-card border border-surface-border bg-surface px-3 py-3"
                  >
                    <div>
                      <p className="text-body font-medium text-ink">
                        {pl.title}
                      </p>
                      <p className="mt-0.5 text-label text-ink-muted">
                        {PRODUCT_TYPE_LABELS[pl.product_type]} · {pl.source}
                        {pl.price_hint ? ` · ${pl.price_hint}` : ""}
                      </p>
                    </div>
                    {pl.source_url && (
                      <a
                        href={pl.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 self-center rounded-card border border-surface-border px-3 py-1.5 text-label text-ink hover:bg-surface-soft"
                      >
                        상품 보기
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 참여자 안내 문구 (P2-5) — 외부 발송 없이 복사용 생성만 */}
          <GuidanceCopy
            title={draft.title}
            dateText={draft.date_text}
            locationDisplay={guidanceLocation}
            requiresApproval={draft.requires_approval}
          />

          {/* 발행 — 사람 승인 게이트. 누르면 공개 /e/[slug]로 게시 */}
          <form
            action={publishDraftAction.bind(null, draft.draft_id)}
            className="space-y-2 rounded-card border border-surface-border p-4"
          >
            <p className="text-label text-ink-muted">
              검토를 마쳤다면 발행하세요. 발행하면 참가자용 공개 페이지로
              게시되고 신청을 받기 시작합니다.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-card bg-brand px-5 py-3 text-body font-medium text-brand-fg hover:bg-brand-hover"
            >
              발행하기
            </button>
            <a
              href="/host/create"
              className="inline-flex text-label font-medium text-ink-muted hover:text-ink"
            >
              ← 다른 이벤트 만들기
            </a>
          </form>
        </div>
      </div>
      </main>
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
