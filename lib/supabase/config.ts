// Supabase 설정 헬퍼
// 값은 절대 코드에 하드코딩하지 않는다. .env.local 또는 배포 환경변수에서만 읽는다.

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

export function getSiteUrl(origin?: string): string {
  return (
    nonEmpty(process.env.NEXT_PUBLIC_SITE_URL) ??
    origin ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
