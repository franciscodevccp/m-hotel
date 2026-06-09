import type { LaundryOrder } from "@/types";

// Proveedores de lavandería disponibles (demo).
export const LAUNDRY_PROVIDERS: string[] = ["Lavandería Limache", "Wash Express", "Lavaseco Central"];

export const SEED_LAUNDRY: LaundryOrder[] = [
  {
    id: "l-220",
    provider: "Lavandería Limache",
    sheets: 24,
    towels: 30,
    sentAt: "2026-06-04T18:00:00",
    status: "en_proceso",
    takenBy: "Marta Soto",
  },
  {
    id: "l-219",
    provider: "Wash Express",
    sheets: 18,
    towels: 20,
    sentAt: "2026-06-03T17:30:00",
    status: "recibido",
    receivedAt: "2026-06-04T16:00:00",
    takenBy: "Luisa Pérez",
  },
];
