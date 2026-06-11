"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select } from "@/components/ui/Select";
import {
  CONSUMPTION_8W,
  DAILY_HISTORY,
  EXPENSES_3M,
  PRODUCT_SALES_30D,
  ROOM_USAGE_90D,
} from "@/data/history";
import { lowMovement } from "@/lib/inventory";
import { formatCLP } from "@/lib/format";
import {
  bottomHabitaciones,
  bottomProductos30d,
  comparativoMensual,
  ocupacionPorTipoDia,
  ocupacionPromedio,
  ticketPromedio,
  topHabitaciones,
  topProductos30d,
  ventaDia,
  ventasHoy,
  ventasPorMes,
} from "@/lib/management";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GOLD = "#c9a24a";
const WINE = "#7a2233";
const AXIS = "#a79f97";
const GRID = "rgba(244, 241, 236, 0.08)";

const tooltipStyle = {
  background: "#211c26",
  border: "1px solid rgba(244, 241, 236, 0.16)",
  borderRadius: 6,
  color: "#f4f1ec",
  fontSize: 12,
};

// Los ítems del tooltip de recharts usan un gris propio por defecto: se fuerza
// el crema del sistema para que nunca queden oscuros sobre fondo oscuro.
const tooltipText = { color: "#f4f1ec" };

function shortCLP(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1).replace(".", ",")} M`;
  return `$${Math.round(n / 1000)} mil`;
}

function StatCard({
  label,
  value,
  hint,
  hintTone,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintTone?: "ok" | "busy";
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col border border-line bg-surface/40 p-5">
      <p className="kicker text-dim">{label}</p>
      <div className="mt-auto pt-3">
        <p className={cn("tnum font-display text-2xl sm:text-3xl", accent ? "text-gold" : "text-cream")}>
          {value}
        </p>
        {hint && (
          <p
            className={cn(
              "mt-1 text-xs",
              hintTone === "ok" ? "text-ok" : hintTone === "busy" ? "text-busy" : "text-dim",
            )}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- montaje en cliente para que recharts mida el contenedor
  useEffect(() => setMounted(true), []);
  return (
    <section className="border border-line bg-surface/40 p-6">
      <div className="mb-6">
        <h2 className="font-display text-xl text-cream">{title}</h2>
        <p className="mt-1 text-xs text-dim">{hint}</p>
      </div>
      <div className="h-56 w-full">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            {children as never}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export default function GerenciaPage() {
  const { products, rooms, branches } = useAppStore();
  const { user } = useSession();
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "limache");

  const hoy = ventasHoy(DAILY_HISTORY);
  const comparativo = comparativoMensual(DAILY_HISTORY);
  const ocupacion30 = ocupacionPromedio(DAILY_HISTORY, 30);
  const ocupacionTipo = ocupacionPorTipoDia(DAILY_HISTORY, 30);
  const ticket30 = ticketPromedio(DAILY_HISTORY, 30);

  const last30 = useMemo(
    () =>
      DAILY_HISTORY.slice(-30).map((s) => ({
        dia: s.date.slice(8),
        total: ventaDia(s),
        hospedaje: s.revenueRooms,
        productos: s.revenueProducts,
        tienda: s.revenueShop,
        ocupacion: s.occupancyPct,
      })),
    [],
  );
  const meses = useMemo(() => ventasPorMes(DAILY_HISTORY), []);

  const roomCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rooms) map.set(String(r.number), r.categoryId);
    return map;
  }, [rooms]);

  const topRooms = useMemo(
    () =>
      topHabitaciones(ROOM_USAGE_90D, 6).map((r) => ({
        hab: `Hab. ${r.roomId}`,
        revenue: r.revenue,
        black:
          roomCategory.get(r.roomId) === "jacuzzi-black" ||
          roomCategory.get(r.roomId) === "standard-black",
      })),
    [roomCategory],
  );
  const bottomRooms = useMemo(() => bottomHabitaciones(ROOM_USAGE_90D, 4), []);

  const topProducts = useMemo(() => topProductos30d(PRODUCT_SALES_30D, products, 6), [products]);
  const bottomProducts = useMemo(
    () => bottomProductos30d(PRODUCT_SALES_30D, products, 4),
    [products],
  );
  const noMovement = useMemo(() => lowMovement(products).slice(0, 6), [products]);

  // Gerencia es material de Administración y del Dueño.
  if (user && user.role !== "admin" && user.role !== "dueno") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Gerencia</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          El panel gerencial está disponible para administración y gerencia.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="kicker text-gold">Gerencia</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Panel gerencial</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Ventas, ocupación, ticket y rotación del recinto, con comparativos históricos. La
            mirada del dueño, alimentada por la operación diaria.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <label className="kicker text-dim">Sucursal</label>
          <Select
            value={branchId}
            onValueChange={setBranchId}
            ariaLabel="Sucursal"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </div>
      </div>

      {/* Fila 1 — KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ventas de hoy" value={formatCLP(hoy)} accent hint="Hospedaje + productos + tienda" />
        <StatCard
          label="Ventas de junio (al 9)"
          value={formatCLP(comparativo.actual)}
          hint={`Últimas 4 semanas: ${comparativo.deltaPct >= 0 ? "↑" : "↓"} ${Math.abs(comparativo.deltaPct)} % vs las 4 anteriores`}
          hintTone={comparativo.deltaPct >= 0 ? "ok" : "busy"}
        />
        <StatCard
          label="Ocupación promedio (30 d)"
          value={`${ocupacion30}%`}
          hint={`${ocupacionTipo.weekend} % fin de semana · ${ocupacionTipo.weekday} % entre semana`}
        />
        <StatCard label="Ticket promedio (30 d)" value={formatCLP(ticket30)} hint="Por estancia" />
      </div>

      {/* Fila 2 — gráficos grandes */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Ventas últimos 30 días" hint="Total diario con desglose por origen.">
          <BarChart data={last30} margin={{ left: 0, right: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="dia" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} interval={4} />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              cursor={{ fill: "rgba(201,162,74,0.06)" }}
              formatter={(v, name) => [formatCLP(Number(v)), String(name)]}
              labelFormatter={(l) => `Día ${l}`}
            />
            <Bar dataKey="hospedaje" name="Hospedaje" stackId="v" fill={GOLD} />
            <Bar dataKey="productos" name="Productos" stackId="v" fill="#8a6a2f" />
            <Bar dataKey="tienda" name="Tienda online" stackId="v" fill={WINE} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Ventas por mes" hint="Abril y mayo completos; junio parcial al día 9.">
          <BarChart data={meses} margin={{ left: 8, right: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="mes" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} tickFormatter={shortCLP} width={64} />
            <Tooltip
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              cursor={{ fill: "rgba(201,162,74,0.06)" }}
              formatter={(v) => [formatCLP(Number(v)), "Ventas"]}
            />
            <Bar dataKey="total" name="Ventas" fill={GOLD} radius={[2, 2, 0, 0]} barSize={56} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Ocupación últimos 30 días" hint="Promedio diario de las 21 habitaciones.">
          <BarChart data={last30} margin={{ left: 0, right: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="dia" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} interval={4} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              cursor={{ fill: "rgba(201,162,74,0.06)" }}
              formatter={(v) => [`${v} %`, "Ocupación"]}
              labelFormatter={(l) => `Día ${l}`}
            />
            <Bar dataKey="ocupacion" name="Ocupación" fill={GOLD} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Habitaciones más vendidas (90 d)"
          hint="Top 6 por ingreso; las BLACK destacadas en vino."
        >
          <BarChart data={topRooms} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} tickFormatter={shortCLP} />
            <YAxis type="category" dataKey="hab" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} width={64} />
            <Tooltip
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              cursor={{ fill: "rgba(201,162,74,0.06)" }}
              formatter={(v) => [formatCLP(Number(v)), "Ingresos"]}
            />
            <Bar dataKey="revenue" name="Ingresos" radius={[0, 2, 2, 0]} barSize={18}>
              {topRooms.map((r) => (
                <Cell key={r.hab} fill={r.black ? WINE : GOLD} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </div>

      {/* Fila 3 — rankings y consumo */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-surface/40 p-6">
          <h2 className="font-display text-xl text-cream">Habitaciones con menor rotación</h2>
          <p className="mt-1 text-xs text-dim">Últimos 90 días, por estancias.</p>
          <ul className="mt-5 divide-y divide-line">
            {bottomRooms.map((r) => {
              const room = rooms.find((rm) => String(rm.number) === r.roomId);
              const maintenance = room?.status === "maintenance";
              return (
                <li key={r.roomId} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="text-sm text-cream">
                    Habitación {r.roomId}
                    {maintenance && <span className="kicker ml-2 text-busy">En mantención</span>}
                  </span>
                  <span className="tnum text-sm text-muted">
                    {r.stays} estancias · {formatCLP(r.revenue)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border border-line bg-surface/40 p-6">
          <h2 className="font-display text-xl text-cream">Productos más vendidos (30 d)</h2>
          <p className="mt-1 text-xs text-dim">Por ingreso estimado del período.</p>
          <ul className="mt-5 divide-y divide-line">
            {topProducts.map((r) => (
              <li key={r.product.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="min-w-0 truncate text-sm text-cream">{r.product.name}</span>
                <span className="tnum shrink-0 text-sm text-muted">
                  {r.units} un. · {formatCLP(r.revenue)}
                </span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 border-t border-line pt-4 text-sm text-cream">
            Menos vendidos y sin movimiento
          </h3>
          <ul className="mt-3 divide-y divide-line">
            {bottomProducts.map((r) => (
              <li key={r.product.id} className="flex items-baseline justify-between gap-4 py-2">
                <span className="min-w-0 truncate text-sm text-muted">{r.product.name}</span>
                <span className="tnum shrink-0 text-xs text-dim">{r.units} un.</span>
              </li>
            ))}
            {noMovement.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between gap-4 py-2">
                <span className="min-w-0 truncate text-sm text-muted">{p.name}</span>
                <span className="kicker shrink-0 text-dim">Sin ventas 30 d</span>
              </li>
            ))}
          </ul>
        </section>

        <ChartCard
          title="Consumo de inventario (8 semanas)"
          hint="Unidades consumidas por familia, semana a semana."
        >
          <BarChart data={CONSUMPTION_8W} margin={{ left: 0, right: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="week" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText} cursor={{ fill: "rgba(201,162,74,0.06)" }} />
            <Bar dataKey="carta" name="Carta" stackId="c" fill={GOLD} />
            <Bar dataKey="sexshop" name="Sexshop" stackId="c" fill={WINE} />
            <Bar dataKey="insumo" name="Insumos" stackId="c" fill="#5a544c" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Costos operacionales (3 meses)" hint="Gastos por categoría; junio parcial.">
          <BarChart data={EXPENSES_3M} margin={{ left: 8, right: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="mes" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} tickFormatter={shortCLP} width={64} />
            <Tooltip
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              cursor={{ fill: "rgba(201,162,74,0.06)" }}
              formatter={(v, name) => [formatCLP(Number(v)), String(name)]}
            />
            <Bar dataKey="insumos" name="Insumos" stackId="g" fill={GOLD} />
            <Bar dataKey="mantencion" name="Mantención" stackId="g" fill="#8a6a2f" />
            <Bar dataKey="sueldos" name="Sueldos" stackId="g" fill={WINE} />
            <Bar dataKey="servicios" name="Servicios" stackId="g" fill="#5a544c" />
            <Bar dataKey="otro" name="Otro" stackId="g" fill="#3d3833" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-5">
        <p className="max-w-2xl text-xs leading-relaxed text-dim">
          Panel con <span className="text-muted">datos de ejemplo</span> para evaluación del
          formato. En operación real, cada gráfico se alimenta automáticamente de los registros
          del sistema (reservas, cortes, ventas y movimientos) — el principio de registro único.
        </p>
        <Link
          href="/admin/reportes"
          className="text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
        >
          Reportes del turno en vivo →
        </Link>
      </div>
    </div>
  );
}
