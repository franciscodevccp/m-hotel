import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { AppStoreProvider } from "@/lib/store";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

// Fuente del panel admin: humanista y de alta legibilidad (ver .admin-ui).
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: "M Motel · Limache",
  description:
    "Un espacio íntimo en Limache, pensado para ustedes dos. Reserva por bloques, atención 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${instrument.variable} ${sourceSans.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <SessionProvider>
          <AppStoreProvider>{children}</AppStoreProvider>
        </SessionProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
