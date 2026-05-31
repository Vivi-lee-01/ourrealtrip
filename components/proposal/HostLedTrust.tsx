// 2. HostLedTrust — "Hosted by" (PRD 6절 2번, DESIGN_BRIEF 1절 원칙 11)
//
// 누가 왜 여는가 = 신뢰의 핵심(UX 원칙 2 Host-led). "host가 골랐다"가 보이는 톤:
// 호스트 아바타 + 이름/커뮤니티 + bio + trust_note(운영 이력). 공식 오인 표현 없음 —
// host 개인의 운영 이력만. 루마 "Hosted by" anatomy 차용.

import { Avatar } from "@/components/ui/Avatar";
import type { Host, Community } from "@/lib/types";

interface HostLedTrustProps {
  host: Host;
  community: Community;
}

export default function HostLedTrust({ host, community }: HostLedTrustProps) {
  return (
    <section
      aria-labelledby="host-trust-title"
      className="rounded-card border border-surface-border bg-surface p-4 shadow-card sm:p-5"
    >
      <p
        id="host-trust-title"
        className="text-caption uppercase tracking-wide text-ink-faint"
      >
        Hosted by
      </p>

      <div className="mt-2 flex items-start gap-3">
        <Avatar name={host.name} src={host.profile_image_url} size={44} />
        <div className="min-w-0">
          <p className="text-h3 text-ink">{host.name}</p>
          <p className="text-body-sm text-ink-muted">{community.name}</p>
        </div>
      </div>

      {host.bio && (
        <p className="mt-3 text-body-sm text-ink-muted">{host.bio}</p>
      )}

      {host.trust_note && (
        <div className="mt-3 rounded-chip bg-surface-soft px-3 py-2.5">
          <p className="text-caption text-ink-faint">호스트 활동 이력</p>
          <p className="mt-0.5 text-body-sm text-ink">{host.trust_note}</p>
        </div>
      )}
    </section>
  );
}
