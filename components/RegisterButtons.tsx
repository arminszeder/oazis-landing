"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, ENTRY_FEE, SIZES, SOURCES, type Mode } from "@/lib/tournament";

type Status = "idle" | "sending" | "done";

const COPY = {
  pair: {
    title: "Van már párom",
    p1Label: "1. játékos",
    p1SizeLabel: "1. játékos mezmérete",
    noteLabel: "Megjegyzés",
    success:
      "Köszönjük! A beosztásról és a fizetés részleteiről a megadott telefonszámon jelentkezünk.",
  },
  solo: {
    title: "Nincs még párom",
    p1Label: "Adataid",
    p1SizeLabel: "Mezméreted",
    noteLabel: "Játékszint, megjegyzés",
    success:
      "Köszönjük! Keresünk hozzád párt a saját szintedről, és a megadott telefonszámon jelentkezünk a részletekkel.",
  },
} as const;

export function RegisterButtons() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setMode(null);
    setStatus("idle");
    setError(null);
  }, []);

  const open = (next: Mode) => {
    setMode(next);
    setStatus("idle");
    setError(null);
  };

  // Esc closes, and the page behind the modal must not scroll under it.
  useEffect(() => {
    if (!mode) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [mode, close]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mode || status === "sending") return;

    const data = new FormData(e.currentTarget);
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          category: data.get("category"),
          p1_name: data.get("p1name"),
          p1_phone: data.get("p1phone"),
          p1_size: data.get("p1size"),
          p2_name: mode === "pair" ? data.get("p2name") : null,
          p2_size: mode === "pair" ? data.get("p2size") : null,
          note: data.get("note"),
          sources: data.getAll("source"),
          newsletter: data.get("newsletter") === "on",
          website: data.get("website"), // honeypot
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Ismeretlen hiba");
      }
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : `Nem sikerült elküldeni a nevezést. Próbáld újra, vagy hívj minket: 06 20 611 3608.`,
      );
    }
  }

  const copy = mode ? COPY[mode] : null;

  return (
    <>
      <div className="cta">
        <button type="button" className="btn btn--primary" onClick={() => open("pair")}>
          Van már párom
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => open("solo")}>
          Nincs még párom
        </button>
      </div>

      {mode && copy && (
        <div
          className="backdrop"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Nevezés — ${copy.title}`}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <div>
                <div className="modal__eyebrow">Nevezés</div>
                <div className="modal__title">{copy.title}</div>
              </div>
              <button
                type="button"
                ref={closeRef}
                className="modal__close"
                onClick={close}
                aria-label="Bezárás"
              >
                ✕
              </button>
            </div>

            {status === "done" ? (
              <div className="success">
                <div className="success__title">Nevezés elküldve</div>
                <p className="success__text">{copy.success}</p>
                <button type="button" className="btn btn--primary" onClick={close}>
                  Bezárom
                </button>
              </div>
            ) : (
              <form className="form" onSubmit={submit}>
                <div className="hp" aria-hidden="true">
                  <label>
                    Weboldal
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <fieldset className="fieldset">
                  <legend className="legend">{copy.p1Label}</legend>
                  <div className="grid2">
                    <label className="field">
                      Név
                      <input
                        className="input"
                        required
                        name="p1name"
                        autoComplete="name"
                        placeholder="Teljes név"
                      />
                    </label>
                    <label className="field">
                      Telefonszám
                      <input
                        className="input"
                        required
                        type="tel"
                        name="p1phone"
                        autoComplete="tel"
                        placeholder="+36 ..."
                      />
                    </label>
                  </div>
                  <SizePicker name="p1size" label={copy.p1SizeLabel} />
                </fieldset>

                {mode === "pair" && (
                  <fieldset className="fieldset fieldset--divided">
                    <legend className="legend">2. játékos</legend>
                    <label className="field">
                      Név
                      <input className="input" required name="p2name" placeholder="Teljes név" />
                    </label>
                    <SizePicker name="p2size" label="2. játékos mezmérete" />
                  </fieldset>
                )}

                <fieldset className="fieldset fieldset--divided">
                  <legend className="legend">Kategória</legend>
                  <div className="options">
                    {CATEGORIES.map((cat) => (
                      <label className="choice choice--wide" key={cat.name}>
                        <span className="choice__name">
                          <input type="radio" required name="category" value={cat.name} />
                          {cat.name}
                        </span>
                        <span className="choice__time">{cat.time}</span>
                      </label>
                    ))}
                  </div>
                  <label className="field">
                    {copy.noteLabel}
                    <textarea
                      className="textarea"
                      name="note"
                      rows={3}
                      placeholder="Bármi, amit tudnunk kell"
                    />
                  </label>
                </fieldset>

                <fieldset className="fieldset fieldset--divided">
                  <legend className="legend">Hol hallottál a versenyről? (opcionális)</legend>
                  <div className="checks">
                    {SOURCES.map((source) => (
                      <label className="check" key={source.value}>
                        <input type="checkbox" name="source" value={source.value} />
                        {source.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="fieldset fieldset--divided">
                  <label className="check check--top">
                    <input type="checkbox" name="newsletter" />
                    <span>
                      Szeretnék értesülni a jövőbeli Oázis Padel versenyekről és eseményekről
                      (opcionális)
                    </span>
                  </label>
                  <label className="check check--top">
                    <input type="checkbox" required name="consent" />
                    <span>
                      Tudomásul vettem, hogy a versenyen való részvétel fizetési kötelezettséggel
                      jár
                    </span>
                  </label>
                  <p className="fine fine--spaced">
                    Az adataidat kizárólag a verseny szervezéséhez és kapcsolattartáshoz használjuk.
                    Adatkezelő: Oázis Padel. Az adatokat harmadik félnek nem adjuk át, és a verseny
                    után 12 hónappal töröljük.
                  </p>
                  <p className="fine">
                    A jelentkezésemmel tudomásul veszem, hogy a szervezők fenntarthatják a jogot
                    arra, hogy megítélésük szerint megváltoztassák egy csapat szintjét.
                  </p>
                </div>

                <div className="fee">
                  <div className="legend">Nevezési díj</div>
                  <div className="fee__amount">{ENTRY_FEE}</div>
                </div>

                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn--primary submit"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Küldés…" : "Nevezés elküldése"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SizePicker({ name, label }: { name: string; label: string }) {
  return (
    <div className="field field--radios">
      <div>{label}</div>
      <div className="sizes">
        {SIZES.map((size) => (
          <label className="choice" key={size}>
            <input type="radio" required name={name} value={size} />
            {size}
          </label>
        ))}
      </div>
    </div>
  );
}
