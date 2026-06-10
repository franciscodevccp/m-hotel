import type { SalesChannel } from "@/types";

// Catálogo real de M Motel, transcrito de STOCK_09-06-26.xlsm (corte al 09-06-2026).
// Fuente: plan_maestro/inventario-mmotel.md. Cada archivo de esta carpeta cubre un
// área del Excel; src/data/products.ts deriva los Product del sistema desde aquí.
// Determinístico: sin Math.random ni fechas relativas.

/** Familia del producto en el sistema (área operativa del catálogo). */
export type RealFamily = "carta" | "sexshop" | "insumo";

/** Fila del inventario real, depurada y normalizada. */
export interface RealItem {
  /** Código de barras original del Excel. El id del producto es `p-${barcode}`. */
  barcode: string;
  /** Nombre normalizado (sin mayúsculas sostenidas, typos corregidos). */
  name: string;
  family: RealFamily;
  /** Grupo del catálogo (lista cerrada por familia, ver spec-1b §3.3). */
  group: string;
  /**
   * Stock TOTAL del Excel tal cual, incluso negativo. Los negativos se cargan
   * en 0 y se regularizan con un movimiento de ajuste al derivar los seeds.
   */
  total: number;
  /** Precio de venta CLP (0 en insumos, blancos y cortesías). */
  price: number;
  /** Costo unitario CLP (obligatorio en insumos y cortesías; opcional en venta). */
  cost?: number;
  /** Restricción +18 (sexshop, alcohol, tabaco). */
  ageRestricted?: boolean;
  /** Canales de venta; vacío = solo inventario interno. */
  channels: SalesChannel[];
}
