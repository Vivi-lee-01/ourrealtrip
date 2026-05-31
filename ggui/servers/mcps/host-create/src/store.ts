import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { HostCreateAgentPayload } from './schema.js';
import type { HostCreateAuthContext } from './auth.js';

export interface McpEventDraft {
  draft_id: string;
  slug: string;
  host_user_id: string | null;
  title: string;
  concept: string | null;
  description: string | null;
  date_text: string | null;
  timezone: string | null;
  location_text: string | null;
  cover_image_url: string | null;
  recruit_capacity: number | null;
  requires_approval: boolean;
  waitlist_enabled: boolean;
  visibility: 'public' | 'unlisted';
  audience: 'public' | 'private';
  community_id: string | null;
  location_visibility: string | null;
  mood: string | null;
  participation_questions: string[];
  schedule_candidates: unknown[];
  options: unknown[];
  lifecycle: string;
  product_links: Array<{
    product_type: 'tna' | 'stay' | 'flight';
    source: string;
    title: string;
    price_hint: string | null;
    source_url: string | null;
    myrealtrip_product_id: string | null;
  }>;
  created_via: 'human' | 'agent' | 'mcp';
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function appRoot(): string {
  return process.env.OURREALTRIP_APP_ROOT?.trim() || path.resolve(process.cwd(), '../../..');
}

const draftsPath = () => path.join(appRoot(), '.data', 'drafts.json');

async function readDrafts(): Promise<McpEventDraft[]> {
  try {
    const raw = await fs.readFile(draftsPath(), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as McpEventDraft[]) : [];
  } catch {
    return [];
  }
}

async function writeDrafts(rows: McpEventDraft[]): Promise<void> {
  const file = draftsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), 'utf8');
}

function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base.length >= 2 ? `${base}-${suffix}` : `event-${suffix}`;
}

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeAudience(value: HostCreateAgentPayload['visibility']): 'public' | 'private' {
  return value === 'public' ? 'public' : 'private';
}

function normalizeProductLinks(payload: HostCreateAgentPayload): McpEventDraft['product_links'] {
  return (payload.product_links ?? []).slice(0, 10).map((link) => ({
    product_type: link.product_type,
    source: '마이리얼트립',
    title: link.title,
    price_hint: text(link.price_hint),
    source_url: text(link.source_url),
    myrealtrip_product_id: null,
  }));
}

export async function createDraftFromPayload(
  payload: HostCreateAgentPayload,
  auth: HostCreateAuthContext,
): Promise<McpEventDraft> {
  const title = text(payload.title) ?? '새 이벤트';
  const now = new Date().toISOString();
  const audience = normalizeAudience(payload.visibility);
  const draft: McpEventDraft = {
    draft_id: randomUUID(),
    slug: slugify(title),
    host_user_id: auth.userId,
    title,
    concept: text(payload.concept),
    description: text(payload.description),
    date_text: text(payload.date_text),
    timezone: text(payload.timezone),
    location_text: text(payload.location_text),
    cover_image_url: text(payload.cover_image_url),
    recruit_capacity: payload.recruit_capacity ?? null,
    requires_approval: payload.requires_approval ?? true,
    waitlist_enabled: payload.waitlist_enabled ?? true,
    visibility: audience === 'public' ? 'public' : 'unlisted',
    audience,
    community_id: text(payload.community_id),
    location_visibility: payload.location_visibility ?? null,
    mood: payload.mood ?? null,
    participation_questions: payload.participation_questions ?? [],
    schedule_candidates: payload.schedule_candidates ?? [],
    options: payload.options ?? [],
    lifecycle: 'draft',
    product_links: normalizeProductLinks(payload),
    created_via: 'mcp',
    status: 'draft',
    published_at: null,
    created_at: now,
    updated_at: now,
  };
  const rows = await readDrafts();
  rows.push(draft);
  await writeDrafts(rows);
  return draft;
}

export async function updateDraftFromPayload(
  draftId: string,
  payload: HostCreateAgentPayload,
  auth: HostCreateAuthContext,
): Promise<McpEventDraft | null> {
  const rows = await readDrafts();
  const idx = rows.findIndex((draft) => draft.draft_id === draftId);
  if (idx < 0) return null;
  const current = rows[idx]!;
  if (current.host_user_id && current.host_user_id !== auth.userId) return null;
  if (current.status === 'published') throw new Error('published event cannot be updated by MCP');

  const audience = payload.visibility ? normalizeAudience(payload.visibility) : current.audience;
  const next: McpEventDraft = {
    ...current,
    title: text(payload.title) ?? current.title,
    concept: payload.concept === undefined ? current.concept : text(payload.concept),
    description: payload.description === undefined ? current.description : text(payload.description),
    date_text: payload.date_text === undefined ? current.date_text : text(payload.date_text),
    timezone: payload.timezone === undefined ? current.timezone : text(payload.timezone),
    location_text: payload.location_text === undefined ? current.location_text : text(payload.location_text),
    cover_image_url: payload.cover_image_url === undefined ? current.cover_image_url : text(payload.cover_image_url),
    recruit_capacity: payload.recruit_capacity === undefined ? current.recruit_capacity : payload.recruit_capacity,
    requires_approval: payload.requires_approval ?? current.requires_approval,
    waitlist_enabled: payload.waitlist_enabled ?? current.waitlist_enabled,
    audience,
    visibility: audience === 'public' ? 'public' : 'unlisted',
    community_id: payload.community_id === undefined ? current.community_id : text(payload.community_id),
    location_visibility: payload.location_visibility ?? current.location_visibility,
    mood: payload.mood ?? current.mood,
    participation_questions: payload.participation_questions ?? current.participation_questions,
    schedule_candidates: payload.schedule_candidates ?? current.schedule_candidates,
    options: payload.options ?? current.options,
    product_links: payload.product_links ? normalizeProductLinks(payload) : current.product_links,
    updated_at: new Date().toISOString(),
  };
  rows[idx] = next;
  await writeDrafts(rows);
  return next;
}

export async function getOwnedDraft(
  draftId: string,
  auth: HostCreateAuthContext,
): Promise<McpEventDraft | null> {
  const rows = await readDrafts();
  const draft = rows.find((row) => row.draft_id === draftId) ?? null;
  if (!draft) return null;
  if (draft.host_user_id && draft.host_user_id !== auth.userId) return null;
  return draft;
}

export async function listOwnedDrafts(auth: HostCreateAuthContext): Promise<McpEventDraft[]> {
  const rows = await readDrafts();
  return rows
    .filter((row) => !row.host_user_id || row.host_user_id === auth.userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function publishOwnedDraft(
  draftId: string,
  auth: HostCreateAuthContext,
): Promise<McpEventDraft | null> {
  const rows = await readDrafts();
  const idx = rows.findIndex((draft) => draft.draft_id === draftId);
  if (idx < 0) return null;
  if (rows[idx]!.host_user_id && rows[idx]!.host_user_id !== auth.userId) return null;
  const now = new Date().toISOString();
  rows[idx] = {
    ...rows[idx]!,
    status: 'published',
    published_at: rows[idx]!.published_at ?? now,
    updated_at: now,
  };
  await writeDrafts(rows);
  return rows[idx]!;
}
