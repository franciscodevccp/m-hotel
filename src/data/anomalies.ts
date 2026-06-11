import type { Anomaly } from "@/types";

// Anomalías de ejemplo para poblar la bitácora del turno.
export const SEED_ANOMALIES: Anomaly[] = [
  {
    id: "a-301",
    roomId: "13",
    type: "dano",
    description: "Control del jacuzzi no responde. Derivado a mantención.",
    at: "2026-06-04T23:15:00",
    user: "Recepción · turno noche",
    status: "abierta",
  },
  {
    id: "a-300",
    roomId: "19",
    type: "objeto_olvidado",
    description: "Par de lentes olvidados, guardados en recepción.",
    at: "2026-06-04T22:50:00",
    user: "Recepción · turno noche",
    status: "resuelta",
  },
];
