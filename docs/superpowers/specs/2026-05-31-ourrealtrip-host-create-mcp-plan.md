---
title: OurRealTrip Host-Create MCP — 구현 계획 (단계별)
date: 2026-05-31
status: plan (전제 게이트 G0 충족 후 착수)
design_doc: ./2026-05-31-ourrealtrip-host-create-mcp-design.md
note: 이 기능은 구글 로그인(미구현)에 의존한다. 일부 단계는 선행 의존 해소 후에야 확정 가능 — 해당 부분은 〔확인 후 확정〕로 표기한다.
---

# 구현 계획 — Host-Create MCP (가입자 에이전트 위임)

설계 결정(D1~D7)·아키텍처는 design 문서 참조. 여기서는 **착수 순서**만 정의한다.

## 게이트 G0 — 전제 해소 (착수 전 필수)

이 게이트를 통과하지 못하면 이후 단계는 추측이 된다. 모두 **읽기/조사**라 부작용 없음.

- [ ] **G0-1** 구글 로그인 스텝이 남길 가입자 토큰/세션 인프라 형태 확정 (PAT가 그 위에 얹힘)
- [ ] **G0-2** Supabase `events`(및 관련) 테이블 스키마 + 현재 웹 발행(publish) 경로 확인
      → `app/host/create/actions.ts`(`createEventDraftAction`), `app/host/preview/[draftId]/actions.ts`, `supabase/` 마이그레이션
- [ ] **G0-3** `lib/host-create/` 도메인 로직 분리 현황 — 커버추출·타임존·마크다운·검증이
      이미 함수인지(`agentPayload.ts`·`safetyCheck.ts`·`markdown.ts`·`presets.ts` 확인됨), GGUI route 안 인라인인지

## Phase 1 — 공유 도메인 서비스 레이어 확정 (★ 핵심)

> 목표: 웹 폼 경로와 MCP 경로가 **같은 함수**를 쓰도록 단일 진실 원천 확립. drift 방지.

1. `lib/host-create/`에 흩어진 검증·정규화 로직을 "draft 생성 서비스"로 응집
   (`validateAgentPayload` + 커버보강 + 타임존/날짜 계산 + 안전점검을 단일 진입점으로)
2. **부작용 없는 순수 함수**로 유지 (persist는 호출측 책임) → 웹 server action 과 MCP 핸들러가 공통 import
3. 기존 웹 경로(`CreateEventForm.applyPayload` → `createEventDraftAction`)를 이 서비스 위로 리팩터 (동작 동일성 회귀 테스트)

검증: 웹 `/host/create` 기존 흐름이 그대로 동작 (회귀 0).

## Phase 2 — 인증 미들웨어 (PAT)

> 의존: G0-1

1. PAT 발급 UI — 웹 `설정 > API 토큰` (구글 로그인 identity 위에). 스코프 `read`/`write`/`publish`
2. 토큰 저장·해시·검증 (평문 저장 금지, 보안 룰 준수)
3. MCP `POST /mcp` 앞단 Bearer 미들웨어: 토큰 → `user_id` + scope 해석. 실패 시 401
4. 토큰별 rate limit + 발급/회수 경로

검증: 무토큰/잘못된 토큰 401, 유효 토큰 → user_id 해석. 〔수치: rate limit 정책 확인 후 확정〕

## Phase 3 — 영속 + 툴 표면 (write 스코프)

> 의존: Phase 1·2, G0-2

기존 `ggui/servers/mcps/host-create`(echo-only) 확장:

1. `host_create_draft` — Phase 1 서비스로 검증 후 **Supabase에 가입자 소유 draft 저장** (write 스코프)
2. `host_update_draft` / `host_get_draft` / `host_list_my_events`
3. `host_preview_event` — 미리보기 URL 반환
4. 기존 `host_recommend_products` / `host_safety_check` 유지 (read)
5. user_id 소유권 격리 (남의 draft 접근 차단)

검증: 헤르메스(또는 MCP Inspector)에서 draft 생성 → Supabase 행 확인 → 웹 미리보기 일치.

## Phase 4 — 발행 (publish 스코프) + 감사 로그

> 의존: Phase 3. D7: 승인 UX는 클라이언트 에이전트 책임, 서버는 publish 스코프로 강제

1. `host_publish_event` — publish 스코프 필수. 공개/비공개 발행
2. **감사 로그** — 토큰·user_id·액션·시각 기록 〔저장 위치·보존기간 확인 후 확정〕
3. `NOT a merchant` 불변식 회귀 점검 (예약·결제 표현 없음)

검증: publish 스코프 없는 토큰 → 발행 거부. 있는 토큰 → 실제 공개 + 감사 로그 1행.

## Phase 5 — 클라이언트 등록 문서화

1. `claude mcp add --transport http ourrealtrip <url> --header "Authorization: Bearer $TOKEN"` 가이드
2. 헤르메스/claude.ai 커넥터 등록 안내
3. 예시 시나리오(이벤트 생성→승인→발행) E2E 문서

검증: 실제 외부 에이전트에서 전 생애주기 1회 통과.

## 범위 밖 (이 계획)

- 게스트(읽기) MCP, OAuth device flow, 예약발행/승인워크플로 고급정책 — 별도 스텝
- `/host/create` 스크롤 버그(design §11)는 이 계획과 독립 — 이미 별도 처리

## 비고

- repo는 git 저장소 아님 → 단계별 커밋 대신 디스크 스냅샷. git init 여부는 별도 결정.
- 각 Phase는 검증 통과 후 다음으로. Phase 1 회귀가 가장 중요(공유 레이어가 웹을 깨면 안 됨).
