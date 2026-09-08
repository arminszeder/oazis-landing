import type { StatusValue } from "@/lib/registrations";

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Nem sikerült menteni.");
}

export function saveEntry(id: string, patch: { status?: StatusValue; organiser_note?: string }) {
  return post("/api/admin/update", { id, ...patch });
}

/** `b` null-lal szétválasztja a párt. */
export function savePairing(a: string, b: string | null) {
  return post("/api/admin/pair", { a, b });
}

export async function logout() {
  await fetch("/api/admin/login", { method: "DELETE" });
}
