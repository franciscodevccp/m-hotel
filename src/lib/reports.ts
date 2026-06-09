import { getCategory } from "@/lib/pricing";
import type { CategoryId, InventoryMovement, Product, Reservation, Transaction } from "@/types";

// Selectores de reportes derivados del estado real del store. Cada uno se mueve
// solo cuando ocurre la operación correspondiente (reserva, pago, venta).

const CATEGORY_ORDER: CategoryId[] = ["standard", "vip-jacuzzi", "jacuzzi-premium", "black"];

/** Monto de reservas agrupado por categoría de habitación. */
export function ingresosPorCategoria(reservations: Reservation[]) {
  const byCat = new Map<CategoryId, number>();
  for (const r of reservations) {
    byCat.set(r.categoryId, (byCat.get(r.categoryId) ?? 0) + r.total);
  }
  return CATEGORY_ORDER.map((id) => ({
    cat: getCategory(id).shortName,
    monto: byCat.get(id) ?? 0,
    black: id === "black",
  }));
}

/** Ingresos por canal: hospedaje (pagos), tienda física y tienda online (productos). */
export function ventasPorCanal(
  transactions: Transaction[],
  movements: InventoryMovement[],
  products: Product[],
) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const hospedaje = transactions.reduce((sum, t) => sum + t.amount, 0);
  let presencial = 0;
  let online = 0;
  for (const m of movements) {
    if (m.type !== "venta_presencial" && m.type !== "venta_online") continue;
    const product = byId.get(m.productId);
    if (!product) continue;
    const monto = Math.abs(m.quantity) * product.price;
    if (m.type === "venta_online") online += monto;
    else presencial += monto;
  }
  return [
    { canal: "Hospedaje", monto: hospedaje },
    { canal: "Tienda física", monto: presencial },
    { canal: "Tienda online", monto: online },
  ];
}

export interface TopProduct {
  name: string;
  unidades: number;
  monto: number;
}

/** Top de productos por monto vendido (presencial + online). */
export function topProductos(
  movements: InventoryMovement[],
  products: Product[],
  n = 5,
): TopProduct[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const acc = new Map<string, TopProduct>();
  for (const m of movements) {
    if (m.type !== "venta_presencial" && m.type !== "venta_online") continue;
    const product = byId.get(m.productId);
    if (!product) continue;
    const qty = Math.abs(m.quantity);
    const cur = acc.get(m.productId) ?? { name: product.name, unidades: 0, monto: 0 };
    cur.unidades += qty;
    cur.monto += qty * product.price;
    acc.set(m.productId, cur);
  }
  return [...acc.values()].sort((a, b) => b.monto - a.monto).slice(0, n);
}
