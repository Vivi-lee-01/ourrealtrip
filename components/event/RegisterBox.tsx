"use client";

// 참가 신청 박스 — Luma 공개 이벤트 페이지의 "등록/참가 신청" 박스 대응
//
// 이벤트가 requires_approval이면 "승인 필요" 안내 + 신청 시 pending,
//   아니면 즉시 confirmed. 제출 후 상태 메시지로 전환.
// ★ 미니멀 톤(create 폼과 일관): 흰 배경 + 얇은 테두리, 이모지·색박스 없음.

import { useState } from "react";
import Button from "@/components/ui/Button";
import { registerForEventAction } from "@/app/e/[slug]/actions";

interface RegisterBoxProps {
  slug: string;
  requiresApproval: boolean;
  capacity: number | null;
  confirmedCount: number;
  /** 승인 필요 시 신청자에게 물을 질문 (선택 응답) */
  participationQuestions?: string[];
}

type Phase = "idle" | "submitting" | "pending" | "confirmed" | "error";

const INPUT =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-body " +
  "text-ink placeholder:text-ink-faint focus-visible:border-brand focus-visible:outline-none";

export default function RegisterBox({
  slug,
  requiresApproval,
  capacity,
  confirmedCount,
  participationQuestions = [],
}: RegisterBoxProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const full = capacity != null && confirmedCount >= capacity;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhase("submitting");
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await registerForEventAction(slug, form);
    if (!res.ok) {
      setError(res.error ?? "신청에 실패했습니다.");
      setPhase("error");
      return;
    }
    setPhase(res.status === "confirmed" ? "confirmed" : "pending");
  }

  // 신청 완료 상태
  if (phase === "pending" || phase === "confirmed") {
    return (
      <div className="rounded-xl border border-surface-border p-5">
        <p className="text-h3 font-bold text-ink">
          {phase === "confirmed" ? "참가 확정" : "신청 완료"}
        </p>
        <p className="mt-2 text-body text-ink-muted">
          {phase === "confirmed"
            ? "참가가 확정되었습니다. 자세한 안내는 호스트가 전달합니다."
            : "신청이 접수되었습니다. 호스트 승인 후 확정 안내를 받게 됩니다."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-h3 font-bold text-ink">참가 신청</p>
        <span className="text-label text-ink-muted">
          {confirmedCount}명 참가
          {capacity != null ? ` · 정원 ${capacity}` : ""}
        </span>
      </div>
      {requiresApproval && (
        <p className="mb-3 text-label text-ink-muted">
          호스트 승인이 필요한 이벤트입니다.
        </p>
      )}

      {full ? (
        <p className="rounded-lg bg-surface-soft px-3 py-3 text-body text-ink-muted">
          정원이 가득 찼습니다.
        </p>
      ) : !open ? (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          참가 신청
        </Button>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2">
          <input name="name" required placeholder="이름" className={INPUT} />
          <input
            name="contact"
            placeholder="연락처 또는 이메일 (선택)"
            className={INPUT}
          />
          <textarea
            name="message"
            rows={2}
            placeholder="호스트에게 한마디 (선택)"
            className={`${INPUT} resize-y`}
          />
          {requiresApproval && participationQuestions.length > 0 && (
            <div className="space-y-2 border-t border-surface-border pt-2">
              {participationQuestions.map((q, i) => (
                <label key={i} className="block space-y-1">
                  <span className="text-label text-ink-muted">{q}</span>
                  <input
                    name={`pq_answer_${i}`}
                    placeholder="답변 (선택)"
                    className={INPUT}
                  />
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-label text-warn">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={phase === "submitting"}
          >
            {phase === "submitting" ? "신청 중…" : "신청하기"}
          </Button>
        </form>
      )}
    </div>
  );
}
