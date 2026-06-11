import { SEED_PRODUCTS } from "@/data/products";

// Agregados HISTÓRICOS de ejemplo para el panel gerencial y las señales de
// inventario de la maqueta. En producción, estas series se derivan de la base
// de datos real (reservas, transacciones y movimientos). Determinístico: sin
// Math.random.

/** Productos deliberadamente sin ventas en 30 días (señal de bajo movimiento). */
const ZERO_SALES_30D = new Set<string>([
  "p-7692832922", // Sal de fruta limón (stock 183: sobrestock evidente)
  "p-30052765", // Papelillo OCB 1 1/4
  "p-11308146600", // Disfraz enfermera S/M (caja)
  "p-9876543210891", // Gin Knut Hansen 500 cc
  "p-7804340909053", // Vino Tarapacá Gran Reserva
  "p-7804300126940", // Vino Tabalí Cabernet Sauvignon
  "p-9876543210947", // Cofia negra (insumo)
  "p-9876543210940", // Tanax (insumo)
]);

/** Más vendidos del mes (unidades), curados a mano para que el ranking se lea real. */
const TOP_SALES_30D: Record<string, number> = {
  "p-7804676070113": 58, // Preservativos variedades
  "p-7802100505538": 52, // Cerveza Royal Guard 355 cc
  "p-7801620004507": 47, // Agua mineral con gas 350 cc
  "p-7801610880159": 44, // Coca-Cola Zero Express 237 ml
  "p-7792798006045": 41, // Cerveza Stella Artois 330 cc
  "p-7001": 38, // Papas fritas porción 250 g
  "p-777000804005": 36, // Lubricante masculino Starsex
  "p-7804620833184": 33, // Pastilla tipo Viagra Enhora
  "p-760798819007": 31, // Porción 2 oz Alto del Carmen 35°
  "p-7802175002171": 29, // Porción mango sour Andino
  "p-760798819006": 27, // Porción vaso espumante
  "p-769284135": 26, // Pizza pepperoni
  "p-777000803008": 24, // Lubricante anal
  "p-182703022026": 23, // Empanadas camarón mandarín 5 un.
  "p-7692832901": 22, // Arrollado jamón/queso 4 un.
  "p-1604202502": 21, // Café sachet 45 g 2 un.
  "p-9002490100070": 20, // Red Bull clásica
};

function hashSales(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i) * (i + 3)) % 9973;
  return (sum % 10) + 1; // 1–10 unidades
}

/**
 * Unidades vendidas por producto en los últimos 30 días (agregado de ejemplo).
 * Cubre las familias vendibles; los productos del set de bajo movimiento
 * quedan en 0 a propósito.
 */
export const PRODUCT_SALES_30D: Record<string, number> = Object.fromEntries(
  SEED_PRODUCTS.filter((p) => p.category !== "insumo").map((p) => [
    p.id,
    ZERO_SALES_30D.has(p.id) ? 0 : (TOP_SALES_30D[p.id] ?? hashSales(p.id)),
  ]),
);

// ------------------------------------------------------------------ Serie diaria

export interface DailyStat {
  date: string; // YYYY-MM-DD
  occupancyPct: number; // ocupación promedio del día (0–100)
  revenueRooms: number; // ingresos por hospedaje CLP
  revenueProducts: number; // ingresos por productos (recepción + room service) CLP
  revenueShop: number; // ingresos tienda online CLP
  expenses: number; // gastos operacionales CLP
}

function roundThousands(n: number): number {
  return Math.round(n / 1000) * 1000;
}

/** 90 días: 2026-03-12 → 2026-06-09, con forma semanal realista y +6 % de tendencia. */
function genHistory(): DailyStat[] {
  const stats: DailyStat[] = [];
  for (let i = 0; i < 90; i++) {
    const date = new Date(2026, 2, 12 + i); // marzo es mes 2
    const day = date.getDay();
    const wiggle = (i * 13) % 9; // 0–8, determinístico
    let occupancy: number;
    if (day === 5 || day === 6) occupancy = 78 + ((wiggle * 17) % 18); // vie–sáb 78–95
    else if (day === 0) occupancy = 60 + ((wiggle * 11) % 13); // dom 60–72
    else occupancy = 38 + ((wiggle * 19) % 18); // lun–jue 38–55
    const trend = 1 + 0.1 * (i / 89); // crecimiento suave del trimestre
    const weekend = day === 5 || day === 6 || day === 0;
    const ticket = weekend ? 68000 : 52000;
    const stays = (occupancy / 100) * 21; // 21 habitaciones
    const revenueRooms = roundThousands(stays * ticket * trend);
    const productsPct = 0.12 + ((i * 7) % 7) * 0.01; // 12–18 %
    const revenueProducts = roundThousands(revenueRooms * productsPct);
    const revenueShop =
      day === 5 || day === 6
        ? roundThousands(60000 + ((i * 23) % 61) * 1000) // picos vie–sáb
        : roundThousands(((i * 31) % 45) * 1000);
    const expenses = roundThousands(
      (day === 1 ? 160000 : 80000) + ((i * 29) % 61) * 1000, // picos los lunes (reposición)
    );
    stats.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      occupancyPct: Math.min(96, Math.round(occupancy)),
      revenueRooms,
      revenueProducts,
      revenueShop,
      expenses,
    });
  }
  return stats;
}

export const DAILY_HISTORY: DailyStat[] = genHistory();

// ------------------------------------------------------------------ Habitaciones

export interface RoomUsage {
  roomId: string;
  stays: number;
  revenue: number;
}

/**
 * Uso por habitación en 90 días. Las Standard rotan más; la línea Black rota
 * menos pero con mayor ingreso por estancia. La 9 (en mantención) es la menos
 * vendida a propósito: da pie a conversación real en la demo.
 */
export const ROOM_USAGE_90D: RoomUsage[] = [
  { roomId: "1", stays: 128, revenue: 4096000 },
  { roomId: "2", stays: 121, revenue: 3872000 },
  { roomId: "3", stays: 117, revenue: 3744000 },
  { roomId: "6", stays: 112, revenue: 3584000 },
  { roomId: "7", stays: 109, revenue: 3488000 },
  { roomId: "8", stays: 103, revenue: 3296000 },
  { roomId: "9", stays: 31, revenue: 992000 },
  { roomId: "4", stays: 88, revenue: 3960000 },
  { roomId: "5", stays: 84, revenue: 3780000 },
  { roomId: "10", stays: 81, revenue: 4050000 },
  { roomId: "11", stays: 78, revenue: 3900000 },
  { roomId: "12", stays: 74, revenue: 3700000 },
  { roomId: "13", stays: 67, revenue: 3350000 },
  { roomId: "14", stays: 64, revenue: 3200000 },
  { roomId: "15", stays: 61, revenue: 4575000 },
  { roomId: "16", stays: 58, revenue: 4350000 },
  { roomId: "17", stays: 56, revenue: 4200000 },
  { roomId: "18", stays: 52, revenue: 3900000 },
  { roomId: "19", stays: 71, revenue: 2840000 },
  { roomId: "20", stays: 68, revenue: 2720000 },
  { roomId: "21", stays: 66, revenue: 2640000 },
];

// ------------------------------------------------------------------ Consumo y costos

export interface WeeklyConsumption {
  week: string;
  carta: number;
  sexshop: number;
  insumo: number;
}

/** Consumo de inventario por familia, últimas 8 semanas (unidades). */
export const CONSUMPTION_8W: WeeklyConsumption[] = [
  { week: "20 abr", carta: 264, sexshop: 64, insumo: 128 },
  { week: "27 abr", carta: 281, sexshop: 71, insumo: 134 },
  { week: "4 may", carta: 259, sexshop: 67, insumo: 141 },
  { week: "11 may", carta: 297, sexshop: 78, insumo: 138 },
  { week: "18 may", carta: 312, sexshop: 74, insumo: 152 },
  { week: "25 may", carta: 305, sexshop: 86, insumo: 147 },
  { week: "1 jun", carta: 334, sexshop: 91, insumo: 159 },
  { week: "8 jun", carta: 318, sexshop: 88, insumo: 163 },
];

export interface MonthlyExpenses {
  mes: string;
  insumos: number;
  mantencion: number;
  sueldos: number;
  servicios: number;
  otro: number;
}

/** Gastos por categoría, últimos 3 meses (CLP). */
export const EXPENSES_3M: MonthlyExpenses[] = [
  { mes: "Abril", insumos: 1480000, mantencion: 620000, sueldos: 4200000, servicios: 980000, otro: 310000 },
  { mes: "Mayo", insumos: 1560000, mantencion: 540000, sueldos: 4200000, servicios: 1010000, otro: 280000 },
  { mes: "Junio (al 9)", insumos: 520000, mantencion: 180000, sueldos: 1260000, servicios: 330000, otro: 90000 },
];
