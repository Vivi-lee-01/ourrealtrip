# Handoff — herc 세션에서 Opus 4.8로 OurRealTrip P0~P2 구현

작성일: 2026-05-31
프로젝트: `/Users/vivi/ourrealtrip`
실행 세션: `herc`
목표 모델: Claude Opus 4.8

## 0. 현재 상황

`hervivi` 세션에서 Anthropic provider로 `claude-opus-4-8`을 직접 호출했으나 실패했다.

실패 원인:

```text
HTTP 400: You're out of extra usage. Add more at claude.ai/admin-settings/usage and keep going.
```

따라서 `hervivi`의 현재 Anthropic API 경로로는 구현을 진행하지 않는다.
이후 구현은 `herc` 세션을 호출하고, 그 안에서 provider/model을 전환해서 진행한다.

확인된 로컬 명령:

```bash
/Users/vivi/.local/bin/herc
/Users/vivi/.local/bin/hermes
```

## 1. 반드시 먼저 읽을 문서

`herc` 세션에서 구현 시작 전 아래 순서로 읽는다.

1. `/Users/vivi/ourrealtrip/HANDOFF_GGUI_LUMA_P0_P2.md`
   - P0~P2의 상세 구현 기준. 최우선 문서.
2. `/Users/vivi/ourrealtrip/HANDOFF_EVENT_FLOW.md`
   - 기존 이벤트 플로우/불변식/실행 검증 메모.
   - 단, iframe 관련 내용은 구버전으로 간주. 최신 방향은 `HANDOFF_GGUI_LUMA_P0_P2.md` 우선.
3. 핵심 코드:
   - `/Users/vivi/ourrealtrip/components/host/CreateEventForm.tsx`
   - `/Users/vivi/ourrealtrip/app/host/create/actions.ts`
   - `/Users/vivi/ourrealtrip/lib/types.ts`
   - `/Users/vivi/ourrealtrip/lib/store/drafts.ts`
   - `/Users/vivi/ourrealtrip/app/host/preview/[draftId]/page.tsx`
   - `/Users/vivi/ourrealtrip/app/e/[slug]/page.tsx`
   - `/Users/vivi/ourrealtrip/components/event/RegisterBox.tsx`

## 2. 실행 방식

### 권장: herc 인터랙티브 세션

```bash
cd /Users/vivi/ourrealtrip
herc
```

세션이 뜨면 먼저 provider/model을 바꾼다.

```text
/model
```

그 다음 사용 가능한 provider 중 Claude Opus 4.8이 되는 경로를 선택한다.
`hervivi`의 Anthropic API 경로는 extra usage 소진으로 실패했으므로, `herc`에서 별도 provider/credential이 잡혀 있는지 확인한다.

### herc 세션 첫 프롬프트

아래를 그대로 붙여 넣는다.

```text
/Users/vivi/ourrealtrip 프로젝트에서 P0~P2 구현을 진행해줘.

반드시 먼저 읽어야 할 문서:
- /Users/vivi/ourrealtrip/HANDOFF_GGUI_LUMA_P0_P2.md
- /Users/vivi/ourrealtrip/HANDOFF_EVENT_FLOW.md

그 다음 아래 핵심 파일을 읽고 현재 상태를 확인해줘:
- /Users/vivi/ourrealtrip/components/host/CreateEventForm.tsx
- /Users/vivi/ourrealtrip/app/host/create/actions.ts
- /Users/vivi/ourrealtrip/lib/types.ts
- /Users/vivi/ourrealtrip/lib/store/drafts.ts
- /Users/vivi/ourrealtrip/app/host/preview/[draftId]/page.tsx
- /Users/vivi/ourrealtrip/app/e/[slug]/page.tsx
- /Users/vivi/ourrealtrip/components/event/RegisterBox.tsx

목표:
P0~P2를 한 번에 진행한다. 다만 안정성을 위해 P0 → P1 → P2 순서로 작은 단위 검증을 반복해줘.

P0 필수:
1. cockpit iframe 최종 제거.
2. GGUI의 @ggui-ai/react(AppRenderer + useMcpAppsChat)를 본체 오른쪽 작업대에 직접 통합.
3. GGUI 데모 문구/다크테마/브랜딩 제거.
4. 에이전트 결과는 구조화 payload로 만들고, 사용자가 “페이지에 반영”을 눌렀을 때만 왼쪽 create 페이지 필드에 반영.
5. 연결 상품은 price_hint/외부 URL 중심. Stripe/자체결제/티켓 판매/결제완료 표현 금지.
6. 발행/booking_open/외부 공유는 자동 수행 금지. draft/preview까지만.
7. 안전 문구 점검 UI 포함.

P1 필수:
1. 공개 범위 선택: 공개/링크 공개/초안.
2. 커뮤니티/호스트 채널 선택.
3. 커버 이미지 후보/자동 생성 강화.
4. 분위기/테마 프리셋.
5. 장소 공개 수준.
6. 승인 필요 시 참여 질문 설정.

P2 필수:
1. 일정 후보/투표 foundation.
2. 옵션 A/B/C 비교 foundation.
3. draft → interest_check → option_refining → booking_open 상태 흐름을 막지 않는 구조.
4. 예약 신호 관리 foundation. 단 externally_confirmed_booked는 외부 API/postback 전용이므로 UI에서 세팅 금지.
5. 참여자 안내/리마인드 생성은 외부 발송 없이 복사용 문구 생성까지만.

서브에이전트 운영:
필요하면 네가 알아서 서브에이전트를 만들어 병렬로 진행해줘.
추천 분담:
- GGUI 통합
- 데이터 모델+스토어
- create UI/UX
- preview/public/register 반영
- QA 검증
단, 최종 병합과 검증은 메인 세션이 책임져줘.

검증 필수:
- cd /Users/vivi/ourrealtrip && npm run typecheck
- 가능하면 dev 서버 중지 또는 .next 삭제 후 npm run build
- /host/create에서 iframe 없이 오른쪽 에이전트 작업대가 보이고, payload 반영 후 preview 이동까지 확인

보고 형식:
1. 수정 파일 목록
2. P0/P1/P2 완료/미완료 체크
3. 검증 명령과 실제 결과
4. 남은 리스크/후속 작업

주의:
- 모르면 추측하지 말고 파일/패키지/로그를 직접 확인.
- 토큰/API 키 출력 금지.
- 외부 발행/배포/메일/Slack 발송 금지.
- 아워리얼트립은 merchant가 아니다. 자체결제/정산/패키지 판매로 보이는 구현 금지.
```

## 3. 구현 불변식

### 비즈니스/안전 불변식

- 아워리얼트립은 merchant가 아니다.
- 가격은 `price_hint` 표시 문자열만 사용한다.
- 결제 금액, PG, 정산, Stripe, 자체 티켓 판매 필드 추가 금지.
- 예약은 MyRealTrip 등 외부 판매처에서 개별 진행된다.
- 클릭은 결제/예약 완료가 아니다.
- `externally_confirmed_booked`는 외부 API/postback 연결 전용이며 UI에서 직접 세팅 금지.
- 에이전트는 draft/제안까지만. 발행, booking_open, 외부 공유는 사람 승인 후만 가능.

### UX 불변식

- Luma UI를 복제하지 않는다. 구조만 학습하고 아워리얼트립 언어로 번역한다.
- GGUI/cockpit 브랜딩이 최종 화면에 보이면 실패.
- 오른쪽 작업대는 “채팅창”보다 “페이지를 함께 만드는 작업대”여야 한다.
- 에이전트 결과는 자동 반영하지 않는다. 사용자가 “페이지에 반영”을 눌러야 반영된다.
- 기본 공개는 공개 추천보다 링크 공개/초안 쪽이 안전하다.

## 4. 예상 구현 파일

P0에서 수정/생성 가능성이 높은 파일:

- `components/host/CreateEventForm.tsx`
- `components/host/HostCreateAgentPanel.tsx` 신규 가능
- `lib/host-create/agentPayload.ts` 신규 권장
- `package.json`
- `package-lock.json` 또는 사용 중인 lockfile

P1/P2에서 수정/생성 가능성이 높은 파일:

- `lib/store/drafts.ts`
- `app/host/create/actions.ts`
- `app/host/preview/[draftId]/page.tsx`
- `app/e/[slug]/page.tsx`
- `components/event/RegisterBox.tsx`
- `lib/types.ts`
- 필요 시 `lib/host-create/options.ts`, `lib/host-create/safety.ts` 등 신규 파일

## 5. 검증 명령

필수:

```bash
cd /Users/vivi/ourrealtrip
npm run typecheck
```

가능하면:

```bash
cd /Users/vivi/ourrealtrip
rm -rf .next
npm run build
```

개발 서버:

```bash
cd /Users/vivi/ourrealtrip
npx next dev -p 3000
```

브라우저 확인:

- `http://localhost:3000/host/create`
- `http://localhost:3000/host/preview/[draftId]`
- 공개 후 `http://localhost:3000/e/[slug]`

## 6. 완료 보고 체크리스트

구현 완료 보고에는 반드시 포함한다.

- 수정 파일 목록.
- P0/P1/P2 각각 완료/부분완료/미완료.
- `npm run typecheck` 실제 결과.
- `npm run build` 실제 결과 또는 못 한 이유.
- iframe 제거 여부.
- `@ggui-ai/react` 직접 통합 여부.
- 구조화 payload 반영 흐름.
- merchant/결제 불변식 위반 여부 점검.
- 남은 리스크.

## 7. 참고: hervivi에서 실패한 명령

아래 명령은 `hervivi` Anthropic extra usage 소진으로 실패했다. 같은 경로로 반복하지 말 것.

```bash
cd /Users/vivi/ourrealtrip \
  && hermes chat --provider anthropic --model claude-opus-4-8 --yolo -q "..."
```

실패 메시지:

```text
HTTP 400: You're out of extra usage. Add more at claude.ai/admin-settings/usage and keep going.
```

`herc`에서 별도 provider/model 경로를 설정한 뒤 진행한다.
