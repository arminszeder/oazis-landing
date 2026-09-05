import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";
import { CATEGORY_NAMES, PHONE_PREFIXES, SIZES, SOURCE_VALUES } from "@/lib/tournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME = 120;
const MAX_PHONE = 40;

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

  // A real registration is a couple of KB. Anything vastly larger is either a
  // mistake or an attempt to make the function do pointless work.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 64_000) return fail("Túl nagy kérés.", 413);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Hibás kérés.");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail("Hibás kérés.");
  }

  // Honeypot. Bots fill every field they find; people never see this one.
  // Answer as if it worked so the bot has nothing to learn from — but log it,
  // so a real entry swallowed by a rogue autofill is at least traceable.
  if (text(body.kedvenc_szin, 200)) {
    console.warn("honeypot triggered, submission dropped", { ip, name: text(body.p1_name, 40) });
    return NextResponse.json({ ok: true });
  }

  const mode = body.mode;
  if (mode !== "pair" && mode !== "solo") return fail("Hiányzó nevezési mód.");

  const category = text(body.category, 40);
  if (!CATEGORY_NAMES.includes(category)) return fail("Válassz kategóriát.");

  const p1_name = text(body.p1_name, MAX_NAME);
  if (!p1_name) return fail("A név megadása kötelező.");

  // The form sends "<dial code> <local number>". Pin the dial code to the three
  // countries the form offers rather than trusting whatever arrives.
  const p1_phone = text(body.p1_phone, MAX_PHONE);
  const prefix = PHONE_PREFIXES.find((p) => p1_phone.startsWith(p));
  if (!prefix) return fail("Válassz országhívószámot.");

  const localDigits = (p1_phone.slice(prefix.length).match(/\d/g) ?? []).length;
  if (localDigits < 6 || localDigits > 12) {
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
