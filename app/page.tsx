// "/" 홈 = Discover (docs/DISCOVER.md 1·8절 D1, PRD 12절)
//
// 결정 D1: 랜딩("/")을 Discover로 렌더한다. /discover는 동일 화면을 가리키는 보조 경로다.
// 단일 출처를 위해 app/discover/page.tsx 컴포넌트를 그대로 재노출한다(중복 구현 금지).
// 두 경로가 같은 서버 컴포넌트를 렌더하므로 화면·데이터·고지가 항상 동일하다.

export { default } from "@/app/discover/page";
