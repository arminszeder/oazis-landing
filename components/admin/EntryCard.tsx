"use client";

import { useState } from "react";
import {
  type Registration,
  STATUSES,
  SOURCE_LABELS,
  prettyPhone,
  shortDate,
} from "@/lib/registrations";

type Props = {
  entry: Registration;
  partner: Registration | null;
  onStatus: (status: Registration["status"]) => void;
  onNote: (note: string) => void;
  busy: boolean;
};

export function EntryCard({ entry, partner, onStatus, onNote, busy }: Props) {
  const [note, setNote] = useState(entry.organiser_note ?? "");
  const [editing, setEditing] = useState(false);

  const teammate = entry.mode === "pair" ? entry.p2_name : partner?.p1_name;
  const teammateSize = entry.mode === "pair" ? entry.p2_size : partner?.p1_size;

  return (
    <article className={`entry entry--${entry.status}${busy ? " entry--busy" : ""}`}>
      <header className="entry__head">
        <div>
          <h3 className="entry__name">{entry.p1_name}</h3>
          <p className="entry__meta">
            {entry.category} · {shortDate(entry.created_at)}
          </p>
        </div>
        <span className={`badge badge--${entry.status}`}>
          {STATUSES.find((s) => s.value === entry.status)?.label}
        </span>
      </header>

      <a className="entry__phone" href={`tel:${entry.p1_phone.replace(/\s/g, "")}`}>
        {prettyPhone(entry.p1_phone)}
      </a>

      <dl className="entry__rows">
        <div>
          <dt>Csapattárs</dt>
          <dd>
            {teammate ? (
              <>
                {teammate}
                {partner && <span className="entry__tag">szervezők párosították</span>}
              </>
            ) : (
              <span className="entry__seeking">Párt keres</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Mez</dt>
          <dd>
            {entry.p1_size}
            {teammateSize ? ` · ${teammateSize}` : ""}
          </dd>
        </div>
        {entry.sources?.length ? (
          <div>
            <dt>Honnan</dt>
            <dd>{entry.sources.map((s) => SOURCE_LABELS[s] ?? s).join(", ")}</dd>
          </div>
        ) : null}
      </dl>

      <div className="entry__statuses">
        {STATUSES.map((status) => (
          <button
            key={status.value}
            type="button"
            className={`chip${entry.status === status.value ? " chip--on" : ""}`}
            onClick={() => onStatus(status.value)}
            disabled={busy || entry.status === status.value}
          >
            {status.short}
          </button>
        ))}
      </div>

      {editing ? (
        <div className="entry__note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Pl. hétfőn utal, vagy csak szombaton ér rá"
            autoFocus
          />
          <div className="entry__noteActions">
            <button
              type="button"
              className="link"
              onClick={() => {
                setNote(entry.organiser_note ?? "");
                setEditing(false);
              }}
            >
              Mégse
            </button>
            <button
              type="button"
              className="link link--go"
              onClick={() => {
                onNote(note);
                setEditing(false);
              }}
            >
              Mentés
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="entry__noteButton" onClick={() => setEditing(true)}>
          {entry.organiser_note ? (
            <span className="entry__noteText">{entry.organiser_note}</span>
          ) : (
            <span className="entry__notePlaceholder">+ megjegyzés</span>
          )}
        </button>
      )}

      {entry.updated_by && (
        <p className="entry__stamp">
          Utoljára: {entry.updated_by}
          {entry.updated_at ? ` · ${shortDate(entry.updated_at)}` : ""}
        </p>
      )}
    </article>
  );
}
