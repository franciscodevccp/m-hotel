import type { LinenIncident, LinenStock } from "@/types";

/** Stock base de blancos del recinto. El "en uso" se deriva de las habitaciones ocupadas. */
export const LINEN_STOCK: LinenStock[] = [
  { type: "sabana", total: 160 },
  { type: "toalla", total: 200 },
  { type: "bata", total: 80 },
];

/** Set de blancos por habitación ocupada, según si la categoría es premium (jacuzzi). */
export const LINEN_KIT = { base: { sabana: 2, toalla: 4, bata: 2 }, premium: { sabana: 2, toalla: 6, bata: 2 } };

// Percances de blancos (placeholders): manchas, roturas, pérdidas, etc.
export const SEED_LINEN_INCIDENTS: LinenIncident[] = [
  {
    id: "li-5",
    type: "toalla",
    kind: "mancha",
    quantity: 2,
    retired: true,
    roomId: "14",
    note: "Maquillaje que no salió al lavado",
    by: "Rosa Muñoz",
    at: "2026-06-09T16:40:00",
  },
  {
    id: "li-4",
    type: "sabana",
    kind: "rotura",
    quantity: 1,
    retired: true,
    roomId: "12",
    note: "Rasgada en la orilla",
    by: "Marta Pino",
    at: "2026-06-09T13:10:00",
  },
  {
    id: "li-3",
    type: "bata",
    kind: "perdida",
    quantity: 1,
    retired: true,
    roomId: "4",
    note: "No estaba al hacer el aseo",
    by: "Carla Soto",
    at: "2026-06-08T22:05:00",
  },
  {
    id: "li-2",
    type: "toalla",
    kind: "quemadura",
    quantity: 3,
    retired: true,
    roomId: "7",
    note: "Quemadura de cigarro",
    by: "Lucía Vera",
    at: "2026-06-08T19:30:00",
  },
  {
    id: "li-1",
    type: "sabana",
    kind: "mancha",
    quantity: 2,
    retired: false,
    roomId: "5",
    note: "Vino — en tratamiento",
    by: "Rosa Muñoz",
    at: "2026-06-07T21:15:00",
  },
];
