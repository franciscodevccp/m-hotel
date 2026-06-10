import type { CleaningLogEntry } from "@/types";

/** Personal de aseo (mucamas) de la demo. */
export const CLEANING_STAFF = ["Rosa Muñoz", "Marta Pino", "Carla Soto", "Lucía Vera"];

// Historial de limpiezas terminadas (placeholders). Quién, cuándo y cuánto se
// demoró. Determinístico. Hoy de la demo: 2026-06-09.
export const SEED_CLEANING_LOG: CleaningLogEntry[] = [
  { id: "cl-16", roomId: "105", by: "Rosa Muñoz", at: "2026-06-09T18:40:00", minutes: 18 },
  { id: "cl-15", roomId: "201", by: "Marta Pino", at: "2026-06-09T17:55:00", minutes: 26 },
  { id: "cl-14", roomId: "302", by: "Carla Soto", at: "2026-06-09T16:30:00", minutes: 31 },
  { id: "cl-13", roomId: "108", by: "Rosa Muñoz", at: "2026-06-09T15:10:00", minutes: 14 },
  { id: "cl-12", roomId: "401", by: "Lucía Vera", at: "2026-06-09T13:45:00", minutes: 38 },
  { id: "cl-11", roomId: "203", by: "Marta Pino", at: "2026-06-09T12:20:00", minutes: 22 },
  { id: "cl-10", roomId: "102", by: "Rosa Muñoz", at: "2026-06-08T23:05:00", minutes: 16 },
  { id: "cl-9", roomId: "206", by: "Carla Soto", at: "2026-06-08T21:40:00", minutes: 28 },
  { id: "cl-8", roomId: "304", by: "Lucía Vera", at: "2026-06-08T20:15:00", minutes: 33 },
  { id: "cl-7", roomId: "107", by: "Marta Pino", at: "2026-06-08T18:50:00", minutes: 19 },
  { id: "cl-6", roomId: "205", by: "Rosa Muñoz", at: "2026-06-08T17:25:00", minutes: 21 },
  { id: "cl-5", roomId: "402", by: "Carla Soto", at: "2026-06-07T22:30:00", minutes: 35 },
  { id: "cl-4", roomId: "104", by: "Lucía Vera", at: "2026-06-07T20:10:00", minutes: 17 },
  { id: "cl-3", roomId: "202", by: "Marta Pino", at: "2026-06-07T18:35:00", minutes: 24 },
  { id: "cl-2", roomId: "301", by: "Rosa Muñoz", at: "2026-06-06T23:15:00", minutes: 29 },
  { id: "cl-1", roomId: "106", by: "Carla Soto", at: "2026-06-06T21:00:00", minutes: 20 },
];
