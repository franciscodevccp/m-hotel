import type { Warehouse } from "@/types";

// Las dos bodegas reales de la operación: la de recepción (venta diaria) y la
// central (bajo llave). Los traspasos digitales mueven stock entre ambas.
export const WAREHOUSES: Warehouse[] = [
  { id: "recepcion", name: "Bodega de recepción", locked: false },
  { id: "central", name: "Bodega central", locked: true },
];

export function warehouseName(id: string): string {
  return WAREHOUSES.find((w) => w.id === id)?.name ?? id;
}
