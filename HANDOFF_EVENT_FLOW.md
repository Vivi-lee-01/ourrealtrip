# OurRealTrip 제품 빌딩 핸드오프 — 사람+에이전트 이벤트 플로우 (2026-05-30)

> 최종 목표: 아워리얼트립 프로덕트 빌딩. Luma식 이벤트 생성 + 참가 + MyRealTrip 실상품 그라운딩 + 에이전트 공동 생성.
> 최신 방향(2026-05-31): cockpit iframe은 최종 방향이 아니다. GGUI의 `@ggui-ai/react` (`AppRenderer` + `useMcpAppsChat`)를 본체에 직접 통합하고, 에이전트가 만든 구조화 payload를 호스트가 검토 후 페이지에 반영한다.
> 상세 P0~P2 구현 핸드오프는 `HANDOFF_GGUI_LUMA_P0_P2.md`를 우선한다.

## 완성된 것 (전부 브라우저 실측 + prod build 통과)

| # | 플로우 | 라우트 | 파일 |
|---|---|---|---|
| 1 | 이벤트 생성(사람) | /host/create | app/host/create/{page,actions}, components/host/CreateEventForm.tsx |
| 2 | 미리보기→발행 | /host/preview/[draftId] | app/host/preview/[draftId]/{page,actions} |
| 3 | 공개 이벤트+참가신청 | /e/[slug] | app/e/[slug]/{page,actions}, components/event/RegisterBox.tsx |
| 4 | 호스트 대시보드(승인/거절) | /host/events/[draftId] | app/host/events/[draftId]/{page,actions} |
| 5 | GGUI 에이전트 임베드(구버전) | /host/create Agent 토글 | 과거 iframe→localhost:6890 방식. 최신 구현에서는 제거하고 `@ggui-ai/react` 직접 통합으로 교체 |

### 데이터 (Phase 1, 백엔드 없음 — .data/*.json)
- lib/store/drafts.ts — EventDraft(생성/발행). status: draft|published, publishDraft().
- lib/store/registrations.ts — Registration(신청). pending/confirmed/declined/cancelled, 승인 흐름.
- A방식(merchant 아님) 불변식: 가격은 price_hint 표시만. 결제금액/PG/정산 필드 없음. 결제는 마이리얼트립 판매처 각자(/go). E2E로 결제필드 0개 검증됨.

### 디자인 톤
- 초기 "루마 클론"·"AI티" 지적 → 미니멀 재작성(흰배경, 얇은 hairline divider, 이모지·색박스 제거, 위계는 타이포로). create/preview/공개/대시보드 일관.
- 좌우 2단은 grid-cols-1 lg:grid-cols-[...]로 모바일 자동 1단(375px 실측, 안 깨짐).

### 해결한 버그
- 한글 slug → Next App Router 404. slugify를 ASCII 전용으로(한글 제목은 event-<id> 폴백).
- .next 캐시 손상(dev 켜진 채 build 돌리면 발생) → rm -rf .next 후 재기동.
- tsconfig.json exclude에 ggui, ggui.alpha3.bak 추가(본체 tsc 클린).

## 남은 것 (다음 세션, 우선순위순)

### 1. GGUI 본체 직접 통합 (가장 중요 — Vivi 명시)
현재: 과거 핸드오프 기준으로는 Agent 토글 시 cockpit iframe이 뜨는 방식이었으나, 최신 방향은 iframe 제거다. GGUI의 `@ggui-ai/react` (`AppRenderer` + `useMcpAppsChat`)를 본체 오른쪽 작업대에 직접 통합한다.
필요:
- 본체에 `@ggui-ai/react` 설치/참조 가능 여부 확인.
- GGUI 데모 문구·다크테마·브랜딩 제거.
- 에이전트 결과를 구조화 payload로 만들고, 사용자가 “페이지에 반영”을 눌렀을 때만 왼쪽 폼에 적용.
- 상세 구현 계획: `HANDOFF_GGUI_LUMA_P0_P2.md`의 P0를 우선한다.

### 2. 호스트 인증/소유권 — 현재 누구나 모든 대시보드 접근 가능(인증 0).
### 3. 데이터 영속성 — .data/*.json → Supabase(시그니처 유지, 내부만 교체).
### 4. 기존 seed 데모(trips/[slug], proposal 모델)와 새 이벤트 라인(EventDraft) 관계 정리(현재 별개 공존).
### 5. 일시 입력 — 자유 텍스트 → date/time picker.

## 실행/검증
- 본체: cd /Users/vivi/ourrealtrip && npx next dev -p 3000 → localhost:3000
- cockpit: cd /Users/vivi/ourrealtrip/ggui && pnpm dev --verbose → 6890/6790/6781/6782
- 테스트 데이터: .data/drafts.json에 발행된 event-p5ww1j(한강 야경 러닝) + 신청 2건 confirmed.
- 빌드 검증: dev 내리고 rm -rf .next && npx next build (dev 켜진 채 build 금지 — 캐시 충돌).

## 제약 (불변)
- merchant 아님. 묶음결제/정산/패키지판매 금지. price_hint 표시만, /go 리다이렉트.
- 에이전트는 draft까지. 발행/외부공유는 사람 승인(publishDraft는 호스트 명시 호출만).
- 외부 발행/배포/키사용 전 Vivi 확인. MYREALTRIP_API_KEY·OAuth 토큰 출력 금지.
