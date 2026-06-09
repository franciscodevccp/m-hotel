"use client";

import { CatalogList } from "@/components/public/CatalogList";
import { buttonStyles } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import { whatsappUrl } from "@/lib/whatsapp";

export default function SexshopPage() {
  const { products } = useAppStore();
  const catalog = products.filter((p) => p.active && p.channels.includes("online"));
  const wa = whatsappUrl("Hola, quiero consultar por la sexshop de M Motel.");

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="mb-12 max-w-2xl">
        <span className="kicker text-gold">Sexshop · solo +18</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">Sexshop</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Una selección discreta para acompañar la visita. Empaque neutro, sin marcas a la vista, y
          en tu cartola aparece un descriptor neutro. Disponible en recepción.
        </p>
        <div className="mt-8">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "secondary" })}
          >
            Consultar por WhatsApp
          </a>
        </div>
      </header>

      {catalog.length === 0 ? (
        <p className="text-sm text-muted">Catálogo no disponible por ahora.</p>
      ) : (
        <CatalogList products={catalog} withCart />
      )}

      <p className="mt-14 border-t border-line pt-6 text-xs leading-relaxed text-dim">
        Productos para mayores de 18 años. Los nombres y precios pueden variar; confirma
        disponibilidad en recepción o por WhatsApp.
      </p>
    </div>
  );
}
