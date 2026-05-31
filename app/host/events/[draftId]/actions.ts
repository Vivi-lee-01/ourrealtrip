"use server";

// 호스트 대시보드 server action — 신청 승인/거절
// 호스트가 신청자를 confirmed/declined로 처리한다(사람 판단).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setRegistrationStatus } from "@/lib/store/registrations";
import { getDraftById } from "@/lib/store/drafts";
import { getHostAuthContext } from "@/lib/auth/host";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function requireWritableEvent(draftId: string): Promise<void> {
  const auth = await getHostAuthContext();
  if (isSupabaseConfigured() && !auth) {
    redirect(`/login?next=${encodeURIComponent(`/host/events/${draftId}`)}`);
  }
  const event = await getDraftById(draftId, auth?.userId ?? null);
  if (!event) throw new Error("관리할 이벤트를 찾을 수 없습니다.");
}

export async function approveRegistrationAction(
  draftId: string,
  registrationId: string,
): Promise<void> {
  await requireWritableEvent(draftId);
  await setRegistrationStatus(registrationId, "confirmed");
  revalidatePath(`/host/events/${draftId}`);
}

export async function declineRegistrationAction(
  draftId: string,
  registrationId: string,
): Promise<void> {
  await requireWritableEvent(draftId);
  await setRegistrationStatus(registrationId, "declined");
  revalidatePath(`/host/events/${draftId}`);
}
