import type { Metadata, Viewport } from "next";
import { Anton, Barlow_Semi_Condensed } from "next/font/google";
import Script from "next/script";
import { MetaPixelPageView } from "@/components/MetaPixelPageView";
import "./globals.css";

const META_PIXEL_ID = "2310558333045322";

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
      <body>
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <MetaPixelPageView />
        {children}
      </body>
    </html>
  );
}
