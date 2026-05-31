// Booking Signal Sync — 상태/출처/신뢰도 도메인 규칙 (PRD 9-9, COMMERCE_MODEL 3)
//
// ★ 안전경계의 단일 출처. 외부 검증 결제완료(externally_confirmed_booked)는
//   오직 source=external_api ingestion으로만 도달 가능하다(현재 미연결, PRD 18-5).
//   자가표시 API·/go·호스트 확인 어디서도 이 상태를 만들 수 없다(아래 가드).

import type {
  BookingProgressStatus,
  BookingProgressSource,
  BookingProgressConfidence,
} from "@/lib/types";

/** 진행 순서 rank — 단조 전진/되돌림 판정용. cancelled는 분기라 별도 취급. */
const STATUS_RANK: Record<BookingProgressStatus, number> = {
  pending: 0,
  clicked_booking_link: 1,
  booking_intent: 2,
  self_reported_booked: 3,
  host_confirmed_booked: 4,
  externally_confirmed_booked: 5,
  cancelled_or_refunded: -1, // 분기 — rank 비교 대상 아님
};

/** 참여자 자가표시 API(POST /api/booking-progress)로 허용되는 status. */
export const PARTICIPANT_SELF_REPORT_STATUSES: readonly BookingProgressStatus[] =
  ["clicked_booking_link", "booking_intent", "self_reported_booked", "cancelled_or_refunded"];

/** 호스트 수동 확인(host-confirm)으로 허용되는 status. */
export const HOST_CONFIRM_STATUSES: readonly BookingProgressStatus[] = [
  "host_confirmed_booked",
  "cancelled_or_refunded",
];

/** /go 자동 기록으로 되돌리면 안 되는(완료·검증) 상태. */
export const PRESERVE_OVER_CLICK_STATUSES: readonly BookingProgressStatus[] = [
  "booking_intent",
  "self_reported_booked",
  "host_confirmed_booked",
  "externally_confirmed_booked",
];

/** source별 부여 가능한 신뢰도 상한 (PRD 9-9-2). */
const SOURCE_CONFIDENCE: Record<BookingProgressSource, BookingProgressConfidence> = {
  internal: "low",
  redirect_tracking: "medium",
  participant_self_report: "medium",
  host_manual: "high",
  external_api: "verified",
};

/** source로부터 신뢰도를 산정한다(단일 규칙). */
export function confidenceForSource(
  source: BookingProgressSource,
): BookingProgressConfidence {
  return SOURCE_CONFIDENCE[source];
}

/** status로부터 기본 source를 추론한다(자가표시/클릭 경로). */
export function defaultSourceForStatus(
  status: BookingProgressStatus,
): BookingProgressSource {
  switch (status) {
    case "pending":
      return "internal";
    case "clicked_booking_link":
      return "redirect_tracking";
    case "host_confirmed_booked":
      return "host_manual";
    case "externally_confirmed_booked":
      return "external_api";
    default:
      // booking_intent / self_reported_booked / cancelled_or_refunded
      return "participant_self_report";
  }
}

/**
 * ★ 안전 가드: 외부 검증 결제완료는 자가/클릭/호스트 입력으로 만들 수 없다.
 * source=external_api ingestion(미연결)에서만 허용. true면 거부해야 한다.
 */
export function isExternallyConfirmedForbidden(
  status: BookingProgressStatus,
  source: BookingProgressSource,
): boolean {
  if (status === "externally_confirmed_booked") return source !== "external_api";
  // verified 신뢰도는 external_api에서만 (배지 위조 방지)
  return false;
}

/** 새 status가 기존 status를 (완료/검증 보존 관점에서) 되돌리는지. */
export function wouldDowngrade(
  existing: BookingProgressStatus,
  next: BookingProgressStatus,
): boolean {
  if (next === "cancelled_or_refunded") return false; // 취소는 항상 허용
  if (existing === "cancelled_or_refunded") return false;
  return STATUS_RANK[next] < STATUS_RANK[existing];
}

/** UI 표기용 라벨(status). "결제완료" 단정 금지 — 출처를 라벨에 녹인다. */
export const BOOKING_STATUS_LABEL: Record<BookingProgressStatus, string> = {
  pending: "미진행",
  clicked_booking_link: "예약 링크 클릭",
  booking_intent: "예약 예정",
  self_reported_booked: "예약함(자가보고)",
  host_confirmed_booked: "예약 확인(호스트)",
  externally_confirmed_booked: "예약 확정(외부검증)",
  cancelled_or_refunded: "취소·환불",
};

/** UI 표기용 라벨(source). */
export const BOOKING_SOURCE_LABEL: Record<BookingProgressSource, string> = {
  internal: "내부",
  redirect_tracking: "클릭추적",
  participant_self_report: "참여자 자가보고",
  host_manual: "호스트 확인",
  external_api: "외부 검증",
};
