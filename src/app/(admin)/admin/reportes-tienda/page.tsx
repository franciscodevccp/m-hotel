"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { formatCLP } from "@/lib/format";
import {
  isRealized,
  topProductosOnline,
  ventasPorDia,
  ventasPorGrupo,
} from "@/lib/shop";
import { useAppStore } from "@/lib/store";

const GOLD = "#c9a24a";
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
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export default function ReportesTiendaPage() {
  const { shopOrders, products } = useAppStore();

  const porDia = useMemo(() => ventasPorDia(shopOrders), [shopOrders]);
  const top = useMemo(() => topProductosOnline(shopOrders, 6), [shopOrders]);
  const porGrupo = useMemo(() => ventasPorGrupo(shopOrders, products), [shopOrders, products]);

  const realized = useMemo(() => shopOrders.filter((o) => isRealized(o.status)), [shopOrders]);
  const ingresos = realized.reduce((s, o) => s + o.total, 0);
  const unidades = realized.reduce((s, o) => s + o.items.reduce((n, it) => n + it.quantity, 0), 0);
  const ticket = realized.length > 0 ? Math.round(ingresos / realized.length) : 0;
  const conversion =
    shopOrders.length > 0 ? Math.round((realized.length / shopOrders.length) * 100) : 0;

  return (
    <AdminOnly section="Reportes de tienda">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <span className="kicker text-gold">Tienda online</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Reportes</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Ventas del sexshop online. Se mueven con cada pedido pagado, despachado y entregado.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Ingresos" value={formatCLP(ingresos)} accent />
          <Stat label="Unidades vendidas" value={String(unidades)} />
          <Stat label="Ticket promedio" value={formatCLP(ticket)} />
          <Stat label="Pedidos pagados" value={`${conversion}%`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Ventas por día" hint="Monto de pedidos concretados">
            <BarChart data={porDia} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="dia" stroke={AXIS} tickLine={false} axisLine={false} fontSize={11} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
                contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
                formatter={(value) => [formatCLP(Number(value)), "Ventas"]}
              />
              <Bar dataKey="monto" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Ventas por sub-categoría" hint="Qué familias del catálogo venden más">
            <BarChart data={porGrupo} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="grupo" stroke={AXIS} tickLine={false} axisLine={false} fontSize={10} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
                contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
                formatter={(value) => [formatCLP(Number(value)), "Ventas"]}
              />
              <Bar dataKey="monto" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Top de productos" hint="Más vendidos online, por monto">
            {top.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-dim">Aún no hay ventas de productos.</p>
              </div>
            ) : (
              <BarChart data={top} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" stroke={AXIS} tickLine={false} axisLine={false} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  fontSize={10}
                />
                <Tooltip
                  cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
                  contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
                  formatter={(value) => [formatCLP(Number(value)), "Vendido"]}
                />
                <Bar dataKey="monto" fill={GOLD} radius={[0, 2, 2, 0]} maxBarSize={16} />
              </BarChart>
            )}
          </ChartCard>

          <ChartCard title="Unidades por producto" hint="Cantidad de unidades vendidas">
            {top.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-dim">Aún no hay ventas de productos.</p>
              </div>
            ) : (
              <BarChart data={top} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" stroke={AXIS} tickLine={false} axisLine={false} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  fontSize={10}
                />
                <Tooltip
                  cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
                  contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
                  formatter={(value) => [`${value} unidades`, "Vendidas"]}
                />
                <Bar dataKey="qty" fill={AXIS} radius={[0, 2, 2, 0]} maxBarSize={16} />
              </BarChart>
            )}
          </ChartCard>
        </div>
      </div>
    </AdminOnly>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className={`tnum mt-2 font-display text-2xl ${accent ? "text-gold" : "text-cream"}`}>
        {value}
      </p>
    </div>
  );
}
