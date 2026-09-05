import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Leaves } from "@/components/Leaves";
import { PHONE, PHONE_HREF, SCHEDULE, VENUE } from "@/lib/tournament";

export const metadata: Metadata = {
  title: "Köszönjük a nevezést! — Oázis Őszi Kupa 2026",
  description: "Megkaptuk a nevezésedet az Oázis Padel Őszi Kupára.",
  // A confirmation page has nothing to offer search — and keeping it out of
  // the index stops it being reached without actually registering.
  robots: { index: false, follow: false },
};

// The follow-up differs by how they entered: a pair only waits on the
// schedule, a solo player is also waiting on us to find them a partner.
const FOLLOW_UP = {
  pair: "A beosztásról és a fizetés részleteiről a megadott telefonszámon jelentkezünk.",
  solo: "Keresünk hozzád párt a saját szintedről, és a megadott telefonszámon jelentkezünk a részletekkel.",
} as const;

export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ tipus?: string }>;
}) {
  const { tipus } = await searchParams;
  const followUp =
    tipus === "solo" || tipus === "pair" ? FOLLOW_UP[tipus] : FOLLOW_UP.pair;

  return (
    <main className="page">
      <Leaves />

      <header className="shell header">
        <Link href="/">
          <Image
            className="header__logo"
            src="/oazis-logo.png"
            alt="Oázis Padel"
            width={1254}
            height={1254}
            priority
          />
        </Link>
        <div className="header__city">Mosonmagyaróvár</div>
      </header>

      <div className="shell thanks">
        <div className="badge">Őszi kupa · 2026</div>

        <h1 className="title thanks__title">
          <span>Köszönjük</span>
          <span className="title__accent">a nevezést!</span>
        </h1>

        <p className="thanks__lead">Várunk téged / titeket a versenyen</p>

        <p className="thanks__follow-up">{followUp}</p>

        <div className="thanks__panel">
          <div className="thanks__dates">
            <div>
              Szeptember 26. <span className="dates__day">Szombat</span>
            </div>
            <div>
              Szeptember 27. <span className="dates__day">Vasárnap</span>
            </div>
          </div>

          <div className="schedule">
            {SCHEDULE.map((cat) => (
              <div className="schedule__row" key={cat.name}>
                <div className="schedule__name">{cat.name}</div>
                <div className="schedule__time">{cat.time}</div>
              </div>
            ))}
          </div>

          <div className="thanks__venue">
            Helyszín: <strong>{VENUE}</strong>
          </div>
        </div>

        <p className="thanks__note">
          Kérdés esetén hívj minket:{" "}
          <a className="contact__phone" href={PHONE_HREF}>
            {PHONE}
          </a>
        </p>

        <Link className="btn btn--primary thanks__back" href="/">
          Vissza a főoldalra
        </Link>
      </div>
    </main>
  );
}
