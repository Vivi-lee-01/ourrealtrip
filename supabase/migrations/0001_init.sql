-- =============================================================================
-- OurRealTrip / 아워리얼트립 — 초기 스키마 (0001_init.sql)
-- PRD v1.0 9절 "핵심 데이터 엔티티" 1:1 매핑
-- 커뮤니티 여행 제안 → 수요 검증 → 상품 조합 → 예약 전환 워크스페이스
-- 확정 결정: host/admin = Supabase Auth / 참여자 = 익명 세션(participant_session_id)
-- =============================================================================

-- UUID 생성 함수 등 확장 (Supabase 기본 제공이나 명시적으로 보장)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUM 타입 정의 (PRD enum 필드)
-- -----------------------------------------------------------------------------

-- Community / Proposal 노출 범위
create type visibility_type as enum ('public', 'unlisted');

-- Proposal 상태 모델 (PRD 8절)
create type proposal_status as enum (
  'draft',           -- 초안 작성 중
  'interest_check',  -- 커뮤니티 공유 후 관심/날짜/예산 반응 수집 중
  'option_refining', -- 참여 신호 기반 여행 option set 조정 중
  'booking_open',    -- 실제 상품 링크 확인 가능
  'closed',          -- 모집 종료
  'cancelled',       -- 취소
  'archived'         -- 과거 제안 보관
);

-- 관계 깊이 (TripProposal / TravelOption 공용)
create type relationship_depth_type as enum ('low', 'mid', 'high');

-- 일정 난이도 (TravelOption)
create type schedule_difficulty_type as enum ('low', 'mid', 'high');

-- TravelOption 유형
create type travel_option_type as enum ('basic', 'premium', 'budget', 'experimental');

-- 상품 유형 (ProductLink / ClickEvent 공용) — 항공/숙소/투어·티켓·액티비티
create type product_type as enum ('flight', 'stay', 'tna');

-- ProductLink 링크 상태
create type product_link_status as enum ('active', 'inactive', 'expired', 'draft');

-- InterestSignal 반응 유형
create type interest_response_type as enum (
  'interested',     -- 관심 있어요
  'date_dependent', -- 날짜 맞으면 갈래요
  'price_dependent',-- 가격 맞으면 갈래요
  'voted_option',   -- 옵션 투표
  'question',       -- 질문
  'not_interested'  -- 관심 없음
);

-- InterestSignal 거절·망설임 유형
create type objection_type as enum ('date', 'budget', 'destination', 'companions', 'other');

-- -----------------------------------------------------------------------------
-- 공용: updated_at 자동 갱신 트리거 함수
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9-1. Host — 여행 제안을 만드는 모임장/커뮤니티 운영자
-- -----------------------------------------------------------------------------
create table host (
  host_id           uuid primary key default gen_random_uuid(),
  -- Supabase Auth 사용자와 연결 (확정 결정 1). 1:1 매핑이지만 seed 편의상 nullable 허용
  auth_user_id      uuid unique references auth.users(id) on delete set null,
  name              text not null,           -- host 표시명
  profile_image_url text,                    -- 프로필 이미지
  community_name    text not null,           -- 커뮤니티명
  bio               text,                    -- 소개
  trust_note        text,                    -- 신뢰 근거(과거 활동/제안 톤)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table host is '여행 제안을 만드는 모임장/커뮤니티 운영자 (Supabase Auth 연결)';

create trigger trg_host_updated_at
  before update on host
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 9-2. Community — host가 운영하는 취향 기반 커뮤니티
-- -----------------------------------------------------------------------------
create table community (
  community_id uuid primary key default gen_random_uuid(),
  host_id      uuid references host(host_id) on delete set null, -- 운영 host (편의 FK)
  name         text not null,                  -- 커뮤니티명
  description  text,                           -- 설명
  category     text,                           -- 카테고리(사진/러닝/와인 등)
  visibility   visibility_type not null default 'unlisted', -- 노출 범위 (Phase 1 unlisted 중심)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table community is 'host가 운영하는 취향 기반 커뮤니티 (사진/러닝/와인 등)';

create trigger trg_community_updated_at
  before update on community
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 9-3. TripProposal — 제품 중심: 커뮤니티 의도를 담은 여행 제안 페이지
-- -----------------------------------------------------------------------------
create table trip_proposal (
  proposal_id            uuid primary key default gen_random_uuid(),
  host_id                uuid not null references host(host_id) on delete cascade,      -- 작성 host
  community_id           uuid references community(community_id) on delete set null,    -- 대상 커뮤니티
  slug                   text not null unique,        -- URL slug (unlisted 접근 키)
  title                  text not null,               -- 제안 제목
  concept                text not null,               -- 한 줄 컨셉
  target_audience        text,                        -- 누구에게 맞고 누구에게 애매한지
  mood                   text,                        -- 제안 톤/분위기
  expected_dates         text,                        -- 예상 날짜
  expected_budget        text,                        -- 예상 가격대
  destination_candidates text[],                      -- 목적지 후보
  status                 proposal_status not null default 'draft', -- 8절 상태 모델
  visibility             visibility_type not null default 'unlisted', -- 노출 범위
  checked_at             timestamptz,                 -- 정보 확인 시점
  -- 인사이트 통합 필드 (모두 nullable, 사용자에게는 번역 카피로 노출)
  community_intent       text,                        -- 이번 여행의 목적
  intended_outcome       text,                        -- 이 여행으로 모임이 얻고 싶은 것
  post_trip_artifact     text,                        -- 이 여행이 끝나고 남아야 할 것
  relationship_depth     relationship_depth_type,     -- 이 여행이 지향하는 관계 깊이
  learning_or_creation_goal text,                     -- 이 여행에서 배우거나 만들고 싶은 것
  why_now                text,                        -- 왜 지금인가
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table trip_proposal is '제품 중심 엔티티: 커뮤니티 의도를 담은 여행 제안 페이지 (/trips/[slug])';

create trigger trg_trip_proposal_updated_at
  before update on trip_proposal
  for each row execute function set_updated_at();

-- slug는 컬럼 정의의 UNIQUE 제약이 이미 인덱스를 생성하므로 별도 index 생략 (중복 방지)
-- 상태/host/community별 dashboard 조회 인덱스
create index idx_trip_proposal_host on trip_proposal (host_id);
create index idx_trip_proposal_community on trip_proposal (community_id);
create index idx_trip_proposal_status on trip_proposal (status);

-- -----------------------------------------------------------------------------
-- 9-4. TravelOption — 상품 나열이 아닌 A/B/C 여행 운영안
-- -----------------------------------------------------------------------------
create table travel_option (
  option_id            uuid primary key default gen_random_uuid(),
  proposal_id          uuid not null references trip_proposal(proposal_id) on delete cascade, -- 소속 제안
  option_name          text not null,                 -- 옵션명(A/B/C 등)
  option_type          travel_option_type not null default 'basic', -- 옵션 유형
  description          text,                          -- 옵션 설명
  estimated_budget     text,                          -- 예상 가격대
  fit_reason           text,                          -- 적합 근거
  risk_note            text,                          -- 동선/취소/변경 리스크
  sort_order           int not null default 0,        -- 정렬 순서
  -- 인사이트 통합 필드 (커뮤니티 의도 차원)
  community_intent_fit text,                          -- 이 안이 커뮤니티 목적에 얼마나 맞는지
  relationship_depth   relationship_depth_type,       -- 이 안이 만드는 관계 깊이
  learning_or_creation_potential text,                -- 이 안의 배움/창작 잠재력
  post_trip_artifact   text,                          -- 이 안에서 남을 산출물
  schedule_difficulty  schedule_difficulty_type,      -- 일정 난이도
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table travel_option is '상품 나열이 아닌 A/B/C 여행 운영안 (가격/일정 + 커뮤니티 의도 차원)';

create trigger trg_travel_option_updated_at
  before update on travel_option
  for each row execute function set_updated_at();

create index idx_travel_option_proposal on travel_option (proposal_id);

-- -----------------------------------------------------------------------------
-- 9-5. ProductLink — booking_open 이후 항공/숙소/TNA 독립 상품 링크
-- -----------------------------------------------------------------------------
create table product_link (
  product_link_id      uuid primary key default gen_random_uuid(),
  option_id            uuid not null references travel_option(option_id) on delete cascade, -- 소속 옵션
  product_type         product_type not null,         -- 상품 유형 (항공/숙소/투어·티켓·액티비티)
  source               text not null,                 -- 판매처
  myrealtrip_product_id text,                          -- API 연동 전 null (확정 결정 3)
  title                text not null,                 -- 상품 표시명
  price_hint           text,                          -- 가격 힌트
  reason               text,                          -- 추천 사유
  caution              text,                          -- 주의사항
  source_url           text not null,                 -- manual 입력 URL (확정 결정 3)
  mylink_url           text,                          -- 마이링크/제휴 링크
  checked_at           timestamptz,                   -- 가격/예약가능 확인 시점
  status               product_link_status not null default 'active', -- 링크 상태
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table product_link is 'booking_open 이후 항공/숙소/TNA 독립 상품 링크 (manual URL + nullable myrealtrip_product_id)';

create trigger trg_product_link_updated_at
  before update on product_link
  for each row execute function set_updated_at();

create index idx_product_link_option on product_link (option_id);
create index idx_product_link_type on product_link (product_type);

-- -----------------------------------------------------------------------------
-- 9-6. InterestSignal — 익명 세션 기반 관심/투표/질문 신호
-- -----------------------------------------------------------------------------
create table interest_signal (
  signal_id              uuid primary key default gen_random_uuid(),
  proposal_id            uuid not null references trip_proposal(proposal_id) on delete cascade, -- 대상 제안
  option_id              uuid references travel_option(option_id) on delete set null,           -- 대상 옵션(옵션 투표 시)
  participant_session_id text not null,                -- 익명 세션 식별자 (확정 결정 1·4, 이름/이메일 미수집)
  response_type          interest_response_type not null, -- 반응 유형
  preferred_dates        text,                         -- 선호 날짜
  preferred_budget       text,                         -- 선호 예산
  comment                text,                         -- 선택 코멘트 (이름/이메일 미수집)
  -- 인사이트 통합 필드
  response_reason        text,                         -- 왜 그렇게 반응했는지 (참여/거절 사유)
  intent_resonance       text,                         -- 어떤 의도/목적에 공감했는지 (의도 태그 집계 입력)
  objection_type         objection_type,               -- 거절·망설임의 유형
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table interest_signal is '익명 세션 기반 관심/투표/질문 신호 (이름/이메일 미수집, participant_session_id)';

create trigger trg_interest_signal_updated_at
  before update on interest_signal
  for each row execute function set_updated_at();

create index idx_interest_signal_proposal on interest_signal (proposal_id);
create index idx_interest_signal_option on interest_signal (option_id);
create index idx_interest_signal_session on interest_signal (participant_session_id);

-- -----------------------------------------------------------------------------
-- 9-7. ClickEvent — /go/[product_link_id] redirect 기반 클릭 추적
-- -----------------------------------------------------------------------------
create table click_event (
  event_id        uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references trip_proposal(proposal_id) on delete cascade, -- 대상 제안
  option_id       uuid references travel_option(option_id) on delete set null,           -- 대상 옵션
  product_link_id uuid not null references product_link(product_link_id) on delete cascade, -- 클릭된 링크
  product_type    product_type not null,         -- 상품 유형
  clicked_at      timestamptz not null default now(), -- 클릭 시각
  referrer        text,                          -- 유입 경로
  device_type     text,                          -- 기기 유형
  browser         text,                          -- 브라우저
  -- utm_* 필드 묶음
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  redirect_url    text not null,                 -- redirect 대상
  created_at      timestamptz not null default now()
);
comment on table click_event is '/go/[product_link_id] redirect 기반 상품 클릭 추적 이벤트';
-- ClickEvent는 append-only 로그라 updated_at 트리거 없음 (created_at == clicked_at 흐름)

create index idx_click_event_proposal on click_event (proposal_id);
create index idx_click_event_product_link on click_event (product_link_id);
create index idx_click_event_option on click_event (option_id);
create index idx_click_event_clicked_at on click_event (clicked_at);

-- -----------------------------------------------------------------------------
-- 9-8. PerformanceSnapshot — host dashboard용 성과 집계 스냅샷
-- -----------------------------------------------------------------------------
create table performance_snapshot (
  snapshot_id            uuid primary key default gen_random_uuid(),
  proposal_id            uuid not null references trip_proposal(proposal_id) on delete cascade, -- 대상 제안
  option_id              uuid references travel_option(option_id) on delete set null,           -- 대상 옵션
  views                  int not null default 0,        -- 조회 수
  interested_count       int not null default 0,        -- 관심 수
  vote_count             int not null default 0,        -- 투표 수
  booking_clicks         int not null default 0,        -- 예약 클릭 수
  product_clicks_by_type jsonb not null default '{}'::jsonb, -- flight/stay/tna별 클릭
  top_option_id          uuid references travel_option(option_id) on delete set null, -- 최다 반응 옵션
  conversion_notes       text,                          -- 전환 메모
  -- 인사이트 통합 필드: InterestSignal.intent_resonance 롤업 (host dashboard 의도 태그용)
  intent_resonance_tags  jsonb,                         -- 어떤 의도/목적에 반응이 집중됐는지 집계
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table performance_snapshot is 'host dashboard용 성과 집계 스냅샷 (의도 반응 태그 롤업 포함)';

create trigger trg_performance_snapshot_updated_at
  before update on performance_snapshot
  for each row execute function set_updated_at();

create index idx_performance_snapshot_proposal on performance_snapshot (proposal_id);
create index idx_performance_snapshot_option on performance_snapshot (option_id);

-- =============================================================================
-- RLS (Row Level Security) 정책
-- -----------------------------------------------------------------------------
-- 정책 요약 (확정 결정 1·4·5):
--  - host/admin (Supabase Auth, authenticated 롤): 자신의 데이터 write
--  - 공개(unlisted/public) proposal 및 하위 데이터: anon SELECT 허용
--  - interest_signal / click_event: anon INSERT 허용 (익명 참여자 신호 수집)
--  - 참여자는 이름/이메일 없이 participant_session_id(텍스트) 기반 (결정 4)
--
-- 주의: 본 MVP RLS는 Phase 1 unlisted 모델 기준이다.
--   slug를 아는 사람만 URL로 접근하므로, SELECT는 visibility 기반으로 폭넓게 허용한다.
--   행 단위 세밀한 host 소유권 검사는 host.auth_user_id = auth.uid() 로 묶는다.
-- =============================================================================

alter table host                 enable row level security;
alter table community            enable row level security;
alter table trip_proposal        enable row level security;
alter table travel_option        enable row level security;
alter table product_link         enable row level security;
alter table interest_signal      enable row level security;
alter table click_event          enable row level security;
alter table performance_snapshot enable row level security;

-- ------------------------- host -------------------------
-- 본인 host 행만 select/insert/update/delete (Supabase Auth)
create policy host_owner_all on host
  for all
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- ------------------------- community -------------------------
-- 공개 커뮤니티는 anon도 조회 가능
create policy community_public_select on community
  for select
  to anon, authenticated
  using (visibility in ('public', 'unlisted'));

-- 소유 host만 write (community.host_id → host.auth_user_id = auth.uid())
create policy community_owner_write on community
  for all
  to authenticated
  using (
    exists (
      select 1 from host h
      where h.host_id = community.host_id and h.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from host h
      where h.host_id = community.host_id and h.auth_user_id = auth.uid()
    )
  );

-- ------------------------- trip_proposal -------------------------
-- 공개(unlisted/public) proposal은 anon SELECT 허용 (slug URL 접근)
create policy trip_proposal_public_select on trip_proposal
  for select
  to anon, authenticated
  using (visibility in ('public', 'unlisted'));

-- 소유 host만 write
create policy trip_proposal_owner_write on trip_proposal
  for all
  to authenticated
  using (
    exists (
      select 1 from host h
      where h.host_id = trip_proposal.host_id and h.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from host h
      where h.host_id = trip_proposal.host_id and h.auth_user_id = auth.uid()
    )
  );

-- ------------------------- travel_option -------------------------
-- 공개 proposal에 속한 옵션은 anon SELECT 허용
create policy travel_option_public_select on travel_option
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from trip_proposal p
      where p.proposal_id = travel_option.proposal_id
        and p.visibility in ('public', 'unlisted')
    )
  );

-- 소유 host만 write (proposal → host)
create policy travel_option_owner_write on travel_option
  for all
  to authenticated
  using (
    exists (
      select 1 from trip_proposal p
      join host h on h.host_id = p.host_id
      where p.proposal_id = travel_option.proposal_id and h.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from trip_proposal p
      join host h on h.host_id = p.host_id
      where p.proposal_id = travel_option.proposal_id and h.auth_user_id = auth.uid()
    )
  );

-- ------------------------- product_link -------------------------
-- 공개 proposal의 booking 링크는 anon SELECT 허용 (option → proposal)
create policy product_link_public_select on product_link
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from travel_option o
      join trip_proposal p on p.proposal_id = o.proposal_id
      where o.option_id = product_link.option_id
        and p.visibility in ('public', 'unlisted')
    )
  );

-- 소유 host만 write
create policy product_link_owner_write on product_link
  for all
  to authenticated
  using (
    exists (
      select 1 from travel_option o
      join trip_proposal p on p.proposal_id = o.proposal_id
      join host h on h.host_id = p.host_id
      where o.option_id = product_link.option_id and h.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from travel_option o
      join trip_proposal p on p.proposal_id = o.proposal_id
      join host h on h.host_id = p.host_id
      where o.option_id = product_link.option_id and h.auth_user_id = auth.uid()
    )
  );

-- ------------------------- interest_signal -------------------------
-- 익명 참여자도 공개 proposal에 신호 INSERT 허용 (이름/이메일 없이 session id 기반)
create policy interest_signal_anon_insert on interest_signal
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from trip_proposal p
      where p.proposal_id = interest_signal.proposal_id
        and p.visibility in ('public', 'unlisted')
    )
  );

-- 소유 host만 SELECT (집계/dashboard용). 참여자 본인은 익명이라 재조회 불가 (의도된 설계)
create policy interest_signal_owner_select on interest_signal
  for select
  to authenticated
  using (
    exists (
      select 1 from trip_proposal p
      join host h on h.host_id = p.host_id
      where p.proposal_id = interest_signal.proposal_id and h.auth_user_id = auth.uid()
    )
  );

-- ------------------------- click_event -------------------------
-- 익명 참여자도 클릭 이벤트 INSERT 허용 (/go redirect 추적)
create policy click_event_anon_insert on click_event
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from trip_proposal p
      where p.proposal_id = click_event.proposal_id
        and p.visibility in ('public', 'unlisted')
    )
  );

-- 소유 host만 SELECT (성과 집계용)
create policy click_event_owner_select on click_event
  for select
  to authenticated
  using (
    exists (
      select 1 from trip_proposal p
      join host h on h.host_id = p.host_id
      where p.proposal_id = click_event.proposal_id and h.auth_user_id = auth.uid()
    )
  );

-- ------------------------- performance_snapshot -------------------------
-- 소유 host만 모든 작업 (dashboard 전용, anon 접근 불가)
create policy performance_snapshot_owner_all on performance_snapshot
  for all
  to authenticated
  using (
    exists (
      select 1 from trip_proposal p
      join host h on h.host_id = p.host_id
      where p.proposal_id = performance_snapshot.proposal_id and h.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from trip_proposal p
      join host h on h.host_id = p.host_id
      where p.proposal_id = performance_snapshot.proposal_id and h.auth_user_id = auth.uid()
    )
  );

-- =============================================================================
-- END 0001_init.sql
-- =============================================================================
