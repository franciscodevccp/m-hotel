import type { CashLine, InventoryMovement, Product, Shift, ShiftItem } from "@/types";

// ShiftItem vive en @/types (lo comparte el snapshot de cortes archivados);
// se reexporta aquí para los consumidores existentes.
export type { ShiftItem };

// Derivados del corte de caja. No se guardan: se calculan desde el turno y los
// movimientos. Única fuente de verdad para los números que muestra el corte.

/** Diferencia de una línea del arqueo: real − esperado. Positivo = sobra, negativo = falta. */
export function lineDiff(line: CashLine): number {
  return line.real - line.expected;
}

/** Diferencia de efectivo. */
export function cashDiff(shift: Shift): number {
  return lineDiff(shift.cash);
}

/** Diferencia agregada de los medios electrónicos (débito + crédito + transferencia). */
export function cardDiff(shift: Shift): number {
  return lineDiff(shift.debit) + lineDiff(shift.credit) + lineDiff(shift.transfer);
}

export function expensesDiff(shift: Shift): number {
  return lineDiff(shift.expenses);
}

/** Descuadre total del turno: suma de las diferencias de todos los medios. */
export function totalDiff(shift: Shift): number {
  return cashDiff(shift) + cardDiff(shift);
}

/** Ingresos totales del turno: todos los medios realmente registrados. */
export function ingresosTotales(shift: Shift): number {
  return shift.cash.real + shift.debit.real + shift.credit.real + shift.transfer.real;
}

/** Utilidad del turno: ingresos − gastos reales. */
export function utilidadTurno(shift: Shift): number {
  return ingresosTotales(shift) - shift.expenses.real;
}

/**
 * Itemiza los artículos vendidos en el turno a partir de los movimientos de venta
 * cuyo refId apunta al turno. Agrupa por producto y suma cantidades y monto.
 */
export function shiftItems(
  movements: InventoryMovement[],
  products: Product[],
  shiftId: string,
): ShiftItem[] {
  const byId = new Map<string, Product>(products.map((p) => [p.id, p]));
  const acc = new Map<string, ShiftItem>();

  for (const m of movements) {
    if (m.refId !== shiftId) continue;
    if (m.type !== "venta_presencial" && m.type !== "venta_online") continue;
    const product = byId.get(m.productId);
    if (!product) continue;
    const qty = Math.abs(m.quantity);
    const existing = acc.get(m.productId);
    if (existing) {
      existing.quantity += qty;
      existing.total += qty * product.price;
    } else {
      acc.set(m.productId, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        total: qty * product.price,
      });
    }
  }

  return [...acc.values()].sort((a, b) => b.total - a.total);
}
