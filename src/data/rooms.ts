import { openingPackFor } from "@/data/courtesies";
import { DEMO_CLIENT } from "@/lib/demo";
import { getCategory, priceFor } from "@/lib/pricing";
import type { Room } from "@/types";

// Las 21 habitaciones reales: 1-2-3-6-7-8-9 Standard VIP, 19-20-21 Standard Black,
// 4-5 Jacuzzi VIP, 10 a 14 Jacuzzi Premium y 15 a 18 Jacuzzi Black.
// Mezcla de estados para que el tablero se vea vivo. El occupiedUntil de las
// ocupadas se siembra en el cliente (ver SEED_OCCUPIED_MINUTES) para que el
// tiempo restante siempre sea coherente con la hora en que se mira la demo.
export const ROOMS: Room[] = [
  { id: "1", number: 1, categoryId: "standard-vip", status: "available" },
  { id: "2", number: 2, categoryId: "standard-vip", status: "occupied" },
  { id: "3", number: 3, categoryId: "standard-vip", status: "cleaning" },
  { id: "4", number: 4, categoryId: "jacuzzi-vip", status: "occupied" },
  { id: "5", number: 5, categoryId: "jacuzzi-vip", status: "available" },
  { id: "6", number: 6, categoryId: "standard-vip", status: "available" },
  { id: "7", number: 7, categoryId: "standard-vip", status: "occupied" },
  { id: "8", number: 8, categoryId: "standard-vip", status: "available" },
  { id: "9", number: 9, categoryId: "standard-vip", status: "maintenance" },
  { id: "10", number: 10, categoryId: "jacuzzi-premium", status: "available" },
  { id: "11", number: 11, categoryId: "jacuzzi-premium", status: "occupied" },
  {
    id: "12",
    number: 12,
    categoryId: "jacuzzi-premium",
    status: "occupied",
    // Estancia activa del cliente de la demo: su habitación ya está asignada
    // y el bloque se cobró en la pieza (ver t-506 en shifts.ts).
    stay: {
      dayType: "weekend",
      duration: 6,
      total: priceFor(getCategory("jacuzzi-premium"), "weekend", 6),
      guestName: DEMO_CLIENT.name,
      checkInAt: "2026-06-09T21:30:00",
      paid: true,
      paymentMethod: "credit",
      paidAt: "2026-06-09T21:48:00",
    },
    // Paquete de ingreso entregado al abrir + una cortesía pedida por
    // citófono: puebla el listado editable de cortesías del tablero.
    courtesies: [
      ...openingPackFor("jacuzzi-premium").map((c, i) => ({
        id: `sc-12-${i}`,
        productId: c.productId,
        label: c.label,
        quantity: c.quantity,
        at: "2026-06-09T21:30:00",
        opening: true,
      })),
      {
        id: "sc-12-extra",
        productId: "p-760798819006",
        label: "Vaso de espumante",
        quantity: 1,
        at: "2026-06-09T21:55:00",
      },
    ],
  },
  { id: "13", number: 13, categoryId: "jacuzzi-premium", status: "cleaning" },
  { id: "14", number: 14, categoryId: "jacuzzi-premium", status: "available" },
  { id: "15", number: 15, categoryId: "jacuzzi-black", status: "occupied" },
  { id: "16", number: 16, categoryId: "jacuzzi-black", status: "available" },
  { id: "17", number: 17, categoryId: "jacuzzi-black", status: "occupied" },
  { id: "18", number: 18, categoryId: "jacuzzi-black", status: "available" },
  { id: "19", number: 19, categoryId: "standard-black", status: "occupied" },
  { id: "20", number: 20, categoryId: "standard-black", status: "available" },
  { id: "21", number: 21, categoryId: "standard-black", status: "cleaning" },
];

/** Minutos restantes mock por habitación ocupada (sembrados sobre la hora actual). */
export const SEED_OCCUPIED_MINUTES: Record<string, number> = {
  "2": 75,
  "4": 200,
  "7": 140,
  "11": 160,
  "12": 50,
  "15": 420,
  "17": 310,
  "19": 35,
};
