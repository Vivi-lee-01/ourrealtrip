"use client";

// 호스트 이벤트 생성 폼 — Plaud식 Q&A 작업대 적용 (2026-05-30)
//
// 구조:
//  - 왼쪽 3/5: 실제로 생성·발행될 이벤트 페이지 편집면
//  - 오른쪽 2/5: 에이전트에게 질문하고, 마음에 드는 답만 페이지에 반영하는 작업대
//
// 원칙:
//  - 에이전트가 외부 발행/예약을 직접 수행하지 않는다.
//  - “실시간 반영 로그”가 아니라 Q&A → 사용자 확인 → 페이지 반영 흐름이다.
//  - 상품은 마이리얼트립 판매처 개별 예약으로 연결한다. 단일 패키지/묶음결제로 보이지 않게 한다.

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import Button from "@/components/ui/Button";
import ReactQueryProvider from "@/components/host/ReactQueryProvider";
import { coverGradient, coverInitial } from "@/lib/cover";
import { createEventDraftAction } from "@/app/host/create/actions";
import {
  AUDIENCE_OPTIONS,
  COMMUNITY_OPTIONS,
  MOOD_PRESETS,
  LOCATION_VISIBILITY_OPTIONS,
  SUGGESTED_PARTICIPATION_QUESTIONS,
  TIMEZONE_OPTIONS,
  coverCandidates,
} from "@/lib/host-create/presets";
import type {
  ProductType,
  EventAudience,
  LocationVisibility,
  MoodPreset,
  ScheduleCandidate,
  DraftOption,
} from "@/lib/types";
import type { HostCreateAgentPayload } from "@/lib/host-create/agentPayload";
import type { SafetyCheckInput } from "@/lib/host-create/safetyCheck";
import { stripMarkdown } from "@/lib/host-create/markdown";

// 에이전트 작업대는 브라우저 전용(AppRenderer = 샌드박스 iframe + postMessage).
// SSR 비활성으로 동적 로드 — 서버 렌더 시 window/localStorage 접근 크래시 방지.
const HostCreateAgentPanel = dynamic(
  () => import("@/components/host/HostCreateAgentPanel"),
  { ssr: false },
);

type CreateMode = "human" | "agent";

interface ProductRow {
  title: string;
  price_hint: string;
  source_url: string;
  product_type: ProductType;
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tna: "투어·티켓·액티비티",
  stay: "숙소",
  flight: "항공",
};

function emptyRow(): ProductRow {
  return { title: "", price_hint: "", source_url: "", product_type: "tna" };
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function PreviewSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "초안 저장 중…" : "미리보기로 이동"}
    </Button>
  );
}

// 공통 입력 — 문서형 페이지 안에서 과하게 폼처럼 보이지 않도록 얇은 선만 사용
const INPUT =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-body " +
  "text-ink placeholder:text-ink-faint focus-visible:border-brand focus-visible:outline-none";
const LABEL = "text-label font-medium text-ink-muted";

// 작성 중 초안 자동 보존 키 — 로그인 왕복 등 페이지 이탈에도 폼이 날아가지 않게 한다.
const DRAFT_LS_KEY = "ourrealtrip/host-create-draft";

export default function CreateEventForm() {
  const [mode, setMode] = useState<CreateMode>("human");
  const [title, setTitle] = useState("");
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [dateText, setDateText] = useState("");
  const [startDate, setStartDate] = useState("2026-06-22");
  const [startTime, setStartTime] = useState("19:00");
  const [endDate, setEndDate] = useState("2026-06-22");
  const [endTime, setEndTime] = useState("21:30");
  const [timezone, setTimezone] = useState("GMT+09:00 서울");
  const [locationText, setLocationText] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [capacityLimitEnabled, setCapacityLimitEnabled] = useState(false);
  const [capacity, setCapacity] = useState("50");
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [rows, setRows] = useState<ProductRow[]>([emptyRow()]);
  const [agentFilled, setAgentFilled] = useState(false);
  // ── P1 필드 ──
  const [audience, setAudience] = useState<EventAudience>("private");
  const [communityId, setCommunityId] = useState("");
  const [locationVisibility, setLocationVisibility] =
    useState<LocationVisibility>("area");
  const [mood, setMood] = useState<MoodPreset | "">("");
  const [participationQuestions, setParticipationQuestions] = useState("");
  // ── P2 foundation: 에이전트가 제안하면 채워지고 그대로 저장된다 ──
  const [scheduleCandidates, setScheduleCandidates] = useState<ScheduleCandidate[]>([]);
  const [eventOptions, setEventOptions] = useState<DraftOption[]>([]);

  // ── 작성 중 초안 자동 보존 (로그인 왕복·새로고침·페이지 이탈에도 유지) ──
  // hydrated 가 true 가 되기 전(=복원 완료 전)에는 저장 effect 가 동작하지 않게 막아,
  // 마운트 첫 렌더의 빈 값이 저장본을 덮어쓰는 레이스를 차단한다.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_LS_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Record<string, unknown>;
        const s = (v: unknown) => (typeof v === "string" ? v : undefined);
        const b = (v: unknown) => (typeof v === "boolean" ? v : undefined);
        if (s(d.title) !== undefined) setTitle(d.title as string);
        if (s(d.concept) !== undefined) setConcept(d.concept as string);
        if (s(d.description) !== undefined) setDescription(d.description as string);
        if (s(d.dateText) !== undefined) setDateText(d.dateText as string);
        if (s(d.startDate) !== undefined) setStartDate(d.startDate as string);
        if (s(d.startTime) !== undefined) setStartTime(d.startTime as string);
        if (s(d.endDate) !== undefined) setEndDate(d.endDate as string);
        if (s(d.endTime) !== undefined) setEndTime(d.endTime as string);
        if (s(d.timezone) !== undefined) setTimezone(d.timezone as string);
        if (s(d.locationText) !== undefined) setLocationText(d.locationText as string);
        if (s(d.coverUrl) !== undefined) setCoverUrl(d.coverUrl as string);
        if (b(d.requiresApproval) !== undefined) setRequiresApproval(d.requiresApproval as boolean);
        if (b(d.capacityLimitEnabled) !== undefined) setCapacityLimitEnabled(d.capacityLimitEnabled as boolean);
        if (s(d.capacity) !== undefined) setCapacity(d.capacity as string);
        if (b(d.waitlistEnabled) !== undefined) setWaitlistEnabled(d.waitlistEnabled as boolean);
        if (Array.isArray(d.rows) && d.rows.length > 0) setRows(d.rows as ProductRow[]);
        if (b(d.agentFilled) !== undefined) setAgentFilled(d.agentFilled as boolean);
        if (s(d.audience) !== undefined) setAudience(d.audience as EventAudience);
        if (s(d.communityId) !== undefined) setCommunityId(d.communityId as string);
        if (s(d.locationVisibility) !== undefined) setLocationVisibility(d.locationVisibility as LocationVisibility);
        if (s(d.mood) !== undefined) setMood(d.mood as MoodPreset | "");
        if (s(d.participationQuestions) !== undefined) setParticipationQuestions(d.participationQuestions as string);
        if (Array.isArray(d.scheduleCandidates)) setScheduleCandidates(d.scheduleCandidates as ScheduleCandidate[]);
        if (Array.isArray(d.eventOptions)) setEventOptions(d.eventOptions as DraftOption[]);
      }
    } catch {
      // 손상된 저장본은 무시하고 빈 폼으로 시작
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // 복원 완료 전에는 저장 금지(덮어쓰기 방지)
    try {
      localStorage.setItem(
        DRAFT_LS_KEY,
        JSON.stringify({
          title, concept, description, dateText, startDate, startTime, endDate, endTime,
          timezone, locationText, coverUrl, requiresApproval, capacityLimitEnabled, capacity,
          waitlistEnabled, rows, agentFilled, audience, communityId, locationVisibility, mood,
          participationQuestions, scheduleCandidates, eventOptions,
        }),
      );
    } catch {
      // 저장 실패(용량 등)는 조용히 무시 — 폼 동작은 막지 않는다
    }
  }, [hydrated, title, concept, description, dateText, startDate, startTime, endDate, endTime, timezone, locationText, coverUrl, requiresApproval, capacityLimitEnabled, capacity, waitlistEnabled, rows, agentFilled, audience, communityId, locationVisibility, mood, participationQuestions, scheduleCandidates, eventOptions]);

  const gradient = coverGradient(title || "ourrealtrip");
  const initial = coverInitial(title || "이벤트");
  // 시작·종료 일자가 다르면 자동으로 여러 날(종료 날짜 표기), 같으면 당일 일정.
  const computedDateText =
    dateText ||
    `${startDate} ${startTime} – ${endDate !== startDate ? `${endDate} ` : ""}${endTime} · ${timezone}`;

  // P1-3 커버 후보(컨셉/제목 시드 기반, 외부 이미지 불필요)
  const coverCands = useMemo(
    () => coverCandidates(title || concept || "아워리얼트립", 4),
    [title, concept],
  );

  // ── Agent → 페이지 반영 브리지 ──
  // HostCreateAgentPanel 이 검증된 payload(HostCreateAgentPayload)를 넘기면, 호스트가
  // "페이지에 반영"을 누른 뒤 이 함수로 폼을 채운다. 에이전트 자동 발행은 없다.
  // (구 postMessage/iframe 브리지는 @ggui-ai/react 직접 통합으로 대체·제거됨)
  function applyPayload(payload: HostCreateAgentPayload) {
    // 폼 필드는 평문 표시면 — 에이전트가 섞어 보낸 마크다운 마커 제거
    if (payload.title !== undefined) setTitle(stripMarkdown(payload.title));
    if (payload.concept !== undefined) setConcept(stripMarkdown(payload.concept));
    if (payload.description !== undefined) setDescription(stripMarkdown(payload.description));
    if (payload.date_text !== undefined) setDateText(payload.date_text);
    if (payload.timezone !== undefined) setTimezone(payload.timezone);
    if (payload.location_text !== undefined) setLocationText(payload.location_text);
    if (payload.cover_image_url !== undefined) setCoverUrl(payload.cover_image_url);
    if (payload.requires_approval !== undefined) {
      setRequiresApproval(payload.requires_approval);
    }
    if (payload.recruit_capacity !== undefined) {
      setCapacityLimitEnabled(true);
      setCapacity(String(payload.recruit_capacity));
    }
    if (payload.waitlist_enabled !== undefined) {
      setWaitlistEnabled(payload.waitlist_enabled);
    }
    if (payload.product_links && payload.product_links.length > 0) {
      const mapped: ProductRow[] = payload.product_links.slice(0, 10).map((pl) => ({
        title: pl.title,
        price_hint: pl.price_hint ?? "",
        source_url: pl.source_url ?? "",
        product_type: pl.product_type,
      }));
      setRows(mapped.length > 0 ? mapped : [emptyRow()]);
    }
    // P1 필드
    if (payload.visibility !== undefined) setAudience(payload.visibility);
    if (payload.community_id !== undefined) setCommunityId(payload.community_id);
    if (payload.location_visibility !== undefined) {
      setLocationVisibility(payload.location_visibility);
    }
    if (payload.mood !== undefined) setMood(payload.mood);
    if (payload.participation_questions && payload.participation_questions.length > 0) {
      setParticipationQuestions(payload.participation_questions.join("\n"));
    }
    // P2 foundation: 일정 후보 / 옵션 비교
    if (payload.schedule_candidates && payload.schedule_candidates.length > 0) {
      setScheduleCandidates(
        payload.schedule_candidates.map((s) => ({
          label: s.label,
          date_text: s.date_text,
          pros: s.pros ?? null,
          cons: s.cons ?? null,
        })),
      );
    }
    if (payload.options && payload.options.length > 0) {
      setEventOptions(
        payload.options.map((o) => ({
          option_name: o.option_name,
          option_type: o.option_type ?? null,
          description: o.description ?? null,
          estimated_budget: o.estimated_budget ?? null,
          fit_reason: o.fit_reason ?? null,
          risk_note: o.risk_note ?? null,
          schedule_difficulty: o.schedule_difficulty ?? null,
        })),
      );
    }
    setMode("agent");
    setAgentFilled(true);
  }

  // 라이브 안전 점검 입력(현재 왼쪽 초안 기준) — 작업대에 전달
  const draftSafety = useMemo<SafetyCheckInput>(
    () => ({
      title,
      concept,
      description,
      productCount: rows.filter((r) => r.title.trim() !== "").length,
      locationVisibility,
      capacityEnabled: capacityLimitEnabled,
    }),
    [title, concept, description, rows, locationVisibility, capacityLimitEnabled],
  );

  function handleCoverUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCoverUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function updateRow(i: number, patch: Partial<ProductRow>) {
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => (prev.length >= 10 ? prev : [...prev, emptyRow()]));
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={createEventDraftAction} className="space-y-5">
      <input type="hidden" name="created_via" value={mode} />
      {/* P2 foundation: 에이전트 제안 일정후보/옵션을 JSON으로 그대로 저장 */}
      <input
        type="hidden"
        name="schedule_candidates"
        value={JSON.stringify(scheduleCandidates)}
      />
      <input type="hidden" name="options" value={JSON.stringify(eventOptions)} />

      {agentFilled && (
        <div className="rounded-lg border border-brand bg-brand-soft px-3 py-2 text-label text-brand-softfg">
          에이전트 답변을 페이지에 반영했습니다. 왼쪽 초안을 검토한 뒤 미리보기로 이동하세요.
        </div>
      )}

      <div className="grid grid-cols-1 gap-7 rounded-sheet border border-surface-border bg-surface shadow-card lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
        {/* ───────── 왼쪽 3/5: 이벤트 페이지 ───────── */}
        <section className="space-y-8 p-5 sm:p-8 lg:p-9">
          <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0 space-y-3">
              <input
                name="title"
                placeholder="이벤트 이름"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-0 bg-transparent px-0 text-[2.5rem] font-bold leading-[1.12] tracking-[-0.04em] text-ink placeholder:text-ink-faint focus-visible:outline-none sm:text-[3rem]"
              />
              <input
                name="concept"
                placeholder="한 줄 컨셉"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full border-0 bg-transparent px-0 text-h2 font-normal text-ink-muted placeholder:text-ink-faint focus-visible:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="overflow-hidden rounded-xl border border-surface-border">
                <div className="relative aspect-[4/3] w-full">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt="커버 미리보기"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className={`absolute inset-0 flex items-center justify-center ${gradient}`}
                    >
                      <span className="select-none font-mono text-5xl font-bold text-white/40">
                        {initial}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <input type="hidden" name="cover_image_url" value={coverUrl} />
              {/* P1-3 컨셉 기반 커버 후보 4종(외부 이미지 API 불필요) */}
              <div className="grid grid-cols-4 gap-1.5">
                {coverCands.map(({ cat, url }) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCoverUrl(url)}
                    title={cat.label}
                    aria-label={`${cat.label} 커버`}
                    className={cx(
                      "overflow-hidden rounded-md border",
                      coverUrl === url ? "border-brand" : "border-surface-border",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={cat.label} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer rounded-lg border border-surface-border bg-surface px-3 py-2 text-center text-caption font-medium text-ink hover:bg-surface-soft">
                  업로드
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                  />
                </label>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-caption font-medium text-ink-muted hover:bg-surface-soft"
                  >
                    비우기
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-h1 text-ink">이벤트 정보</h2>
            <div className="border-l-4 border-surface-border pl-4">
              <input type="hidden" name="date_text" value={computedDateText} />
              <input type="hidden" name="timezone" value={timezone} />
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className={LABEL}>시작</p>
                    <div className="grid grid-cols-[1fr_110px] gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setStartDate(v);
                          if (endDate < v) setEndDate(v); // 종료일이 시작일보다 빠르면 보정
                        }}
                        className={INPUT}
                      />
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={INPUT} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className={LABEL}>종료</p>
                    <div className="grid grid-cols-[1fr_110px] gap-2">
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={INPUT}
                      />
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={INPUT} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
                  <div className="space-y-1.5">
                    <p className={LABEL}>시간대</p>
                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={INPUT}>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className={LABEL}>장소</p>
                    <input
                      name="location_text"
                      placeholder="오프라인 주소 또는 가상 링크"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      className={INPUT}
                    />
                    {/* P1-5 장소 공개 수준 */}
                    <select
                      name="location_visibility"
                      value={locationVisibility}
                      onChange={(e) =>
                        setLocationVisibility(e.target.value as LocationVisibility)
                      }
                      aria-label="장소 공개 수준"
                      className={cx(INPUT, "text-label text-ink-muted")}
                    >
                      {LOCATION_VISIBILITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          공개 수준 · {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* P1: 공개 범위(P1-1) · 커뮤니티 채널(P1-2) · 분위기(P1-4) */}
          <div className="space-y-4">
            <h2 className="text-h1 text-ink">공개 &amp; 분위기</h2>
            <input type="hidden" name="audience" value={audience} />
            <input type="hidden" name="community_id" value={communityId} />
            <input type="hidden" name="mood" value={mood} />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className={LABEL}>공개 범위</p>
                <div className="inline-flex rounded-xl border border-surface-border bg-surface p-1">
                  {AUDIENCE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setAudience(o.value)}
                      title={o.description}
                      className={cx(
                        "rounded-lg px-3 py-2 text-label font-medium",
                        audience === o.value ? "bg-surface-sunken text-ink" : "text-ink-muted",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-caption text-ink-faint">
                  {AUDIENCE_OPTIONS.find((o) => o.value === audience)?.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className={LABEL}>커뮤니티 / 채널</p>
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className={INPUT}
                  >
                    {COMMUNITY_OPTIONS.map((o) => (
                      <option key={o.value || "__personal__"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-caption text-ink-faint">
                    {COMMUNITY_OPTIONS.find((o) => o.value === communityId)?.note}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className={LABEL}>분위기</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MOOD_PRESETS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMood((prev) => (prev === m.value ? "" : m.value))}
                        title={m.tone}
                        className={cx(
                          "rounded-pill border px-3 py-1.5 text-label font-medium transition",
                          mood === m.value
                            ? "border-brand bg-brand-soft text-brand-softfg"
                            : "border-surface-border bg-surface text-ink hover:bg-surface-soft",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-h1 text-ink">이벤트 소개</h2>
            <textarea
              name="description"
              rows={6}
              placeholder="어떤 이야기인지, 누구와 함께하고 싶은지."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cx(INPUT, "resize-y text-body leading-7")}
            />
          </div>

          {/* P2 foundation: 일정 후보(P2-1) · 옵션 비교(P2-2) — 에이전트 제안 시 표시 */}
          {(scheduleCandidates.length > 0 || eventOptions.length > 0) && (
            <div className="space-y-5">
              {scheduleCandidates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-h1 text-ink">일정 후보</h2>
                    <button
                      type="button"
                      onClick={() => setScheduleCandidates([])}
                      className="text-label text-ink-faint hover:text-ink"
                    >
                      비우기
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {scheduleCandidates.map((s, i) => (
                      <li key={i} className="rounded-xl border border-surface-border p-3">
                        <p className="text-body font-medium text-ink">
                          {s.label} · {s.date_text}
                        </p>
                        {(s.pros || s.cons) && (
                          <p className="mt-0.5 text-caption text-ink-muted">
                            {s.pros ? `좋은 점: ${s.pros}` : ""}
                            {s.pros && s.cons ? " · " : ""}
                            {s.cons ? `아쉬운 점: ${s.cons}` : ""}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="text-caption text-ink-faint">
                    관심자 투표는 발행 후 단계에서 받습니다.
                  </p>
                </div>
              )}
              {eventOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-h1 text-ink">옵션 비교</h2>
                    <button
                      type="button"
                      onClick={() => setEventOptions([])}
                      className="text-label text-ink-faint hover:text-ink"
                    >
                      비우기
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {eventOptions.map((o, i) => (
                      <div key={i} className="space-y-1 rounded-xl border border-surface-border p-3">
                        <p className="text-body font-medium text-ink">{o.option_name}</p>
                        {o.description && (
                          <p className="text-caption text-ink-muted">{o.description}</p>
                        )}
                        {o.estimated_budget && (
                          <p className="text-caption text-ink-faint">예상 예산 {o.estimated_budget}</p>
                        )}
                        {o.fit_reason && (
                          <p className="text-caption text-ink-muted">적합: {o.fit_reason}</p>
                        )}
                        {o.risk_note && (
                          <p className="text-caption text-ink-faint">유의: {o.risk_note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="h-px bg-surface-border" />

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_250px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-h1 text-ink">연결 상품</h2>
                <button
                  type="button"
                  onClick={addRow}
                  className="text-label font-medium text-brand hover:underline"
                >
                  상품 추가
                </button>
              </div>
              <div className="space-y-3">
                {rows.map((row, i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-surface-border p-3">
                    <div className="flex items-center gap-2">
                      <input
                        name={`pl_title_${i}`}
                        placeholder="상품명"
                        value={row.title}
                        onChange={(e) => updateRow(i, { title: e.target.value })}
                        className="flex-1 border-0 bg-transparent px-0 text-body font-medium text-ink placeholder:text-ink-faint focus-visible:outline-none"
                      />
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          aria-label="상품 제거"
                          className="px-1 text-ink-faint hover:text-ink"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        name={`pl_price_${i}`}
                        placeholder="가격 (예: 45,000원~)"
                        value={row.price_hint}
                        onChange={(e) => updateRow(i, { price_hint: e.target.value })}
                        className="rounded-md border border-surface-border bg-surface px-2.5 py-1.5 text-label text-ink placeholder:text-ink-faint focus-visible:border-brand focus-visible:outline-none"
                      />
                      <input
                        name={`pl_url_${i}`}
                        type="url"
                        placeholder="마이리얼트립 상품 URL"
                        value={row.source_url}
                        onChange={(e) => updateRow(i, { source_url: e.target.value })}
                        className="rounded-md border border-surface-border bg-surface px-2.5 py-1.5 text-label text-ink placeholder:text-ink-faint focus-visible:border-brand focus-visible:outline-none sm:col-span-2"
                      />
                    </div>
                    <select
                      name={`pl_type_${i}`}
                      value={row.product_type}
                      onChange={(e) => updateRow(i, { product_type: e.target.value as ProductType })}
                      className="rounded-md border border-surface-border bg-surface px-2.5 py-1.5 text-label text-ink-muted focus-visible:border-brand focus-visible:outline-none"
                    >
                      {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((type) => (
                        <option key={type} value={type}>
                          {PRODUCT_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" name={`pl_source_${i}`} value="마이리얼트립" />
                  </div>
                ))}
              </div>
              <p className="text-caption text-ink-faint">
                예약은 각 상품 판매처에서 개별 진행됩니다. 단일 결제/패키지처럼 보이지 않게 표시합니다.
              </p>
            </div>

            <aside className="space-y-0 overflow-hidden rounded-xl border border-surface-border bg-surface-soft">
              <h3 className="px-4 py-3 text-h3 text-ink">발행 옵션</h3>
              {requiresApproval && <input type="hidden" name="requires_approval" value="on" />}
              {waitlistEnabled && <input type="hidden" name="waitlist_enabled" value="on" />}
              <button
                type="button"
                onClick={() => setRequiresApproval((prev) => !prev)}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 border-t border-surface-border px-4 py-3 text-left"
                aria-pressed={requiresApproval}
              >
                <span className="text-body-sm text-ink">승인 필요</span>
                <span className="relative inline-flex items-center">
                  <span className={cx("h-7 w-12 rounded-pill transition-colors", requiresApproval ? "bg-ink" : "bg-surface-border")} />
                  <span className={cx("absolute left-1 h-5 w-5 rounded-full bg-surface shadow-card transition-transform", requiresApproval && "translate-x-5")} />
                </span>
              </button>
              {/* P1-6 승인 필요 시 신청자 질문 설정 */}
              {requiresApproval && (
                <div className="space-y-2 border-t border-surface-border px-4 py-3">
                  <p className="text-label font-medium text-ink-muted">참여 질문 (선택)</p>
                  <textarea
                    name="participation_questions"
                    value={participationQuestions}
                    onChange={(e) => setParticipationQuestions(e.target.value)}
                    rows={3}
                    placeholder={"한 줄에 하나씩\n예: 혼자 오시나요, 함께 오시나요?"}
                    className="w-full resize-y rounded-lg border border-surface-border bg-surface px-3 py-2 text-label text-ink placeholder:text-ink-faint focus-visible:border-brand focus-visible:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PARTICIPATION_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() =>
                          setParticipationQuestions((prev) =>
                            prev.includes(q) ? prev : (prev ? prev + "\n" : "") + q,
                          )
                        }
                        className="rounded-pill border border-surface-border bg-surface px-2.5 py-1 text-caption text-ink-muted hover:bg-surface-soft"
                      >
                        + {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setCapacityLimitEnabled((prev) => !prev)}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 border-t border-surface-border px-4 py-3 text-left"
                aria-pressed={capacityLimitEnabled}
              >
                <span className="text-body-sm text-ink">이벤트 정원 제한</span>
                <span className="relative inline-flex items-center">
                  <span className={cx("h-7 w-12 rounded-pill transition-colors", capacityLimitEnabled ? "bg-ink" : "bg-surface-border")} />
                  <span className={cx("absolute left-1 h-5 w-5 rounded-full bg-surface shadow-card transition-transform", capacityLimitEnabled && "translate-x-5")} />
                </span>
              </button>
              {capacityLimitEnabled && (
                <div className="grid grid-cols-[1fr_92px] items-center gap-3 border-t border-surface-border px-4 py-3">
                  <span className="text-body-sm text-ink">최대 수용 인원</span>
                  <input
                    name="recruit_capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-right text-body text-ink focus-visible:border-brand focus-visible:outline-none"
                  />
                </div>
              )}
              {!capacityLimitEnabled && <input type="hidden" name="recruit_capacity" value="" />}
              <button
                type="button"
                onClick={() => setWaitlistEnabled((prev) => !prev)}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 border-t border-surface-border px-4 py-3 text-left"
                aria-pressed={waitlistEnabled}
              >
                <span className="text-body-sm text-ink">초과 용량 대기자 명단</span>
                <span className="relative inline-flex items-center">
                  <span className={cx("h-7 w-12 rounded-pill transition-colors", waitlistEnabled ? "bg-ink" : "bg-surface-border")} />
                  <span className={cx("absolute left-1 h-5 w-5 rounded-full bg-surface shadow-card transition-transform", waitlistEnabled && "translate-x-5")} />
                </span>
              </button>
              <div className="space-y-3 border-t border-surface-border p-4">
                <PreviewSubmitButton />
                <p className="text-caption text-ink-faint">
                  제목을 비워도 초안은 만들 수 있습니다. 공개 전 승인 단계가 한 번 더 있습니다.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* ───────── 오른쪽 2/5: 에이전트 작업대 (@ggui-ai/react 직접 통합) ───────── */}
        <aside className="border-t border-surface-border p-5 sm:p-6 lg:border-l lg:border-t-0">
          <ReactQueryProvider>
            <HostCreateAgentPanel
              onApplyPayload={applyPayload}
              draftSafety={draftSafety}
            />
          </ReactQueryProvider>
        </aside>
      </div>
    </form>
  );
}
