"use client";

// 3. RsvpPanel — Interest/RSVP (PRD 6절 3번, 상품보다 먼저, DESIGN_BRIEF 5-3)
//
// ★ 화면 위계: 커버·호스트 다음, 상품보다 먼저, 가장 두드러진 카드(Interest before booking).
// ★ 참여자 익명: 이름/이메일 입력칸 없음(확정 결정 4). 선택 코멘트 textarea만.
// 응답: 관심 있어요(primary) / 날짜 되면 / 가격 되면 / 옵션 투표 / 질문(secondary).
// 제출 시 POST /api/rsvp (lib/store.recordInterest로 익명 세션 기록).
// "예약"/"결제" 단어 금지 — 여기는 의향만.

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { ResponseType } from "@/lib/types";

interface OptionChoice {
  option_id: string;
  option_name: string;
}

interface RsvpPanelProps {
  proposalId: string;
  options: OptionChoice[];
}

interface ResponseChoice {
  type: ResponseType;
  label: string;
  hint: string;
}

// not_interested 는 1차 동선에 노출하지 않는다(거절 유형은 코멘트로 자연 수집).
const RESPONSE_CHOICES: ResponseChoice[] = [
  { type: "interested", label: "관심 있어요", hint: "일단 의향만 남겨요" },
  { type: "date_dependent", label: "날짜 되면 갈래요", hint: "날짜가 맞으면" },
  { type: "price_dependent", label: "가격 되면 갈래요", hint: "예산이 맞으면" },
  { type: "voted_option", label: "옵션에 투표", hint: "마음에 드는 안에" },
  { type: "question", label: "질문 남기기", hint: "궁금한 걸 물어봐요" },
];

type SubmitState = "idle" | "submitting" | "done" | "error";

export default function RsvpPanel({ proposalId, options }: RsvpPanelProps) {
  const [selected, setSelected] = useState<ResponseType | null>(null);
  const [optionId, setOptionId] = useState<string>(options[0]?.option_id ?? "");
  const [preferredDates, setPreferredDates] = useState("");
  const [preferredBudget, setPreferredBudget] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  const isVote = selected === "voted_option";
  const isQuestion = selected === "question";
  const isDate = selected === "date_dependent";
  const isPrice = selected === "price_dependent";

  async function handleSubmit() {
    if (!selected) return;
    setState("submitting");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: proposalId,
          option_id: isVote ? optionId || null : null,
          response_type: selected,
          preferred_dates: isDate ? preferredDates.trim() || null : null,
          preferred_budget: isPrice ? preferredBudget.trim() || null : null,
          comment: comment.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <section
        aria-labelledby="rsvp-title"
        className="rounded-card border border-brand bg-brand-soft p-4 shadow-card sm:p-5"
      >
        <h2 id="rsvp-title" className="text-h2 text-brand-softfg">
          의향을 남겼어요
        </h2>
        <p className="mt-2 text-body-sm text-ink-muted">
          호스트가 모인 반응을 보고 다음 단계를 정해요. 이름·연락처는 받지 않아요.
        </p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => {
            setSelected(null);
            setComment("");
            setPreferredDates("");
            setPreferredBudget("");
            setState("idle");
          }}
        >
          다른 반응도 남기기
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="rsvp-title"
      className="rounded-card border border-surface-border bg-surface p-4 shadow-card sm:p-5"
    >
      <h2 id="rsvp-title" className="text-h2 text-ink">
        같이 갈까 고민 중이라면
      </h2>
      <p className="mt-1 text-body-sm text-ink-muted">
        부담 없이 의향만 먼저 남겨요. 지금 예약하는 게 아니에요.
      </p>

      {/* 1 primary(interested) + 4 secondary 칩 (DESIGN_BRIEF 5-3) */}
      <div className="mt-4 space-y-2">
        <Button
          variant={selected === "interested" ? "primary" : "chip-toggle"}
          size="lg"
          selected={selected === "interested"}
          aria-pressed={selected === "interested"}
          className="w-full"
          onClick={() => setSelected("interested")}
        >
          관심 있어요
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {RESPONSE_CHOICES.filter((c) => c.type !== "interested").map((c) => {
            const active = selected === c.type;
            return (
              <Button
                key={c.type}
                variant="chip-toggle"
                selected={active}
                className="w-full flex-col items-start gap-0 py-2 text-left"
                onClick={() => setSelected(c.type)}
              >
                <span className="text-label">{c.label}</span>
                <span
                  className={`text-caption font-normal ${active ? "text-brand-softfg" : "text-ink-faint"}`}
                >
                  {c.hint}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 옵션 투표 선택 시 옵션 드롭다운 */}
      {isVote && options.length > 0 && (
        <div className="mt-3">
          <label htmlFor="rsvp-option" className="text-caption text-ink-faint">
            어떤 안에 투표할까요
          </label>
          <select
            id="rsvp-option"
            value={optionId}
            onChange={(e) => setOptionId(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-card border border-surface-border bg-surface-sunken px-3 py-2 text-body text-ink"
          >
            {options.map((o) => (
              <option key={o.option_id} value={o.option_id}>
                {o.option_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜/가격 의향 펼침 입력(선택) */}
      {isDate && (
        <div className="mt-3">
          <label htmlFor="rsvp-dates" className="text-caption text-ink-faint">
            선호 날짜 (선택)
          </label>
          <input
            id="rsvp-dates"
            value={preferredDates}
            onChange={(e) => setPreferredDates(e.target.value)}
            maxLength={120}
            placeholder="예: 6월 셋째 주 주말이면 가능"
            className="mt-1 min-h-[44px] w-full rounded-card border border-surface-border bg-surface-sunken px-3 py-2 text-body text-ink placeholder:text-ink-faint"
          />
        </div>
      )}
      {isPrice && (
        <div className="mt-3">
          <label htmlFor="rsvp-budget" className="text-caption text-ink-faint">
            선호 예산 (선택)
          </label>
          <input
            id="rsvp-budget"
            value={preferredBudget}
            onChange={(e) => setPreferredBudget(e.target.value)}
            maxLength={120}
            placeholder="예: 1인 80만원 안쪽이면 갈래요"
            className="mt-1 min-h-[44px] w-full rounded-card border border-surface-border bg-surface-sunken px-3 py-2 text-body text-ink placeholder:text-ink-faint"
          />
        </div>
      )}

      {/* 선택 코멘트 — 이름/이메일 입력칸 없음 */}
      <div className="mt-3">
        <label htmlFor="rsvp-comment" className="text-caption text-ink-faint">
          {isQuestion ? "궁금한 점 (선택)" : "한마디 남기기 (선택)"}
        </label>
        <textarea
          id="rsvp-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={
            isQuestion
              ? "예: 항공은 각자 알아서 예매하나요?"
              : "예: 날짜만 맞으면 무조건 갈래요"
          }
          className="mt-1 w-full rounded-card border border-surface-border bg-surface-sunken px-3 py-2 text-body text-ink placeholder:text-ink-faint"
        />
      </div>

      {state === "error" && (
        <p className="mt-2 text-body-sm text-warn" role="alert">
          잠시 문제가 있었어요. 다시 시도해 주세요.
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        disabled={!selected || state === "submitting"}
        onClick={handleSubmit}
        className="mt-4 w-full"
      >
        {state === "submitting" ? "보내는 중…" : "의향 남기기"}
      </Button>

      <p className="mt-2 text-caption text-ink-faint">
        이름·이메일은 받지 않아요.
      </p>
    </section>
  );
}
