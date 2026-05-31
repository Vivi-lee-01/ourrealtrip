// 금지 문구 단일 출처 + 빌드/테스트 가드 헬퍼 (PRD 17-2, ARCHITECTURE.md 8절)
//
// 어느 산출물(UI 카피·버튼·상품제목·OG·메타)에도 등장하면 안 되는 문구.
// 제3자(마이리얼트립) 상품 제목·설명에 포함된 프로모션·특가 강조 문구는
// 화면 표기 시 중립화한다 — 우리가 그 주장을 하는 것처럼 보이면 안 된다.

export const BANNED_PHRASES: readonly string[] = [
  "공식 추천",
  "단독 특가",
  "최저가 보장",
  "예약 가능 보장",
  "전체 예약하기",
  "패키지 구매하기",
  "이 일정 그대로 예약하기",
  "예약하면 수익 보장",
  "누구나 여행으로 돈 번다",
  "방문자 캐시백",
] as const;

/**
 * 내부 전략어(철학어) — 사용자-facing 카피에 절대 노출 금지 (PRD 17-4).
 * 의도/목적은 사용자 언어로 번역해서 노출한다.
 */
export const BANNED_INTERNAL_TERMS: readonly string[] = [
  "대학 언번들링",
  "AI 네이티브 탤런트",
  "AI-native talent",
] as const;

/** assertNoBanned 위반 시 던지는 에러 */
export class BannedPhraseError extends Error {
  constructor(
    public readonly matched: string,
    public readonly context: string,
  ) {
    super(
      `[banned-phrase] 금지 문구 "${matched}" 가 카피에 포함됨` +
        (context ? ` (context: ${context})` : ""),
    );
    this.name = "BannedPhraseError";
  }
}

/**
 * 텍스트에 금지 문구/내부 전략어가 포함됐는지 검사한다.
 * 빌드/테스트 가드용 — 위반 시 BannedPhraseError를 던진다.
 *
 * @param text 검사할 사용자-facing 카피
 * @param context 위반 위치 식별용 라벨(선택)
 */
export function assertNoBanned(text: string, context = ""): void {
  if (!text) return;
  const haystack = text.normalize("NFC");
  for (const phrase of [...BANNED_PHRASES, ...BANNED_INTERNAL_TERMS]) {
    if (haystack.includes(phrase)) {
      throw new BannedPhraseError(phrase, context);
    }
  }
}

/**
 * 던지지 않는 검사 버전 — 발견된 금지 문구 목록을 반환한다.
 * 가드 리포트/일괄 검사용.
 */
export function findBanned(text: string): string[] {
  if (!text) return [];
  const haystack = text.normalize("NFC");
  return [...BANNED_PHRASES, ...BANNED_INTERNAL_TERMS].filter((phrase) =>
    haystack.includes(phrase),
  );
}
