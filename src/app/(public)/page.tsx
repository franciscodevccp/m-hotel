import Image from "next/image";
import Link from "next/link";
import { CategoryGrid } from "@/components/public/CategoryGrid";
import { Hero } from "@/components/public/Hero";
import { ServiceList } from "@/components/public/ServiceList";
import { buttonStyles } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Stat } from "@/components/ui/Stat";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Cifras de M */}
      <section className="border-b border-line bg-bg">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-12 px-5 py-14 sm:px-8 md:grid-cols-4 md:py-16">
          <Stat
            value={
              <>
                4,3<span className="text-gold">★</span>
              </>
            }
            label={`${SITE.reviews} reseñas en Google`}
          />
          <Stat value={SITE.rooms} label="Habitaciones" />
          <Stat value="24/7" label="Atención continua" />
          <Stat value="24h" label="Room service gourmet" />
        </div>
      </section>

      {/* Categorías */}
      <section id="categorias" className="scroll-mt-24 border-b border-line bg-bg">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-2xl">
            <span className="kicker text-gold">Categorías</span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
              Cuatro formas de estar a solas.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-muted">
              Desde lo esencial hasta la categoría BLACK. Cada una con su tarifa por bloque de
              horas; el tiempo lo eliges al reservar.
            </p>
          </Reveal>

          <CategoryGrid />
        </div>
      </section>

      {/* Experiencia M */}
      <section id="experiencia" className="scroll-mt-24 overflow-hidden border-b border-line bg-bg">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="kicker text-gold">Experiencia M</span>
              <h2 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
                Pensado en cada detalle.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted">
                Iluminación cálida, jacuzzi privado y una copa esperando. Espacios cuidados para que
                el tiempo se sienta distinto, sin apuros.
              </p>
              <div className="mt-8">
                <Link href="/reservar" className={buttonStyles({ variant: "secondary" })}>
                  Reservar ahora
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="space-y-4">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="/images/imagenes.webp"
                  alt="Ambiente de las habitaciones de M Motel"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-bg/35" aria-hidden />
                <div className="vignette absolute inset-0" aria-hidden />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src="/images/habitacion.webp"
                    alt="Habitación con jacuzzi e iluminación cálida"
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-bg/45" aria-hidden />
                </div>
                <div className="flex aspect-square flex-col justify-between border border-line bg-surface p-5">
                  <span className="kicker text-gold">Reseñas</span>
                  <p className="font-display text-lg leading-snug text-cream">
                    “Privacidad, limpieza y discreción.”
                  </p>
                  <span className="kicker text-dim">
                    4,3★ · {SITE.reviews} reseñas
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="scroll-mt-24 bg-bg">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-2xl">
            <span className="kicker text-gold">Servicios</span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
              Lo que incluye tu visita.
            </h2>
          </Reveal>
          <Reveal delay={0.05} className="mt-12">
            <ServiceList />
          </Reveal>
        </div>
      </section>

      {/* Cierre */}
      <section className="relative overflow-hidden border-t border-line bg-surface">
        <div className="gold-glow absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight text-cream sm:text-6xl">
              Un momento a solas, cuando quieran.
            </h2>
            <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted">
              Reserva en menos de un minuto. Te confirmamos por WhatsApp.
            </p>
            <div className="mt-10 flex justify-center">
              <Link href="/reservar" className={buttonStyles({ variant: "primary", size: "lg" })}>
                Reservar
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
