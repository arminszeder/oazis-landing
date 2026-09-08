"use client";

import { CATEGORIES, ENTRY_FEE, SIZES } from "@/lib/tournament";
import { type Registration, STATUSES, headcount, sizes } from "@/lib/registrations";

// The fee is written for the page as "12 000 Ft / fő"; the total below needs
// the number behind it.
const FEE_PER_PLAYER = Number(ENTRY_FEE.replace(/\D/g, "").slice(0, 6)) || 0;

const HUF = new Intl.NumberFormat("hu-HU");

export function Summary({ rows }: { rows: Registration[] }) {
  const live = rows.filter((r) => r.status !== "cancelled");
  const paid = rows.filter((r) => r.status === "paid");

  const players = live.reduce((total, r) => total + headcount(r), 0);
  const paidPlayers = paid.reduce((total, r) => total + headcount(r), 0);

  const sizeTotals = SIZES.map((size) => ({
    size,
    count: live.flatMap(sizes).filter((s) => s === size).length,
  }));

  function exportCsv() {
    const header = [
      "Nevezés ideje",
      "Kategória",
      "Mód",
      "1. játékos",
      "Telefon",
      "1. méret",
      "2. játékos",
      "2. méret",
      "Státusz",
      "Szervezői megjegyzés",
    ];

    const byId = new Map(rows.map((r) => [r.id, r]));
    const lines = rows.map((r) => {
      const partner = r.paired_with ? byId.get(r.paired_with) : null;
      return [
        new Date(r.created_at).toLocaleString("hu-HU"),
        r.category,
        r.mode === "pair" ? "Van párja" : "Párt keres",
        r.p1_name,
        r.p1_phone,
        r.p1_size,
        r.p2_name ?? partner?.p1_name ?? "",
        r.p2_size ?? partner?.p1_size ?? "",
        STATUSES.find((s) => s.value === r.status)?.label ?? r.status,
        r.organiser_note ?? "",
      ];
    });

    // Semicolons and a BOM, so Excel in a Hungarian locale opens it in columns
    // rather than dumping every row into the first cell.
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");

    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `oazis-nevezesek-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="summary">
      <section className="panel">
        <h3 className="panel__title">Kategóriák</h3>
        <ul className="bars">
          {CATEGORIES.map((category) => {
            const count = live.filter((r) => r.category === category.name).length;
            const players = live
              .filter((r) => r.category === category.name)
              .reduce((total, r) => total + headcount(r), 0);
            const share = live.length ? Math.round((count / live.length) * 100) : 0;

            return (
              <li key={category.name}>
                <div className="bars__row">
                  <span>{category.name}</span>
                  <span className="bars__value">
                    {count} nevezés · {players} fő
                  </span>
                </div>
                <div className="bars__track">
                  <div className="bars__fill" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h3 className="panel__title">Státusz</h3>
        <ul className="tally">
          {STATUSES.map((status) => (
            <li key={status.value}>
              <span>{status.label}</span>
              <strong>{rows.filter((r) => r.status === status.value).length}</strong>
            </li>
          ))}
        </ul>
        <p className="panel__note">
          Befolyt nevezési díj: <strong>{HUF.format(paidPlayers * FEE_PER_PLAYER)} Ft</strong>{" "}
          ({paidPlayers} fő × {HUF.format(FEE_PER_PLAYER)} Ft)
        </p>
        <p className="panel__note">
          Még nem fizetett: <strong>{players - paidPlayers} fő</strong>
        </p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Mezméretek</h3>
        <ul className="tally">
          {sizeTotals.map(({ size, count }) => (
            <li key={size}>
              <span>{size}</span>
              <strong>{count} db</strong>
            </li>
          ))}
          <li className="tally--total">
            <span>Összesen</span>
            <strong>{sizeTotals.reduce((t, s) => t + s.count, 0)} db</strong>
          </li>
        </ul>
        <p className="panel__note">A lemondott nevezések nincsenek beleszámolva.</p>
      </section>

      <section className="panel">
        <h3 className="panel__title">Letöltés</h3>
        <p className="panel__note">
          Minden nevezés egy CSV-ben, pontosvesszővel elválasztva, hogy az Excel rendesen nyissa
          meg.
        </p>
        <button type="button" className="button" onClick={exportCsv}>
          Nevezések letöltése
        </button>
      </section>
    </div>
  );
}
