import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin";
import { serverClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { id: string; mode: string; category: string; paired_with: string | null };

/**
 * Két párt kereső nevező összepárosítása, vagy egy pár szétválasztása.
 *
 * A kapcsolat kétirányú: mindkét sor a másikra mutat. Így a lista bármelyik
 * végéről nézve látszik a pár, és a szétválasztás egyetlen művelet.
 */
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Jelentkezz be újra." }, { status: 401 });

  let body: { a?: unknown; b?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Hibás kérés." }, { status: 400 });
  }

  const a = typeof body.a === "string" ? body.a : "";
  // b === null means "release whoever a is paired with".
  const b = typeof body.b === "string" ? body.b : null;
  if (!a) return NextResponse.json({ error: "Hiányzó azonosító." }, { status: 400 });
  if (a === b) return NextResponse.json({ error: "Önmagával nem párosítható." }, { status: 400 });

  const db = serverClient();
  const stamp = { updated_at: new Date().toISOString(), updated_by: session.name };

  try {
    const wanted = b ? [a, b] : [a];
    const { data, error } = await db
      .from("registrations")
      .select("id, mode, category, paired_with")
      .in("id", wanted);
    if (error) throw new Error(`${error.code ?? "?"}: ${error.message}`);

    const rows = (data ?? []) as Row[];
    if (rows.length !== wanted.length) {
      return NextResponse.json({ error: "Nem található nevezés." }, { status: 404 });
    }
    if (rows.some((r) => r.mode !== "solo")) {
      return NextResponse.json({ error: "Csak párt kereső nevezők párosíthatók." }, { status: 400 });
    }
    if (b && rows[0].category !== rows[1].category) {
      return NextResponse.json({ error: "Csak azonos kategórián belül." }, { status: 400 });
    }

    // Free both sides of any pairing these two are already in, so nobody is
    // left pointing at a partner who has moved on.
    const release = rows.flatMap((r) => [r.id, r.paired_with]).filter((v): v is string => !!v);
    const { error: clearError } = await db
      .from("registrations")
      .update({ paired_with: null, ...stamp })
      .in("id", release);
    if (clearError) throw new Error(`${clearError.code ?? "?"}: ${clearError.message}`);

    if (b) {
      for (const [self, partner] of [
        [a, b],
        [b, a],
      ]) {
        const { error: linkError } = await db
          .from("registrations")
          .update({ paired_with: partner, ...stamp })
          .eq("id", self);
        if (linkError) throw new Error(`${linkError.code ?? "?"}: ${linkError.message}`);
      }
    }
  } catch (err) {
    console.error("admin pairing failed", err);
    return NextResponse.json({ error: "Nem sikerült menteni a párosítást." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
