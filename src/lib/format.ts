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

/** Fecha legible: "mié 4 de junio". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "long",
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
