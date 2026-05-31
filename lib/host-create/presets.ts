// 호스트 이벤트 생성 — P1 프리셋/옵션 단일 출처
//
// 공개 범위(P1-1) · 커뮤니티 채널(P1-2) · 커버 카테고리(P1-3) · 분위기(P1-4) ·
// 장소 공개 수준(P1-5) 의 라벨/설명을 한 곳에 모은다. create UI + preview + 에이전트
// 가 동일 출처를 참조하도록 한다.
//
// 외부 이미지 API 없이 gradient/SVG 템플릿으로 커버 후보를 만든다(데모 안정성 우선).

import type {
  EventAudience,
  LocationVisibility,
  MoodPreset,
} from "@/lib/types";

// ── P1-1. 공개 범위 ──
export const AUDIENCE_OPTIONS: ReadonlyArray<{
  value: EventAudience;
  label: string;
  description: string;
}> = [
  { value: "public", label: "공개", description: "누구나 탐색에서 볼 수 있어요." },
  { value: "private", label: "비공개", description: "링크를 받은 사람만 볼 수 있어요." },
];

// ── P1-2. 커뮤니티/호스트 채널 (seed 의 community_id 와 정합) ──
export const COMMUNITY_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
  note: string;
}> = [
  { value: "", label: "개인으로 열기", note: "커뮤니티 없이 내 이름으로 모집해요." },
  {
    value: "comm-filmwalk-seoul",
    label: "필름워크 서울",
    note: "이 커뮤니티 운영자는 이벤트를 함께 관리할 수 있어요.",
  },
  {
    value: "comm-build-and-move",
    label: "빌드앤무브",
    note: "이 커뮤니티 운영자는 이벤트를 함께 관리할 수 있어요.",
  },
  {
    value: "comm-wave-salon",
    label: "파도살롱",
    note: "이 커뮤니티 운영자는 이벤트를 함께 관리할 수 있어요.",
  },
  { value: "__new__", label: "새 커뮤니티 만들기", note: "발행 후 커뮤니티를 새로 만들 수 있어요." },
];

// ── P1-4. 분위기/테마 프리셋 ──
export const MOOD_PRESETS: ReadonlyArray<{
  value: MoodPreset;
  label: string;
  tone: string;
}> = [
  { value: "quiet", label: "조용한 취향 모임", tone: "차분하고 사려 깊은 톤" },
  { value: "casual", label: "가볍게 합류", tone: "부담 없는 친근한 톤" },
  { value: "deep", label: "깊은 대화", tone: "진솔하고 밀도 있는 톤" },
  { value: "active", label: "액티브", tone: "활기차고 에너지 있는 톤" },
  { value: "local", label: "로컬 여행", tone: "동네를 안내하듯 따뜻한 톤" },
  { value: "premium", label: "프리미엄 큐레이션", tone: "정제되고 단정한 톤" },
];

// ── P1-5. 장소 공개 수준 ──
export const LOCATION_VISIBILITY_OPTIONS: ReadonlyArray<{
  value: LocationVisibility;
  label: string;
}> = [
  { value: "exact", label: "정확한 주소" },
  { value: "area", label: "대략적 지역" },
  { value: "after_approval", label: "승인 후 공개" },
  { value: "online", label: "온라인 링크" },
  { value: "tbd", label: "미정" },
];

// ── P1-6. 승인 질문 추천 (requires_approval 시) ──
export const SUGGESTED_PARTICIPATION_QUESTIONS: readonly string[] = [
  "이 모임에 관심 있는 이유가 궁금해요.",
  "혼자 오시나요, 함께 오시나요?",
  "선호하는 일정이나 예산이 있나요?",
];

// ── 시간대 (Luma 대응 — 전 GMT offset 커버, offset 순 정렬) ──
// 표시 문자열을 그대로 값으로 저장한다(date_text에 텍스트로 들어감).
export const TIMEZONE_OPTIONS: readonly string[] = [
  "GMT-12:00 베이커섬",
  "GMT-11:00 미드웨이",
  "GMT-10:00 하와이",
  "GMT-09:00 알래스카",
  "GMT-08:00 로스앤젤레스",
  "GMT-07:00 덴버",
  "GMT-06:00 시카고",
  "GMT-05:00 뉴욕",
  "GMT-04:00 산티아고",
  "GMT-03:30 뉴펀들랜드",
  "GMT-03:00 상파울루",
  "GMT-02:00 페르난두지노로냐",
  "GMT-01:00 아조레스",
  "GMT+00:00 런던",
  "GMT+01:00 파리",
  "GMT+02:00 카이로",
  "GMT+03:00 모스크바",
  "GMT+03:30 테헤란",
  "GMT+04:00 두바이",
  "GMT+04:30 카불",
  "GMT+05:00 카라치",
  "GMT+05:30 뉴델리",
  "GMT+05:45 카트만두",
  "GMT+06:00 다카",
  "GMT+06:30 양곤",
  "GMT+07:00 방콕",
  "GMT+08:00 싱가포르",
  "GMT+08:00 홍콩",
  "GMT+08:00 베이징",
  "GMT+09:00 서울",
  "GMT+09:00 도쿄",
  "GMT+09:30 애들레이드",
  "GMT+10:00 시드니",
  "GMT+11:00 솔로몬제도",
  "GMT+12:00 오클랜드",
  "GMT+13:00 누쿠알로파",
  "GMT+14:00 키리바시",
];

// ── P1-3. 커버 카테고리 (저채도 그라데이션 팔레트) ──
// 무지개 카테고리 색 금지(DESIGN_BRIEF) — 차분한 듀오톤만 사용.
export interface CoverCategory {
  key: string;
  label: string;
  /** SVG 그라데이션 stop 색(저채도) */
  from: string;
  to: string;
}

export const COVER_CATEGORIES: readonly CoverCategory[] = [
  { key: "citywalk", label: "도시 산책", from: "#1f2937", to: "#374151" },
  { key: "film", label: "사진·필름", from: "#334155", to: "#475569" },
  { key: "wine", label: "와인·바", from: "#3b2f3a", to: "#5b4651" },
  { key: "run", label: "러닝·아웃도어", from: "#1e3a34", to: "#2f5249" },
  { key: "book", label: "책·대화", from: "#3a3327", to: "#574d3a" },
  { key: "workation", label: "워케이션", from: "#26303f", to: "#3a4a63" },
  { key: "localtour", label: "로컬 투어", from: "#2c3326", to: "#444f39" },
  { key: "class", label: "원데이 클래스", from: "#322b3a", to: "#4b4059" },
  { key: "mt", label: "커뮤니티 MT", from: "#2a3340", to: "#3c4a5e" },
  { key: "overseas", label: "해외 소도시", from: "#1f3340", to: "#2f4d5e" },
];

/** 카테고리 팔레트로 1:1 커버 SVG data URL 생성(외부 이미지 불필요).
 *  ★ 워터마크 텍스트 없음 — placeholder처럼 보이지 않게 차분한 듀오톤 그라데이션만.
 *  실사진 커버는 에이전트(MyRealTrip 상품 사진)나 업로드로 채운다. */
export function makeCoverDataUrl(cat: CoverCategory): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${cat.from}" />
          <stop offset="1" stop-color="${cat.to}" />
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="22%" r="72%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.16" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="900" rx="48" fill="url(#g)" />
      <rect width="1200" height="900" rx="48" fill="url(#glow)" />
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 컨셉/제목 시드로 커버 후보 N개(서로 다른 카테고리 팔레트) 생성 */
export function coverCandidates(seed: string, count = 4): Array<{ cat: CoverCategory; url: string }> {
  const label = seed || "아워리얼트립";
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0;
  const start = Math.abs(h) % COVER_CATEGORIES.length;
  const picks: Array<{ cat: CoverCategory; url: string }> = [];
  for (let i = 0; i < Math.min(count, COVER_CATEGORIES.length); i++) {
    const cat = COVER_CATEGORIES[(start + i) % COVER_CATEGORIES.length];
    picks.push({ cat, url: makeCoverDataUrl(cat) });
  }
  return picks;
}

