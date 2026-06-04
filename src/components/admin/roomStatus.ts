import type { RoomStatus } from "@/types";

// Meta de estados de habitación: etiqueta y clases de color (apagadas, no semáforos).
export const ROOM_STATUS: Record<RoomStatus, { label: string; dot: string; text: string }> = {
  available: { label: "Disponible", dot: "bg-ok", text: "text-ok" },
  occupied: { label: "Ocupada", dot: "bg-busy", text: "text-busy" },
  cleaning: { label: "Limpieza", dot: "bg-clean", text: "text-clean" },
  maintenance: { label: "Mantención", dot: "bg-maint", text: "text-maint" },
};

export const ROOM_STATUS_ORDER: RoomStatus[] = [
  "available",
  "occupied",
  "cleaning",
  "maintenance",
];
