~/ourrealtrip/HANDOFF_NEXT_SESSION.md 파일을 먼저 읽고, 거기 설명된 아워리얼트립 세션을 이어가줘.

해야 할 일:
1. 지금 뭐 하던 중이었는지 5줄 이내로 요약해줘.
2. 특히 최신 논점인 Booking Signal Sync / Conversion Feedback Loop를 확인해줘.
   - 참여자가 MyRealTrip에서 결제/예약하면 OurRealTrip에 “결제완료”처럼 반영되는 아이디어.
   - 단, 외부 verified 결제완료는 MyRealTrip webhook/postback/reporting API/reservation status lookup이 있을 때만 가능하다는 안전 경계를 지켜.
   - MVP에서는 click tracking, booking intent, self_reported_booked, host_confirmed_booked, externally_confirmed_booked를 분리해.
3. 이어서 작업할지 나에게 물어봐. 추천 next step은 다음 중 하나로 제안해줘:
   A. PRD/docs에 Booking Signal Sync 상태 모델 반영
   B. 호스트 AI-create / GGUI cockpit 구현 범위 확정
   C. 실제 코드에 booking signal 상태/대시보드 반영
   D. 참여자 화면 디자인 피드백 반영

중요 제약:
- 프로젝트명은 아워리얼트립 / OurRealTrip.
- 피봇하지 않음. Luma식 커뮤니티 이벤트/여행 생성 + MyRealTrip 실제 상품 그라운딩 유지.
- 커뮤니티 + 액티비티/3-액티비티/랜덤소개팅형은 대표 유스케이스이지 제품 전체를 하루짜리 소개팅 앱으로 제한하지 말 것.
- 사람과 에이전트가 동등한 생성 주체다. 에이전트도 API/MCP로 draft 생성, 상품 조회, 프로그램 조합, 질문 생성, 신호 요약을 할 수 있어야 한다.
- 발행, 외부 공유, booking_open, 제휴 링크 노출, 결제/예약 확정처럼 보이는 문구는 사람 승인 게이트 필요.
- OurRealTrip은 merchant가 아니다. 묶음결제/우리 결제수취/호스트 정산/패키지 판매 금지.
- MyRealTrip API 키는 /Users/vivi/ourrealtrip/.env.local에만 있고, 절대 출력하지 말 것.

참고 파일:
- /Users/vivi/ourrealtrip/HANDOFF_NEXT_SESSION.md
- /Users/vivi/ourrealtrip/HANDOFF_FOR_VERIFIER.md
- /Users/vivi/ourrealtrip/PRD.md
- /Users/vivi/ourrealtrip/docs/HOST_AI_CREATE.md
- /Users/vivi/ourrealtrip/docs/ARCHITECTURE.md
- /Users/vivi/ourrealtrip/docs/COMMERCE_MODEL.md
