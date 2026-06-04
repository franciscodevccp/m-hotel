import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <Image
        src="/images/hero.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Capas de oscurecimiento + viñeta para legibilidad y grade cálido */}
      <div className="absolute inset-0 bg-bg/55" aria-hidden />
      <div className="vignette absolute inset-0" aria-hidden />
      <div className="scrim-bottom absolute inset-0" aria-hidden />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="max-w-2xl">
          <p className="kicker rise text-gold" style={{ animationDelay: "0.05s" }}>
            {SITE.city} · Atención 24/7
          </p>
          <h1
            className="rise mt-6 font-display text-5xl font-light leading-[0.95] tracking-tight text-cream sm:text-7xl"
            style={{ animationDelay: "0.15s" }}
          >
            Un espacio íntimo,
            <br />
            pensado para ustedes dos.
          </h1>
          <p
            className="rise mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "0.3s" }}
          >
            Habitaciones por bloques de horas en {SITE.city}. Reserva en línea, con la discreción y
            el cuidado de siempre.
          </p>
          <div
            className="rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.45s" }}
          >
            <Link href="/reservar" className={buttonStyles({ variant: "primary", size: "lg" })}>
              Reservar
            </Link>
            <Link href="/#categorias" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              Ver categorías
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
