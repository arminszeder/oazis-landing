import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, issueToken, passwordMatches } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A shared password is only as good as the guess rate, so this is the one place
// in the app that throttles hard. Per-instance, like /api/register: enough to
// make an online guessing run impractical.
const RATE_LIMIT = { windowMs: 300_000, max: 10 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Túl sok próbálkozás. Várj öt percet." }, { status: 429 });
  }

  let body: { password?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Hibás kérés." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "";
  const given = typeof body.password === "string" ? body.password : "";

  if (!name) return NextResponse.json({ error: "Írd be a neved." }, { status: 400 });
  if (!passwordMatches(given)) {
    console.warn("admin login rejected", { ip, name });
    return NextResponse.json({ error: "Hibás jelszó." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, name });
  response.cookies.set(SESSION_COOKIE, issueToken(name), SESSION_COOKIE_OPTIONS);
  return response;
}

/** Kijelentkezés. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
