// /host/create — 호스트 이벤트 생성 화면 (Luma "이벤트 만들기" 대응)
//
// 사람 직접 입력 + Agent 보조(GGUI) 진입을 한 화면에서 제공한다.
// 제출 시 server action(createEventDraftAction)으로 draft 저장 후 미리보기로 이동.
// 발행(공개 노출)은 미리보기에서 승인 게이트를 거친다.

import type { Metadata } from "next";
import AppTopNav from "@/components/AppTopNav";
import CreateEventForm from "@/components/host/CreateEventForm";
import { getHostAuthContext } from "@/lib/auth/host";

export const metadata: Metadata = {
  title: "이벤트 만들기 · 아워리얼트립",
  description:
    "스토리가 있는 여행·액티비티 이벤트를 만들고 마이리얼트립 상품을 연결합니다.",
};

export default async function HostCreatePage() {
  const user = await getHostAuthContext();

  return (
    <>
      <AppTopNav user={user} active="create" />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <header className="max-w-3xl space-y-1">
          <h1 className="text-display-lg font-bold text-ink">이벤트 만들기</h1>
          <p className="text-body text-ink-muted">
            이야기를 이벤트로 만들고, 마이리얼트립 상품을 붙여 예약 동선으로
            연결합니다. 먼저 초안을 만든 뒤 미리보고 발행하세요.
          </p>
        </header>
        <CreateEventForm />
      </main>
    </>
  );
}
