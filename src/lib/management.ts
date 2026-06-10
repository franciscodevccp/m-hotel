import type { DailyStat, RoomUsage } from "@/data/history";
import type { Product } from "@/types";

// Selectores puros del panel gerencial. Trabajan sobre los agregados de
// src/data/history.ts; en producción se derivan de la base de datos real.

/** Venta total de un día: hospedaje + productos + tienda online. */
export function ventaDia(stat: DailyStat): number {
  return stat.revenueRooms + stat.revenueProducts + stat.revenueShop;
}

/** Ventas del último día de la serie (el "hoy" de la demo). */
export function ventasHoy(history: DailyStat[]): number {
  const last = history[history.length - 1];
  return last ? ventaDia(last) : 0;
}

/** Ventas acumuladas de un mes (prefijo YYYY-MM). */
export function ventasMes(history: DailyStat[], monthPrefix: string): number {
  return history
    .filter((s) => s.date.startsWith(monthPrefix))
    .reduce((sum, s) => sum + ventaDia(s), 0);
}

/** Totales de los últimos 3 meses de la serie, con etiqueta honesta del parcial. */
export function ventasPorMes(history: DailyStat[]): { mes: string; total: number }[] {
  return [
    { mes: "Abril", total: ventasMes(history, "2026-04") },
    { mes: "Mayo", total: ventasMes(history, "2026-05") },
    { mes: "Junio (al 9)", total: ventasMes(history, "2026-06") },
  ];
}

/** Ocupación promedio de los últimos N días de la serie. */
export function ocupacionPromedio(history: DailyStat[], days: number): number {
  const slice = history.slice(-days);
  if (slice.length === 0) return 0;
  return Math.round(slice.reduce((s, d) => s + d.occupancyPct, 0) / slice.length);
}

/** Ocupación promedio de los últimos N días, separada por fin de semana / semana. */
export function ocupacionPorTipoDia(
  history: DailyStat[],
  days: number,
): { weekend: number; weekday: number } {
  const slice = history.slice(-days);
  const isWeekend = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 5 || day === 6 || day === 0;
  };
  const we = slice.filter((s) => isWeekend(s.date));
  const wd = slice.filter((s) => !isWeekend(s.date));
  const avg = (list: DailyStat[]) =>
    list.length === 0 ? 0 : Math.round(list.reduce((s, d) => s + d.occupancyPct, 0) / list.length);
  return { weekend: avg(we), weekday: avg(wd) };
}

/** Ticket promedio por estancia de los últimos N días (hospedaje / estancias estimadas). */
export function ticketPromedio(history: DailyStat[], days: number): number {
  const slice = history.slice(-days);
  const revenue = slice.reduce((s, d) => s + d.revenueRooms, 0);
  const stays = slice.reduce((s, d) => s + (d.occupancyPct / 100) * 20, 0);
  return stays === 0 ? 0 : Math.round(revenue / stays / 100) * 100;
}

/**
 * Comparativo honesto entre períodos comparables: las últimas 4 semanas contra
 * las 4 anteriores. Al ser múltiplos de 7 días, ambas ventanas tienen el mismo
 * mix de fines de semana (comparar junio parcial contra mayo completo
 * distorsiona por ese mix).
 */
export function comparativoMensual(history: DailyStat[]): {
  actual: number;
  anterior: number;
  deltaPct: number;
} {
  const last = history.slice(-28);
  const prev = history.slice(-56, -28);
  const total = (list: DailyStat[]) => list.reduce((s, d) => s + ventaDia(d), 0);
  const actual = ventasMes(history, "2026-06");
  const anterior = total(prev);
  const deltaPct =
    total(prev) === 0 ? 0 : Math.round(((total(last) - total(prev)) / total(prev)) * 100);
  return { actual, anterior, deltaPct };
}

/** Habitaciones con más ingreso en 90 días. */
export function topHabitaciones(usage: RoomUsage[], n: number): RoomUsage[] {
  return [...usage].sort((a, b) => b.revenue - a.revenue).slice(0, n);
}

/** Habitaciones con menor rotación en 90 días. */
export function bottomHabitaciones(usage: RoomUsage[], n: number): RoomUsage[] {
  return [...usage].sort((a, b) => a.stays - b.stays).slice(0, n);
}

export interface ProductRank {
  product: Product;
  units: number;
  revenue: number;
}

/** Productos más vendidos en 30 días (por ingreso: unidades × precio). */
export function topProductos30d(
  sales: Record<string, number>,
  products: Product[],
  n: number,
): ProductRank[] {
  return products
    .filter((p) => p.category !== "insumo" && p.active)
    .map((p) => ({ product: p, units: sales[p.id] ?? 0, revenue: (sales[p.id] ?? 0) * p.price }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n);
}

/** Productos vendibles con menos rotación en 30 días (excluye los sin ventas). */
export function bottomProductos30d(
  sales: Record<string, number>,
  products: Product[],
  n: number,
): ProductRank[] {
  return products
    .filter((p) => p.category !== "insumo" && p.active && (sales[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, units: sales[p.id] ?? 0, revenue: (sales[p.id] ?? 0) * p.price }))
    .sort((a, b) => a.units - b.units || a.revenue - b.revenue)
    .slice(0, n);
}
