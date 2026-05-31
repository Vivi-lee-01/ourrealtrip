import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safeNext";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  // 세션 쿠키는 이 콜백을 서빙한 호스트(requestUrl.origin)에 저장된다.
  // NEXT_PUBLIC_SITE_URL(getSiteUrl)로 리다이렉트하면 쿠키 호스트와 어긋나
  // preview/alias 배포에서 세션이 안 붙고 /login 바운스 루프가 생긴다 → request origin 고정.
  const origin = requestUrl.origin;

  // 제공자가 에러를 돌려준 경우(code 없음): 조용히 보호 페이지로 보내지 않고 노출한다.
  if (!code) {
    const reason = requestUrl.searchParams.get("error") ?? "missing_code";
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // 교환 실패 시 보호 페이지로 보내면 미들웨어가 다시 /login으로 튕겨 무한 루프가 된다.
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?next=${encodeURIComponent(next)}&error=exchange_failed`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
