// 웹 모드 호스트-크리에이트 에이전트 (공개 Vercel 배포용)
//
// 왜 필요한가
//   기존 HostCreateAgentPanel 은 GGUI MCP-Apps 백엔드(localhost:6790)를 요구한다.
//   그 백엔드는 공개 웹에 없고, HTTPS 페이지에서 http://localhost 로는 mixed-content 차단이라
//   배포본에서 "Failed to fetch" 가 난다. 이 라우트는 GGUI 없이 서버사이드에서 LLM 을
//   직접 호출해 이벤트 프로그램 초안을 만든다. 키는 서버에만 머문다(브라우저 노출 0).
//
// 프로바이더: OpenAI Chat Completions (response_format=json_object 로 유효 JSON 강제).
//
// 계약: POST { prompt } → { summary, payload }
//   payload 는 클라이언트의 validateAgentPayload 가 한 번 더 정규화한다(느슨한 JSON 허용).
//
// A방식 안전 불변식(merchant 아님): 결제/정산/예약확정 문구 금지, product_links 는 표시 전용.

import { NextResponse } from "next/server";
import { validateAgentPayload, type HostCreateAgentPayload } from "@/lib/host-create/agentPayload";

export const runtime = "nodejs";
export const maxDuration = 60;

// 폭넓게 가용한 모델. 키 권한에 따라 OPENAI_MODEL 환경변수로 덮어쓸 수 있다.
const MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o";

const SYSTEM = `당신은 "아워리얼트립"의 호스트 이벤트 생성 보조 에이전트입니다.
호스트가 적은 아이디어를, 같이 가볼 만한 "스토리가 있는 이벤트/액티비티"로 번역해 구조화 초안을 만듭니다.

반드시 아래 형태의 JSON 객체 하나만 반환하세요(JSON 외 텍스트 금지):
{
  "summary": "<호스트에게 건네는 1~2문장 한국어 요약>",
  "payload": {
    "title": "<매력적인 제목>",
    "concept": "<한 줄 컨셉>",
    "description": "<3~5문장. 처음 온 사람도 어색하지 않게 진행 맥락 포함>",
    "date_text": "<예: 2026년 6월 21일 토요일 19:00–21:30>",
    "timezone": "GMT+09:00 서울",
    "location_text": "<지역/동선. 너무 구체적 주소는 피함>",
    "visibility": "public",
    "requires_approval": true,
    "recruit_capacity": <적정 인원 정수>,
    "waitlist_enabled": true,
    "mood": "<quiet|casual|deep|active|local|premium 중 하나>",
    "location_visibility": "area",
    "participation_questions": ["<신청자에게 물을 질문 1~3개>"],
    "product_links": [
      { "title": "<마이리얼트립에서 붙일 만한 체험/상품>", "price_hint": "<예: 45,000원~>", "source_url": "https://www.myrealtrip.com/", "product_type": "tna", "reason": "<왜 이 상품인지>", "caution": "예약은 판매처에서 개별 진행" }
    ],
    "safety_notes": ["<오해 소지 표현을 어떻게 다듬었는지 1~3개>"]
  }
}

규칙:
- 결제·정산·예약확정·묶음결제 같은 표현 금지. product_links 는 "표시·연결"만 합니다(아워리얼트립은 판매자가 아님).
- "소개팅"처럼만 읽히지 않도록 활동·경험·대화 중심으로 다듬고, 다듬은 점을 safety_notes 에 적으세요.
- 한국어로, 따뜻하고 구체적으로 작성하세요. product_links 는 1~3개면 충분합니다.`;

interface OpenAIChoice {
  message?: { content?: string };
}

interface MrtProduct {
  title: string;
  price_hint: string | null;
  source_url: string | null;
  image_url: string | null;
  reason: string | null;
}

const MYREALTRIP_MCP_URL =
  process.env.MYREALTRIP_MCP_URL?.trim() ||
  process.env.GGUI_MYREALTRIP_MCP_URL?.trim() ||
  "https://mcp-servers.myrealtrip.com/mcp";

/** 코드펜스/잡텍스트가 섞여도 첫 { … 마지막 } 블록을 파싱 (json_object 면 보통 그대로 통과) */
function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function textIncludesAny(text: string, words: readonly string[]): boolean {
  return words.some((word) => text.includes(word));
}

function buildTnaQueries(prompt: string, payload: HostCreateAgentPayload): string[] {
  const source = [
    prompt,
    payload.title,
    payload.concept,
    payload.description,
    payload.location_text,
  ]
    .filter((v): v is string => typeof v === "string")
    .join(" ");

  const cities = ["서울", "부산", "제주", "도쿄", "오사카", "교토", "후쿠오카", "발리", "방콕"];
  const city = cities.find((c) => source.includes(c)) ?? "서울";
  const queries = new Set<string>();

  if (textIncludesAny(source, ["클래스", "워크숍", "체험", "만들", "쿠킹", "드로잉", "공방"])) {
    queries.add(`${city} 클래스`);
    queries.add(`${city} 체험`);
  }
  if (textIncludesAny(source, ["투어", "도슨트", "산책", "골목", "야경", "궁", "로컬"])) {
    queries.add(`${city} 투어`);
  }
  if (textIncludesAny(source, ["액티비티", "러닝", "서핑", "아웃도어", "보트", "운동"])) {
    queries.add(`${city} 액티비티`);
  }

  // 너무 긴 자연어는 searchTnas에서 0건이 잘 나므로, 마지막 안전망은 도시 단독 검색.
  queries.add(city);
  return Array.from(queries).slice(0, 4);
}

async function callMcpTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(MYREALTRIP_MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  if (!res.ok) throw new Error(`MyRealTrip MCP ${res.status}`);
  return (await res.json()) as unknown;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function collectStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((item) => collectStrings(item, out));
  else if (v && typeof v === "object") {
    Object.values(v as Record<string, unknown>).forEach((item) => collectStrings(item, out));
  }
  return out;
}

function parseMrtProducts(raw: unknown): MrtProduct[] {
  const root = asRecord(raw);
  const content = root && asRecord(root.result)?.content;
  const firstText = Array.isArray(content)
    ? content
        .map((item) => asRecord(item))
        .find((item) => item?.type === "text" && typeof item.text === "string")?.text
    : undefined;
  if (typeof firstText !== "string") return [];

  let widget: unknown;
  try {
    widget = JSON.parse(firstText).widget;
  } catch {
    return [];
  }

  const items = asRecord(widget)?.children;
  if (!Array.isArray(items)) return [];

  const nonProductLabels = new Set([
    "ListView",
    "ListViewItem",
    "Box",
    "Row",
    "Col",
    "Text",
    "Image",
    "Button",
    "row",
    "column",
    "lg",
    "xl",
    "xs",
    "sm",
    "bold",
    "medium",
    "center",
    "between",
    "stretch",
    "cover",
    "primary",
    "client",
    "none",
    "open_url",
    "100%",
    "이미지",
    "예약하기",
  ]);

  const products: MrtProduct[] = [];
  for (const item of items) {
    const strings = collectStrings(item);
    const title = strings.find(
      (s) =>
        s.length >= 3 &&
        !nonProductLabels.has(s) &&
        !s.startsWith("http") &&
        !s.includes("예약하기") &&
        !/^⭐/.test(s) &&
        !/^[0-9,]+원~?$/.test(s) &&
        !/^#[0-9A-Fa-f]{3,8}$/.test(s),
    );
    if (!title) continue;

    const price = strings.find((s) => /^[0-9,]+원~?$/.test(s)) ?? null;
    const url = strings.find((s) => /^https:\/\/(?:experiences\.)?myrealtrip\.com\//.test(s)) ?? null;
    const image = strings.find((s) => /^https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"']*)?$/i.test(s)) ?? null;
    if (!url) continue;

    products.push({
      title,
      price_hint: price,
      source_url: url,
      image_url: image,
      reason: "실제 MyRealTrip 검색 결과",
    });
    if (products.length >= 3) break;
  }
  return products;
}

async function searchMyRealTripProducts(
  prompt: string,
  payload: HostCreateAgentPayload,
): Promise<MrtProduct[]> {
  const seen = new Set<string>();
  const out: MrtProduct[] = [];
  for (const query of buildTnaQueries(prompt, payload)) {
    try {
      const raw = await callMcpTool("searchTnas", { query, page: 1, perPage: 5 });
      for (const product of parseMrtProducts(raw)) {
        const key = product.source_url ?? product.title;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(product);
        if (out.length >= 3) return out;
      }
    } catch {
      // MyRealTrip MCP는 보조 enrichment다. 실패해도 초안 생성 자체는 막지 않는다.
    }
  }
  return out;
}

async function enrichWithRealProducts(
  prompt: string,
  payload: HostCreateAgentPayload,
): Promise<HostCreateAgentPayload> {
  const products = await searchMyRealTripProducts(prompt, payload);
  if (products.length === 0) return payload;
  return {
    ...payload,
    cover_image_url: payload.cover_image_url ?? products.find((p) => p.image_url)?.image_url ?? undefined,
    product_links: products.map((p) => ({
      title: p.title,
      price_hint: p.price_hint,
      source_url: p.source_url,
      product_type: "tna" as const,
      reason: p.reason,
      caution: "예약은 판매처에서 개별 진행",
    })),
  };
}

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "서버에 OPENAI_API_KEY 가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  let prompt = "";
  try {
    const body = (await req.json()) as { prompt?: unknown };
    if (typeof body.prompt === "string") prompt = body.prompt;
  } catch {
    // 본문 파싱 실패는 아래 빈 prompt 가드로 떨어진다
  }
  if (!prompt.trim()) {
    return NextResponse.json({ error: "prompt 가 필요합니다." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `OpenAI 호출 실패: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `OpenAI ${res.status}`, detail: detail.slice(0, 300) },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { choices?: OpenAIChoice[] };
  const text = data.choices?.[0]?.message?.content ?? "";

  const parsed = extractJson(text);
  const payload = await enrichWithRealProducts(
    prompt,
    validateAgentPayload(parsed?.payload),
  );
  const summary =
    typeof parsed?.summary === "string" && parsed.summary.trim().length > 0
      ? parsed.summary
      : "이벤트 초안을 만들었어요. 오른쪽 제안 카드를 확인하고 “페이지에 반영”을 눌러주세요.";

  return NextResponse.json({ summary, payload });
}
