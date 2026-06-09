import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type Level = "out" | "low" | "ok";

/** Nivel de stock segun el umbral del producto. */
export function stockLevel(p: Pick<Product, "stock" | "lowStockThreshold">): Level {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.lowStockThreshold) return "low";
  return "ok";
}

const META: Record<Level, { label: string; dot: string; text: string }> = {
  out: { label: "Agotado", dot: "bg-busy", text: "text-busy" },
  low: { label: "Stock bajo", dot: "bg-clean", text: "text-clean" },
  ok: { label: "En stock", dot: "bg-ok", text: "text-ok" },
};

/** Etiqueta de estado de stock: verde / ambar / rojo, en tono apagado. */
export function StockBadge({ product }: { product: Product }) {
  const meta = META[stockLevel(product)];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs", meta.text)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}
