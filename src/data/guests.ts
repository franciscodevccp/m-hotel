import { DEMO_CLIENT } from "@/lib/demo";
import type { Guest } from "@/types";

/**
 * Historial interno de huéspedes (consulta de recepción). Cruza con la lista
 * negra por RUT: si hay coincidencia, la ficha alerta sola. Los huéspedes con
 * 6+ visitas se consideran frecuentes; VIP lo asigna administración.
 */
export const SEED_GUESTS: Guest[] = [
  {
    id: "g-1",
    name: DEMO_CLIENT.name,
    rut: DEMO_CLIENT.rut,
    phone: DEMO_CLIENT.phone,
    visits: 14,
    lastVisit: "2026-06-09T21:30:00",
    totalSpent: 1185000,
    tags: ["vip", "frecuente"],
    notes: "Prefiere Jacuzzi Premium. Pide espumante al llegar.",
  },
  {
    id: "g-2",
    name: "Camila R.",
    rut: "17.443.210-5",
    phone: "+56 9 8123 4567",
    visits: 9,
    lastVisit: "2026-06-04T20:15:00",
    totalSpent: 760000,
    tags: ["frecuente"],
    notes: "Siempre reserva Jacuzzi Black de fin de semana.",
  },
  {
    id: "g-3",
    name: "Joaquín M.",
    rut: "15.998.776-3",
    phone: "+56 9 7654 3210",
    visits: 6,
    lastVisit: "2026-06-04T19:40:00",
    totalSpent: 295000,
    tags: ["frecuente"],
  },
  {
    id: "g-4",
    name: "Daniela P.",
    rut: "18.554.301-9",
    phone: "+56 9 6011 2233",
    visits: 3,
    lastVisit: "2026-06-04T18:05:00",
    totalSpent: 250000,
    tags: [],
  },
  {
    id: "g-5",
    name: "Tomás V.",
    rut: "16.221.890-1",
    phone: "+56 9 5544 8899",
    visits: 2,
    lastVisit: "2026-06-04T16:30:00",
    totalSpent: 100000,
    tags: [],
  },
  {
    id: "g-6",
    name: "Francisca A.",
    rut: "19.102.334-6",
    phone: "+56 9 4400 1212",
    visits: 4,
    lastVisit: "2026-06-03T23:10:00",
    totalSpent: 320000,
    tags: [],
    notes: "Pidió boleta a nombre de empresa en su última visita.",
  },
  {
    id: "g-7",
    name: "Andrés Fuenzalida",
    rut: "14.220.873-K",
    phone: "+56 9 3322 1100",
    visits: 5,
    lastVisit: "2026-03-14T22:05:00",
    totalSpent: 365000,
    tags: [],
    notes: "Incidente con personal en marzo 2026. Derivado a lista negra.",
  },
  {
    id: "g-8",
    name: "Carolina Mendoza",
    rut: "16.582.441-7",
    phone: "+56 9 2210 4433",
    visits: 1,
    lastVisit: "2026-05-28T21:50:00",
    totalSpent: 50000,
    tags: [],
  },
];
