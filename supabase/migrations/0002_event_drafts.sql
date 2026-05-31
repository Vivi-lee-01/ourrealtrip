-- =============================================================================
-- OurRealTrip — host-create event draft / registration tables
-- 목적: 현재 /host/create → /host/preview → /e/[slug] EventDraft 계약을 보존하면서
-- Supabase Auth 기반 소유권/RLS로 옮기기 위한 브릿지 스키마.
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists event_draft (
  draft_id uuid primary key default gen_random_uuid(),
  host_id uuid references host(host_id) on delete cascade,
  host_user_id uuid references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  concept text,
  description text,
  date_text text,
  timezone text,
  location_text text,
  cover_image_url text,
  recruit_capacity int,
  requires_approval boolean not null default true,
  waitlist_enabled boolean not null default true,
  visibility visibility_type not null default 'unlisted',
  audience text not null default 'private' check (audience in ('public', 'private')),
  community_id text,
  location_visibility text,
  mood text,
  participation_questions jsonb not null default '[]'::jsonb,
  schedule_candidates jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  lifecycle proposal_status not null default 'draft',
  product_links jsonb not null default '[]'::jsonb,
  created_via text not null default 'human' check (created_via in ('human', 'agent', 'mcp')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  proposal_id uuid references trip_proposal(proposal_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_draft_owner_present check (host_id is not null or host_user_id is not null)
);

comment on table event_draft is 'Host-create 이벤트 초안/발행 브릿지 테이블. 현재 EventDraft UI 계약을 보존한다.';

create trigger trg_event_draft_updated_at
  before update on event_draft
  for each row execute function set_updated_at();

create index if not exists idx_event_draft_host on event_draft(host_id);
create index if not exists idx_event_draft_host_user on event_draft(host_user_id);
create index if not exists idx_event_draft_status on event_draft(status);
create index if not exists idx_event_draft_slug on event_draft(slug);

create table if not exists event_registration (
  registration_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references event_draft(draft_id) on delete cascade,
  name text not null,
  contact text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table event_registration is 'Host-create 이벤트 신청/승인 데이터. interest_signal과 별도의 Luma식 신청 모델.';

create trigger trg_event_registration_updated_at
  before update on event_registration
  for each row execute function set_updated_at();

create index if not exists idx_event_registration_event on event_registration(event_id);
create index if not exists idx_event_registration_status on event_registration(status);

alter table event_draft enable row level security;
alter table event_registration enable row level security;

-- 호스트 본인 초안 조회/쓰기
create policy event_draft_owner_select on event_draft
  for select to authenticated
  using (
    host_user_id = auth.uid()
    or exists (
      select 1 from host h
      where h.host_id = event_draft.host_id and h.auth_user_id = auth.uid()
    )
  );

create policy event_draft_owner_write on event_draft
  for all to authenticated
  using (
    host_user_id = auth.uid()
    or exists (
      select 1 from host h
      where h.host_id = event_draft.host_id and h.auth_user_id = auth.uid()
    )
  )
  with check (
    host_user_id = auth.uid()
    or exists (
      select 1 from host h
      where h.host_id = event_draft.host_id and h.auth_user_id = auth.uid()
    )
  );

-- 발행된 공개/비공개 링크 이벤트는 URL을 아는 사람에게 조회 허용
create policy event_draft_published_select on event_draft
  for select to anon, authenticated
  using (status = 'published' and visibility in ('public', 'unlisted'));

-- 발행된 이벤트에 한해 익명 신청 허용
create policy event_registration_anon_insert on event_registration
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from event_draft e
      where e.draft_id = event_registration.event_id
        and e.status = 'published'
        and e.visibility in ('public', 'unlisted')
    )
  );

-- 소유 호스트만 신청자 목록 조회/상태 변경
create policy event_registration_owner_select on event_registration
  for select to authenticated
  using (
    exists (
      select 1 from event_draft e
      left join host h on h.host_id = e.host_id
      where e.draft_id = event_registration.event_id
        and (e.host_user_id = auth.uid() or h.auth_user_id = auth.uid())
    )
  );

create policy event_registration_owner_update on event_registration
  for update to authenticated
  using (
    exists (
      select 1 from event_draft e
      left join host h on h.host_id = e.host_id
      where e.draft_id = event_registration.event_id
        and (e.host_user_id = auth.uid() or h.auth_user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from event_draft e
      left join host h on h.host_id = e.host_id
      where e.draft_id = event_registration.event_id
        and (e.host_user_id = auth.uid() or h.auth_user_id = auth.uid())
    )
  );
