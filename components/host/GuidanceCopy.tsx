"use client";

// 참여자 안내/리마인드 문구 생성 (P2-5)
//
// ★ 외부 발송 없음: Slack/이메일 등으로 보내지 않는다. 상태별(관심자/승인/대기) 안내
//   문구를 만들어 클립보드 복사까지만 한다. 실제 발송은 호스트가 사람으로서 한다.
// ★ merchant 아님: 결제/예약 확정 표현을 쓰지 않는다.

import { useState } from "react";

interface GuidanceCopyProps {
  title: string;
  dateText: string | null;
  /** 장소 공개 수준이 반영된 표시 문자열(호출부에서 결정) */
  locationDisplay: string | null;
  requiresApproval: boolean;
}

export default function GuidanceCopy({
  title,
  dateText,
  locationDisplay,
  requiresApproval,
}: GuidanceCopyProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const meta = [
    dateText ? `일시: ${dateText}` : "",
    locationDisplay ? `장소: ${locationDisplay}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const templates: Array<{ id: string; label: string; text: string }> = [
    {
      id: "interest",
      label: "관심자 안내",
      text: `안녕하세요! ‘${title}’에 관심 가져주셔서 고맙습니다.${meta ? "\n" + meta : ""}\n참여를 원하시면 이벤트 페이지에서 신청해 주세요. 궁금한 점은 편하게 남겨주세요.`,
    },
    ...(requiresApproval
      ? [
          {
            id: "approved",
            label: "승인 안내",
            text: `‘${title}’ 참가가 확정되었습니다.${meta ? "\n" + meta : ""}\n곧 자세한 진행 안내를 전해드릴게요. 만나서 반가워요!`,
          },
        ]
      : []),
    {
      id: "waitlist",
      label: "대기 안내",
      text: `‘${title}’ 대기자 명단에 등록되었습니다.\n자리가 생기면 가장 먼저 안내드릴게요. 조금만 기다려 주세요.`,
    },
  ];

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // 클립보드 권한 없을 때는 조용히 무시(데모 안정성)
    }
  }

  return (
    <div className="space-y-3 rounded-card border border-surface-border p-4">
      <div>
        <h2 className="text-h3 font-bold text-ink">참여자 안내 문구</h2>
        <p className="mt-0.5 text-label text-ink-muted">
          복사해서 직접 보내세요. 이 화면에서 외부로 발송하지 않습니다.
        </p>
      </div>
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-surface-border bg-surface p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-label font-medium text-ink">{t.label}</span>
              <button
                type="button"
                onClick={() => handleCopy(t.id, t.text)}
                className="rounded-md border border-surface-border px-2.5 py-1 text-caption font-medium text-ink hover:bg-surface-soft"
              >
                {copied === t.id ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="whitespace-pre-wrap text-caption leading-5 text-ink-muted">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
