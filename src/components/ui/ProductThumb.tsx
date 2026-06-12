/* eslint-disable @next/next/no-img-element -- miniaturas locales de la maqueta, sin optimizador */
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const FAMILY_TONE: Record<string, string> = {
  sexshop: "text-wine-soft",
  insumo: "text-muted",
};

/**
 * Miniatura de producto para inventarios, pedidos y traspasos. Muestra la
 * fotografía si el producto la tiene; si no, un monograma sobrio con la
 * inicial (la maqueta no trae las fotos reales: el espacio queda reservado).
 */
export function ProductThumb({
  product,
  size = "md",
  className,
}: {
  product: Pick<Product, "name" | "image" | "category">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-10";
  const initial = product.name.trim().charAt(0).toUpperCase() || "·";

  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        className={cn(sizeClass, "shrink-0 rounded-xs border border-line object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-xs border border-line bg-surface-2",
        "font-display",
        size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base",
        FAMILY_TONE[product.category] ?? "text-gold/80",
        className,
      )}
    >
      {initial}
    </span>
  );
}
