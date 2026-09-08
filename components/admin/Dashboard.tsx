"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/tournament";
import { type Registration, type StatusValue, STATUSES, headcount } from "@/lib/registrations";
import { EntryCard } from "./EntryCard";
import { PairingBoard } from "./PairingBoard";
import { Summary } from "./Summary";
import { logout, saveEntry, savePairing } from "./actions";

const TABS = [
  { id: "list", label: "Nevezések" },
  { id: "pairing", label: "Párosítás" },
  { id: "summary", label: "Összesítés" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function Dashboard({ rows: initial, organiser }: { rows: Registration[]; organiser: string }) {
  const router = useRouter();

  // Local copy so a status change lands under the thumb immediately. The server
  // stays the source of truth: every write is followed by a refresh.
  const [rows, setRows] = useState(initial);
  useEffect(() => setRows(initial), [initial]);

  const [tab, setTab] = useState<Tab>("list");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function markBusy(ids: string[], busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => (busy ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  /** Optimistic write: patch locally, call the API, roll back if it fails. */
  async function mutate(ids: string[], patch: (r: Registration) => Registration, call: () => Promise<void>) {
    const snapshot = rows;
    setError(null);
    markBusy(ids, true);
    setRows((current) => current.map((r) => (ids.includes(r.id) ? patch(r) : r)));

    try {
      await call();
      router.refresh();
    } catch (err) {
      setRows(snapshot);
      setError(err instanceof Error ? err.message : "Nem sikerült menteni.");
    } finally {
      markBusy(ids, false);
    }
  }

  function setStatusOf(id: string, next: StatusValue) {
    return mutate([id], (r) => ({ ...r, status: next, updated_by: organiser }), () =>
      saveEntry(id, { status: next }),
    );
  }

  function setNoteOf(id: string, note: string) {
    return mutate([id], (r) => ({ ...r, organiser_note: note || null, updated_by: organiser }), () =>
      saveEntry(id, { organiser_note: note }),
    );
  }

  function pair(a: string, b: string | null) {
    const affected = rows
      .filter((r) => r.id === a || r.id === b || (r.paired_with && [a, b].includes(r.paired_with)))
      .map((r) => r.id);

    return mutate(
      affected,
      (r) => {
        if (r.id === a) return { ...r, paired_with: b };
        if (b && r.id === b) return { ...r, paired_with: a };
        return { ...r, paired_with: null };
      },
      () => savePairing(a, b),
    );
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (status !== "all" && r.status !== status) return false;
      if (!needle) return true;
      return [r.p1_name, r.p2_name, r.p1_phone, r.organiser_note]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [rows, query, category, status]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const live = rows.filter((r) => r.status !== "cancelled");
  const players = live.reduce((total, r) => total + headcount(r), 0);
  const waiting = live.filter((r) => r.mode === "solo" && !r.paired_with).length;
  const unpaid = live.filter((r) => r.status !== "paid").length;

  return (
    <main className="admin">
      <header className="admin__bar">
        <div>
          <h1 className="admin__title">Oázis Őszi Kupa</h1>
          <p className="admin__who">Belépve: {organiser}</p>
        </div>
        <button
          type="button"
          className="link"
          onClick={async () => {
            await logout();
            router.refresh();
          }}
        >
          Kilépés
        </button>
      </header>

      <section className="stats">
        <div className="stat">
          <strong>{live.length}</strong>
          <span>nevezés</span>
        </div>
        <div className="stat">
          <strong>{players}</strong>
          <span>játékos</span>
        </div>
        <div className="stat stat--warn">
          <strong>{unpaid}</strong>
          <span>nem fizetett</span>
        </div>
        <div className="stat stat--warn">
          <strong>{waiting}</strong>
          <span>párt keres</span>
        </div>
      </section>

      <nav className="tabs">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`tabs__tab${tab === entry.id ? " tabs__tab--on" : ""}`}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      {error && <p className="admin__error">{error}</p>}

      {tab === "list" && (
        <>
          <div className="filters">
            <input
              className="filters__search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keresés név, telefon vagy megjegyzés szerint"
              type="search"
            />
            <div className="filters__row">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">Minden kategória</option>
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">Minden státusz</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="admin__count">
            {visible.length === rows.length
              ? `${rows.length} nevezés`
              : `${visible.length} találat a ${rows.length} nevezésből`}
          </p>

          <div className="entries">
            {visible.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                partner={entry.paired_with ? byId.get(entry.paired_with) ?? null : null}
                busy={busyIds.has(entry.id)}
                onStatus={(next) => setStatusOf(entry.id, next)}
                onNote={(note) => setNoteOf(entry.id, note)}
              />
            ))}
          </div>

          {visible.length === 0 && (
            <p className="admin__empty">
              {rows.length ? "Erre nincs találat." : "Még nincs egyetlen nevezés sem."}
            </p>
          )}
        </>
      )}

      {tab === "pairing" && <PairingBoard rows={rows} onPair={pair} busyIds={busyIds} />}
      {tab === "summary" && <Summary rows={rows} />}
    </main>
  );
}
