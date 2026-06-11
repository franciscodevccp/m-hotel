import type { AuditEntry } from "@/types";

// Registro de auditoría de demostración (placeholders). Movimientos variados de
// distintos usuarios y roles, ordenables por fecha. Determinístico.
export const SEED_AUDIT: AuditEntry[] = [
  { id: "au-20", type: "crear", action: "Registró ingreso de stock", target: "Abarrotes Limache · $93.600", module: "Inventario", at: "2026-06-09T21:05:00", userName: "Encargado de inventario", userRole: "encargado" },
  { id: "au-19", type: "editar", action: "Editó la configuración del recinto", target: "Datos del recinto", module: "Configuración", at: "2026-06-09T20:48:00", userName: "Ivon", userRole: "admin" },
  { id: "au-18", type: "crear", action: "Creó una reserva", target: "Jacuzzi Premium · Valentina Ríos", module: "Reservas", at: "2026-06-09T20:10:00", userName: "Recepción turno noche", userRole: "recepcion" },
  { id: "au-17", type: "estado", action: "Hizo check-in", target: "Habitación 12", module: "Habitaciones", at: "2026-06-09T19:32:00", userName: "Recepción turno noche", userRole: "recepcion" },
  { id: "au-16", type: "editar", action: "Editó un producto", target: "Vibrador Power Wand Rosado · precio", module: "Inventario", at: "2026-06-09T18:55:00", userName: "Encargado de inventario", userRole: "encargado" },
  { id: "au-15", type: "crear", action: "Registró un pago", target: "Efectivo · $50.000 · Hab. 2", module: "Caja", at: "2026-06-09T17:40:00", userName: "Recepción turno día", userRole: "recepcion" },
  { id: "au-14", type: "estado", action: "Terminó la limpieza", target: "Habitación 13 · 22 min", module: "Limpieza", at: "2026-06-09T16:20:00", userName: "Aseo", userRole: "aseo" },
  { id: "au-13", type: "crear", action: "Creó un proveedor", target: "Distribuidora Aconcagua", module: "Inventario", at: "2026-06-09T15:05:00", userName: "Encargado de inventario", userRole: "encargado" },
  { id: "au-12", type: "estado", action: "Avanzó un pedido de la tienda", target: "#1052 → Preparando", module: "Tienda online", at: "2026-06-09T14:12:00", userName: "Ivon", userRole: "admin" },
  { id: "au-11", type: "estado", action: "Hizo check-out", target: "Habitación 19", module: "Habitaciones", at: "2026-06-09T12:48:00", userName: "Recepción turno día", userRole: "recepcion" },
  { id: "au-10", type: "editar", action: "Ajustó stock", target: "Corona (330 ml) · +24", module: "Inventario", at: "2026-06-09T11:30:00", userName: "Encargado de inventario", userRole: "encargado" },
  { id: "au-9", type: "crear", action: "Creó un pedido de room service", target: "Habitación 4", module: "Room service", at: "2026-06-08T23:40:00", userName: "Recepción turno noche", userRole: "recepcion" },
  { id: "au-8", type: "estado", action: "Entregó un pedido de room service", target: "Habitación 7", module: "Room service", at: "2026-06-08T22:15:00", userName: "Recepción turno noche", userRole: "recepcion" },
  { id: "au-7", type: "editar", action: "Editó precios de una categoría", target: "Categoría Jacuzzi Black", module: "Precios", at: "2026-06-08T20:05:00", userName: "Ivon", userRole: "admin" },
  { id: "au-6", type: "crear", action: "Registró una anomalía", target: "Hab. 5 · objeto olvidado", module: "Anomalías", at: "2026-06-08T18:30:00", userName: "Recepción turno día", userRole: "recepcion" },
  { id: "au-5", type: "crear", action: "Creó un usuario", target: "Encargado de inventario · Encargado", module: "Configuración", at: "2026-06-08T17:10:00", userName: "Ivon", userRole: "admin" },
  { id: "au-4", type: "estado", action: "Cambió de habitación", target: "4 → 5", module: "Habitaciones", at: "2026-06-07T21:00:00", userName: "Recepción turno noche", userRole: "recepcion" },
  { id: "au-3", type: "crear", action: "Creó un cupón", target: "VERANO15 · 15%", module: "Tienda online", at: "2026-06-07T19:45:00", userName: "Ivon", userRole: "admin" },
  { id: "au-2", type: "acceso", action: "Inició sesión", target: "Administración", module: "Acceso", at: "2026-06-07T12:00:00", userName: "Ivon", userRole: "admin" },
  { id: "au-1", type: "estado", action: "Resolvió una anomalía", target: "Hab. 14", module: "Anomalías", at: "2026-06-06T23:20:00", userName: "Recepción turno noche", userRole: "recepcion" },
];
