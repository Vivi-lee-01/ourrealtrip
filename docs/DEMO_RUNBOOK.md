---
title: OurRealTrip 시연 런북 (3:3 소개팅 라이브 생성 데모)
date: 2026-05-31
---

# 데모 시나리오
이벤트 등록하기 → 에이전트에게 프롬프트 → searchTnas로 실제 MRT 상품 + 커버 사진 →
초안 생성 → 발행 → 메인 캐러셀 맨 앞에 사진과 함께 자동 노출.

# 시연용 에이전트 프롬프트 (호스트-create 채팅창에 그대로 붙여넣기)

```
서울에서 하루에 3:3로 만나는 취향 기반 액티비티 소개팅 이벤트를 만들어줘.
아침엔 한강 보트, 점심엔 미술관 도슨트 투어, 저녁엔 사격 또는 야구 관람으로
아침/점심/저녁 시간대별 액티비티를 묶어줘.
각 시간대 액티비티에 맞는 마이리얼트립 상품을 searchTnas로 찾아서 붙이고,
커버 이미지는 한강이나 서울 액티비티 대표 사진으로 해줘.
결제·예약 확정 같은 표현은 빼고 '관심/참여' 톤으로, 공개 이벤트로 만들어줘.
```

(짧은 버전)
```
아침 한강 보트, 점심 미술관 도슨트, 저녁 사격으로 묶은 서울 3:3 소개팅 이벤트 만들어줘.
각 액티비티에 맞는 마이리얼트립 상품을 searchTnas로 찾아 붙이고, 커버는 한강 사진으로.
```

# 사전 기동 (라이브 에이전트가 동작하려면 — 키 게이트)
1. 본체 Next dev: `cd ~/ourrealtrip && npm run dev` → localhost:3000 (Terminal 창에서, 닫지 말 것)
2. GGUI 스택: `cd ~/ourrealtrip/ggui && pnpm dev --verbose`
   - ggui(6781)/todo(6782)/agent(6790) 동시 기동. `ggui/.env.local`의 CLAUDE_CODE_OAUTH_TOKEN 필요(출력·커밋 금지).
3. host-create MCP(별도): `cd ~/ourrealtrip/ggui && pnpm --filter @ggui/mcp-host-create start` (포트 6783)
4. manifest 확인: mcpServers = ggui/todo/myrealtrip/host_create

# 시연 단계
1. localhost:3000 → 상단 '이벤트 등록하기' (/host/create)
2. 우측 패널 "에이전트 연결됨" 확인 → 위 프롬프트 붙여넣기·전송
3. 에이전트가 searchTnas(실 MRT)·host_safety_check·host_create_apply 자율 호출 → '에이전트 제안' 카드
4. '페이지에 반영' → 좌측 폼 채워짐 → '미리보기로 이동' → /host/preview/<id>
5. '발행' → /e/<slug> 공개 페이지
6. 메인('/')으로 이동/새로고침 → 캐러셀 맨 앞에 방금 이벤트가 커버 사진과 함께 노출

# 폴백 (라이브 에이전트 흐름이 막힐 때)
- GGUI 스택/키 문제로 라이브 생성이 안 되면: 미리 발행해 둔 동일 이벤트가 메인 캐러셀에 이미
  떠 있는 상태로 "이렇게 자동 노출됩니다"를 보여주고, 생성 과정은 화면 녹화/스크린샷으로 대체.
- 커버가 안 붙으면(에이전트가 이미지 URL 전사 누락) extractTnaImageFromEntries가 searchTnas
  결과에서 직접 추출 → 그래도 비면 글리프 폴백 카드로 노출(깨짐 아님).

# 핵심 메시지
"사람이 큐레이션, API가 그라운딩." 결제 안 받음(merchant 아님) — 관심→마음 모임→상품 링크.
