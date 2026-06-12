import { PRODUCT_SALES_30D } from "@/data/history";
import type { Product } from "@/types";

// Helpers de inventario por bodega. El campo `stock` del producto es el saldo
// de la bodega de recepción (operativo); `centralStock` es la bodega central y
// `laundryStock` la bodega de lavandería/aseo (insumos de las camareras).

/** Saldo en bodega central (bajo llave). */
export function centralOf(product: Product): number {
  return product.centralStock ?? 0;
}

/** Saldo en bodega de lavandería/aseo. */
export function laundryOf(product: Product): number {
  return product.laundryStock ?? 0;
}

/** Saldo de un producto en una bodega específica. */
export function stockOf(product: Product, warehouseId: string): number {
  if (warehouseId === "central") return centralOf(product);
  if (warehouseId === "lavanderia") return laundryOf(product);
  return product.stock;
}

/** Copia del producto con el saldo de una bodega reemplazado. */
export function withStock(product: Product, warehouseId: string, value: number): Product {
  if (warehouseId === "central") return { ...product, centralStock: value };
  if (warehouseId === "lavanderia") return { ...product, laundryStock: value };
  return { ...product, stock: value };
}

/** Saldo total del recinto (recepción + central + lavandería). */
export function totalOf(product: Product): number {
  return product.stock + centralOf(product) + laundryOf(product);
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
