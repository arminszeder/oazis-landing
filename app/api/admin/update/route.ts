import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin";
import { serverClient } from "@/lib/supabase";
import { STATUS_VALUES } from "@/lib/registrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NOTE = 500;

/** Egy nevezés státuszának vagy szervezői megjegyzésének módosítása. */
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Jelentkezz be újra." }, { status: 401 });

  let body: { id?: unknown; status?: unknown; organiser_note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Hibás kérés." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Hiányzó azonosító." }, { status: 400 });

  // Only these two are editable from the dashboard. Names, phone numbers and
  // sizes are what the entrant actually submitted, and stay as submitted.
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: session.name };

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUS_VALUES.includes(body.status)) {
      return NextResponse.json({ error: "Ismeretlen státusz." }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (body.organiser_note !== undefined) {
    if (typeof body.organiser_note !== "string") {
      return NextResponse.json({ error: "Hibás megjegyzés." }, { status: 400 });
    }
    patch.organiser_note = body.organiser_note.trim().slice(0, MAX_NOTE) || null;
  }

  if (patch.status === undefined && patch.organiser_note === undefined) {
    return NextResponse.json({ error: "Nincs mit menteni." }, { status: 400 });
  }

  try {
    const { error } = await serverClient().from("registrations").update(patch).eq("id", id);
    if (error) throw new Error(`${error.code ?? "?"}: ${error.message}`);
  } catch (err) {
    console.error("admin update failed", err);
    return NextResponse.json({ error: "Nem sikerült menteni." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
