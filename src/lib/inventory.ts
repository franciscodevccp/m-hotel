import { PRODUCT_SALES_30D } from "@/data/history";
import type { Product } from "@/types";

// Helpers de inventario por bodega. El campo `stock` del producto es el saldo
// de la bodega de recepción (operativo); `centralStock` es la bodega central.

/** Saldo en bodega central (bajo llave). */
export function centralOf(product: Product): number {
  return product.centralStock ?? 0;
}

/** Saldo total del recinto (recepción + central). */
export function totalOf(product: Product): number {
  return product.stock + centralOf(product);
}

/**
 * Productos sin ventas en los últimos 30 días (señal de bajo movimiento).
 * Solo aplica a familias vendibles; los insumos no rotan por venta.
 */
export function lowMovement(products: Product[]): Product[] {
  return products.filter(
    (p) => p.category !== "insumo" && p.active && (PRODUCT_SALES_30D[p.id] ?? 0) === 0,
  );
}
