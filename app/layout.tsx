import type { Metadata, Viewport } from "next";
import { Anton, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin-ext"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const barlow = Barlow_Semi_Condensed({
  subsets: ["latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oázis Őszi Kupa 2026 — Padel verseny, Mosonmagyaróvár",
  description:
    "Oázis Padel Őszi Kupa, szeptember 26–27. Női, kezdő, középhaladó és haladó kategória. Nevezés online, a díj mellé welcome drink, meleg étel és ajándék póló jár.",
  openGraph: {
    title: "Oázis Őszi Kupa 2026",
    description:
      "Padel verseny Mosonmagyaróváron, szeptember 26–27. Négy kategória, online nevezés.",
    locale: "hu_HU",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0705",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className={`${anton.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
