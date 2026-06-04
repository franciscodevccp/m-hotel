import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer id="contacto" className="relative border-t border-gold/30 bg-bg">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl text-cream">M</span>
              <span className="kicker text-dim">Motel</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Un espacio íntimo en {SITE.city}, pensado para ustedes dos. Atención las 24 horas,
              con la discreción de siempre.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="kicker">Dónde</span>
            <p className="text-sm leading-relaxed text-muted">
              {SITE.address}
              <br />
              {SITE.city}, {SITE.region}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gold transition-colors hover:text-gold-soft"
            >
              Cómo llegar
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="kicker">Contacto</span>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted transition-colors hover:text-cream"
            >
              WhatsApp {SITE.whatsappDisplay}
            </a>
            <a
              href={`tel:${SITE.phone.replace(/\s/g, "")}`}
              className="text-sm text-muted transition-colors hover:text-cream"
            >
              {SITE.phone}
            </a>
            <Link
              href="/admin/login"
              className="mt-2 text-xs uppercase tracking-[0.16em] text-dim transition-colors hover:text-muted"
            >
              Panel administrativo
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 {SITE.name}. Maqueta de demostración.</span>
          <span className="kicker text-dim">
            {SITE.city} · Atención 24/7
          </span>
        </div>
      </div>
    </footer>
  );
}
