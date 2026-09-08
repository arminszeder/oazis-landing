// Shapes and labels shared by the admin dashboard and the routes behind it.
// Nothing here touches the database, so it is safe to import from client
// components.

export const STATUSES = [
  { value: "new", label: "Új", short: "Új" },
  { value: "contacted", label: "Megkeresve", short: "Megkeresve" },
  { value: "paid", label: "Fizetett", short: "Fizetett" },
  { value: "cancelled", label: "Lemondva", short: "Lemondva" },
] as const;

export const STATUS_VALUES: readonly string[] = STATUSES.map((s) => s.value);

export type StatusValue = (typeof STATUSES)[number]["value"];

export const SOURCE_LABELS: Record<string, string> = {
  social: "Közösségi média",
  messenger: "Messenger",
  referral: "Ajánlás",
};

export type Registration = {
  id: string;
  created_at: string;
  mode: "pair" | "solo";
  category: string;
  p1_name: string;
  p1_phone: string;
  p1_size: string;
  p2_name: string | null;
  p2_size: string | null;
  note: string | null;
  sources: string[] | null;
  newsletter: boolean;
  status: StatusValue;
  organiser_note: string | null;
  paired_with: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

/** How many players a registration accounts for: a pair is two, a solo is one. */
export function headcount(r: Registration) {
  return r.mode === "pair" ? 2 : 1;
}

/** Shirt sizes owed for one registration. */
export function sizes(r: Registration) {
  return r.mode === "pair" && r.p2_size ? [r.p1_size, r.p2_size] : [r.p1_size];
}

/** `+36 20 611 3608` reads better than the raw string the form submits. */
export function prettyPhone(phone: string) {
  const trimmed = phone.trim();
  const match = trimmed.match(/^(\+\d{2,3})\s*(.*)$/);
  if (!match) return trimmed;

  const digits = match[2].replace(/\D/g, "");
  const grouped = digits.replace(/(\d{1,3})(?=(\d{3})+$)/g, "$1 ");
  return `${match[1]} ${grouped || digits}`.trim();
}

export function shortDate(iso: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
