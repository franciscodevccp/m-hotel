"use client";

import { CatalogList } from "@/components/public/CatalogList";
import { buttonStyles } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import { useVisitor } from "@/lib/visitor";
import { whatsappUrl } from "@/lib/whatsapp";

export default function CartaPage() {
  const { products } = useAppStore();
  const { visitor, openPrompt } = useVisitor();
  const registered = visitor?.mode === "registered";
  const carta = products.filter((p) => p.active && p.channels.includes("room_service"));
  const wa = whatsappUrl("Hola, quiero hacer un pedido de room service en M Motel.");

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="mb-12 max-w-2xl">
        <span className="kicker text-gold">Room service · 24 horas</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
          Carta gourmet
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Cocina caliente, coctelería y algo dulce, directo a la habitación a cualquier hora. Pídelo
          desde tu pieza o coordínalo con recepción.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "secondary" })}
          >
            Pedir por WhatsApp
          </a>
          {registered ? (
            <p className="text-xs text-dim">
              Arma tu pedido agregando platos y envíalo de una vez desde “Mi pedido”.
            </p>
          ) : (
            <button
              type="button"
              onClick={openPrompt}
              className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
            >
              Regístrate para pedir en línea
            </button>
          )}
        </div>
      </header>

      {carta.length === 0 ? (
        <p className="text-sm text-muted">Carta no disponible por ahora.</p>
      ) : (
        <CatalogList products={carta} quickOrder={registered} />
      )}

      <p className="mt-14 border-t border-line pt-6 text-xs leading-relaxed text-dim">
        Carta sujeta a disponibilidad. La venta de alcohol y cigarros es solo para mayores de 18
        años.
      </p>
    </div>
  );
}
