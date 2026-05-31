---
title: OurRealTrip Host-Create MCP — 가입자 에이전트 위임 설계
date: 2026-05-31
status: design (구글 로그인 구현 완료 이후 착수 예정)
author: Vivi (비비클로 brainstorming)
depends_on:
  - 구글 로그인 / 가입자 identity (선행 스텝, 미착수)
scope: 호스트(쓰기) 전용 — 게스트 읽기 MCP는 별도 스텝
---

# OurRealTrip Host-Create MCP — 가입자 에이전트 위임 설계

## 1. 한 줄 정의

가입자가 **자기 개인 에이전트**(예: 로컬 터미널의 헤르메스, Claude Code, claude.ai)를 통해
OurRealTrip의 **호스트-create 능력**(이벤트 초안 생성 → 발행)을 원격으로 위임 호출할 수 있게 한다.
인터페이스는 인증된 **원격 HTTP MCP 서버**다.

> 예시 시나리오: Vivi가 로컬 헤르메스에게 "이번 주말 제주 트레킹 모임 이벤트 만들어줘"라고 말하면,
> 헤르메스가 OurRealTrip MCP 툴을 호출해 초안을 만들고, Vivi에게 확인을 받은 뒤(헤르메스 쪽 UX)
> `publish`까지 수행해 실제 이벤트 페이지가 Vivi 계정으로 생성된다.

## 2. 설계 결정 (확정)

| # | 결정 | 근거 |
|---|------|------|
| D1 | 인터페이스 = **구조화된 MCP 툴** (대화형 릴레이 아님) | 헤르메스가 운전석, 결정론적·재현 가능한 자동화 |
| D2 | 대상 = **가입자의 개인 에이전트**가 호스트-create 능력을 위임 호출 | 핵심 가치: 우리 도메인 지능을 외부 에이전트가 재사용 |
| D3 | 인증 = **구글 로그인 완료 후** 웹에서 발급하는 개인 토큰(PAT) | 이 스펙은 구글 로그인 *다음* 스텝 |
| D4 | 기반 = 기존 `ggui/servers/mcps/host-create`(6783) 스캐폴드 확장 | 백지 아님. echo-only → 인증+영속으로 승급 |
| D5 | 전송 = **원격 Streamable HTTP + Bearer 토큰** | 에이전트 접근성 최상(`claude mcp add --transport http` 한 줄), claude.ai 커넥터까지 커버, 마이리얼트립 MCP 선례 정합. 스캐폴드가 이미 Streamable HTTP |
| D6 | 범위 = 이번 스텝은 **호스트(쓰기) 전용** | 게스트 공개 이벤트 검색/조회 MCP는 별도 스텝 |
| D7 | 생애주기 = 에이전트가 **draft 생성 → 발행(publish)까지 전부** 수행 | "사람 승인"은 클라이언트 에이전트(헤르메스)가 자기 사용자에게 받음. **publish 스코프 토큰 보유 = 위임된 승인** |
| ★ | **공유 도메인 서비스 레이어**가 핵심 작업량 | 웹 GGUI 경로와 MCP 경로가 같은 로직을 쓰도록 단일 진실 원천 |

## 3. 현재 상태 (검증됨)

`ggui/servers/mcps/host-create` 실측 결과:

- **echo-only 데모 서버**다. tools: `host_create_apply`(검증+반향), `host_recommend_products`(표시용 상품제안), `host_safety_check`(위험 문구 린트). **DB에 쓰지 않음, stateless, 무인증.**
- 전송: `StreamableHTTPServerTransport`, `POST /mcp`, 기본 포트 6783.
- 공유 계약 존재: 페이로드는 Next 앱의 `lib/host-create/agentPayload.ts`의 `HostCreateAgentPayload`를 미러링. → **공유 레이어의 절반은 이미 있음.**
- 안전 불변식(유지): *"aworrealtrip is NOT a merchant"* — `product_links`는 표시 전용, 예약·결제는 외부 셀러. 이 불변식은 **그대로 유효**하다. 이번 스텝이 바꾸는 건 "이벤트 발행" 권한뿐.

> ⚠️ 미검증 / 착수 전 확인 필요:
> - `lib/host-create/`의 실제 구성(커버추출·타임존추론·마크다운 렌더 로직이 어디에 있는지)
> - Supabase `events`(또는 해당) 테이블 스키마 + 현재 웹의 발행(publish) 경로
> - 구글 로그인 스텝이 남길 가입자 토큰/세션 인프라 (PAT 발급이 그 위에 얹힘)

## 4. 이번 스텝의 실제 작업 (echo-only → 운영 MCP)

1. **인증 추가** — `POST /mcp` 앞단에 Bearer 토큰 미들웨어. 토큰 → `user_id` + scope 해석.
2. **영속 추가** — `host_create_apply`가 반향에 그치지 않고, 검증된 페이로드를 **가입자 계정 소유의 draft**로 Supabase에 저장.
3. **발행 툴 추가** — `host_publish_event`(publish 스코프 필요).
4. **공유 서비스 레이어 추출** — 커버추출·마크다운·타임존(37)·단일/여러날 추론 로직을 `lib/host-create/`로 모아 웹 GGUI route와 MCP 핸들러가 **동일 함수**를 import.
5. **감사 로그** — 토큰별 발행/수정 이력 기록 (D7의 책임 추적성).

## 5. 인증 / identity

- 구글 로그인된 가입자가 웹 `설정 > API 토큰`에서 **PAT 발급**.
- 스코프 분리: `read` / `write`(draft 생성·수정) / `publish`(발행). publish는 명시적 별도 스코프.
- 헤르메스/클라이언트: `Authorization: Bearer <PAT>` 헤더. 서버가 토큰 → user_id + scope 해석.
- 토큰은 user_id에 귀속 → 생성되는 이벤트는 그 가입자 소유. 토큰별 rate limit.
- (미래 업글) OAuth device flow — 계약 호환 유지하도록 토큰 해석 레이어를 인터페이스로 분리.

## 6. 툴 표면 (host-create, 구조화)

| 툴 | 역할 | 필요 스코프 | 부작용 |
|----|------|-----------|--------|
| `host_create_draft` | 제목·설명 등 받아 draft 생성. 내부서 커버추출·타임존추론·렌더 적용 후 **persist** | write | 초안 저장 |
| `host_update_draft` | draft 필드 수정 | write | 수정 |
| `host_get_draft` / `host_list_my_events` | 내 이벤트 조회 | read | 없음 |
| `host_preview_event` | 렌더된 미리보기 URL 반환 (헤르메스가 사용자에게 보여줌) | read | 없음 |
| `host_publish_event` | 공개/비공개 발행 | **publish** | **발행(외부 노출)** |
| `host_recommend_products` | 표시 전용 상품 제안 (기존 유지) | read | 없음 |
| `host_safety_check` | 위험 문구 린트 (기존 유지) | read | 없음 |

설계 원칙: 기존 GGUI 대화형 에이전트의 "되묻기 지능"이 구조화 툴에선 사라지므로,
모호 입력은 **명시적 검증 + 구조화 에러 응답**으로 옮긴다(헤르메스가 에러 읽고 재시도).

## 7. 아키텍처 / 데이터 흐름

```
헤르메스/Claude Code/claude.ai
   │  (Authorization: Bearer PAT)
   ▼
[host-create MCP : Streamable HTTP /mcp]
   │  ① 토큰 → user_id + scope
   │  ② 스코프 게이트 (write / publish)
   ▼
[공유 도메인 서비스  lib/host-create/*]   ◀── 웹 GGUI route 도 동일 import
   │  커버추출 · 마크다운 렌더 · 타임존37 · 단일/여러날 추론 · 검증
   ▼
[Supabase]  events (user_id 소유 격리) + audit_log
```

핵심: **웹 경로와 MCP 경로가 `lib/host-create/`의 동일 함수를 공유**한다.
안 그러면 웹과 MCP의 동작이 갈라지는 drift 발생(= 이 스텝의 진짜 리스크).

## 8. 안전 / 책임

- `NOT a merchant` 불변식 **유지** — 예약·결제는 외부 셀러. MCP는 이벤트 페이지만 다룸.
- "human-approved" 불변식은 **이동**: 웹 클릭 → 클라이언트 에이전트(헤르메스)가 자기 사용자에게 승인. 서버는 **publish 스코프 토큰 = 위임 증명**으로 강제.
- 감사 로그 필수: 어떤 토큰이 언제 무엇을 발행/수정했는지. 사후 책임·토큰 회수의 근거.
- user_id 소유권 격리 — 토큰은 자기 이벤트만 조작 가능.
- 토큰 회전·회수 경로 (보안 룰: 자격증명 회전 4축 점검 준용).

## 9. 범위 밖 (Out of scope, 이번 스텝)

- 게스트(읽기) 공개 이벤트 검색/조회 MCP → 별도 스텝
- OAuth device flow (PAT로 시작, 계약만 호환)
- publish 자동화의 고급 정책(예약 발행, 승인 워크플로) — 단순 publish만
- git 저장소화 (현재 `/Users/vivi/ourrealtrip`는 git repo 아님 — 별도 결정)

## 10. 열린 질문 (착수 전 해소)

1. **선행 의존**: 구글 로그인 스텝이 남기는 토큰/세션 인프라 형태 — PAT 발급이 그 위에 어떻게 얹히는가?
2. **Supabase 스키마**: `events` 테이블의 실제 컬럼 + 현재 웹 발행 경로 (공유 레이어가 그걸 감싸야 함)
3. **`lib/host-create/` 현황**: 커버추출·타임존추론 로직이 이미 함수로 분리돼 있는가, 아니면 GGUI route 안에 인라인인가? (후자면 추출이 작업의 절반)
4. **rate limit / 남용 방지** 정책 수치
5. **감사 로그** 저장 위치·보존 기간

## 11. 관련 UI 버그 — `/host/create` 무한 세로 증가 (별개 작업)

> ⚠️ 이 항목은 MCP 위임 설계와 **독립**이다. 같은 host-create 영역이라 추적용으로 함께 기록하되,
> 구글 로그인·MCP 스텝과 무관하게 **지금 당장 고칠 수 있는 별도 작업**이다.

**증상**: `http://localhost:3000/host/create` 에서 GGUI 에이전트와 대화를 나누면
대화 영역에 스크롤이 없어 컨텐츠가 쌓일수록 **페이지가 아래로 무한히 길어진다**.
**연결 상품(product_links) 배치 영역**도 동일하게 늘어남.

**원인 가설**: 대화/연결상품 패널에 높이 경계(`max-height` + `overflow`)가 없어
컨텐츠 높이만큼 부모가 늘어나 페이지 전체가 밀림.

**처방**:
- 대화 영역과 연결상품 영역을 **스크롤 컨테이너화** — "발행 옵션이 끝나는 높이" 즈음에서
  컨텐츠를 끊고(`max-height` 고정 또는 뷰포트 기준 높이), 내부 `overflow-y-auto`로 스크롤.
- flex 레이아웃이면 스크롤 자식에 `min-h-0` 필요 (flex 자식 기본 `min-height:auto`가 축소를 막는 함정).
- 페이지 자체가 늘어나는 게 아니라 **각 패널 내부에서만 스크롤**되도록.

**착수 전 확인**: `/host/create` 페이지 컴포넌트 경로(`app/host/create/...`)와
대화·연결상품 패널의 현재 높이/overflow CSS.
