import type {
  Coupon,
  Product,
  ShopFulfillment,
  ShopOrder,
  ShopOrderStatus,
  ShopPaymentMethod,
} from "@/types";

// --- Etiquetas y estados ---

export const SHOP_STATUS_LABEL: Record<ShopOrderStatus, string> = {
  pendiente: "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  despachado: "Despachado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const SHOP_STATUS_CLASS: Record<ShopOrderStatus, string> = {
  pendiente: "text-busy",
  pagado: "text-gold",
  preparando: "text-clean",
  despachado: "text-clean",
  entregado: "text-ok",
  cancelado: "text-dim",
};

/** Orden para listar (lo accionable primero). */
export const SHOP_STATUS_ORDER: Record<ShopOrderStatus, number> = {
  pendiente: 0,
  pagado: 1,
  preparando: 2,
  despachado: 3,
  entregado: 4,
  cancelado: 5,
};

/** Flujo lineal del pedido (sin cancelado). */
export const SHOP_FLOW: ShopOrderStatus[] = [
  "pendiente",
  "pagado",
  "preparando",
  "despachado",
  "entregado",
];

/** Siguiente estado al avanzar; null si ya terminó. */
export const SHOP_NEXT: Record<ShopOrderStatus, ShopOrderStatus | null> = {
  pendiente: "pagado",
  pagado: "preparando",
  preparando: "despachado",
  despachado: "entregado",
  entregado: null,
  cancelado: null,
};

/** Texto del botón para avanzar al siguiente estado. */
export const SHOP_ADVANCE_LABEL: Record<ShopOrderStatus, string> = {
  pendiente: "Confirmar pago",
  pagado: "Preparar",
  preparando: "Despachar",
  despachado: "Marcar entregado",
  entregado: "",
  cancelado: "",
};

export const FULFILLMENT_LABEL: Record<ShopFulfillment, string> = {
  despacho: "Despacho a domicilio",
  retiro: "Retiro en local",
  habitacion: "A la habitación",
};

/** Línea corta de entrega para listas (con comuna/habitación según el caso). */
export function fulfillmentLine(o: ShopOrder): string {
  if (o.fulfillment === "despacho") return `Despacho · ${o.comuna ?? ""}`;
  if (o.fulfillment === "habitacion") return o.address ?? "A la habitación";
  return "Retiro en local";
}

export const PAYMENT_LABEL: Record<ShopPaymentMethod, string> = {
  webpay: "Webpay",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
};

/** Etiqueta de estado, adaptada a retiro (despachado → listo para retiro). */
export function statusLabelFor(order: ShopOrder): string {
  if (order.status === "despachado" && order.fulfillment === "retiro") {
    return "Listo para retiro";
  }
  return SHOP_STATUS_LABEL[order.status];
}

/** El pedido representa una venta concretada (cuenta para ingresos). */
export function isRealized(status: ShopOrderStatus): boolean {
  return status === "pagado" || status === "preparando" || status === "despachado" || status === "entregado";
}

/** Pedidos que requieren acción del operador (pagados/por preparar/por despachar). */
export function needsAction(status: ShopOrderStatus): boolean {
  return status === "pagado" || status === "preparando" || status === "despachado";
}

// --- Cupones ---

export function couponLabel(c: Coupon): string {
  if (c.type === "porcentaje") return `${c.value}% de descuento`;
  if (c.type === "monto") return `$${c.value.toLocaleString("es-CL")} de descuento`;
  return "Envío gratis";
}

// --- Derivaciones para reportes y clientes ---

function dateKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function dayLabel(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

/** Ventas por día (pedidos concretados), últimos `limit` días con actividad. */
export function ventasPorDia(orders: ShopOrder[], limit = 14): { dia: string; monto: number }[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (!isRealized(o.status)) continue;
    const key = dateKey(o.createdAt);
    map.set(key, (map.get(key) ?? 0) + o.total);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-limit)
    .map(([key, monto]) => ({ dia: dayLabel(key), monto }));
}

/** Productos más vendidos online, por monto. */
export function topProductosOnline(
  orders: ShopOrder[],
  limit = 6,
): { name: string; qty: number; monto: number }[] {
  const map = new Map<string, { name: string; qty: number; monto: number }>();
  for (const o of orders) {
    if (!isRealized(o.status)) continue;
    for (const it of o.items) {
      const cur = map.get(it.name) ?? { name: it.name, qty: 0, monto: 0 };
      cur.qty += it.quantity;
      cur.monto += it.unitPrice * it.quantity;
      map.set(it.name, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.monto - a.monto).slice(0, limit);
}

/** Ventas por sub-categoría (grupo del catálogo). */
export function ventasPorGrupo(
  orders: ShopOrder[],
  products: Product[],
): { grupo: string; monto: number }[] {
  const groupById = new Map(products.map((p) => [p.id, p.group ?? "Otros"]));
  const map = new Map<string, number>();
  for (const o of orders) {
    if (!isRealized(o.status)) continue;
    for (const it of o.items) {
      const grupo = groupById.get(it.productId) ?? "Otros";
      map.set(grupo, (map.get(grupo) ?? 0) + it.unitPrice * it.quantity);
    }
  }
  return [...map.entries()].map(([grupo, monto]) => ({ grupo, monto })).sort((a, b) => b.monto - a.monto);
}

export interface CustomerSummary {
  name: string;
  email: string;
  phone: string;
  comuna?: string;
  pedidos: number;
  total: number;
  ultimo: string; // ISO del último pedido
}

/** Agrupa los pedidos por cliente (correo). */
export function clientesResumen(orders: ShopOrder[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const o of orders) {
    const key = o.customerEmail.toLowerCase();
    const cur =
      map.get(key) ??
      ({
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        comuna: o.comuna,
        pedidos: 0,
        total: 0,
        ultimo: o.createdAt,
      } satisfies CustomerSummary);
    cur.pedidos += 1;
    if (isRealized(o.status)) cur.total += o.total;
    if (o.createdAt > cur.ultimo) {
      cur.ultimo = o.createdAt;
      cur.name = o.customerName;
      cur.phone = o.customerPhone;
      cur.comuna = o.comuna;
    }
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
