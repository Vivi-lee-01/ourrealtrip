"use client";

// 브라우저 전용 Supabase client. 로그인 버튼 등 Client Component에서만 사용한다.

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
}
