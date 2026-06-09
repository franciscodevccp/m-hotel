import { seedProductId } from "@/data/products";
import type { RoomServiceOrder } from "@/types";

// Pedidos de room service en preparación al abrir el turno (demo).
export const SEED_ROOM_SERVICE: RoomServiceOrder[] = [
  {
    id: "rso-310",
    roomId: "201",
    items: [
      { productId: seedProductId("Pizza Pepperoni"), quantity: 1 },
      { productId: seedProductId("Corona (330 ml)"), quantity: 2 },
    ],
    total: 10500, // 4.500 + 3.000 x2
    notes: "Sin ají en la pizza.",
    status: "preparando",
    createdAt: "2026-06-04T23:20:00",
    user: "Recepción · turno noche",
  },
  {
    id: "rso-309",
    roomId: "102",
    items: [{ productId: seedProductId("Piscola Mistral"), quantity: 1 }],
    total: 4500,
    status: "preparando",
    createdAt: "2026-06-04T23:05:00",
    user: "Recepción · turno noche",
  },
];
