import { CATEGORIES } from "@/data/categories";
import type { Category, CategoryId, DayType, Duration } from "@/types";

// Única fuente de verdad para leer tarifas. Cualquier precio que se muestre
// debe pasar por acá, leyendo data/categories.ts.

export const DURATIONS: Duration[] = [3, 6, 12];

export function getCategory(id: CategoryId): Category {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Categoría desconocida: ${id}`);
  return found;
}

/** Precio del bloque para una categoría, día y duración. */
export function priceFor(category: Category, dayType: DayType, duration: Duration): number {
  return category.pricing[dayType][duration];
}

/** Valor de la hora adicional (informativo en la demo). */
export function extraHourFor(category: Category, dayType: DayType): number {
  return category.pricing.extraHour[dayType];
}

/** Precio "desde": el menor de la categoría (entre semana, 3 horas). */
export function fromPrice(category: Category): number {
  return category.pricing.weekday[3];
}
