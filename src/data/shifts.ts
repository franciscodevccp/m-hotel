import type { Shift, Transaction } from "@/types";

const SHIFT_USER = "Recepción · turno noche";

// Pagos registrados en el turno en curso. La suma es el total "registrado" en caja.
export const SEED_TRANSACTIONS: Transaction[] = [
  { id: "t-501", roomId: "102", method: "cash", amount: 50000, at: "2026-06-04T22:20:00", user: SHIFT_USER },
  { id: "t-502", roomId: "105", method: "card", amount: 50000, at: "2026-06-04T22:48:00", user: SHIFT_USER },
  { id: "t-503", roomId: "108", method: "cash", amount: 35000, at: "2026-06-04T23:05:00", user: SHIFT_USER },
  { id: "t-504", roomId: "201", method: "transfer", amount: 75000, at: "2026-06-04T23:30:00", user: SHIFT_USER },
  { id: "t-505", roomId: "203", method: "cash", amount: 45000, at: "2026-06-05T00:10:00", user: SHIFT_USER },
  { id: "t-506", roomId: "304", method: "card", amount: 45000, at: "2026-06-05T00:42:00", user: SHIFT_USER },
];

// Turno abierto con un descuadre intencional: lo esperado por ocupación/reservas
// supera lo registrado en caja. Es el gancho del módulo de caja.
export const SEED_SHIFT: Shift = {
  id: "s-77",
  user: SHIFT_USER,
  openedAt: "2026-06-04T22:00:00",
  expectedTotal: 315000,
  countedTotal: 300000,
};
