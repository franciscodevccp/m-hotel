import { seedProductId } from "@/data/products";
import { hasJacuzzi } from "@/lib/pricing";
import { CATEGORIES } from "@/data/categories";
import type { CategoryId, CleaningKitItem, CleaningKits, CleaningLogEntry } from "@/types";

export type { CleaningKitItem };

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

function kitItem(name: string, label: string, quantity: number): CleaningKitItem {
  return { productId: seedProductId(name), label, quantity };
}

// Medición predefinida por administración: cuánto insumo consume cada aseo.
// Es la base editable: el kit vigente vive en el store (Limpieza → Kit de
// insumos) y administración ajusta las cantidades por categoría.
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

/** Kit predeterminado de una categoría (semilla del kit configurable). */
export function cleaningKitFor(categoryId: CategoryId): CleaningKitItem[] {
  return [...KIT_BASE, ...(hasJacuzzi(categoryId) ? KIT_JACUZZI : [])].filter(
    (i) => i.productId,
  );
}

/** Kits iniciales por categoría: la medición que administración puede ajustar. */
export const SEED_CLEANING_KITS: CleaningKits = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, cleaningKitFor(c.id)]),
) as CleaningKits;

// ------------------------------------------------------------------ Historial

// Observaciones sembradas (≈1 de cada 30 limpiezas deja incidencia, como en la
// operación real). Alimentan el reporte de "habitaciones observadas".
const SEED_NOTES = [
  "Mancha en alfombra junto a la cama. Se aplicó quitamanchas, revisar en próxima ronda.",
  "Control remoto del aire acondicionado sin pilas. Se repuso desde lavandería.",
  "Quemadura de cigarro en sábana: se retiró del circuito y se informó a blancos.",
  "Espejo del baño con marco suelto. Se avisó a mantención.",
  "Faltó vaso de cortesía en el frigobar al entrar. Se repuso y queda anotado.",
  "Olor a humedad persistente en el baño. Se ventiló y aromatizó dos veces.",
];

/**
 * 30 días de limpiezas (2026-05-11 → 2026-06-09), determinístico (corre en
 * módulo, una vez, con valores fijos: SSR y cliente idénticos). Cuatro perfiles
 * de rendimiento distinguibles: Rosa rápida (~16 m), Marta media (~22 m),
 * Carla media (~26 m) y Lucía lenta (~33 m). Fin de semana con más movimiento.
 * Cada entrada lleva inicio, término, cumplimiento de checklist y, de vez en
 * cuando, una observación (para el reporte de observadas y cumplimiento).
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
      const minutes = Math.max(10, base + ((n * 7) % 9) - 4); // variación ±4 determinística
      const hour = 10 + ((c * 97) % 13); // 10:00–22:00
      const minute = (n * 11) % 60;
      const day = `2026-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const endMinutes = hour * 60 + minute;
      const startMinutes = Math.max(0, endMinutes - minutes);
      const fmt = (total: number) =>
        `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      entries.push({
        id: `cl-g${n}`,
        roomId: roomIds[(n * 5) % roomIds.length],
        by,
        startedAt: `${day}T${fmt(startMinutes)}:00`,
        at: `${day}T${fmt(endMinutes)}:00`,
        minutes,
        // ~1 de cada 25 limpiezas quedó cerrada por supervisión sin checklist
        // completo: da pie al indicador de cumplimiento de protocolo.
        checklist: n % 25 !== 0,
        note: n % 30 === 7 ? SEED_NOTES[Math.floor(n / 30) % SEED_NOTES.length] : undefined,
      });
    }
  }
  return entries.reverse(); // más reciente primero
}

export const SEED_CLEANING_LOG: CleaningLogEntry[] = genCleaningLog();
