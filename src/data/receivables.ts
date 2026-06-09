import type { Receivable } from "@/types";

// Cuentas por cobrar de ejemplo (consumos/estancias pendientes de pago).
export const SEED_RECEIVABLES: Receivable[] = [
  {
    id: "c-88",
    customer: "Empresa Aguas Claras",
    roomId: "206",
    concept: "Estancia 12h + minibar (convenio empresa)",
    amount: 95000,
    createdAt: "2026-06-04T21:00:00",
    status: "pendiente",
  },
  {
    id: "c-87",
    customer: "Cliente frecuente · Hab. 301",
    roomId: "301",
    concept: "Saldo pendiente de la última visita",
    amount: 20000,
    createdAt: "2026-06-03T20:30:00",
    status: "pendiente",
  },
];
