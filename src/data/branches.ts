import type { Branch } from "@/types";

// Sucursales del grupo. La arquitectura nace preparada para multi-sucursal:
// los registros nuevos llevan branchId y la vista consolidada es fase futura.
export const SEED_BRANCHES: Branch[] = [
  {
    id: "limache",
    name: "M Motel Limache",
    address: "Av. Palmira Romano Sur 196-A, Limache",
    active: true,
  },
];
