# OurRealTrip GGUI × Luma UX 구현 핸드오프 — P0~P2

작성일: 2026-05-31
대상 구현 모델: Claude Opus 4.8
프로젝트: `/Users/vivi/ourrealtrip`

## 0. 한 줄 목표

Luma create UX에서 배운 “이벤트 페이지를 직접 만드는 듯한 작성 경험”을 아워리얼트립 도메인에 맞게 번역하고, GGUI의 `@ggui-ai/react`를 본체에 직접 통합해서 에이전트가 만든 구조화 제안을 호스트가 검토 후 페이지에 반영할 수 있게 만든다.

## 1. 핵심 방향 확정

### 해야 하는 것

- cockpit 샘플을 iframe으로 끼우지 않는다.
- `@ggui-ai/react`의 `AppRenderer` + `useMcpAppsChat`를 본체 React/Next 앱에 직접 가져온다.
- GGUI 데모 문구, 다크테마, ggui 브랜딩을 제거한다.
- 오른쪽 작업대는 아워리얼트립 톤의 에이전트 채팅/작업 UI로 만든다.
- 에이전트 응답은 단순 텍스트가 아니라 구조화 payload로 왼쪽 이벤트 페이지 필드에 반영한다.
- 에이전트는 draft/제안까지만 한다. 발행/외부 공유/booking_open은 사람 승인 후만 가능하다.

### 하지 말아야 하는 것

- Stripe/자체결제/티켓 판매 구현 금지.
- “예약 완료”, “결제 완료”, “확정가”처럼 오해될 표현 금지.
- MyRealTrip 외부 검증 없이 `externally_confirmed_booked` 상태 세팅 금지.
- cockpit iframe 유지 금지. 임시 fallback으로도 최종 데모에 남기지 않는다.
- Luma UI/문구를 그대로 복제하지 않는다. 구조만 학습하고 아워리얼트립 언어로 번역한다.

## 2. 현재 코드 상태 요약

### 주요 파일

- `components/host/CreateEventForm.tsx`
  - 현재 생성 화면의 핵심.
  - 왼쪽 3/5: 이벤트 페이지형 편집면.
  - 오른쪽 2/5: 에이전트 작업대 stub.
  - 이미 `postMessage` 기반 `ourrealtrip:fill-event` payload 브리지가 있음.
  - 현재는 GGUI 직접 통합 전. 버튼/stub 중심.

- `app/host/create/actions.ts`
  - draft 생성 server action.
  - `price_hint`만 저장한다.
  - 결제 금액/PG/정산 필드 없음.
  - 저장 후 `/host/preview/[draftId]`로 이동.

- `lib/types.ts`
  - `ProposalStatus`: `draft | interest_check | option_refining | booking_open | closed | cancelled | archived`.
  - `Visibility`: `public | unlisted`.
  - `TripProposal`에 Luma 대응 필드 있음:
    - `cover_image_url`
    - `recruit_capacity`
    - `requires_approval`
    - `timezone`
    - `waitlist_enabled`
  - `BookingProgressStatus`에 안전 경계 주석 있음. `externally_confirmed_booked`는 외부 API/postback 전용.

- `lib/store/drafts.ts`
  - Phase 1 JSON 저장소.
  - 필요 시 필드 확장 대상.

- `app/host/preview/[draftId]/page.tsx`
  - 공개 전 미리보기/승인 단계.

- `app/e/[slug]/page.tsx`
  - 공개 이벤트 페이지.

- `components/event/RegisterBox.tsx`
  - 참가 신청/등록 박스.

- `HANDOFF_EVENT_FLOW.md`
  - 과거 핸드오프. 일부 iframe 중심 표현이 최신 방향과 충돌하므로 이 문서를 우선한다.

## 3. Luma UX 학습 결과 → 아워리얼트립 번역

### Luma에서 확인한 요소

- 페이지형 create 화면.
- 큰 1:1 커버 이미지 영역.
- 커버 이미지 선택/업로드/추천 카테고리.
- 테마/스타일/폰트/디스플레이 선택.
- 캘린더 선택. 실제 의미는 이벤트 소유 주체/배포 채널.
- 공개/비공개 설정.
- 시작/종료 날짜 및 시간.
- 30분 단위 시간 선택.
- 시간대: GMT+09:00 서울.
- 장소: 오프라인 장소 또는 가상 링크.
- 설명 영역 + “AI로 제안하기”.
- 이벤트 옵션:
  - 티켓 가격
  - 결제 수락/Stripe 연결
  - 승인 필요
  - 수용 인원
  - 대기자 명단

### 아워리얼트립식 번역 원칙

- `calendar` → 커뮤니티/호스트 채널.
- `public/private` → 공개/링크공개/초안.
- `ticket/Stripe` → 연결 상품/외부 예약 링크.
- `capacity/waitlist` → 관심/신청/승인/대기/외부예약 신호 분리.
- `AI description` → 설명뿐 아니라 일정, 상품, 참여 안내, 안전 문구까지 구조화 제안.
- `theme` → 페이지 분위기/호스트 톤.

## 4. P0 — GGUI 트랙 데모 완성에 직접 필요한 작업

P0는 이번 구현의 필수 범위다. 이 범위가 끝나면 “복잡한 앱이 에이전틱하게 편해졌다”는 데모가 성립해야 한다.

### P0-1. `@ggui-ai/react` 본체 직접 통합

목표:
- cockpit iframe 제거.
- 본체 오른쪽 작업대 안에서 GGUI 앱 렌더링.

작업:
1. 본체 `package.json`에 `@ggui-ai/react` 설치 가능 여부 확인.
   - 이전 세션에서 cockpit은 `@ggui-ai/react@0.2.0-alpha.1` 사용 확인.
   - npm 공개 여부가 네트워크/timeout 때문에 불완전했으므로 재확인 필요.
2. npm 공개면 본체에 설치.
3. 비공개/네트워크 문제면 `ggui` workspace/local package 참조 방식 검토.
4. `components/host/CreateEventForm.tsx`에서 오른쪽 작업대 하단의 stub 전송 버튼을 GGUI 채팅 컴포넌트로 대체.

검증:
- `npm run typecheck` 통과.
- `/host/create`에서 오른쪽 작업대가 로딩되고, iframe이 남지 않아야 함.
- DOM에 `iframe[src*='6890']`가 없어야 함.

주의:
- ggui 데모 dark theme/branding이 보이면 실패.
- 본체 디자인 token과 흰 배경 미니멀 톤 유지.

### P0-2. GGUI payload schema 정의

목표:
- 에이전트가 “답변 텍스트”가 아니라 페이지에 반영 가능한 구조화 데이터를 반환한다.

권장 타입:

```ts
export interface HostCreateAgentPayload {
  title?: string;
  concept?: string;
  description?: string;
  date_text?: string;
  timezone?: string;
  location_text?: string;
  cover_image_url?: string;
  visibility?: "public" | "unlisted" | "draft";
  community_id?: string;
  requires_approval?: boolean;
  recruit_capacity?: number;
  waitlist_enabled?: boolean;
  participation_questions?: string[];
  product_links?: Array<{
    title: string;
    price_hint?: string | null;
    source_url?: string | null;
    product_type: "tna" | "stay" | "flight";
    reason?: string | null;
    caution?: string | null;
  }>;
  safety_notes?: string[];
}
```

파일 후보:
- `lib/host-create/agentPayload.ts` 신규 생성.
- 또는 `lib/types.ts`에 추가. 단, 파일이 이미 커지고 있으므로 신규 파일 선호.

검증:
- payload validator 함수 추가.
- 잘못된 product_type은 `tna` fallback.
- product_links는 최대 10개로 제한.
- recruit_capacity는 finite positive number만 허용.

### P0-3. payload → 왼쪽 페이지 반영 bridge 정리

목표:
- 현재 `postMessage` bridge를 GGUI 직접 통합에 맞게 함수형 bridge로 정리한다.

현재:
- `CreateEventForm.tsx`에 `applyPayload(payload)`가 있음.
- `window.addEventListener("message", ...)`로 `ourrealtrip:fill-event`를 받음.

작업:
1. `applyPayload`를 validator 사용하도록 변경.
2. GGUI 응답에서 payload를 받으면 `applyPayload` 호출.
3. iframe postMessage는 제거하거나 dev fallback으로만 남긴다. 최종 데모에서는 사용하지 않는다.
4. 적용 후 `agentFilled`/`mode` 상태가 업데이트되어 “에이전트가 채운 초안”임을 표시한다.

검증:
- mock payload 버튼 또는 테스트 유틸로 아래 필드가 실제 input/preview에 반영되어야 함:
  - title
  - concept
  - description
  - date_text/timezone
  - location_text
  - requires_approval
  - recruit_capacity
  - waitlist_enabled
  - product_links

### P0-4. 오른쪽 작업대 UX 완성

목표:
- “채팅창”이 아니라 “페이지를 함께 만드는 작업대”로 보여야 한다.

필수 UI:
- 상단: `Beta` + `페이지에 대해 물어보기` 유지 가능.
- 추천 질문:
  - “이 모임이 소개팅처럼 보이지 않게 다듬어줘”
  - “상품 연결을 판매 페이지처럼 보이지 않게 정리해줘”
  - “처음 온 사람이 어색하지 않게 진행 순서를 짜줘”
  - “일정 후보 3개와 장단점을 만들어줘”
- 스킬칩:
  - 페이지 반영
  - 상품 추천
  - 일정 후보
  - 참여 안내
  - 안전 문구 점검
  - 더 많은 스킬
- 에이전트 결과 카드:
  - 제목/컨셉/설명 preview
  - 연결 상품 카드
  - 안전 점검 메모
  - “페이지에 반영” 버튼

검증:
- 호스트가 결과를 확인하지 않고 자동 반영되지 않아야 함.
- “페이지에 반영” 같은 명시 액션 후에만 왼쪽 필드 변경.

### P0-5. 안전 문구 자동 점검

목표:
- 발행 전 위험 표현을 에이전트가 잡아낸다.

체크리스트:
- 단일 패키지/묶음결제로 보이는가?
- 자체 결제/예약 확정처럼 보이는가?
- 가격이 확정가처럼 보이는가?
- 외부 상품 링크가 플랫폼 결제로 오해되는가?
- 소개팅/매칭 서비스처럼 보이는가?
- 장소 공개 수준이 과도한가?
- 정원과 외부 예약 가능성이 혼동되는가?

UI:
- 오른쪽 작업대 결과에 `안전 점검` 섹션 표시.
- preview 또는 submit 전에도 경고 표시 가능.

검증:
- “결제 완료”, “예약 확정”, “패키지 가격” 같은 입력이 있으면 경고 또는 대체 문구 제안.

### P0-6. Preview까지 E2E 검증

필수 명령:

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

주의:
- dev 서버 켜진 채 build하면 `.next` 캐시 충돌 가능. 기존 핸드오프에도 기록됨.
- build 전에는 dev 서버 중지 또는 `.next` 삭제.

브라우저 검증:
1. `/host/create` 접속.
2. 에이전트에게 “서울 밤 사진 산책 모임을 만들어줘. 상품은 조용히 하단에 붙이고 소개팅처럼 보이지 않게 해줘.” 입력.
3. 결과 카드 확인.
4. “페이지에 반영” 클릭.
5. 왼쪽 필드가 채워지는지 확인.
6. “미리보기로 이동”.
7. `/host/preview/[draftId]`에서 상품/정원/승인/대기자/설명 반영 확인.

## 5. P1 — Luma에서 바로 배울 핵심 UX

P1은 P0 이후 같은 세션에서 가능하면 진행. 시간이 부족하면 별도 PR/커밋 범위로 분리.

### P1-1. 공개 범위 선택

목표:
- 공개/링크공개/초안을 create에서 명시적으로 선택.

UX:
- 공개: 탐색/추천 노출 가능.
- 링크 공개: 링크 있는 사람만 접근.
- 초안: 호스트만 preview.

데이터:
- 기존 `Visibility`는 `public | unlisted`만 있음.
- draft-only는 proposal status/draft 상태로 표현 가능.
- UI에서는 “초안”을 별도 선택하되 저장 모델에서는 publish 전 상태로 처리.

근거:
- Luma는 공개/비공개 설명을 명확히 제공.
- 호스트 부담을 줄이려면 기본값은 `링크 공개` 또는 `초안` 선호.

### P1-2. 커뮤니티/호스트 채널 선택

목표:
- Luma의 calendar 선택을 아워리얼트립의 커뮤니티/호스트 채널 선택으로 번역.

UX:
- “어느 커뮤니티에서 열까요?”
- 개인/테스트 커뮤니티/새 커뮤니티 만들기.
- 관리자 권한 안내: 이 커뮤니티 운영자는 이벤트를 함께 관리할 수 있음.

데이터:
- `Community` 타입 있음.
- Phase 1은 seed/static list로 시작 가능.

### P1-3. 커버 이미지 추천/자동 생성 강화

목표:
- 현재 자동 SVG 하나/업로드에서, 컨셉 기반 후보 3개 이상으로 개선.

UX:
- 자동 생성
- 업로드
- 추천 카테고리:
  - 도시 산책
  - 사진/필름
  - 와인/바
  - 러닝/아웃도어
  - 책/대화
  - 워케이션
  - 로컬 투어
  - 원데이 클래스
  - 커뮤니티 MT
  - 해외 소도시

주의:
- 외부 이미지 API 없어도 gradient/SVG 템플릿으로 충분.
- 이미지 생성 모델 호출은 필수 아님. 데모 안정성이 우선.

### P1-4. 분위기/테마 프리셋

목표:
- Luma의 theme/style/font를 아워리얼트립의 “분위기”로 번역.

프리셋:
- 조용한 취향 모임
- 가볍게 합류
- 깊은 대화
- 액티브
- 로컬 여행
- 프리미엄 큐레이션

반영:
- 색/커버만 바꾸지 말고 문구 톤도 에이전트가 제안.

### P1-5. 장소 공개 수준

목표:
- 단일 `location_text`에서 “정확한 주소/대략적 지역/승인 후 공개/온라인 링크/미정”을 지원.

근거:
- 커뮤니티/낯선 사람 모임은 안전/프라이버시가 중요.

최소 구현:
- `location_visibility` 또는 UI state만 먼저 도입.
- preview/public page에 문구 반영.

### P1-6. 참여 승인 질문

목표:
- `requires_approval`을 켰을 때 신청자 질문 설정.

예시 질문:
- 이 모임에 관심 있는 이유는?
- 혼자 오나요, 함께 오나요?
- 선호 일정/예산이 있나요?
- 예약 완료 후 알려줄 수 있나요?

최소 구현:
- create UI에서 질문 배열 입력.
- draft 저장.
- RegisterBox에서 질문 노출.

## 6. P2 — 아워리얼트립 고유 차별화

P2는 GGUI 데모 이후 제품 확장 범위. P0/P1 코드 구조가 이 방향을 막지 않게 설계한다.

### P2-1. 일정 후보/투표

목표:
- 확정 일정뿐 아니라 “후보 일정”을 만들고 관심자에게 투표받기.

상태:
- `interest_check`
- `option_refining`

에이전트 역할:
- 후보 일정 3개 생성.
- 장단점/예상 참여자 fit 설명.

### P2-2. 옵션 A/B/C 비교

목표:
- 여행/모임 옵션 여러 개 생성.

데이터:
- `TravelOption` 타입 이미 있음.

옵션 필드:
- option_name
- option_type
- description
- estimated_budget
- fit_reason
- risk_note
- schedule_difficulty
- product_links

에이전트 UI:
- 카드 3개 렌더링.
- 사용자가 선택한 옵션만 페이지 반영.

### P2-3. 관심 체크 → 옵션 조정 → booking_open 상태 전환

목표:
- Luma식 즉시 발행이 아니라 아워리얼트립식 단계 운영.

상태 흐름:
1. draft
2. interest_check
3. option_refining
4. booking_open
5. closed/cancelled/archived

주의:
- booking_open은 사람 승인 필요.
- 에이전트가 자동 전환하지 않음.

### P2-4. 예약 신호 관리

목표:
- 외부 예약 링크 클릭과 실제 예약 완료를 분리.

상태:
- clicked_booking_link
- booking_intent
- self_reported_booked
- host_confirmed_booked
- externally_confirmed_booked
- cancelled_or_refunded

불변식:
- `externally_confirmed_booked`는 외부 API/postback 연결 전까지 어떤 UI에서도 세팅 금지.

### P2-5. 참여자 안내/리마인드 생성

목표:
- 승인자/대기자/관심자 상태별 안내 메시지 생성.

주의:
- Slack/Email 등 외부 발송은 사람 승인 전 금지.
- 데모에서는 복사 가능한 안내문 생성까지만 해도 충분.

## 7. 구현 순서 제안

### 1차 구현: P0 only

1. GGUI 의존성 확인 및 설치.
2. payload schema/validator 생성.
3. `CreateEventForm.tsx`의 agent 작업대 컴포넌트 분리.
   - 예: `components/host/HostCreateAgentPanel.tsx`
4. GGUI chat/app renderer 직접 통합.
5. 에이전트 결과 → payload → `applyPayload` 연결.
6. 안전 점검 결과 UI 추가.
7. preview E2E 검증.

### 2차 구현: P1 core

1. visibility selector.
2. community selector.
3. 커버 후보/분위기 프리셋.
4. 장소 공개 수준.
5. 승인 질문.

### 3차 구현: P2 foundation

1. 일정 후보 타입/스토어 확장.
2. 옵션 A/B/C 타입과 UI skeleton.
3. booking signal UI skeleton.

## 8. Acceptance Criteria

### P0 완료 기준

- `/host/create`에서 cockpit iframe이 보이지 않는다.
- 오른쪽 작업대가 본체 톤으로 렌더링된다.
- 에이전트에게 요청하면 구조화 제안이 생성된다.
- 사용자가 “페이지에 반영”을 눌러야 왼쪽 필드가 채워진다.
- 반영 가능한 필드:
  - 제목
  - 한 줄 컨셉
  - 설명
  - 일정/시간대
  - 장소
  - 승인 필요
  - 정원
  - 대기자 명단
  - 연결 상품
- 연결 상품은 price_hint/외부 URL 중심이며 결제 필드가 없다.
- `npm run typecheck` 통과.
- 가능하면 `npm run build` 통과.

### P1 완료 기준

- 공개 범위가 UI에 명확히 표시된다.
- 커뮤니티/호스트 채널 선택이 있다.
- 커버/분위기 프리셋이 있다.
- 장소 공개 수준을 선택할 수 있다.
- 승인 필요 시 참여 질문을 설정할 수 있다.

### P2 완료 기준

- 일정 후보/옵션 비교/예약 신호 관리의 최소 타입과 UI skeleton이 있다.
- P2가 P0/P1 구조와 충돌하지 않는다.
- 실제 외부 예약 확정처럼 보이는 표현이 없다.

## 9. 검증 명령

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

## 10. Claude Opus 4.8에게 줄 첫 프롬프트

아래 프롬프트를 새 Opus 4.8 세션 첫 메시지로 사용한다.

```text
/Users/vivi/ourrealtrip 프로젝트에서 GGUI × Luma UX P0 구현을 진행해줘.

먼저 반드시 읽을 파일:
- /Users/vivi/ourrealtrip/HANDOFF_GGUI_LUMA_P0_P2.md
- /Users/vivi/ourrealtrip/HANDOFF_EVENT_FLOW.md
- /Users/vivi/ourrealtrip/components/host/CreateEventForm.tsx
- /Users/vivi/ourrealtrip/app/host/create/actions.ts
- /Users/vivi/ourrealtrip/lib/types.ts
- /Users/vivi/ourrealtrip/lib/store/drafts.ts

목표:
- cockpit iframe을 최종 데모에서 제거하고, @ggui-ai/react(AppRenderer + useMcpAppsChat)를 본체 오른쪽 작업대에 직접 통합한다.
- 에이전트 결과는 구조화 payload로 만들고, 사용자가 “페이지에 반영”을 눌렀을 때만 왼쪽 이벤트 페이지 필드에 반영한다.
- 연결 상품은 price_hint/외부 URL만 사용한다. Stripe/자체결제/티켓 판매/결제완료 표현은 금지한다.
- 발행/booking_open/외부 공유는 자동 수행하지 않는다. draft와 preview까지만 한다.

우선순위:
1. P0 전체 완료
2. 시간이 남으면 P1의 공개 범위/커뮤니티 선택/장소 공개 수준까지
3. P2는 foundation skeleton까지만, P0를 흔들지 않는 선에서

검증:
- npm run typecheck 필수
- 가능하면 rm -rf .next && npm run build
- /host/create에서 iframe 없이 오른쪽 에이전트 작업대가 보이고, payload 반영 후 preview 이동까지 확인

답변은 한국어로, 실제 수정한 파일과 검증 결과를 짧게 보고해줘.
```

## 11. 세션/모델 실행 메모

현재 대화 세션에서 모델을 바꾸려면 Hermes CLI에서 `/model`을 사용한다.

권장:

```text
/model
```

그 다음 Anthropic / Claude Opus 4.8 선택.

새 세션으로 열 경우:

```bash
cd /Users/vivi/ourrealtrip
hermes chat --provider anthropic --model claude-opus-4-8
```

단, provider/model 이름은 로컬 Hermes 설정의 실제 alias와 다를 수 있으므로 `/model` picker가 가장 안전하다.

## 12. 구현 중 의사결정 원칙

- 데모 안정성 > 완벽한 기능.
- GGUI 직접 통합 > iframe 유지.
- 구조화 payload > 자유 텍스트 답변.
- 사람 승인 > 에이전트 자동 발행.
- 외부 예약 링크 > 내부 결제.
- 링크 공개/초안 기본값 > 공개 추천 기본값.
- 제품 언어는 아워리얼트립. Luma/GGUI 브랜딩 노출 금지.
