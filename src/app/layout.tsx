import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "M Motel · Limache",
  description:
    "Un espacio íntimo en Limache, pensado para ustedes dos. Reserva por bloques, atención 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${instrument.variable} h-full`}>
      <body className="min-h-full antialiased">
        <SessionProvider>
          <AppStoreProvider>{children}</AppStoreProvider>
        </SessionProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
