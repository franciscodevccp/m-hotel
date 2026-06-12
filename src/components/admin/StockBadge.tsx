import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export type StockLevel = "out" | "critical" | "low" | "ok";

/**
 * Semáforo de stock (pedido del cliente): verde normal, amarillo bajo,
 * rojo crítico, gris sin stock. Crítico = la mitad del umbral o menos.
 */
export function stockLevelFor(quantity: number, threshold: number): StockLevel {
  if (quantity <= 0) return "out";
  if (quantity <= Math.max(1, Math.ceil(threshold / 2))) return "critical";
  if (quantity <= threshold) return "low";
  return "ok";
}

/** Nivel de stock de la bodega de recepción (saldo operativo de venta). */
export function stockLevel(p: Pick<Product, "stock" | "lowStockThreshold">): StockLevel {
  return stockLevelFor(p.stock, p.lowStockThreshold);
}

export const STOCK_META: Record<StockLevel, { label: string; dot: string; text: string }> = {
  out: { label: "Sin stock", dot: "bg-maint", text: "text-maint" },
  critical: { label: "Crítico", dot: "bg-busy", text: "text-busy" },
  low: { label: "Stock bajo", dot: "bg-clean", text: "text-clean" },
  ok: { label: "Normal", dot: "bg-ok", text: "text-ok" },
};

/** Etiqueta de estado de stock con el semáforo de cuatro niveles. */
export function StockBadge({ product }: { product: Product }) {
  const meta = STOCK_META[stockLevel(product)];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs", meta.text)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

/**
 * Punto compacto del semáforo para tablas por bodega: el color habla solo y
 * el nivel queda en el title/aria. La cantidad se muestra al lado.
 */
export function StockDot({ quantity, threshold }: { quantity: number; threshold: number }) {
  const meta = STOCK_META[stockLevelFor(quantity, threshold)];
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={cn("inline-block size-2 shrink-0 rounded-full", meta.dot)}
    />
  );
}
