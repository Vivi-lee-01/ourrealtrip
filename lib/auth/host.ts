// 호스트 인증/식별 헬퍼
// - Supabase가 설정된 환경: Google 로그인된 user.id를 host owner identity로 사용
// - Supabase 미설정 로컬 데모: null을 반환해 기존 데모 흐름 유지

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface HostAuthContext {
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export async function getHostAuthContext(): Promise<HostAuthContext | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const metadata = data.user.user_metadata ?? {};
  const rawName = metadata.full_name ?? metadata.name;
  const rawAvatarUrl = metadata.avatar_url ?? metadata.picture;

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    name: typeof rawName === "string" ? rawName : null,
    avatarUrl: typeof rawAvatarUrl === "string" ? rawAvatarUrl : null,
  };
}

export async function requireHostAuthContext(nextPath: string): Promise<HostAuthContext> {
  const ctx = await getHostAuthContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return ctx;
}
