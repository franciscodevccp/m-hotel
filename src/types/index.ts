// Tipos compartidos de la maqueta. Importar siempre desde "@/types".

/** Día de tarifa: weekday = Lun–Jue, weekend = Vie–Dom y festivos. */
export type DayType = "weekday" | "weekend";

/** Bloques de horas disponibles en la demo. */
export type Duration = 3 | 6 | 12;

/** Identificador estable de cada categoría. */
export type CategoryId = "standard" | "vip-jacuzzi" | "jacuzzi-premium" | "black";

export interface CategoryPricing {
  weekday: Record<Duration, number>;
  weekend: Record<Duration, number>;
  extraHour: { weekday: number; weekend: number };
}

export interface Category {
  id: CategoryId;
  name: string; // "Categoría BLACK"
  shortName: string; // "BLACK"
  area: number; // m²
  tagline: string; // frase corta y discreta
  amenities: string[];
  pricing: CategoryPricing;
  image: string | null; // ruta de la foto o null si va placeholder
}

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export interface Room {
  id: string;
  number: number;
  categoryId: CategoryId;
  status: RoomStatus;
  occupiedUntil?: string; // ISO, si está ocupada
}

export type ReservationStatus = "pending" | "confirmed";

export interface Reservation {
  id: string;
  categoryId: CategoryId;
  dayType: DayType;
  duration: Duration;
  guestName: string;
  guestPhone: string;
  total: number;
  createdAt: string; // ISO
  status: ReservationStatus;
}

export type PaymentMethod = "cash" | "card" | "transfer";

export interface Transaction {
  id: string;
  roomId: string;
  method: PaymentMethod;
  amount: number;
  at: string; // ISO
  user: string; // auditoría mock
}

export interface Shift {
  id: string;
  user: string;
  openedAt: string;
  closedAt?: string;
  expectedTotal: number; // esperado por reservas/ocupación
  countedTotal: number; // ingresado en caja
}

/** Estado parcial del flujo de reserva mientras el usuario lo completa. */
export interface ReservationDraft {
  categoryId: CategoryId | null;
  dayType: DayType;
  duration: Duration | null;
  guestName: string;
  guestPhone: string;
}
