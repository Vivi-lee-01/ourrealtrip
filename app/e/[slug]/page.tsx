// /e/[slug] — 발행된 이벤트 공개 페이지 (참가자가 보는 화면, Luma 대응)
//
// Luma 공개 이벤트 페이지 레이아웃 차용(좌 커버/메타, 우 본문/등록):
//   좌: 커버 이미지 + 주최(호스트) + 연결 상품
//   우: 제목/컨셉 + 일시·장소 + 참가 신청 박스 + 이벤트 소개
// 톤은 create 폼과 일관(미니멀: 흰 배경, 얇은 divider, 이모지·색박스 없음).
//
// ★ 발행된(status=published) draft만 노출. 미발행/없음은 notFound().
// ★ A방식(merchant 아님): 상품은 price_hint 표시 + 판매처/확인시점 고지. 결제 수취 없음.

import { notFound } from "next/navigation";
import { getDraftBySlug } from "@/lib/store/drafts";
import { countConfirmed } from "@/lib/store/registrations";
import { getHostAuthContext } from "@/lib/auth/host";
import AppTopNav from "@/components/AppTopNav";
import { coverGradient, coverInitial } from "@/lib/cover";
import RegisterBox from "@/components/event/RegisterBox";
import { MOOD_PRESETS } from "@/lib/host-create/presets";
import type { ProductType } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tna: "투어·티켓·액티비티",
  stay: "숙소",
  flight: "항공",
};

export default async function PublicEventPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getHostAuthContext();
  const event = await getDraftBySlug(slug);
  if (!event || event.status !== "published") notFound();

  const confirmedCount = await countConfirmed(event.draft_id);
  const gradient = coverGradient(event.title);
  const initial = coverInitial(event.title);

  // 장소 공개 수준에 따른 표시 (프라이버시): after_approval/tbd는 원문 주소를 숨긴다.
  const locationDisplay =
    event.location_visibility === "after_approval"
      ? "승인 후 안내"
      : event.location_visibility === "tbd"
        ? "장소 미정"
        : event.location_text;

  const moodLabel = event.mood
    ? MOOD_PRESETS.find((m) => m.value === event.mood)?.label ?? null
    : null;

  return (
    <>
      <AppTopNav user={user} active="events" />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr] lg:gap-12">
        {/* ── 좌: 커버 + 주최 + 상품 ── */}
        <aside className="space-y-5">
          <div className="overflow-hidden rounded-xl">
            <div className="relative aspect-square w-full">
              {event.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.cover_image_url}
                  alt={event.title}
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

          {/* 주최 */}
          <div>
            <p className="text-label text-ink-muted">주최</p>
            <p className="mt-0.5 text-body font-medium text-ink">호스트</p>
          </div>

          {/* 연결 상품 (A방식: 표시 + 고지) */}
          {event.product_links.length > 0 && (
            <div className="space-y-2">
              <p className="text-label text-ink-muted">연결된 상품</p>
              <ul className="space-y-2">
                {event.product_links.map((pl, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-surface-border p-3"
                  >
                    <p className="text-body font-medium text-ink">{pl.title}</p>
                    <p className="mt-0.5 text-label text-ink-muted">
                      {PRODUCT_TYPE_LABELS[pl.product_type]} · {pl.source}
                      {pl.price_hint ? ` · ${pl.price_hint}` : ""}
                    </p>
                    {pl.source_url && (
                      <a
                        href={pl.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-label font-medium text-brand hover:underline"
                      >
                        상품 보기 →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-label text-ink-faint">
                결제는 마이리얼트립에서 진행됩니다. 가격·재고는 확인 시점 기준.
              </p>
            </div>
          )}
        </aside>

        {/* ── 우: 본문 + 등록 ── */}
        <div className="space-y-6">
          <div>
            <h1 className="text-display-lg font-bold text-ink">
              {event.title}
            </h1>
            {event.concept && (
              <p className="mt-1.5 text-h3 font-normal text-ink-muted">
                {event.concept}
              </p>
            )}
            {moodLabel && (
              <span className="mt-2 inline-flex items-center rounded-full bg-surface-soft px-2.5 py-1 text-label font-medium text-ink-muted">
                {moodLabel}
              </span>
            )}
          </div>

          {/* 일시 · 장소 */}
          {(event.date_text || locationDisplay) && (
            <div className="space-y-2 border-y border-surface-border py-4">
              {event.date_text && (
                <div>
                  <p className="text-label text-ink-muted">일시</p>
                  <p className="text-body text-ink">{event.date_text}</p>
                </div>
              )}
              {locationDisplay && (
                <div>
                  <p className="text-label text-ink-muted">장소</p>
                  <p className="text-body text-ink">{locationDisplay}</p>
                </div>
              )}
            </div>
          )}

          {/* 일정 후보 (P2-1 foundation) — 읽기 전용, 아직 투표 UI 없음 */}
          {event.schedule_candidates.length > 0 && (
            <div className="border-b border-surface-border pb-4">
              <p className="mb-2 text-label text-ink-muted">일정 후보</p>
              <ul className="space-y-2">
                {event.schedule_candidates.map((sc, i) => (
                  <li key={i}>
                    <p className="text-body font-medium text-ink">
                      {sc.label}
                      {sc.date_text ? ` · ${sc.date_text}` : ""}
                    </p>
                    {(sc.pros || sc.cons) && (
                      <p className="mt-0.5 text-label text-ink-muted">
                        {[sc.pros, sc.cons].filter(Boolean).join(" / ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 참가 신청 박스 */}
          <RegisterBox
            slug={event.slug}
            requiresApproval={event.requires_approval}
            capacity={event.recruit_capacity}
            confirmedCount={confirmedCount}
            participationQuestions={event.participation_questions}
          />

          {/* 이벤트 소개 */}
          {event.description && (
            <div>
              <h2 className="mb-2 text-h3 font-bold text-ink">이벤트 소개</h2>
              <p className="whitespace-pre-wrap text-body leading-relaxed text-ink">
                {event.description}
              </p>
            </div>
          )}
        </div>
        </div>
      </main>
    </>
  );
}
