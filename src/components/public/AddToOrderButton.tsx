"use client";

import { useCartaOrder } from "@/lib/cartaOrder";
import { useVisitor } from "@/lib/visitor";
import type { Product } from "@/types";

/** Agregar un plato al pedido de la carta; con stepper si ya está en el pedido. Solo registrados. */
export function AddToOrderButton({ product }: { product: Product }) {
  const { visitor } = useVisitor();
  const { qtyOf, add, setQty } = useCartaOrder();

  if (visitor?.mode !== "registered") return null;

  const qty = qtyOf(product.id);
  const snapshot = { productId: product.id, name: product.name, price: product.price };

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => add(snapshot)}
        className="mt-3 w-full rounded-full border border-gold/60 py-2 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-bg"
      >
        Agregar al pedido
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between rounded-full border border-gold/50 bg-surface/60 px-1">
      <button
        type="button"
        onClick={() => setQty(product.id, qty - 1)}
        aria-label="Quitar una unidad"
        className="flex size-8 items-center justify-center text-lg leading-none text-gold transition-colors hover:text-gold-soft"
      >
        −
      </button>
      <span className="tnum text-sm text-cream">{qty}</span>
      <button
        type="button"
        onClick={() => add(snapshot)}
        aria-label="Agregar una unidad"
        className="flex size-8 items-center justify-center text-lg leading-none text-gold transition-colors hover:text-gold-soft"
      >
        +
      </button>
    </div>
  );
}
