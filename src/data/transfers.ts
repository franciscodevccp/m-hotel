import type { Transfer } from "@/types";

// Traspasos sembrados entre bodegas (historial + la solicitud lista para
// aprobar en vivo durante la demo). Los productId apuntan al inventario real
// (`p-{códigoDeBarras}`); las cantidades de tr-103 son entregables con el
// stock central sembrado. Fechas absolutas: el "hoy" de la demo es 2026-06-09.
export const SEED_TRANSFERS: Transfer[] = [
  {
    id: "tr-103",
    from: "central",
    to: "recepcion",
    items: [
      { productId: "p-7802100505538", quantity: 24 }, // Cerveza Royal Guard 355 cc
      { productId: "p-7801620004507", quantity: 24 }, // Agua mineral con gas 350 cc
      { productId: "p-7804676070113", quantity: 12 }, // Preservativos variedades
    ],
    status: "solicitado",
    requestedBy: "Recepción · turno noche",
    note: "Reposición para el fin de semana: cervezas y agua casi sin saldo en recepción.",
    createdAt: "2026-06-09T19:30:00",
    branchId: "limache",
  },
  {
    id: "tr-102",
    from: "central",
    to: "recepcion",
    items: [
      { productId: "p-7801610880159", quantity: 12 }, // Coca-Cola Zero Express 237 ml
      { productId: "p-7792798006045", quantity: 24 }, // Cerveza Stella Artois 330 cc
    ],
    status: "recibido",
    requestedBy: "Recepción · turno día",
    deliveredBy: "Encargado de inventario",
    receivedBy: "Recepción · turno día",
    createdAt: "2026-06-08T10:15:00",
    deliveredAt: "2026-06-08T11:40:00",
    receivedAt: "2026-06-08T12:05:00",
    branchId: "limache",
  },
  {
    id: "tr-101",
    from: "central",
    to: "recepcion",
    items: [
      { productId: "p-777000804005", quantity: 6 }, // Lubricante masculino Starsex
      { productId: "p-7804620833184", quantity: 6 }, // Pastilla tipo Viagra Enhora
    ],
    status: "entregado",
    requestedBy: "Recepción · turno noche",
    deliveredBy: "Encargado de inventario",
    createdAt: "2026-06-07T21:10:00",
    deliveredAt: "2026-06-07T22:00:00",
    branchId: "limache",
  },
  {
    id: "tr-100",
    from: "central",
    to: "recepcion",
    items: [{ productId: "p-75041670", quantity: 12 }], // Cerveza Corona 330 cc (sin saldo central)
    status: "rechazado",
    requestedBy: "Recepción · turno día",
    deliveredBy: "Encargado de inventario",
    note: "Stock central insuficiente, se repone con la compra del viernes.",
    createdAt: "2026-06-06T09:40:00",
    branchId: "limache",
  },
];
