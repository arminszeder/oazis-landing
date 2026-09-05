import Image from "next/image";
import { Leaves } from "@/components/Leaves";
import { RegisterButtons } from "@/components/RegisterButtons";
import { CATEGORIES, PHONE, PHONE_HREF, SCHEDULE, VENUE } from "@/lib/tournament";

const ICON = {
  stroke: "#C8682B",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
};

const PERKS = [
  { label: "Welcome Drink", d: ["M8 3h8l-1 5a3 3 0 0 1-6 0L8 3z", "M12 13v7", "M9 21h6"] },
  {
    label: "Egy tál meleg étel",
    d: ["M3 11h18a9 9 0 0 1-18 0z", "M9 7c0-1.5 1.5-2 1.5-3.5", "M14 7c0-1.5 1.5-2 1.5-3.5"],
  },
  { label: "Egy ajándék póló", d: ["M9 3l3 2 3-2 5 3-2 3-1.5-.8V21h-9V8.2L6 9 4 6l5-3z"] },
];

export default function Home() {
  return (
    <main className="page">
      <Leaves />

      <header className="shell header">
        <Image
          className="header__logo"
          src="/oazis-logo.png"
          alt="Oázis Padel"
          width={1254}
          height={1254}
          priority
        />
        <div className="header__city">Mosonmagyaróvár</div>
      </header>

      <div className="shell hero">
        <div>
          <div className="badge">Őszi kupa · 2026</div>

          <h1 className="title">
            <span>Oázis</span>
            <span className="title__accent">Őszi Kupa</span>
          </h1>

          <div className="dates">
            <div>
              Szeptember 26. <span className="dates__day">Szombat</span>
            </div>
            <div>
              Szeptember 27. <span className="dates__day">Vasárnap</span>
            </div>
          </div>

          <div className="tags">
            {CATEGORIES.map((cat) => (
              <div className="tag" key={cat.name}>
                {cat.name}
              </div>
            ))}
          </div>

          <RegisterButtons />

          <div className="venue">
            <div>
              Helyszín: <strong>{VENUE}</strong>
            </div>
          </div>
        </div>

        <section className="panel">
          <div className="panel__corner" aria-hidden="true" />

          <h2 className="panel__label">Kategóriák és kezdés</h2>
          <div className="schedule">
            {SCHEDULE.map((cat) => (
              <div className="schedule__row" key={cat.name}>
                <div className="schedule__name">{cat.name}</div>
                <div className="schedule__time">{cat.time}</div>
              </div>
            ))}
          </div>

          <div className="panel__section">
            <h2 className="panel__label">A nevezés mellé adjuk ajándékba</h2>
            <div className="perks">
              {PERKS.map((perk) => (
                <div className="perk" key={perk.label}>
                  <svg {...ICON} aria-hidden="true">
                    {perk.d.map((d) => (
                      <path d={d} key={d} />
                    ))}
                  </svg>
                  {perk.label}
                </div>
              ))}
            </div>
          </div>

          <div className="contact">
            <svg {...ICON} aria-hidden="true">
              <path d="M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4 6.2 2 2 0 0 1 6.5 3z" />
            </svg>
            <span>
              Bármilyen kérdés esetén, keressetek minket telefonon:{" "}
              <a className="contact__phone" href={PHONE_HREF}>
                {PHONE}
              </a>
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
