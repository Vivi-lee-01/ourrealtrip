import { NextResponse, type NextRequest } from "next/server";

// 미들웨어는 항상 Edge 런타임. Edge 번들에서 @/lib/supabase/* (createServerClient의
// supabase-js Node API, 그리고 같은 네임스페이스의 config)가 "unsupported modules"로
// 빌드를 막는다. → 미들웨어는 외부 import 없이 self-contained로 두고, 인증 쿠키 존재만
// 가볍게 확인해 보호 경로를 게이팅한다. 실제 세션 검증·갱신은 서버 컴포넌트
// (lib/auth/host getHostAuthContext→getUser)와 OAuth 콜백 라우트가 담당.

const HOST_PROTECTED_PREFIXES = ["/host"];

function isProtectedPath(pathname: string): boolean {
  return HOST_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Supabase SSR 세션 쿠키(sb-<ref>-auth-token, 청크 .0/.1 포함) 존재 여부.
function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // NEXT_PUBLIC_* 는 빌드 시 리터럴로 인라인 → Edge-safe. 미설정(로컬 데모/프리뷰)이면 통과.
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!configured || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }
  if (hasSupabaseSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
