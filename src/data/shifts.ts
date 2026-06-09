import type { Expense, Shift, Transaction } from "@/types";

const SHIFT_USER = "Recepción · turno noche";

// Id del turno en curso. Los movimientos de inventario del turno lo referencian
// (refId) para poder itemizar los artículos vendidos en el corte.
export const CURRENT_SHIFT_ID = "s-1477";

// Pagos registrados en el turno en curso. La suma alimenta el detalle de "Pagos
// del turno"; los totales del corte se llevan en las líneas cash/card del turno.
export const SEED_TRANSACTIONS: Transaction[] = [
  { id: "t-501", roomId: "102", method: "cash", amount: 50000, at: "2026-06-04T22:20:00", user: SHIFT_USER },
  { id: "t-502", roomId: "105", method: "card", amount: 50000, at: "2026-06-04T22:48:00", user: SHIFT_USER },
  { id: "t-503", roomId: "108", method: "cash", amount: 35000, at: "2026-06-04T23:05:00", user: SHIFT_USER },
  { id: "t-504", roomId: "201", method: "transfer", amount: 75000, at: "2026-06-04T23:30:00", user: SHIFT_USER },
  { id: "t-505", roomId: "203", method: "cash", amount: 45000, at: "2026-06-05T00:10:00", user: SHIFT_USER },
  { id: "t-506", roomId: "304", method: "card", amount: 45000, at: "2026-06-05T00:42:00", user: SHIFT_USER },
];

// Turno abierto sembrado con los números del corte real del cliente (folio 1477):
// el descuadre fuerte está en tarjeta (−$85.000), el dolor que cierra el trato.
export const SEED_SHIFT: Shift = {
  id: CURRENT_SHIFT_ID,
  folio: 1477,
  user: SHIFT_USER,
  openedAt: "2026-06-04T22:00:00",
  openingCash: 15000,
  cash: { real: 419000, expected: 417000 },
  card: { real: 416000, expected: 501000 },
  expenses: { real: 0, expected: 0 },
  tipsCash: 19500,
  tipsCard: 27000,
};

// Gastos del turno. Arranca vacío: registrar un gasto sube expenses.real y baja
// la utilidad del turno.
export const SEED_EXPENSES: Expense[] = [];
