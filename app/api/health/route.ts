import { NextResponse } from "next/server";
import { configProblem, serverClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Answers "can this deployment reach the database?" without revealing any
// values. Handy right after a deploy: curl https://<site>/api/health
export async function GET() {
  const problem = configProblem();
  if (problem) {
    return NextResponse.json({ ok: false, ...deployment(), config: problem }, { status: 503 });
  }

  try {
    const { error } = await serverClient()
      .from("registrations")
      .select("id", { head: true, count: "exact" });
    if (error) throw new Error(error.message);
  } catch (err) {
    return NextResponse.json(
      { ok: false, config: "env vars look fine", database: String(err) },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, ...deployment(), config: "env vars set", database: "reachable" });
}

// Names only, never values: enough to tell "set on the wrong environment" from
// "not set at all" from "set under a different name", without leaking anything.
function deployment() {
  return {
    vercelEnv: process.env.VERCEL_ENV ?? "not on vercel",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
    supabaseVarsVisible: Object.keys(process.env).filter((k) => /SUPABASE/i.test(k)).sort(),
  };
}
