import { DEMO_CLIENT } from "@/lib/demo";
import { getCategory, priceFor } from "@/lib/pricing";
import type { Room } from "@/types";

// 20 habitaciones: 8 Standard Vip, 6 Vip con Jacuzzi, 4 Jacuzzi Premium, 2 BLACK.
// Mezcla de estados para que el tablero se vea vivo. El occupiedUntil de las
// ocupadas se siembra en el cliente (ver SEED_OCCUPIED_MINUTES) para que el
// tiempo restante siempre sea coherente con la hora en que se mira la demo.
export const ROOMS: Room[] = [
  { id: "101", number: 101, categoryId: "standard", status: "available" },
  { id: "102", number: 102, categoryId: "standard", status: "occupied" },
  { id: "103", number: 103, categoryId: "standard", status: "cleaning" },
  { id: "104", number: 104, categoryId: "standard", status: "available" },
  { id: "105", number: 105, categoryId: "standard", status: "occupied" },
  { id: "106", number: 106, categoryId: "standard", status: "available" },
  { id: "107", number: 107, categoryId: "standard", status: "maintenance" },
  { id: "108", number: 108, categoryId: "standard", status: "occupied" },
  { id: "201", number: 201, categoryId: "vip-jacuzzi", status: "occupied" },
  { id: "202", number: 202, categoryId: "vip-jacuzzi", status: "available" },
  { id: "203", number: 203, categoryId: "vip-jacuzzi", status: "occupied" },
  { id: "204", number: 204, categoryId: "vip-jacuzzi", status: "cleaning" },
  { id: "205", number: 205, categoryId: "vip-jacuzzi", status: "available" },
  { id: "206", number: 206, categoryId: "vip-jacuzzi", status: "occupied" },
  { id: "301", number: 301, categoryId: "jacuzzi-premium", status: "available" },
  { id: "302", number: 302, categoryId: "jacuzzi-premium", status: "occupied" },
  { id: "303", number: 303, categoryId: "jacuzzi-premium", status: "available" },
  {
    id: "304",
    number: 304,
    categoryId: "jacuzzi-premium",
    status: "occupied",
    // Estancia activa del cliente de la demo: su habitación ya está asignada.
    stay: {
      dayType: "weekend",
      duration: 6,
      total: priceFor(getCategory("jacuzzi-premium"), "weekend", 6),
      guestName: DEMO_CLIENT.name,
      checkInAt: "2026-06-09T21:30:00",
    },
  },
  { id: "401", number: 401, categoryId: "black", status: "occupied" },
  { id: "402", number: 402, categoryId: "black", status: "available" },
];

/** Minutos restantes mock por habitación ocupada (sembrados sobre la hora actual). */
export const SEED_OCCUPIED_MINUTES: Record<string, number> = {
  "102": 75,
  "105": 140,
  "108": 35,
  "201": 200,
  "203": 90,
  "206": 310,
  "302": 160,
  "304": 50,
  "401": 420,
};
