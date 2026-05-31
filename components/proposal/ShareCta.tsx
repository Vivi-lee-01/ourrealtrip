"use client";

// Share CTA 섹션 (PRD 6절 8번)
//
// 커뮤니티 공유용 문안을 복사한다. 공식 오인/패키지/전체 예약 문구 없음 —
// 호스트가 자기 모임에 그대로 붙여넣을 수 있는 중립 안내 문안.
// 공유 문안은 서버에서 생성해 props로 받고, 여기선 클립보드 복사 UX만 담당한다.

import { useState } from "react";
import Button from "@/components/ui/Button";

interface ShareCtaProps {
  /** 공유 제목(여행 제목) */
  title: string;
  /** 공유용 본문 문안(서버에서 banned 검증 거친 카피) */
  shareText: string;
  /** 공유 대상 URL */
  url: string;
}

export default function ShareCta({ title, shareText, url }: ShareCtaProps) {
  const [copied, setCopied] = useState(false);
  const fullText = `${shareText}\n${url}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 차단 환경 — 사용자가 직접 선택 복사하도록 textarea 노출 상태 유지
      setCopied(false);
    }
  }

  return (
    <section
      id="share"
      aria-labelledby="share-title"
      className="rounded-card border border-surface-border bg-surface p-4 shadow-card sm:p-5"
    >
      <h2 id="share-title" className="text-h2 text-ink">
        커뮤니티에 공유하기
      </h2>
      <p className="mt-1 text-body-sm text-ink-muted">
        아래 문안을 복사해 우리 모임에 그대로 공유하세요.
      </p>

      <div className="mt-3 rounded-card bg-surface-soft p-3">
        <p className="whitespace-pre-line text-body-sm text-ink">{fullText}</p>
      </div>

      <Button
        variant="outline"
        onClick={handleCopy}
        aria-live="polite"
        className="mt-3 w-full"
      >
        <span aria-hidden>{copied ? "✓" : "⧉"}</span>
        <span>{copied ? "복사했어요" : "공유 문안 복사"}</span>
      </Button>

      <p className="mt-2 text-caption text-ink-faint" aria-hidden={!title}>
        {title} · 공유 링크 {url}
      </p>
    </section>
  );
}
