// /host/events/[draftId] — 호스트 대시보드 (신청자 목록 + 승인/거절)
//
// 발행한 이벤트의 신청 현황을 보고 pending 신청을 승인/거절한다.
// 신청 신호 퍼널(확정/대기/거절) + 연결 상품 클릭 신호는 추후 Booking Signal Sync 연동.
// 톤은 미니멀(흰 배경, 얇은 divider) 일관.

import { notFound } from "next/navigation";
import { getDraftById } from "@/lib/store/drafts";
import { getHostAuthContext } from "@/lib/auth/host";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listRegistrationsByEvent } from "@/lib/store/registrations";
import type { Registration, RegistrationStatus } from "@/lib/store/registrations";
import {
  approveRegistrationAction,
  declineRegistrationAction,
} from "@/app/host/events/[draftId]/actions";

interface PageProps {
  params: Promise<{ draftId: string }>;
}

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "대기",
  confirmed: "확정",
  declined: "거절",
  cancelled: "취소",
};

export default async function HostEventDashboard({ params }: PageProps) {
  const { draftId } = await params;
  const auth = await getHostAuthContext();
  if (isSupabaseConfigured() && !auth) notFound();
  const event = await getDraftById(draftId, auth?.userId ?? null);
  if (!event) notFound();

  const regs = await listRegistrationsByEvent(draftId);
  const confirmed = regs.filter((r) => r.status === "confirmed").length;
  const pending = regs.filter((r) => r.status === "pending").length;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* 헤더 */}
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-label text-ink-muted">
          <span>{event.status === "published" ? "발행됨" : "초안"}</span>
          {event.status === "published" && (
            <>
              <span>·</span>
              <a href={`/e/${event.slug}`} className="text-brand hover:underline">
                공개 페이지 보기 →
              </a>
            </>
          )}
        </div>
        <h1 className="text-display font-bold text-ink">{event.title}</h1>
        <p className="text-body text-ink-muted">
          확정 {confirmed}
          {event.recruit_capacity ? ` / 정원 ${event.recruit_capacity}` : ""} ·
          대기 {pending}
        </p>
      </header>

      <div className="h-px bg-surface-border" />

      {/* 신청자 목록 */}
      <section className="space-y-3">
        <h2 className="text-label font-medium text-ink-muted">
          신청자 {regs.length}명
        </h2>
        {regs.length === 0 ? (
          <p className="rounded-lg bg-surface-soft px-3 py-6 text-center text-body text-ink-muted">
            아직 신청자가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {regs.map((r) => (
              <RegRow key={r.registration_id} reg={r} draftId={draftId} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function RegRow({ reg, draftId }: { reg: Registration; draftId: string }) {
  const badgeTone: Record<RegistrationStatus, string> = {
    pending: "bg-warn-soft text-warn",
    confirmed: "bg-success-soft text-success",
    declined: "bg-surface-soft text-ink-muted",
    cancelled: "bg-surface-soft text-ink-faint",
  };
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-surface-border p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body font-medium text-ink">{reg.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-label font-medium ${badgeTone[reg.status]}`}
          >
            {STATUS_LABEL[reg.status]}
          </span>
        </div>
        {(reg.contact || reg.message) && (
          <p className="mt-0.5 truncate text-label text-ink-muted">
            {[reg.contact, reg.message].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {reg.status === "pending" && (
        <div className="flex shrink-0 gap-2">
          <form action={approveRegistrationAction.bind(null, draftId, reg.registration_id)}>
            <button
              type="submit"
              className="rounded-card bg-brand px-3 py-1.5 text-label font-medium text-brand-fg hover:bg-brand-hover"
            >
              승인
            </button>
          </form>
          <form action={declineRegistrationAction.bind(null, draftId, reg.registration_id)}>
            <button
              type="submit"
              className="rounded-card border border-surface-border px-3 py-1.5 text-label font-medium text-ink-muted hover:text-ink"
            >
              거절
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
