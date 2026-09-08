"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/tournament";
import { type Registration, prettyPhone, shortDate } from "@/lib/registrations";

type Props = {
  rows: Registration[];
  onPair: (a: string, b: string | null) => void;
  busyIds: Set<string>;
};

/**
 * Párt kereső nevezők kategóriánként. Két érintés egy pár: rákattintasz az
 * egyikre, aztán a másikra. Csak azonos kategórián belül enged párosítani,
 * ahogy a szerver is.
 */
export function PairingBoard({ rows, onPair, busyIds }: Props) {
  const [picked, setPicked] = useState<string | null>(null);

  const solos = rows.filter((r) => r.mode === "solo" && r.status !== "cancelled");
  const byId = new Map(rows.map((r) => [r.id, r]));

  function choose(entry: Registration) {
    if (entry.paired_with) {
      onPair(entry.id, null);
      setPicked(null);
      return;
    }
    if (!picked) {
      setPicked(entry.id);
      return;
    }
    if (picked === entry.id) {
      setPicked(null);
      return;
    }

    const first = byId.get(picked);
    if (first && first.category === entry.category) {
      onPair(picked, entry.id);
    }
    setPicked(null);
  }

  return (
    <div className="pairing">
      <p className="pairing__lead">
        Koppints két névre azonos kategórián belül, és párba kerülnek. Egy kész páron koppintva
        szétválnak. A nevezők adata nem változik, csak a párosítás.
      </p>

      <div className="pairing__grid">
        {CATEGORIES.map((category) => {
          const inCategory = solos.filter((r) => r.category === category.name);
          const waiting = inCategory.filter((r) => !r.paired_with);
          const pickedHere = picked && byId.get(picked)?.category === category.name;

          return (
            <section key={category.name} className="pairing__col">
              <header className="pairing__colHead">
                <h3>{category.name}</h3>
                <span>{waiting.length} vár párra</span>
              </header>

              {inCategory.length === 0 && <p className="pairing__empty">Nincs párt kereső.</p>}

              <ul className="pairing__list">
                {inCategory.map((entry) => {
                  const partner = entry.paired_with ? byId.get(entry.paired_with) : null;
                  // Show a formed pair once, on the earlier of the two rows.
                  // The id breaks the tie if two entries share a timestamp.
                  if (
                    partner &&
                    (partner.created_at < entry.created_at ||
                      (partner.created_at === entry.created_at && partner.id < entry.id))
                  ) {
                    return null;
                  }

                  const isPicked = picked === entry.id;
                  const selectable = !partner && (!picked || pickedHere);

                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={
                          "pairing__person" +
                          (partner ? " pairing__person--paired" : "") +
                          (isPicked ? " pairing__person--picked" : "") +
                          (!selectable && !partner ? " pairing__person--dimmed" : "")
                        }
                        onClick={() => choose(entry)}
                        disabled={busyIds.has(entry.id) || (!selectable && !partner)}
                      >
                        <span className="pairing__who">
                          {entry.p1_name}
                          {partner && <span className="pairing__plus">+ {partner.p1_name}</span>}
                        </span>
                        <span className="pairing__sub">
                          {partner
                            ? "Kész pár — koppints a szétválasztáshoz"
                            : `${prettyPhone(entry.p1_phone)} · ${shortDate(entry.created_at)}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
