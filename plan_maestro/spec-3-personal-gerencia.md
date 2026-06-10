# Spec 3 — Personal y Panel Gerencial (Fases 3–4)

> Cierra los bloques 4 y 5 del correo de Ivon. Ambas son **vistas derivadas**: Personal
> consolida datos que el sistema ya captura; Gerencia consume agregados históricos
> sembrados (en producción saldrían de la BD).
>
> Prerrequisitos: spec-1 (rol dueño, auditoría) y spec-2 (PRODUCT_SALES_30D en history.ts).

---

## §A. Vista Personal — `/admin/personal`

**Roles**: admin y dueño (dueño solo lectura, pero esta página ya es de lectura).
**Nav**: grupo "Reportes" para admin; grupo "Operación" para dueño (según spec-1 §6).

### A1. Enriquecer el seed de limpiezas

El `SEED_CLEANING_LOG` actual tiene 16 entradas en 4 días — insuficiente para métricas.
Reemplazarlo por un generador determinístico en `src/data/cleaning.ts`:

```ts
/** 30 días de limpiezas (2026-05-11 → 2026-06-09), determinístico. */
function genCleaningLog(): CleaningLogEntry[] {
  const staff = ["Rosa Muñoz", "Marta Pino", "Carla Soto", "Lucía Vera"];
  const roomIds = ["101","102","103","104","105","106","108","201","202","203","204","205","206","301","302","303","304","401","402"];
  const entries: CleaningLogEntry[] = [];
  let n = 0;
  for (let d = 0; d < 30; d++) {
    const date = new Date(2026, 4, 11 + d); // mayo es mes 4
    const isWeekend = [5, 6, 0].includes(date.getDay());
    const cleanings = isWeekend ? 9 + (d % 3) : 5 + (d % 3); // finde más movimiento
    for (let c = 0; c < cleanings; c++) {
      n++;
      const by = staff[(d + c) % 4];
      // Perfiles distintos: Rosa rápida (~16m), Marta media (~22m), Carla media (~26m), Lucía lenta (~33m)
      const base = [16, 22, 26, 33][(d + c) % 4];
      const minutes = base + ((n * 7) % 9) - 4; // variación ±4 determinística
      const hour = 10 + ((c * 97) % 13); // 10:00–22:00
      entries.push({
        id: `cl-g${n}`,
        roomId: roomIds[(n * 5) % roomIds.length],
        by,
        at: `2026-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String((n * 11) % 60).padStart(2, "0")}:00`,
        minutes: Math.max(10, minutes),
      });
    }
  }
  return entries.reverse(); // más reciente primero
}
export const SEED_CLEANING_LOG: CleaningLogEntry[] = genCleaningLog();
```

(El generador corre en módulo, una vez, con valores fijos → SSR y cliente idénticos.)
Resultado esperado: ~200 limpiezas, 4 perfiles de rendimiento distinguibles. Esto alimenta
también el historial existente de `/admin/limpieza` (que ya filtra y promedia — verificar
que la paginación/scroll aguante la lista más larga).

### A2. Contenido de la página

Header: kicker "Reportes", h1 "Personal y rendimiento", bajada: "Habitaciones realizadas,
tiempos de aseo y actividad por trabajador. Se alimenta solo con la operación."

**Filtros**: `Select` trabajadora ("Todas" + nombres derivados del log) + `Select` período
("Últimos 7 días" | "Últimos 30 días" | "Todo"). Filtrar `cleaningLog` por `at` contra la
fecha actual.

**Stats (4 cards)** del filtro activo:
- Limpiezas realizadas
- Tiempo promedio (`fmtDuration` de `CleaningReportButton` — moverla a `src/lib/format.ts`
  como export para reutilizar)
- Mejor tiempo (mínimo con su trabajadora)
- % dentro del objetivo — limpiezas con `minutes <= 30`, etiqueta "≤ 30 min (objetivo)".
  Este es el proxy de "cumplimiento de procedimientos": honesto y medible.

**Gráficos (recharts, mismos tokens GOLD/AXIS/GRID/tooltipStyle de /admin/reportes)**:
1. "Limpiezas por trabajadora" — barras horizontales (cantidad en el período).
2. "Tiempo promedio por trabajadora" — barras horizontales en minutos (revela los
   perfiles: Rosa ~16 m vs Lucía ~33 m → conversación de gestión que Ivon quiere tener).
3. "Rendimiento por turno" — barras agrupando el log por franja: Día (08–20 h) / Noche
   (20–08 h), derivada de la hora de `at`. Mostrar limpiezas y tiempo promedio por franja.

**Tabla "Actividad"**: reutilizar el patrón del historial de `/admin/limpieza`
(habitación, trabajadora, fecha, hora, duración) con paginación de 15. Incluir además las
cargas de lavandería tomadas (`laundry` con `by`) como filas de tipo "Lavandería · carga
{sábanas/toallas/batas}" intercaladas por fecha — son "tareas ejecutadas" reales.

**Mini-sección "Historial de actividades"**: las últimas 10 entradas de `audit` filtradas
por `userName === trabajadora seleccionada` (cuando hay una seleccionada). Link "Ver
auditoría completa" → /admin/auditoria (solo visible para admin).

Pie de página discreto (`text-xs text-dim`): "El informe PDF de limpiezas está disponible
en Limpieza → Descargar informe." (ya existe; no duplicar).

---

## §B. Panel Gerencial — `/admin/gerencia`

**Roles**: admin y dueño. **Es el home del dueño** (spec-1 §6).
**Nav**: admin → grupo "Reportes", primera posición, label "Panel gerencial"; dueño →
grupo "Gerencia".

### B1. Data histórica sembrada — `src/data/history.ts`

Un solo archivo con TODOS los agregados de ejemplo (incluye el `PRODUCT_SALES_30D` de
spec-2 §B3). **No generar miles de transacciones**: agregados precalculados, livianos para
localStorage. Encabezar el archivo con:

```ts
// Agregados HISTÓRICOS de ejemplo para el panel gerencial de la maqueta.
// En producción, estas series se derivan de la base de datos real (reservas,
// transacciones y movimientos). Determinístico: sin Math.random.
```

```ts
export interface DailyStat {
  date: string;          // YYYY-MM-DD
  occupancyPct: number;  // ocupación promedio del día (0–100)
  revenueRooms: number;  // ingresos por hospedaje CLP
  revenueProducts: number; // ingresos por productos (recepción + room service) CLP
  revenueShop: number;   // ingresos tienda online CLP
  expenses: number;      // gastos operacionales CLP
}

/** 90 días: 2026-03-12 → 2026-06-09. */
export const DAILY_HISTORY: DailyStat[] = genHistory();
```

Generador determinístico con forma realista:
- Base semanal: lun–jue ocupación 38–55 %, vie–sáb 78–95 %, dom 60–72 % (usar
  `date.getDay()` + variación `(i * 13) % 9`).
- `revenueRooms ≈ ocupación × 20 hab × ticket` con ticket weekday ~$52.000 / weekend
  ~$68.000, redondeado a miles.
- `revenueProducts ≈ 12–18 %` de rooms; `revenueShop` 0–$120.000 con picos vie/sáb;
  `expenses` $80.000–$220.000 con picos los lunes (reposición).
- Tendencia: +6 % suave del primer mes al último (para que el comparativo mensual dé
  positivo y se vea crecimiento).

```ts
/** Uso por habitación en 90 días (para más/menos vendidas). */
export interface RoomUsage { roomId: string; stays: number; revenue: number; }
export const ROOM_USAGE_90D: RoomUsage[] = [ /* 20 habitaciones */ ];
```
Coherencia de negocio al poblarla: las Standard rotan más (90–130 estancias), las BLACK
rotan menos (45–60) pero con mayor revenue por estancia; dejar una clara "menos vendida"
(ej. la 107, que está en mantención) — da pie a conversación real en la demo.

```ts
/** Consumo de inventario por categoría, últimas 8 semanas (unidades). */
export interface WeeklyConsumption { week: string; carta: number; sexshop: number; insumo: number; }
export const CONSUMPTION_8W: WeeklyConsumption[] = [ /* 8 filas */ ];

/** Gastos por categoría, últimos 3 meses (CLP). */
export const EXPENSES_3M: { mes: string; insumos: number; mantencion: number; sueldos: number; servicios: number; otro: number }[] = [ /* abr, may, jun */ ];
```

Selectores en `src/lib/management.ts` (nuevo, funciones puras y testeables a ojo):
`ventasHoy/Semana/Mes(history)`, `ventasPorMes(history) → 3 meses`,
`ocupacionPromedio(history, días)`, `ticketPromedio(history, días)`,
`comparativoMensual(history) → { actual, anterior, deltaPct }` (mes actual = junio parcial
vs mayo completo: etiquetar "Junio (al día 9)" para ser honestos),
`topHabitaciones / bottomHabitaciones(ROOM_USAGE_90D, n)`,
`topProductos30d / bottomProductos30d(PRODUCT_SALES_30D, products, n)`.

### B2. Contenido de la página

Header: kicker "Gerencia", h1 "Panel gerencial", bajada. A la derecha del header, el
`Select` de **sucursal** con única opción "M Motel Limache" (spec-1 §4) y el `Select` de
período donde aplique.

**Fila 1 — KPIs (4 cards, patrón StatCard del dashboard)**:
- Ventas de hoy (rooms+products+shop del último DailyStat) — accent dorado
- Ventas del mes (junio acumulado) + hint "vs mayo: {±X %}" con flecha y color
  (ok si sube, busy si baja)
- Ocupación promedio (30 d) + hint "{N} % fin de semana / {M} % entre semana"
- Ticket promedio (30 d)

**Fila 2 — gráficos grandes (grid lg:grid-cols-2, ChartCard reutilizado de reportes)**:
1. "Ventas últimos 30 días" — barras apiladas o barras simples del total diario; tooltip
   con desglose hospedaje/productos/tienda.
2. "Ventas por mes" — barras de los 3 meses (abril, mayo, junio parcial con etiqueta).
3. "Ocupación últimos 30 días" — barras (%) con `YAxis` oculto y tooltip "%".
4. "Habitaciones más vendidas (90 d)" — barras horizontales top 6 por revenue, con la
   distinción BLACK en WINE como hace `ingresosPorCategoria`.

**Fila 3 — rankings y consumo (grid lg:grid-cols-2)**:
5. "Habitaciones con menor rotación" — lista (no gráfico): bottom 4 con estancias y
   revenue; la 107 con kicker "En mantención".
6. "Productos más vendidos (30 d)" — top 6 (de PRODUCT_SALES_30D × precio) y, debajo,
   "Menos vendidos / sin movimiento" — bottom 4 + los de bajo movimiento con kicker
   `text-dim` "Sin ventas 30 d".
7. "Consumo de inventario (8 semanas)" — barras apiladas por familia (carta / sexshop /
   insumos).
8. "Costos operacionales (3 meses)" — barras apiladas por categoría de gasto.

**Pie del panel** (`text-xs text-dim`, borde superior):
"Panel con **datos de ejemplo** para evaluación del formato. En operación real, cada
gráfico se alimenta automáticamente de los registros del sistema (reservas, cortes,
ventas y movimientos) — el principio de registro único." ← Esta frase es deliberada:
coherente con la honestidad del correo de Francisco Y remata con el concepto que Ivon
pidió. No omitirla.

### B3. Ajustes relacionados

- Dashboard admin (`/admin/page.tsx`): agregar card-link "Panel gerencial →" para admin.
- `/admin/reportes` se mantiene (reportes operativos del turno en vivo); Gerencia es la
  vista histórica/estratégica. Si hay dudas de duplicación: Reportes = lo que pasa AHORA,
  Gerencia = tendencias. Dejar un link cruzado entre ambas.

---

## Criterios de "listo" (Fases 3–4)

- [ ] Seed de limpiezas ~30 días con 4 perfiles de tiempo distinguibles; /admin/limpieza
      sigue funcionando con la lista más larga.
- [ ] /admin/personal: filtros, 4 stats, 3 gráficos, tabla de actividad con lavandería
      intercalada y mini-historial de auditoría por trabajadora.
- [ ] /admin/gerencia: 4 KPIs + 8 bloques, selector de sucursal, comparativo mensual con
      delta, nota de datos de ejemplo al pie.
- [ ] El dueño (Rodrigo) aterriza en Gerencia al iniciar sesión y navega Personal,
      Reportes, Cortes y Auditoría sin ver ningún botón de acción.
- [ ] Todos los gráficos usan los tokens visuales existentes (GOLD/WINE/AXIS/GRID) y
      montan client-side como los de /admin/reportes (patrón `mounted`).
- [ ] `pnpm build` limpio. localStorage no supera tamaños razonables (history son
      agregados, no transacciones).
