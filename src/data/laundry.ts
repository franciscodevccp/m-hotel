import type { LaundryLoad } from "@/types";

/** Máquinas de lavado propias del recinto. */
export const LAUNDRY_MACHINES: { name: string; type: "lavadora" | "secadora" }[] = [
  { name: "Lavadora 1", type: "lavadora" },
  { name: "Lavadora 2", type: "lavadora" },
  { name: "Secadora 1", type: "secadora" },
  { name: "Secadora 2", type: "secadora" },
];

// Cargas de lavado de la demo. createdAt fijo; el inicio de etapa (cronómetro)
// de las cargas en proceso se siembra sobre la hora actual en el cliente.
export const SEED_LAUNDRY: LaundryLoad[] = [
  { id: "lw-6", sheets: 20, towels: 24, robes: 6, stage: "recolectado", createdAt: "2026-06-09T20:30:00" },
  {
    id: "lw-5",
    sheets: 12,
    towels: 16,
    robes: 4,
    stage: "lavando",
    machine: "Lavadora 1",
    by: "Marta Soto",
    createdAt: "2026-06-09T20:05:00",
  },
  {
    id: "lw-4",
    sheets: 8,
    towels: 10,
    robes: 3,
    stage: "secando",
    machine: "Secadora 1",
    by: "Luisa Pérez",
    createdAt: "2026-06-09T19:40:00",
  },
  { id: "lw-3", sheets: 6, towels: 8, robes: 2, stage: "doblando", by: "Marta Soto", createdAt: "2026-06-09T19:10:00" },
  { id: "lw-2", sheets: 14, towels: 18, robes: 5, stage: "recolectado", by: "Luisa Pérez", createdAt: "2026-06-09T18:45:00" },
  { id: "lw-1", sheets: 10, towels: 12, robes: 4, stage: "listo", by: "Marta Soto", createdAt: "2026-06-09T17:20:00" },
];

/** Minutos en la etapa actual de las cargas en proceso (se siembra sobre la hora actual). */
export const SEED_LAUNDRY_MINUTES: Record<string, number> = {
  "lw-5": 18,
  "lw-4": 9,
  "lw-3": 4,
};

/** Siembra el inicio de etapa (cronómetro) de las cargas en proceso, sobre la hora actual. */
export function seedLaundryTimes(loads: LaundryLoad[]): LaundryLoad[] {
  const now = Date.now();
  return loads.map((l) => {
    const m = SEED_LAUNDRY_MINUTES[l.id];
    if (m != null && (l.stage === "lavando" || l.stage === "secando" || l.stage === "doblando")) {
      return { ...l, startedAt: new Date(now - m * 60000).toISOString() };
    }
    return l;
  });
}

/** Primera máquina libre del tipo pedido (o undefined si todas están ocupadas). */
export function freeMachineName(
  loads: LaundryLoad[],
  type: "lavadora" | "secadora",
): string | undefined {
  const stage = type === "lavadora" ? "lavando" : "secando";
  const busy = new Set(
    loads.filter((l) => l.stage === stage && l.machine).map((l) => l.machine as string),
  );
  return LAUNDRY_MACHINES.find((m) => m.type === type && !busy.has(m.name))?.name;
}
