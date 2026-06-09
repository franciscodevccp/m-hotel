"use client";

import { useCart } from "@/lib/cart";
import type { Product } from "@/types";

/** Botón de agregar al carro; cuando ya hay unidades muestra un stepper. */
export function AddToCartButton({ product }: { product: Product }) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(product.id);
  const snapshot = {
    productId: product.id,
    name: product.name,
    price: product.price,
    ageRestricted: product.ageRestricted,
  };

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => add(snapshot)}
        className="mt-3 w-full rounded-full border border-line-strong py-2 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
      >
        Agregar al carro
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
