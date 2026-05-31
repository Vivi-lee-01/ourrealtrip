"use server";

// 참가 신청 server action — 발행된 이벤트(/e/[slug])에서 호출
//
// 이벤트가 requires_approval이면 pending(승인 대기), 아니면 confirmed로 저장.
// ★ 결제 아님: 참가 의사 기록만. 상품 결제는 마이리얼트립에서 각자(/go).

import { revalidatePath } from "next/cache";
import { getDraftBySlug } from "@/lib/store/drafts";
import { createRegistration } from "@/lib/store/registrations";

export interface RegisterResult {
  ok: boolean;
  status?: "pending" | "confirmed";
  error?: string;
}

export async function registerForEventAction(
  slug: string,
  form: FormData,
): Promise<RegisterResult> {
  const name = (form.get("name") as string | null)?.trim();
  if (!name) return { ok: false, error: "이름을 입력해 주세요." };

  const event = await getDraftBySlug(slug);
  if (!event || event.status !== "published") {
    return { ok: false, error: "신청할 수 없는 이벤트입니다." };
  }

  const contact = (form.get("contact") as string | null)?.trim() || null;
  const message = (form.get("message") as string | null)?.trim() || null;

  const reg = await createRegistration({
    event_id: event.draft_id,
    name,
    contact,
    message,
    requires_approval: event.requires_approval,
  });

  // 공개 페이지의 "N명 참가" 카운트 갱신
  revalidatePath(`/e/${slug}`);

  return {
    ok: true,
    status: reg.status === "confirmed" ? "confirmed" : "pending",
  };
}
