# OurRealTrip (아워리얼트립)

> **당신의 콘텐츠가 여행이 됩니다.**
> 취향과 스토리가 더해진 여행/액티비티를 "이벤트"로 만들고, 실제 상품을 연결하는 호스트 중심 플랫폼.

OurRealTrip은 "여행 추천 서비스"가 아닙니다. **Luma처럼 이벤트를 만들고**, 그 이벤트에 **마이리얼트립의 실제 티켓·체험·액티비티 상품을 연결**하는 것이 핵심입니다. 호스트는 GGUI 기반 AI 에이전트와 대화하며 이벤트 초안을 만들고, 검토 후 페이지에 반영합니다.

---

## ✨ 핵심 컨셉 — "A방식"

| 우리는 | 우리는 아님 |
|--------|-------------|
| 스토리가 있는 이벤트를 만든다 | 여행 상품을 직접 판매하지 않는다 (merchant 아님) |
| 마이리얼트립 상품을 **표시·연결**한다 | 결제·정산·예약확정을 대행하지 않는다 |
| RSVP·관심 신호를 모은다 | "N명 예약"이 아니라 "N명 참여의향" |
| 호스트 승인 후 상품 링크를 연다 | 처음부터 결제를 강요하지 않는다 |

예약·결제는 항상 **각 판매처(마이리얼트립 등)에서 개별 진행**됩니다.

---

## 🔗 라이브 데모

- **공개 URL**: https://ourrealtrip-vercel-current.vercel.app
- 둘러보기(Discover), 카테고리, 트립 상세, 로그인까지 **공개 웹에서 바로** 동작합니다.
- **AI 호스트 작업대**(`/host/create`)의 라이브 에이전트는 GGUI 에이전트 백엔드가 떠 있어야 동작합니다 (아래 [GGUI 에이전트](#-ggui-에이전트-호스트-작업대) 참고).

---

## 🧩 주요 기능 / 라우트

| 라우트 | 설명 |
|--------|------|
| `/` · `/discover` | Discover 홈 — 카테고리, 인기 트립, 커뮤니티, "작동 방식" |
| `/host/create` | **GGUI AI 에이전트 작업대** — 프롬프트로 이벤트 초안 생성 → 검토 → 폼 반영 |
| `/host/preview/[draftId]` | 발행 전 미리보기 |
| `/e/[slug]` | 이벤트(제안) 상세 + RSVP |
| `/trips/[slug]` | 트립 상세 (SSG) |
| `/c/[category]` | 카테고리별 둘러보기 |
| `/login` · `/auth/callback` | Supabase Google OAuth 로그인 |
| `/api/rsvp` · `/api/booking-progress` | RSVP / 진행 신호 API |
| `/api/agent` | GGUI 백엔드 미가용 시 LLM 직접 호출 폴백(web fallback) |

로그인은 **강제되지 않습니다.** 메인은 공개이고, 이벤트 등록(`/host/create`)·이벤트 신청 같은 행위에서만 로그인을 요구합니다 (인증은 서버 컴포넌트 `requireHostAuthContext`가 담당).

---

## 🏗 아키텍처

```
┌──────────────────────────────────────────────┐
│  Next.js 15 App Router (Vercel)               │
│  - Discover / Trips / Category (SSR·SSG)      │
│  - /host/create → <HostCreateAgentPanel>      │
│      @ggui-ai/react <AppRenderer> + 채팅       │
│  - Supabase SSR 인증 (Google OAuth)            │
└───────────────┬──────────────────────────────┘
                │ NEXT_PUBLIC_AGENT_ENDPOINT
                ▼
┌──────────────────────────────────────────────┐
│  GGUI 에이전트 백엔드 (ggui/servers)            │
│  - agent (6790)  : LLM 루프 + MCP 호스트        │
│  - ggui  (6781)  : UI 생성 MCP (ggui_render)   │
│  - mcps  (6782+) : 도메인 툴 (host_create 등)   │
│  - myrealtrip MCP: 실제 상품 검색(searchTnas)   │
└──────────────────────────────────────────────┘
```

- **프론트엔드**는 Vercel에 배포됩니다 (Next.js framework preset 필수 — 아래 [배포](#-배포) 참고).
- **GGUI 에이전트 백엔드**는 `ggui/` 모노레포의 로컬 서버 묶음입니다. 프론트엔드는 `NEXT_PUBLIC_AGENT_ENDPOINT`로 이 백엔드에 연결합니다.

---

## 🛠 기술 스택

- **프레임워크**: Next.js 15 (App Router) · React 19 · TypeScript
- **스타일**: Tailwind CSS (CSS 변수 기반 디자인 토큰, 라이트/다크) — Airbnb 톤 + Rausch(`#ff385c`) 단일 액센트
- **인증**: Supabase SSR (`@supabase/ssr`, Google OAuth)
- **AI 에이전트 UI**: GGUI (`@ggui-ai/react`) — 에이전트가 MCP `ggui_render`로 그린 UI를 샌드박스 iframe에 렌더
- **상품 연결**: MyRealTrip MCP (`mcp-servers.myrealtrip.com`)
- **배포**: Vercel

---

## 🤖 GGUI 에이전트 (호스트 작업대)

`/host/create`의 작업대는 호스트가 자연어로 "이런 이벤트 만들고 싶어"라고 말하면, 에이전트가 **제목·소개·일정·연결 상품·안전 문구**가 담긴 구조화 초안(`HostCreateAgentPayload`)을 만들어 제안합니다. 호스트가 **"페이지에 반영"**을 누르면 왼쪽 폼이 채워집니다 (사람 승인 게이트).

### 로컬에서 전체 GGUI 스택 실행

```bash
cd ggui
cp .env.local.example .env.local   # 필요한 키 채우기 (아래)
pnpm install
pnpm dev                            # ggui(6781) · mcps(6782+) · agent(6790) · web(6890)
```

`ggui/.env.local`에 필요한 값:

```ini
# LLM 인증 — 둘 중 하나
ANTHROPIC_API_KEY=...               # 또는
CLAUDE_CODE_OAUTH_TOKEN=...          # Claude 구독 OAuth 토큰

MODEL=claude-haiku-4-5              # 에이전트 모델
GGUI_MCP_URL=http://localhost:6781/mcp
GGUI_HOST_CREATE_MCP_URL=http://localhost:6783/mcp
GGUI_MYREALTRIP_MCP_URL=https://mcp-servers.myrealtrip.com/mcp
```

> 백엔드가 꺼져 있으면 작업대는 자동으로 **폴백 모드**(`/api/agent`)로 떨어지거나 오프라인 안내를 보여줍니다 — 데모/로컬 흐름이 깨지지 않습니다.

### 공개 웹에서 라이브 에이전트 노출

GGUI 백엔드는 로컬 서버이므로, 공개 배포 프론트엔드가 연결하려면 백엔드를 공개 HTTPS로 노출해야 합니다.

- **빠른 방법(데모)**: `cloudflared tunnel --url http://localhost:6790` → 나온 URL을 Vercel 환경변수 `NEXT_PUBLIC_AGENT_ENDPOINT`에 넣고 재배포. (브라우저↔에이전트는 CORS `*` 허용)
- **영구 방법**: `pnpm deploy:railway` (Railway 멀티서비스 배포 — `RAILWAY_API_TOKEN` 필요).

> ⚠️ 터널 방식은 로컬 서버 + 터널이 켜져 있는 동안만 동작합니다. 또한 `ggui_render` 샌드박스 UI(별도 포트)는 단일 포트 터널에서는 렌더되지 않을 수 있습니다 — 채팅·제안 생성은 정상 동작합니다.

---

## 💻 프론트엔드 로컬 개발

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

`.env.local`:

```ini
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_AGENT_ENDPOINT=http://localhost:6790   # GGUI 에이전트
```

> Supabase 환경변수가 없어도 메인/둘러보기 등 데모 흐름은 동작합니다 (인증만 비활성).

---

## 🚀 배포

Vercel에 배포합니다.

- **Framework Preset은 반드시 `Next.js`** 여야 합니다. 프리셋이 없으면 Vercel이 `.next`를 서버리스 함수로 변환하지 않아 **모든 라우트가 404**가 됩니다.
- 빌드 명령: `npm run build` (`next build && node scripts/patch-dirname.mjs`).
- `scripts/patch-dirname.mjs`: Vercel 서버리스(ESM) 런타임에서 `ua-parser-js` 등 ncc 사전번들 청크가 일으키는 `__dirname is not defined` 500을 빌드 직후 패치로 해결합니다.

환경변수(Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AGENT_ENDPOINT`.

---

## 📁 프로젝트 구조

```
app/                  Next.js App Router (페이지·API 라우트)
  discover/           Discover 홈 (= "/")
  host/create/        GGUI 에이전트 작업대
  api/                rsvp · booking-progress · agent(폴백)
components/
  host/               HostCreateAgentPanel, CreateEventForm …
  discover/           CategoryRail, TripCard, PilotCarousel …
  proposal/           이벤트 상세·RSVP·여정 UI
lib/
  auth/               Supabase 호스트 인증 컨텍스트
  supabase/           SSR client/server/middleware
  host-create/        에이전트 payload 스키마·안전 점검
  data/ · seed/       Discover 시드 데이터
ggui/                 GGUI 에이전트 모노레포 (servers/agent · ggui · mcps)
scripts/patch-dirname.mjs   배포 런타임 패치
```

---

## 🔒 안전 원칙

- 결제·정산·예약확정·묶음결제 UI/문구 없음 (merchant 아님).
- 상품은 표시·외부 링크 연결만. 예약은 판매처에서 개별 진행.
- 에이전트는 "소개팅"처럼만 읽힐 표현을 활동·경험 중심으로 다듬고, 다듬은 내용을 안전 노트로 남깁니다.
- 민감 정보(API 키·토큰)는 `.env.local`에만 두며 절대 커밋하지 않습니다.

---

_Hackathon project · OurRealTrip · Built with GGUI × MyRealTrip._
