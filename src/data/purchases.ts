import { seedProductId } from "@/data/products";
import type { Provider, Purchase, PurchaseItem } from "@/types";

// Proveedores habituales del recinto (para el ingreso de stock y los informes).
export const PROVIDERS: Provider[] = [
  { id: "pv-1", name: "Abarrotes Limache", rut: "76.412.880-1" },
  { id: "pv-2", name: "Comercial Valparaíso", rut: "77.205.339-K" },
  { id: "pv-3", name: "Distribuidora Aconcagua", rut: "78.991.450-6" },
  { id: "pv-4", name: "Importadora Eros", rut: "76.880.112-3" },
  { id: "pv-5", name: "Viñas y Licores V Región", rut: "79.330.778-9" },
];

interface SeedItem {
  name: string;
  qty: number;
  cost: number;
}

function build(id: string, provider: string, at: string, user: string, items: SeedItem[]): Purchase {
  const list: PurchaseItem[] = items.map((it) => ({
    productId: seedProductId(it.name),
    quantity: it.qty,
    unitCost: it.cost,
  }));
  return {
    id,
    provider,
    items: list,
    total: list.reduce((s, it) => s + it.quantity * it.unitCost, 0),
    at,
    user,
  };
}

// Ingresos de stock ya registrados (historial de la demo). Determinístico.
export const SEED_PURCHASES: Purchase[] = [
  build("pc-1021", "Abarrotes Limache", "2026-06-08T11:30:00", "Encargado", [
    { name: "Corona (330 ml)", qty: 24, cost: 1400 },
    { name: "Agua embotellada (350 ml)", qty: 36, cost: 600 },
    { name: "Bebidas en Lata (350 ml)", qty: 48, cost: 800 },
  ]),
  build("pc-1020", "Importadora Eros", "2026-06-06T16:10:00", "Encargado", [
    { name: "Caja preservativos Sensor Plus (3 un.)", qty: 24, cost: 1200 },
    { name: 'Lubricante femenino Starsex "Placer Intenso"', qty: 12, cost: 1100 },
  ]),
  build("pc-1019", "Viñas y Licores V Región", "2026-06-04T10:05:00", "Encargado", [
    { name: "Misiones de Rengo Cabernet Sauvignon (750 ml)", qty: 12, cost: 4500 },
    { name: "Espumante Demi Sec Barón Lacroix (750 ml)", qty: 6, cost: 6900 },
  ]),
];
