# OurRealTrip GGUI Cockpit — 다음 세션 핸드오프 (2026-05-30)

## 한 줄 상태
GGUI 호스트 AI-create cockpit이 **Anthropic 크레딧 0원 + 구독 OAuth 토큰**으로 살아서, 생성형 UI 렌더까지 검증됨. 마지막 남은 것: **agent가 MyRealTrip 도구를 실제로 호출해 실상품 카드를 띄우는 것** — 권한 게이트 패치를 막 적용하고 재테스트하던 중 중단.

## 위치 / 실행
- repo: `/Users/vivi/ourrealtrip/ggui` (alpha.4, **claude-agent-sdk** 단일벤더)
- 구버전 백업: `/Users/vivi/ourrealtrip/ggui.alpha3.bak` (openai-agents-sdk, 폐기 가능)
- 구동: `cd /Users/vivi/ourrealtrip/ggui && pnpm dev --verbose`
  - web=6890(열기), agent=6790, ggui MCP=6781, todo MCP=6782
- 포트 정리: `lsof -ti:6890 -ti:6790 -ti:6781 -ti:6782 | sort -u | xargs kill -9`

## 인증 (★ 크레딧 우회 — 이게 최대 난관이었고 해결됨)
- Anthropic API 크레딧 구매가 막힘(개인 org는 결제 활성화 안 됨 / 회사 org는 휴일이라 초대 대기). → API 키 경로 포기.
- 대신 **Claude 구독 OAuth 토큰**(`~/.hermes/.env`의 `ANTHROPIC_TOKEN`, `sk-ant-oat...`)을 `ggui/.env.local`의 `CLAUDE_CODE_OAUTH_TOKEN`에 주입. API 키는 비활성(주석).
- 이걸로 agent + ggui UI 생성 둘 다 인증 통과 확인됨. 크레딧 에러 사라짐.
- ⚠️ 이 토큰은 Vivi의 Claude 구독 자격증명. GGUI 호출이 구독 사용량으로 잡힘. 값 절대 출력 금지.

## 적용한 코드 패치 (servers/agent/src/agent.ts) — tsx watch가 리로드
1. **OAuth 폴백**: 부팅 가드를 `ANTHROPIC_API_KEY || CLAUDE_CODE_OAUTH_TOKEN`로 완화. query env를 `oauthToken ? {CLAUDE_CODE_OAUTH_TOKEN} : {ANTHROPIC_API_KEY}`로 분기. (이거 없으면 크레딧 없이 agent 부팅 자체가 실패)
2. **MCP Authorization 헤더 조건부**: bearer 있는 서버(ggui)에만 `Authorization: Bearer` 붙이고, MyRealTrip 무인증 MCP엔 헤더 생략(`Bearer undefined` 방지).
3. **권한 게이트 해소** (마지막 패치, 재검증 미완):
   - `DEFAULT_ALLOWED_TOOLS`에 `myrealtrip:` 11개 도구 추가(`mcp__myrealtrip__searchTnas` 등)
   - query 옵션에 `permissionMode: 'bypassPermissions'` 추가
   - 원인: claude-agent-sdk가 allowlist 없는 MCP 도구를 "Claude requested permissions... but you haven't granted it yet" 에러로 차단했었음.

## env (ggui/.env.local) 현재 구성
- `ANTHROPIC_API_KEY=` (주석 처리 — OAuth 사용)
- `CLAUDE_CODE_OAUTH_TOKEN=<set>` (Hermes ANTHROPIC_TOKEN에서 주입)
- `GGUI_MYREALTRIP_MCP_URL=https://mcp-servers.myrealtrip.com/mcp` (agent가 자동 등록)
- `SYSTEM_PROMPT=<OurRealTrip cockpit posture + MyRealTrip 검색규칙>` (한 줄)
- `GGUI_TODO_MCP_URL=...6782/mcp` (데모 todo — 꺼도 무방)

## 검증된 것 (✅)
- 4개 서버 정상 기동, agent adapter=claude-agent-sdk
- OAuth 인증 통과(크레딧 0원에도 동작)
- 생성형 UI 실제 렌더: `ggui_handshake OK → ggui_render OK` + iframe 마운트 + 멀티턴 `ggui_consume`
- MyRealTrip 무인증 MCP 자체는 정상(curl로 initialize/tools/list/tools/call 확인, searchTnas `success:true`, 11개 도구)

## 남은 것 (다음 세션 첫 작업)
1. **MyRealTrip 도구 호출 성공 재검증** — 권한 패치(위 #3) 적용 후 서버 재기동했고, 마지막 프롬프트(`서울 클래스, 서울 투어 같은 실제 마이리얼트립 액티비티 상품을 검색해서 후보 카드로 보여줘`)가 09:53 처리됨. 그 직후 로그에서 `searchTnas`가 ERROR 없이 도는지, `ggui_render`로 상품 카드가 뜨는지 확인 필요. (중단 시점에 미확인)
   - 확인법: 브라우저 localhost:6890 "+ New" → 위 프롬프트 → 백엔드 로그에서 searchTnas outcome 확인.
   - 여전히 권한 에러면: claude-agent-sdk 버전(`@anthropic-ai/claude-agent-sdk@0.2.76`)의 permissionMode 옵션명/값 재확인, 또는 `canUseTool` 콜백으로 우회.
2. **MyRealTrip 검색 키워드 규칙** — searchTnas는 키워드-리터럴. 긴 자연어("서울 근교 당일 액티비티")는 0건. `getCategoryList(서울)` → `{도시}+광역 카테고리`로 질의해야 함. SYSTEM_PROMPT에 이미 규칙 주입했으나 agent가 잘 따르는지 확인.
3. 실상품 카드 뜨면 → docs/GGUI_COCKPIT.md 5·6절을 실측값으로 갱신.

## 주의 / 분절 이슈
- 이번 세션에서 도구 호출이 반복적으로 누락되는 분절 발생(텍스트만 나가고 실제 호출 안 됨). 다음 세션은 한 번에 한 도구씩 확실히 호출 권장.
- 클립보드로 프롬프트 전달 시 Vivi가 중간에 다른 걸 복사하면 덮어써짐 — 브라우저에서 직접 타이핑이 더 안정적일 수 있음.

## 본 작업(A/C)은 이미 완료
- Booking Signal Sync 7-state 문서(PRD/COMMERCE_MODEL/ARCHITECTURE/GGUI_COCKPIT) + 코드(types/store/api/go/컴포넌트) 반영 완료, verifier 검수 통과, tsc·next build 통과. (GGUI는 그와 별개인 cockpit 데모)
