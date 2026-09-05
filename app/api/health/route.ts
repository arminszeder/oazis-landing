import { NextResponse } from "next/server";
import { configProblem, serverClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Answers "can this deployment reach the database?" without revealing any
// values. Handy right after a deploy: curl https://<site>/api/health
export async function GET() {
  const problem = configProblem();
  if (problem) {
    return NextResponse.json({ ok: false, config: problem }, { status: 503 });
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

  return NextResponse.json({ ok: true, config: "env vars set", database: "reachable" });
}
