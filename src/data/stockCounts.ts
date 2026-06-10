import type { StockCount } from "@/types";

// Conteo de inventario de ejemplo: parcial de bebidas y cervezas en la bodega
// de recepción, cerrado y ajustado el 2026-06-08. Dos diferencias detectadas;
// sus movimientos de ajuste viven en SEED_MOVEMENTS (refId "cnt-2061").
export const SEED_STOCK_COUNTS: StockCount[] = [
  {
    id: "cnt-2061",
    scope: "parcial",
    warehouseId: "recepcion",
    group: "Bebidas y cervezas",
    lines: [
      { productId: "p-7802100505538", expected: 14, counted: 12 }, // Royal Guard: −2
      { productId: "p-7801620004507", expected: 12, counted: 11 }, // Agua con gas: −1
      { productId: "p-7792798006045", expected: 12, counted: 12 },
      { productId: "p-7801610350355", expected: 12, counted: 12 },
      { productId: "p-9002490100070", expected: 12, counted: 12 },
      { productId: "p-7802100000354", expected: 12, counted: 12 },
    ],
    status: "cerrado",
    adjusted: true,
    by: "Encargado de inventario",
    createdAt: "2026-06-08T16:20:00",
    closedAt: "2026-06-08T16:55:00",
    branchId: "limache",
  },
];
