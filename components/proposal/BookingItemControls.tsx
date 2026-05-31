"use client";

// 9. 각자예약 자가표시 — 항목별 "내 예약" + "예약 완료" 토글 (PRD 6절 9번, COMMERCE 3·6)
//
// ★ 항목별 독립 CTA. 단일 "전체 예약"/묶음결제 버튼 절대 없음(구조적으로 항목 단위만).
// "내 예약" → /go/[product_link_id](클릭 기록 후 외부 판매처 redirect, 새 탭).
// 복귀 후 "예약 완료" 자가표시 → POST /api/booking-progress(status=self_reported_booked).
// 토글 해제 시 booking_intent로 정정(자가표시 취소). 호스트/외부 확인 상태는 읽기 전용 표시.
// ★ 자가표시일 뿐 — 시스템이 결제를 확인한 게 아니다("예약함" 자가보고, "결제완료" X).

import { useState } from "react";
import type { BookingProgressStatus } from "@/lib/types";

interface BookingItemControlsProps {
  proposalId: string;
  optionId: string;
  productLinkId: string;
  /** 내 초기 진행 상태(쿠키 세션 복원). 없으면 pending */
  initialStatus?: BookingProgressStatus;
}

type SaveState = "idle" | "saving" | "error";

export default function BookingItemControls({
  proposalId,
  optionId,
  productLinkId,
  initialStatus = "pending",
}: BookingItemControlsProps) {
  const [status, setStatus] = useState<BookingProgressStatus>(initialStatus);
  const [save, setSave] = useState<SaveState>("idle");

  const booked =
    status === "self_reported_booked" ||
    status === "host_confirmed_booked" ||
    status === "externally_confirmed_booked";

  async function mark(next: Exclude<BookingProgressStatus, "pending">) {
    setSave("saving");
    try {
      const res = await fetch("/api/booking-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: proposalId,
          option_id: optionId,
          product_link_id: productLinkId,
          status: next,
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus(next);
      setSave("idle");
    } catch {
      setSave("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* 항목별 독립 "내 예약" — 외부 판매처로 (outline, 묶음 아님) */}
      <a
        href={`/go/${productLinkId}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-card border border-surface-border bg-surface px-3.5 py-2 text-label text-ink transition-colors hover:bg-surface-soft"
      >
        <span>내 예약</span>
        <span aria-hidden>↗</span>
      </a>

      {/* 예약 완료 자가표시 토글 — 결제 확인 아님 */}
      <button
        type="button"
        aria-pressed={booked}
        onClick={() =>
          mark(booked ? "booking_intent" : "self_reported_booked")
        }
        disabled={save === "saving"}
        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-card px-2.5 py-1.5 text-caption transition-colors disabled:opacity-50 ${
          booked
            ? "text-success"
            : "text-ink-faint hover:text-ink-muted"
        }`}
      >
        <span
          aria-hidden
          className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-pill border ${
            booked
              ? "border-success bg-success text-white"
              : "border-surface-borderStrong"
          }`}
        >
          {booked ? "✓" : ""}
        </span>
        <span>{booked ? "예약했어요(자가표시)" : "예약했어요 표시"}</span>
      </button>

      {save === "error" && (
        <span className="text-caption text-warn" role="alert">
          저장 실패 · 다시
        </span>
      )}
    </div>
  );
}
