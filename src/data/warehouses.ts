import type { Warehouse } from "@/types";

// Las tres bodegas reales de la operación: recepción (venta diaria), central
// (bajo llave) y lavandería/aseo (insumos de las camareras). Los traspasos
// digitales mueven stock entre ellas con guía interna de despacho.
export const WAREHOUSES: Warehouse[] = [
  { id: "recepcion", name: "Bodega de recepción", locked: false },
  { id: "central", name: "Bodega central", locked: true },
  { id: "lavanderia", name: "Bodega lavandería y aseo", locked: false },
];

export function warehouseName(id: string): string {
  return WAREHOUSES.find((w) => w.id === id)?.name ?? id;
}
