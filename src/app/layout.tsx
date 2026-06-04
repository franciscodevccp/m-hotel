import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { AppStoreProvider } from "@/lib/store";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
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
    <html lang="es" className={`${fraunces.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AppStoreProvider>{children}</AppStoreProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
