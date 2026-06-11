import type { RoomStatus } from "@/types";

// Meta de estados de habitación. El tablero pinta la tarjeta completa con el
// código operacional del cliente: verde disponible, rojo ocupada, celeste
// limpieza, amarillo mantención/bloqueada. Identificación a golpe de vista.
export const ROOM_STATUS: Record<
  RoomStatus,
  { label: string; dot: string; text: string; card: string; fg: string }
> = {
  available: {
    label: "Disponible",
    dot: "bg-[var(--room-free-line)]",
    text: "text-[var(--room-free-fg)]",
    card: "border-[var(--room-free-line)] bg-[var(--room-free-bg)]",
    fg: "text-[var(--room-free-fg)]",
  },
  occupied: {
    label: "Ocupada",
    dot: "bg-[var(--room-occ-line)]",
    text: "text-[var(--room-occ-fg)]",
    card: "border-[var(--room-occ-line)] bg-[var(--room-occ-bg)]",
    fg: "text-[var(--room-occ-fg)]",
  },
  cleaning: {
    label: "Limpieza",
    dot: "bg-[var(--room-clean-line)]",
    text: "text-[var(--room-clean-fg)]",
    card: "border-[var(--room-clean-line)] bg-[var(--room-clean-bg)]",
    fg: "text-[var(--room-clean-fg)]",
  },
  maintenance: {
    label: "Mantención",
    dot: "bg-[var(--room-maint-line)]",
    text: "text-[var(--room-maint-fg)]",
    card: "border-[var(--room-maint-line)] bg-[var(--room-maint-bg)]",
    fg: "text-[var(--room-maint-fg)]",
  },
};

export const ROOM_STATUS_ORDER: RoomStatus[] = [
  "available",
  "occupied",
  "cleaning",
  "maintenance",
];
