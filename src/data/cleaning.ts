import { seedProductId } from "@/data/products";
import { hasJacuzzi } from "@/lib/pricing";
import type { CategoryId, CleaningLogEntry } from "@/types";

/** Personal de aseo (mucamas) de la demo. */
export const CLEANING_STAFF = ["Rosa Muñoz", "Marta Pino", "Carla Soto", "Lucía Vera"];

// ------------------------------------------------------------------ Checklist

const CHECKLIST_BASE = [
  "Cama y ropa de cama",
  "Baño y ducha",
  "Pisos",
  "Basureros",
  "Espejos",
  "Reposición de amenities",
  "Aromatización",
  "Revisión de daños o faltantes",
];

/** Tareas obligatorias del aseo; el jacuzzi se agrega solo donde corresponde. */
export function cleaningChecklistFor(categoryId: CategoryId): string[] {
  if (!hasJacuzzi(categoryId)) return CHECKLIST_BASE;
  const list = [...CHECKLIST_BASE];
  list.splice(2, 0, "Jacuzzi: vaciado y sanitizado");
  return list;
}

// ------------------------------------------------------------------ Kit de insumos

export interface CleaningKitItem {
  productId: string;
  label: string;
  /** Consumo estimado por aseo, en unidades del inventario (admite fracción de bidón). */
  quantity: number;
}

function kitItem(name: string, label: string, quantity: number): CleaningKitItem {
  return { productId: seedProductId(name), label, quantity };
}

// Medición predefinida por administración: cuánto insumo consume cada aseo.
// Configurable por tipo de habitación (la línea Jacuzzi consume más).
const KIT_BASE: CleaningKitItem[] = [
  kitItem("Limpia piso 5 L", "Limpia piso", 0.1),
  kitItem("Cloro gel 5 L", "Cloro gel", 0.1),
  kitItem("Desinfectante Anti Bac 220 cc elimina olores", "Desinfectante", 0.2),
  kitItem("Glade desodorante ambiental spray 360 ml", "Desodorante ambiental", 0.1),
  kitItem("Limpia vidrios 5 L", "Limpia vidrios", 0.1),
  kitItem("Papel higiénico", "Papel higiénico", 1),
  kitItem("Papel Nova Ovella 100 m", "Toalla de papel", 0.2),
];

const KIT_JACUZZI: CleaningKitItem[] = [
  kitItem("Cloro multiuso 5 L", "Cloro multiuso (jacuzzi)", 0.2),
  kitItem("Crema limpiadora 700 g", "Crema limpiadora", 0.2),
];

/** Insumos que descuenta cada limpieza según la categoría de la pieza. */
export function cleaningKitFor(categoryId: CategoryId): CleaningKitItem[] {
  return [...KIT_BASE, ...(hasJacuzzi(categoryId) ? KIT_JACUZZI : [])].filter(
    (i) => i.productId,
  );
}

/**
 * 30 días de limpiezas (2026-05-11 → 2026-06-09), determinístico (corre en
 * módulo, una vez, con valores fijos: SSR y cliente idénticos). Cuatro perfiles
 * de rendimiento distinguibles: Rosa rápida (~16 m), Marta media (~22 m),
 * Carla media (~26 m) y Lucía lenta (~33 m). Fin de semana con más movimiento.
 */
function genCleaningLog(): CleaningLogEntry[] {
  const staff = CLEANING_STAFF;
  const roomIds = [
    "1", "2", "3", "4", "5", "6", "7", "8",
    "10", "11", "12", "13", "14",
    "15", "16", "17", "18", "19", "20", "21",
  ];
  const entries: CleaningLogEntry[] = [];
  let n = 0;
  for (let d = 0; d < 30; d++) {
    const date = new Date(2026, 4, 11 + d); // mayo es mes 4
    const isWeekend = [5, 6, 0].includes(date.getDay());
    const cleanings = isWeekend ? 9 + (d % 3) : 5 + (d % 3);
    for (let c = 0; c < cleanings; c++) {
      n++;
      const by = staff[(d + c) % 4];
      const base = [16, 22, 26, 33][(d + c) % 4];
      const minutes = base + ((n * 7) % 9) - 4; // variación ±4 determinística
      const hour = 10 + ((c * 97) % 13); // 10:00–22:00
      entries.push({
        id: `cl-g${n}`,
        roomId: roomIds[(n * 5) % roomIds.length],
        by,
        at: `2026-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String((n * 11) % 60).padStart(2, "0")}:00`,
        minutes: Math.max(10, minutes),
      });
    }
  }
  return entries.reverse(); // más reciente primero
}

export const SEED_CLEANING_LOG: CleaningLogEntry[] = genCleaningLog();
