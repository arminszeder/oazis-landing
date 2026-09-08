import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Feeds the Google Sheet mirror (scripts/oazis-sheets-sync.gs). The Apps Script
// writes whatever columns arrive, in this order, so adding one here adds it to
// both sheets on the next sync. `id` stays first and stays stable: the team's
// working sheet keys its rows on it to know which ones are already there.

type Registration = {
  id: string;
  created_at: string;
  mode: string;
  category: string;
  p1_name: string;
  p1_phone: string;
  p1_size: string;
  p2_name: string | null;
  p2_size: string | null;
  note: string | null;
  sources: string[] | null;
  newsletter: boolean;
  status: string;
  organiser_note: string | null;
};

// hu-HU with an explicit zone, so the sheet reads the same whether the function
// ran in Frankfurt or Washington.
const WHEN = new Intl.DateTimeFormat("hu-HU", {
  timeZone: "Europe/Budapest",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const MODE_LABELS: Record<string, string> = { pair: "Van párja", solo: "Párt keres" };

const STATUS_LABELS: Record<string, string> = {
  new: "Új",
  contacted: "Megkeresve",
  paid: "Fizetett",
  cancelled: "Lemondva",
};

// Short forms of lib/tournament.ts SOURCES. The full labels are questions put to
// the entrant and are far too long to sit in a spreadsheet column.
const SOURCE_LABELS: Record<string, string> = {
  social: "Közösségi média",
  messenger: "Messenger",
  referral: "Ajánlás",
};

function label(map: Record<string, string>, value: string | null) {
  if (!value) return "";
  return map[value] ?? value;
}

const COLUMNS: { header: string; value: (r: Registration) => string }[] = [
  { header: "Azonosító", value: (r) => r.id },
  { header: "Nevezés ideje", value: (r) => WHEN.format(new Date(r.created_at)) },
  { header: "Kategória", value: (r) => r.category },
  { header: "Nevezés módja", value: (r) => label(MODE_LABELS, r.mode) },
  { header: "1. játékos", value: (r) => r.p1_name },
  { header: "Telefon", value: (r) => r.p1_phone },
  { header: "1. játékos mérete", value: (r) => r.p1_size },
  { header: "2. játékos", value: (r) => r.p2_name ?? "" },
  { header: "2. játékos mérete", value: (r) => r.p2_size ?? "" },
  // The form has no field for this yet; the column exists so a later one lands
  // in the sheet without a script change.
  { header: "Megjegyzés", value: (r) => r.note ?? "" },
  {
    header: "Honnan hallott rólunk",
    value: (r) => (r.sources ?? []).map((s) => label(SOURCE_LABELS, s)).join(", "),
  },
  { header: "Hírlevél", value: (r) => (r.newsletter ? "Igen" : "Nem") },
  { header: "Státusz", value: (r) => label(STATUS_LABELS, r.status) },
  { header: "Szervezői megjegyzés", value: (r) => r.organiser_note ?? "" },
];

// Every entry carries a name and a phone number, so this endpoint is as
// sensitive as the table itself. No token configured means no way in.
function authorised(request: Request) {
  const expected = process.env.EXPORT_TOKEN?.trim();
  if (!expected) return false;

  const given =
    request.headers.get("x-export-token")?.trim() ||
    new URL(request.url).searchParams.get("token")?.trim() ||
    "";
  if (!given) return false;

  // Hashing first makes the comparison constant time and equal length, so a
  // wrong token leaks neither its length nor how much of it matched.
  return timingSafeEqual(
    createHash("sha256").update(given).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  let rows: Registration[];
  try {
    const { data, error } = await serverClient()
      .from("registrations")
      .select("*")
      // Oldest first: new entries then append to the bottom of the sheet and
      // every row above keeps the line number the team saw yesterday.
      .order("created_at", { ascending: true })
      .limit(5000);
    if (error) throw new Error(`${error.code ?? "?"}: ${error.message}`);
    rows = (data ?? []) as Registration[];
  } catch (err) {
    console.error("export failed", err);
    return NextResponse.json({ error: "database" }, { status: 503 });
  }

  return NextResponse.json(
    {
      generatedAt: WHEN.format(new Date()),
      count: rows.length,
      columns: COLUMNS.map((c) => c.header),
      rows: rows.map((r) => COLUMNS.map((c) => c.value(r))),
    },
    { headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );
}
