import type { DayType, Duration } from "@/types";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("es-CL");

/** Monto en CLP con separador de miles: 45000 -> "$45.000". */
export function formatCLP(amount: number): string {
  return clp.format(amount);
}

/** Número con separador de miles, sin símbolo de moneda. */
export function formatNumber(value: number): string {
  return decimal.format(value);
}

/** Hora local en formato 24h: "14:30". */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function to12h(h: number, m: number): string {
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Hora en formato 12h con AM/PM: "1:00 PM". Para lo de cara al huésped. */
export function formatTime12(date: Date): string {
  return to12h(date.getHours(), date.getMinutes());
}

/** Convierte "HH:MM" (24h) a 12h con AM/PM: "13:00" → "1:00 PM". */
export function hhmmTo12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return to12h(h, m);
}

/** Fecha legible: "mié 4 de junio". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Fecha y hora corta: "04-06-2026 22:00". */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Suma horas a una fecha y devuelve una nueva instancia. */
export function addHours(date: Date, hours: number): Date {
  const next = new Date(date.getTime());
  next.setHours(next.getHours() + hours);
  return next;
}

export const DAY_LABELS: Record<DayType, string> = {
  weekday: "Entre semana",
  weekend: "Fin de semana y festivos",
};

export const DAY_LABELS_LONG: Record<DayType, string> = {
  weekday: "Entre semana · Lun a Jue",
  weekend: "Fin de semana y festivos · Vie a Dom",
};

export const DURATION_LABELS: Record<Duration, string> = {
  3: "3 horas",
  6: "6 horas",
  12: "12 horas",
};
