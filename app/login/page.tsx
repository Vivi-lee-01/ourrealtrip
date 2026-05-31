import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { getHostAuthContext } from "@/lib/auth/host";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/auth/safeNext";

export const metadata: Metadata = {
  title: "로그인 · 아워리얼트립",
  description: "호스트 이벤트 생성과 관리를 위해 Google 계정으로 로그인합니다.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  const auth = await getHostAuthContext();
  if (auth) redirect(nextPath);

  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="space-y-6 rounded-card border border-surface-border bg-surface p-6 shadow-card">
        <header className="space-y-2">
          <p className="text-label font-medium text-ink-muted">Host access</p>
          <h1 className="text-display font-bold text-ink">로그인</h1>
          <p className="text-body text-ink-muted">
            이벤트 생성·미리보기·신청자 관리는 Google 로그인 후 이용합니다.
          </p>
        </header>

        {!configured && (
          <div className="rounded-card border border-warn/30 bg-warn-soft px-4 py-3 text-label text-warn">
            Supabase 환경변수가 아직 없어 실제 Google 로그인을 시작할 수 없습니다.
            `.env.local`에 Supabase URL/Anon Key를 넣고 Supabase Dashboard에서 Google Provider를 켜면 바로 동작합니다.
          </div>
        )}

        <GoogleLoginButton nextPath={nextPath} />
      </div>
    </main>
  );
}
