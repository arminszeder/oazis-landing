import { NextResponse } from "next/server";
import { configProblem, serverClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deployment detail is useful when a deploy misbehaves and useless to everyone
// else, so it is only returned to someone holding HEALTH_TOKEN. Without that
// variable set there is no way to get it, by design.
function detail(request: Request) {
  const token = process.env.HEALTH_TOKEN;
  const given = new URL(request.url).searchParams.get("token");
  if (!token || given !== token) return {};

  return {
    vercelEnv: process.env.VERCEL_ENV ?? "not on vercel",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
    supabaseVarsVisible: Object.keys(process.env).filter((k) => /SUPABASE/i.test(k)).sort(),
  };
}

// Answers "can this deployment reach the database?" and nothing more.
// Never returns a configuration value, only whether one is usable.
export async function GET(request: Request) {
  const extra = detail(request);

  if (configProblem()) {
    return NextResponse.json({ ok: false, reason: "config", ...extra }, { status: 503 });
  }

  try {
    const { error } = await serverClient()
      .from("registrations")
      .select("id", { head: true, count: "exact" });
    if (error) throw new Error(error.message);
  } catch {
    return NextResponse.json({ ok: false, reason: "database", ...extra }, { status: 503 });
  }

  return NextResponse.json({ ok: true, ...extra });
}
