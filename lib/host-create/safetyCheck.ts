// 안전 문구 자동 점검 (P0-5) — 발행 전 오해 소지 표현을 잡아낸다.
//
// 단일 출처 금지문구(lib/copy/banned-phrases.ts)의 findBanned()를 재사용하고,
// 그 위에 "맥락형" 위험 패턴(결제완료/예약확정/확정가/소개팅/장소 과다공개 등)을
// 얹는다. 금지문구 리스트를 포크하지 않는다 — 정합성 단일 출처 유지.
//
// ★ 아워리얼트립은 merchant 아님: "결제 완료/예약 확정/확정가/묶음결제"는 전부
//   오해 소지 표현. 외부 판매처 개별 예약으로 보이도록 대체 문구를 제안한다.

import { findBanned } from "@/lib/copy/banned-phrases";
import type { LocationVisibility } from "./agentPayload";

export type SafetySeverity = "high" | "medium" | "low";

export interface SafetyFinding {
  id: string;
  severity: SafetySeverity;
  /** 무엇이 위험한지 */
  message: string;
  /** 어떻게 바꾸면 되는지 */
  suggestion: string;
  /** 걸린 문구(있으면) */
  matched?: string;
}

export interface SafetyCheckInput {
  title?: string | null;
  concept?: string | null;
  description?: string | null;
  /** 연결 상품 수 */
  productCount?: number;
  /** 장소 공개 수준 */
  locationVisibility?: LocationVisibility | null;
  /** 정원 제한 사용 여부 */
  capacityEnabled?: boolean;
}

interface RiskPattern {
  id: string;
  re: RegExp;
  severity: SafetySeverity;
  message: string;
  suggestion: string;
}

// 맥락형 위험 패턴 — 사용자 입력 본문(title+concept+description) 대상
const RISK_PATTERNS: readonly RiskPattern[] = [
  {
    id: "payment-done",
    re: /결제\s*완료|결제됨|구매\s*완료/,
    severity: "high",
    message: "‘결제 완료’처럼 보이는 표현이 있습니다. 아워리얼트립은 결제를 받지 않습니다.",
    suggestion: "‘예약은 각 상품 판매처에서 개별 진행됩니다’처럼 결제 주체가 외부임을 분명히 하세요.",
  },
  {
    id: "booking-confirmed",
    re: /예약\s*확정|확정\s*예약|예약이?\s*완료/,
    severity: "high",
    message: "‘예약 확정’ 표현은 외부 검증 없이는 단정할 수 없습니다.",
    suggestion: "‘예약하러 가기’ 또는 ‘관심 표시’처럼 신호 단계로 표현하세요. 확정은 판매처가 합니다.",
  },
  {
    id: "fixed-price",
    re: /확정가|최종가|정가\b/,
    severity: "medium",
    message: "가격이 ‘확정가’처럼 보입니다. 가격·재고는 확인 시점 기준으로 바뀔 수 있습니다.",
    suggestion: "‘45,000원~’처럼 표시 가격임을 드러내고 ‘확인 시점 기준’ 고지를 함께 두세요.",
  },
  {
    id: "bundle-payment",
    re: /묶음\s*결제|일괄\s*결제|단일\s*결제|패키지\s*가격|정산/,
    severity: "high",
    message: "‘묶음/일괄/패키지 결제·정산’은 단일 판매자처럼 오해됩니다.",
    suggestion: "상품은 각각 별도 판매처 링크로 두고, 묶음 결제 표현을 제거하세요.",
  },
  {
    id: "dating-matching",
    re: /소개팅|매칭\s*서비스|미팅\s*주선|짝\s*찾기/,
    severity: "medium",
    message: "소개팅·매칭 서비스처럼 읽힐 수 있는 표현이 있습니다.",
    suggestion: "‘함께 같은 장면을 보는 모임’처럼 활동·관심사 중심 문구로 바꾸세요.",
  },
];

/**
 * 입력 본문 + 메타를 점검해 위험 findings를 반환한다. 비어 있으면 [].
 * 빌드/렌더 어디서도 throw하지 않는다(UI 경고용).
 */
export function runSafetyCheck(input: SafetyCheckInput): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const body = [input.title, input.concept, input.description]
    .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    .join("\n")
    .normalize("NFC");

  // 1) 단일 출처 금지문구 (재사용)
  for (const matched of findBanned(body)) {
    findings.push({
      id: `banned:${matched}`,
      severity: "high",
      message: `금지 문구 ‘${matched}’ 가 포함되어 있습니다.`,
      suggestion: "중립적 표현으로 바꾸세요. 우리가 그 주장을 하는 것처럼 보이면 안 됩니다.",
      matched,
    });
  }

  // 2) 맥락형 위험 패턴
  for (const p of RISK_PATTERNS) {
    const m = body.match(p.re);
    if (m) {
      findings.push({
        id: p.id,
        severity: p.severity,
        message: p.message,
        suggestion: p.suggestion,
        matched: m[0],
      });
    }
  }

  // 3) 장소 공개 수준 과다 (낯선 사람 모임 안전)
  if (input.locationVisibility === "exact") {
    findings.push({
      id: "location-exact",
      severity: "low",
      message: "정확한 주소를 처음부터 공개하도록 설정돼 있습니다.",
      suggestion: "낯선 사람이 섞이는 모임이라면 ‘대략적 지역’ 또는 ‘승인 후 공개’를 권합니다.",
    });
  }

  // 4) 정원 + 외부 예약 혼동
  if (input.capacityEnabled && (input.productCount ?? 0) > 0) {
    findings.push({
      id: "capacity-vs-booking",
      severity: "low",
      message: "‘정원’과 ‘외부 상품 예약 가능 수량’이 혼동될 수 있습니다.",
      suggestion: "정원은 모임 참가 인원, 상품 예약은 각 판매처 사정임을 구분해 안내하세요.",
    });
  }

  return findings;
}

/** findings 중 가장 높은 심각도(없으면 null) */
export function highestSeverity(findings: SafetyFinding[]): SafetySeverity | null {
  if (findings.some((f) => f.severity === "high")) return "high";
  if (findings.some((f) => f.severity === "medium")) return "medium";
  if (findings.some((f) => f.severity === "low")) return "low";
  return null;
}
