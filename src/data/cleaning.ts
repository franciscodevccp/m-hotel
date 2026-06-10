import type { CleaningLogEntry } from "@/types";

/** Personal de aseo (mucamas) de la demo. */
export const CLEANING_STAFF = ["Rosa Muñoz", "Marta Pino", "Carla Soto", "Lucía Vera"];

/**
 * 30 días de limpiezas (2026-05-11 → 2026-06-09), determinístico (corre en
 * módulo, una vez, con valores fijos: SSR y cliente idénticos). Cuatro perfiles
 * de rendimiento distinguibles: Rosa rápida (~16 m), Marta media (~22 m),
 * Carla media (~26 m) y Lucía lenta (~33 m). Fin de semana con más movimiento.
 */
function genCleaningLog(): CleaningLogEntry[] {
  const staff = CLEANING_STAFF;
  const roomIds = [
    "101", "102", "103", "104", "105", "106", "108",
    "201", "202", "203", "204", "205", "206",
    "301", "302", "303", "304", "401", "402",
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
