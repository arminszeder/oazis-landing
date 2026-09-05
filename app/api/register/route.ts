import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";
import { CATEGORY_NAMES, SIZES, SOURCE_VALUES } from "@/lib/tournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME = 120;
const MAX_PHONE = 40;
const MAX_NOTE = 2000;

// Coarse per-IP throttle. Serverless instances each keep their own map, so this
// stops a bored browser tab rather than a determined attacker — the real barrier
// is that the service key never leaves the server.
const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return fail("Túl sok próbálkozás. Várj egy percet, aztán próbáld újra.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Hibás kérés.");
  }

  // Honeypot. Bots fill every field they find; people never see this one.
  // Answer as if it worked so the bot has nothing to learn from.
  if (text(body.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const mode = body.mode;
  if (mode !== "pair" && mode !== "solo") return fail("Hiányzó nevezési mód.");

  const category = text(body.category, 40);
  if (!CATEGORY_NAMES.includes(category)) return fail("Válassz kategóriát.");

  const p1_name = text(body.p1_name, MAX_NAME);
  if (!p1_name) return fail("A név megadása kötelező.");

  const p1_phone = text(body.p1_phone, MAX_PHONE);
  if ((p1_phone.match(/\d/g) ?? []).length < 6) {
    return fail("Adj meg egy érvényes telefonszámot.");
  }

  const p1_size = text(body.p1_size, 4);
  if (!SIZES.includes(p1_size as (typeof SIZES)[number])) return fail("Válassz mezméretet.");

  let p2_name: string | null = null;
  let p2_size: string | null = null;
  if (mode === "pair") {
    p2_name = text(body.p2_name, MAX_NAME) || null;
    p2_size = text(body.p2_size, 4) || null;
    if (!p2_name) return fail("A 2. játékos nevének megadása kötelező.");
    if (!p2_size || !SIZES.includes(p2_size as (typeof SIZES)[number])) {
      return fail("Válassz mezméretet a 2. játékosnak.");
    }
  }

  const sources = Array.isArray(body.sources)
    ? [...new Set(body.sources.map((s) => text(s, 40)).filter((s) => SOURCE_VALUES.includes(s)))]
    : [];

  const row = {
    mode,
    category,
    p1_name,
    p1_phone,
    p1_size,
    p2_name,
    p2_size,
    note: text(body.note, MAX_NOTE) || null,
    sources,
    newsletter: body.newsletter === true,
  };

  try {
    const { error } = await serverClient().from("registrations").insert(row);
    if (error) throw new Error(`${error.code ?? "?"}: ${error.message}`);
  } catch (err) {
    // Missing env vars land here too, which is exactly the case worth shouting
    // about in the logs — the visitor just sees "try again or call us".
    console.error("registration insert failed", err);
    return fail("Nem sikerült menteni a nevezést. Próbáld újra, vagy hívj minket.", 500);
  }

  return NextResponse.json({ ok: true });
}
