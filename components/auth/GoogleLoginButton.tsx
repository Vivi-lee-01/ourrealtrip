"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/supabase/config";

export default function GoogleLoginButton({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(createSupabaseBrowserClient, []);

  async function signIn() {
    setError(null);
    if (!supabase) {
      setError("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)가 아직 설정되지 않았습니다.");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const redirectTo = `${getSiteUrl(origin)}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (signInError) setError(signInError.message);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={signIn}
        className="w-full rounded-card bg-ink px-4 py-3 text-label font-medium text-surface transition hover:opacity-90"
      >
        Google로 계속하기
      </button>
      {error && <p className="text-label text-warn">{error}</p>}
    </div>
  );
}
