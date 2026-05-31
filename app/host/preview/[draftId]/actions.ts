"use server";

// 발행 server action — 미리보기에서 호스트가 명시적으로 호출(사람 승인 게이트)
// 발행 후 공개 페이지 /e/[slug]로 이동.

import { redirect } from "next/navigation";
import { publishDraft, getDraftById } from "@/lib/store/drafts";
import { getHostAuthContext } from "@/lib/auth/host";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function publishDraftAction(draftId: string): Promise<void> {
  const auth = await getHostAuthContext();
  if (isSupabaseConfigured() && !auth) {
    redirect(`/login?next=${encodeURIComponent(`/host/preview/${draftId}`)}`);
  }
  const published = await publishDraft(draftId, auth?.userId ?? null);
  if (!published) {
    throw new Error("발행할 초안을 찾을 수 없습니다.");
  }
  redirect(`/e/${published.slug}`);
}

// (조회 헬퍼 — preview에서 직접 store를 import해도 되지만 액션 파일에 모음)
export async function getDraftForPreview(draftId: string) {
  const auth = await getHostAuthContext();
  if (isSupabaseConfigured() && !auth) return null;
  return getDraftById(draftId, auth?.userId ?? null);
}
