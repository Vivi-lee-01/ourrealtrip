# OurRealTrip / 아워리얼트립 — GGUI Host AI-create Cockpit

> 이 문서는 GGUI(생성형 UI) 기반 **호스트 AI-create cockpit**의 구현 스펙 SSOT다.
> 상위 충돌 시 `PRD.md` > `docs/ARCHITECTURE.md`(10절) > 본 문서 순으로 우선한다.
> 대상: 핸드오프 2026-05-30 결정 4(“GGUI는 AI-create cockpit으로 사용, 전체 앱 재구현 X”).

---

## 0. 한 줄 정의

호스트가 자연어로 “이런 모임 여행 만들고 싶어”라고 말하면, **컨텍스트에 반응하는 생성형 UI**가 동적으로 뜨고, 그 UI가 **MCP 도구**를 호출해 MyRealTrip 실상품으로 그라운딩된 proposal **초안**을 만든다. 발행은 사람 승인 게이트를 통과한 뒤 기존 Next.js 본체로 핸드오프한다.

---

## 1. GGUI가 무엇인가 (스폰서 트랙 사실관계)

GGUI = 해커톤 스폰서(Loqu, 운영 Hashed·MarketFitLab)의 **생성형 UI 에이전틱 앱 개발 트랙**. 빌더에게 오픈소스 레포 + MCP 클라우드 서버 + 샘플 코드를 제공한다.

- GitHub: https://github.com/ggui-ai/ggui
- 문서: https://docs.ggui.ai
- 부트스트랩(npm, alpha): `npx @ggui-ai/create-agentic-app@alpha`
- 방식: **BYOK** — 빌더가 LLM/외부 API 키를 직접 입력
- 에이전트 프레임워크: Google ADK / Claude Agent SDK / **OpenAI Agents SDK** 중 택일 → 본 프로젝트는 **OpenAI Agents SDK + OpenAI 키** 선택(Vivi 지정)
- 주된 작업: 에이전트에 줄 도구를 **MCP 서버로 개발**(템플릿에 To-do MCP 예시 포함). 프론트/에이전트 코드 수정 자유
- 트랙 평가 기준: ① 생성형 UI 활용도(컨텍스트 반응 동적 UI) ② 멀티턴 일관성 ③ MCP 도구 사용 ④ 아이디어/완성도(복잡한 앱이 에이전틱하게 편해지는가)
- 시상: GGUI Track Award 1등 100만원
- 담당: Chloe / 문혜연, 개발자 임완섭(wanseob@loqu.co)

> 이 사실관계는 행사 안내 기준이며, 실제 패키지 API/도구 시그니처는 부트스트랩 직후 레포를 떠서 확인한다(추측 금지).

---

## 2. 경계 — 무엇을 GGUI로 하고, 무엇을 안 하는가

| 한다 (GGUI cockpit) | 안 한다 |
|---------------------|---------|
| 호스트 자연어 → 동적 생성형 UI로 proposal 초안 조립 | 전체 앱을 GGUI로 재구현 |
| MyRealTrip MCP 호출로 실상품 그라운딩 | 참여자-facing 공개 페이지(`/trips/[slug]`)를 GGUI로 대체 |
| 멀티턴 수정(“소개팅 느낌 줄여줘”) | 자동 발행 / 자동 외부 공유 |
| 승인 후 기존 `/host/trips/[proposal_id]`로 핸드오프 | 결제·예약 확정 / merchant 행위 |

핵심: **기존 Next.js 앱이 본체**다. GGUI는 호스트 생성 경험만 증강하는 sidecar/cockpit이다.

---

## 3. 배치 옵션 (둘 중 택일 — 데모는 B로 시작)

- **A. 통합 라우트** `/host/ai-create` — 본체 앱 안에 cockpit을 임베드. 장기적으로 지향.
- **B. sidecar 데모** `ourrealtrip/ggui/` — `create-agentic-app`로 부트스트랩한 독립 앱을 별도 포트로 띄워 데모. 해커톤/검증 단계 권장(본체 빌드 영향 0, 롤백 쉬움).

데모 단계는 **B**: 본체(`localhost:3000`)는 그대로 두고, cockpit을 별도 npm 앱으로 `localhost:3100`(예) 구동. 검증 끝나면 A로 흡수 검토.

---

## 4. 부트스트랩 절차 (로컬, 외부 발송 없음)

```
cd /Users/vivi/ourrealtrip
npx @ggui-ai/create-agentic-app@alpha ggui   # ggui/ 하위에 sidecar 생성
cd ggui
# 에이전트 프레임워크 선택 프롬프트 → OpenAI Agents SDK
npm install
# 환경변수: BYOK
#   OPENAI_API_KEY   (OpenAI, cockpit LLM)
#   MYREALTRIP_API_KEY (필요 시 — 무인증 MCP는 키 불필요)
npm run dev          # cockpit 로컬 구동 (포트는 템플릿 기본값 확인)
```

- 키는 `ggui/.env.local`(git ignore)에만. 본체의 `/Users/vivi/ourrealtrip/.env.local`과 별개로 둘지, 심볼릭/복사할지는 부트스트랩 후 구조 보고 결정.
- **절대 금지**: 키 값을 채팅·문서·로그·커밋·프롬프트에 출력.

---

## 5. MCP 도구 표면 (cockpit이 호출) — 실측 갱신 2026-05-30

> 부트스트랩 전 스펙은 추상 액션명(`search_myrealtrip_activities` 등)이었으나, **실제 구현은
> MyRealTrip 무인증 MCP의 리터럴 도구명 + ggui_* 렌더 도구**다. 아래는 `ggui/servers/agent/src/agent.ts`의
> `DEFAULT_ALLOWED_TOOLS`와 라이브 프로브(`ggui/scripts/probe-searchtnas.sh`) 실측값.

### 5-1. 렌더 도구 (ggui MCP, `localhost:6781`)
`ggui_handshake` → `ggui_render` → `ggui_update`/`ggui_emit` → `ggui_consume`. agent가 MCP 핸드셰이크로 자동 발견.
실측 사이클: `ggui_handshake` → `ggui_render`(상품 카드 props 주입) → `ggui_consume`(사용자 클릭 대기).

### 5-2. MyRealTrip 무인증 MCP (`https://mcp-servers.myrealtrip.com/mcp`, 키 불필요, 읽기전용)
agent allowlist 등록 11개 도구. 자주 쓰는 것:

| 도구 | 부작용 | 비고 |
|------|--------|------|
| `getCategoryList(city)` | 없음(읽기) | TNA 검색 전 유효 카테고리 확보(필수 선행) |
| `searchTnas` | 없음(읽기) | 투어/액티비티 검색. **키워드-리터럴**: `{도시}+광역 카테고리`로 질의(긴 자연어=0건) |
| `getTnaDetail` / `getTnaOptions` | 없음(읽기) | 상품 상세·옵션 |
| `searchStays` / `getStayDetail` | 없음(읽기) | 숙박형 보조 ProductLink |
| `search{International,Domestic}Flights` 외 | 없음(읽기) | 항공 보조 |

### 5-3. OurRealTrip 액션 (본체 연동 — cockpit 데모엔 미연결, 후속)
`compose_activity_program` / `create_proposal_draft` / `summarize_interest_signals` / `summarize_booking_signals`(read-only, PRD 9-9-3) / `publish_proposal_after_host_approval`(**사람 승인**). 데모 단계에선 검색→카드 렌더까지만 검증, 본체 핸드오프는 A 흡수 시 연결.

- MyRealTrip MCP 실측·widget 파싱 주의는 `docs/HOST_AI_CREATE.md` 3·4절을 그대로 따른다(추측 파싱 금지).
- `searchTnas` 권한: claude-agent-sdk가 allowlist 미등록 MCP 도구를 권한 프롬프트로 차단하므로, agent.ts에서 11툴 allowlist + `permissionMode:'bypassPermissions'`(로컬 cockpit 데모 한정)로 해소.

---

## 6. 데모 플로우 (멀티턴 — 트랙 평가 기준 정렬) — 실측 갱신 2026-05-30

> 실행: `cd ourrealtrip/ggui && pnpm dev --verbose`(web=6890/agent=6790/ggui=6781/todo=6782).
> 검증 프로브: `bash scripts/probe-searchtnas.sh`(agent에 직접 POST→SSE 캡처, 브라우저 없이 도구호출·렌더 확인).

1. 호스트 자연어 입력: 예) “서울 클래스, 서울 투어 같은 실제 마이리얼트립 액티비티 상품을 검색해서 후보 카드로 보여줘.”
2. 도구 호출(실측): `getCategoryList(서울)` → `searchTnas`(클래스/투어) → `ggui_handshake` → `ggui_render`.
3. 생성형 UI 동적 생성(실측): 탭 분리(class/tour) + 상품 카드(`title`/`price`/`rating`/판매처) + 선택 카운터(`selectedCount`). 실상품 데이터가 render props에 구조화되어 주입됨(텍스트 나열 아님).
4. 멀티턴 수정: 후속 발화 → `ggui_consume`로 클릭/입력 수신 → 재검색·`ggui_render` 갱신(상태 일관 유지).
5. (후속) 호스트 승인 → `publish_proposal_after_host_approval` → 기존 `/host/trips/[proposal_id]` 핸드오프. 현재 데모엔 미연결.

평가 기준 매핑: 2·3=생성형 UI 활용도+MCP 도구 사용, 4=멀티턴 일관성, 전체=아이디어/완성도.

> **모델 의존성(중요 실측):** agent 추론 모델이 `claude-haiku-4-5`면 searchTnas는 호출하지만
> `ggui_render`를 건너뛰고 마크다운 텍스트로만 답한다. `MODEL=claude-sonnet-4-6`으로 올리면
> 동일 프롬프트에서 handshake→render→consume 전체 사이클을 수행하고 실상품 카드를 띄운다.
> cockpit 데모는 sonnet 이상 권장(`ggui/.env.local`의 `MODEL`).

---

## 7. 안전경계 (반드시 준수)

- [ ] cockpit 산출물은 **draft까지**. 발행·외부공유·booking_open·제휴링크 노출은 사람 승인(PRD 2-C).
- [ ] merchant 금지 — 묶음결제·결제수취·정산·패키지 판매 표현/구조 없음(PRD 16·COMMERCE_MODEL 1).
- [ ] 카피는 `banned-phrases` 가드 통과. 특가/공식추천/최저가/전체예약 류 금지.
- [ ] 랜덤소개팅형은 데모 hook이되 user-facing 카피는 “취향 기반 액티비티 프로그램”으로 완화. 매칭 성공/연애 성사/궁합 약속 금지.
- [ ] `summarize_booking_signals`는 읽기 전용 — `externally_confirmed_booked`를 만들 수 없다.
- [ ] BYOK 키(`OPENAI_API_KEY`/`MYREALTRIP_API_KEY`)는 서버/CLI env로만. 클라이언트 번들·로그·프롬프트·커밋에 노출 금지.
- [ ] 참여자-facing 공개 페이지는 본체 Next.js UI 유지(GGUI로 대체 금지).

---

## 8. 현재 상태 / 다음 단계 — 실측 갱신 2026-05-30

**완료(검증됨):**
- 부트스트랩 완료: `ourrealtrip/ggui/`(`create-agentic-app@0.2.0-alpha.4`). **프레임워크는 스펙의 OpenAI Agents SDK가 아니라 claude-agent-sdk 단일벤더**(alpha.4 기본).
- 인증: Anthropic API 크레딧 없이 **Claude 구독 OAuth 토큰**(`CLAUDE_CODE_OAUTH_TOKEN`)으로 agent+ggui UI 생성 둘 다 통과. agent.ts에 OAuth 폴백 패치.
- 4서버 기동(web=6890/agent=6790/ggui=6781/todo=6782).
- **MyRealTrip 실상품 그라운딩 + 생성형 카드 렌더 E2E 통과**: `getCategoryList→searchTnas→ggui_handshake→ggui_render→ggui_consume`, 권한 에러 0, render props에 실상품(제목/가격/평점) 구조화 주입 확인(`scripts/probe-searchtnas.sh`).
- 모델: agent 추론 모델을 `claude-sonnet-4-6`으로 설정(haiku는 render 생략 — 6절 모델 의존성 참고).

**다음 단계:**
- 본체 OurRealTrip 프로덕트 빌딩 계속(참여자 화면, host dashboard 등 PRD 우선순위).
- (후속) cockpit→본체 핸드오프: `create_proposal_draft`/`publish_proposal_after_host_approval` 연결, A(`/host/ai-create`) 흡수 검토.
- 외부 발행/배포(Railway·Vercel)·공개 URL·키 사용은 Vivi 승인 후.

---

## 9. 참조

- `PRD.md` 2-C(agent action surface), 9-9(Booking Signal Sync), 16·17(negative spec)
- `docs/ARCHITECTURE.md` 10절(cockpit 아키텍처 위치), 9절(외부 ingestion stub)
- `docs/HOST_AI_CREATE.md` 2~5절(MCP 그라운딩 파이프라인·widget 파싱·A/B/C 조합)
- GGUI: https://github.com/ggui-ai/ggui · https://docs.ggui.ai
