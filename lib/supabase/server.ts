// 서버 컴포넌트/서버 액션/라우트 핸들러용 Supabase client.
// Supabase 환경변수가 없으면 null을 반환해 로컬 데모 흐름을 깨지 않는다.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 호출될 때는 set이 불가능할 수 있다.
          // middleware가 세션 refresh를 담당하므로 여기서는 조용히 무시한다.
        }
      },
    },
  });
}
