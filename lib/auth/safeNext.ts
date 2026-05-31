// next 리다이렉트 경로 가드 (open-redirect 방지).
// 상대 경로("/...")만 허용하고, 프로토콜-상대("//")·백슬래시 우회("/\\")는 막는다.
// 로그인 페이지와 OAuth 콜백이 같은 규칙을 쓰도록 단일 진입점으로 둔다.
// 로그인 후 기본 착지 = 메인("/"). (구: /host/create 직행 → 메인페이지 리부트로 변경)
const DEFAULT_NEXT = "/";

export function safeNextPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return DEFAULT_NEXT;
  }
  return value;
}
