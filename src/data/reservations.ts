import { DEMO_CLIENT } from "@/lib/demo";
import { getCategory, priceFor } from "@/lib/pricing";
import type { CategoryId, DayType, Duration, Reservation } from "@/types";

function total(categoryId: CategoryId, dayType: DayType, duration: Duration): number {
  return priceFor(getCategory(categoryId), dayType, duration);
}

// Reservas precargadas para poblar el panel admin. A esta lista se suman, en el
// cliente, las reservas que llegan del flujo público.
export const SEED_RESERVATIONS: Reservation[] = [
  {
    id: "r-1044",
    categoryId: "jacuzzi-premium",
    roomId: "12",
    dayType: "weekend",
    duration: 6,
    guestName: DEMO_CLIENT.name,
    guestEmail: DEMO_CLIENT.email,
    guestPhone: DEMO_CLIENT.phone,
    guestRut: DEMO_CLIENT.rut,
    total: total("jacuzzi-premium", "weekend", 6),
    createdAt: "2026-06-09T20:00:00",
    arrivalAt: "2026-06-09T21:30:00",
    status: "confirmed",
  },
  {
    id: "r-1037",
    categoryId: "jacuzzi-vip",
    dayType: "weekday",
    duration: 3,
    guestName: DEMO_CLIENT.name,
    guestEmail: DEMO_CLIENT.email,
    guestPhone: DEMO_CLIENT.phone,
    guestRut: DEMO_CLIENT.rut,
    total: total("jacuzzi-vip", "weekday", 3),
    createdAt: "2026-05-22T20:00:00",
    status: "confirmed",
  },
  {
    id: "r-1042",
    categoryId: "jacuzzi-black",
    dayType: "weekend",
    duration: 6,
    guestName: "Camila R.",
    guestPhone: "+56 9 8123 4567",
    total: total("jacuzzi-black", "weekend", 6),
    createdAt: "2026-06-04T20:15:00",
    status: "confirmed",
  },
  {
    id: "r-1041",
    categoryId: "standard-black",
    dayType: "weekday",
    duration: 3,
    guestName: "Joaquín M.",
    guestPhone: "+56 9 7654 3210",
    total: total("standard-black", "weekday", 3),
    createdAt: "2026-06-04T19:40:00",
    status: "confirmed",
  },
  {
    id: "r-1040",
    categoryId: "jacuzzi-premium",
    dayType: "weekday",
    duration: 12,
    guestName: "Daniela P.",
    guestPhone: "+56 9 6011 2233",
    total: total("jacuzzi-premium", "weekday", 12),
    createdAt: "2026-06-04T18:05:00",
    status: "pending",
  },
  {
    id: "r-1039",
    categoryId: "standard-vip",
    dayType: "weekday",
    duration: 6,
    guestName: "Tomás V.",
    guestPhone: "+56 9 5544 8899",
    total: total("standard-vip", "weekday", 6),
    createdAt: "2026-06-04T16:30:00",
    status: "confirmed",
  },
  {
    id: "r-1038",
    categoryId: "jacuzzi-vip",
    dayType: "weekend",
    duration: 6,
    guestName: "Francisca A.",
    guestPhone: "+56 9 4400 1212",
    total: total("jacuzzi-vip", "weekend", 6),
    createdAt: "2026-06-03T23:10:00",
    status: "confirmed",
  },
];
