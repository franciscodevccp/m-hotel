import type { RoomCharge } from "@/types";

/**
 * Tickets de cobro en pieza precargados. Las habitaciones ocupadas con pago
 * registrado en el turno (ver SEED_TRANSACTIONS) ya no aparecen acá: estos son
 * los cobros que la camarera tiene pendientes al abrir la demo.
 */
export const SEED_CHARGES: RoomCharge[] = [
  {
    id: "ch-118",
    roomId: "11",
    concept: "Bloque 3 h",
    amount: 50000,
    courtesies: ["1× Café sachet 45 g 2 un."],
    status: "pendiente",
    createdAt: "2026-06-11T11:05:00",
  },
  {
    id: "ch-117",
    roomId: "15",
    concept: "Bloque 12 h",
    amount: 105000,
    courtesies: ["1× Porción vaso espumante", "1× Bomba de baño 60 g"],
    status: "pendiente",
    createdAt: "2026-06-11T09:40:00",
  },
  {
    id: "ch-116",
    roomId: "17",
    concept: "Bloque 6 h",
    amount: 85000,
    courtesies: [],
    status: "pendiente",
    createdAt: "2026-06-11T10:20:00",
  },
];
