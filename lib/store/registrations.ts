// 참가 신청(Registration) 스토어 — Phase 1 (백엔드 없음)
//
// 발행된 이벤트(/e/[slug])에 참가자가 신청한 기록을 .data/registrations.json 에 저장.
// .data/는 gitignore. Supabase 교체 시 시그니처 유지한 채 내부만 insert/select로 교체.
//
// Luma 대응: 이벤트가 requires_approval이면 신청은 pending(승인 대기)로 들어가고,
//   호스트가 대시보드에서 approved/declined 처리. 승인 불필요면 즉시 confirmed.
// ★ 결제와 무관: 신청은 "참가 의사" 기록일 뿐, 상품 결제는 마이리얼트립에서 각자(/go).

import { promises as fs } from "node:fs";
import path from "node:path";

// Vercel 서버리스는 읽기전용 FS → /tmp 로 분기 (로컬은 프로젝트 루트 .data)
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "ourrealtrip-data")
  : path.join(process.cwd(), ".data");
const REG_FILE = path.join(DATA_DIR, "registrations.json");

/** 신청 상태 — 승인 흐름 */
export type RegistrationStatus =
  | "pending" // 승인 대기(requires_approval=true)
  | "confirmed" // 확정(승인 불필요 시 즉시, 또는 호스트 승인)
  | "declined" // 호스트 거절
  | "cancelled"; // 참가자 취소

export interface Registration {
  registration_id: string;
  /** 대상 이벤트 draft_id */
  event_id: string;
  /** 신청자 표시 이름 */
  name: string;
  /** 연락 수단(이메일 또는 자유 텍스트) */
  contact: string | null;
  /** 신청 시 한마디(선택) */
  message: string | null;
  status: RegistrationStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateRegistrationInput {
  event_id: string;
  name: string;
  contact?: string | null;
  message?: string | null;
  /** 이벤트가 승인 필요면 pending, 아니면 confirmed로 시작 */
  requires_approval: boolean;
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRegs(): Promise<Registration[]> {
  try {
    const raw = await fs.readFile(REG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Registration[]) : [];
  } catch {
    return [];
  }
}

async function writeRegs(rows: Registration[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(REG_FILE, JSON.stringify(rows, null, 2), "utf8");
}

/** 신청 한 건 생성 — 승인 필요 여부에 따라 초기 상태 결정 */
export async function createRegistration(
  input: CreateRegistrationInput,
): Promise<Registration> {
  const now = new Date().toISOString();
  const reg: Registration = {
    registration_id: crypto.randomUUID(),
    event_id: input.event_id,
    name: input.name.trim(),
    contact: input.contact?.trim() || null,
    message: input.message?.trim() || null,
    status: input.requires_approval ? "pending" : "confirmed",
    created_at: now,
    updated_at: now,
  };
  const rows = await readRegs();
  rows.push(reg);
  await writeRegs(rows);
  return reg;
}

/** 이벤트의 신청 목록(최근 신청 우선) */
export async function listRegistrationsByEvent(
  eventId: string,
): Promise<Registration[]> {
  const rows = await readRegs();
  return rows
    .filter((r) => r.event_id === eventId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** 호스트의 신청 상태 변경(승인/거절) — 대시보드에서 사용 */
export async function setRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus,
): Promise<Registration | null> {
  const rows = await readRegs();
  const idx = rows.findIndex((r) => r.registration_id === registrationId);
  if (idx < 0) return null;
  rows[idx] = {
    ...rows[idx],
    status,
    updated_at: new Date().toISOString(),
  };
  await writeRegs(rows);
  return rows[idx];
}

/** 이벤트의 확정(confirmed) 신청 수 — 공개 페이지 "N명 참가" 표시용 */
export async function countConfirmed(eventId: string): Promise<number> {
  const rows = await readRegs();
  return rows.filter(
    (r) => r.event_id === eventId && r.status === "confirmed",
  ).length;
}
