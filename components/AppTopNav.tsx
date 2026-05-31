import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import type { HostAuthContext } from "@/lib/auth/host";

interface AppTopNavProps {
  user?: HostAuthContext | null;
  // 후방호환: 호스트 페이지들이 active="create"/"events"를 넘긴다.
  // events·discover는 모두 "탐색" 탭으로 매핑한다.
  active?: "discover" | "create" | "events";
}

// Airbnb 스타일 중앙 네비 — 실제 라우트만 남긴다(깨진 중복 탭 제거).
//   탐색 → "/", 이벤트 등록하기 → "/host/create"
const navItems = [
  { href: "/", label: "탐색", key: "discover" },
  { href: "/host/create", label: "이벤트 등록하기", key: "create" },
] as const;

export default function AppTopNav({ user, active = "discover" }: AppTopNavProps) {
  const displayName = user?.name ?? user?.email ?? "로그인 사용자";
  // events는 별도 탭이 없으므로 "탐색"(discover) 강조로 흡수한다.
  const activeKey = active === "events" ? "discover" : active;

  return (
    <header className="w-full border-b border-surface-border bg-surface">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* 좌측 — 텍스트 워드마크 + Rausch 액센트 도트 (이미지 에셋 없음) */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-h3 font-semibold text-ink"
          aria-label="OurRealTrip 홈"
        >
          <span
            aria-hidden
            className="inline-block size-2 rounded-pill bg-brand"
          />
          <span>OurRealTrip</span>
        </Link>

        {/* 중앙 — 실제 라우트만 가진 네비 */}
        <div className="flex min-w-0 items-center justify-center gap-6 sm:gap-8">
          {navItems.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap text-body font-semibold transition ${
                  isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* 우측 — 로그인 시 프로필, 미로그인 시 로그인 링크(메인 착지) */}
        <div className="flex shrink-0 items-center justify-end">
          {user ? (
            <div
              className="flex min-w-0 items-center gap-2"
              title={displayName}
            >
              <Avatar
                name={displayName}
                src={user.avatarUrl}
                size={34}
                className="shrink-0 shadow-sm"
              />
              <span className="hidden max-w-36 truncate text-label font-medium text-ink-muted lg:inline">
                {displayName}
              </span>
            </div>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-pill border border-surface-border bg-surface px-4 py-2 text-label font-semibold text-ink transition hover:bg-surface-soft"
            >
              로그인
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
