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
import { ROOM_STATUS, ROOM_STATUS_ORDER } from "@/components/admin/roomStatus";
import { formatCLP } from "@/lib/format";
import { ingresosPorCategoria, topProductos, ventasPorCanal } from "@/lib/reports";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import type { RoomStatus } from "@/types";

const GOLD = "#c9a24a";
const WINE = "#7a2233";
const AXIS = "#a79f97"; // texto de ejes y tooltips legible (token muted)
const GRID = "rgba(244, 241, 236, 0.08)";

// Colores de estado (mismos matices que el tablero) para los gráficos.
const STATUS_HEX: Record<RoomStatus, string> = {
  available: "#7da465",
  occupied: "#6c94b8",
  cleaning: "#c9a24a",
  maintenance: "#9f9786",
};

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
  // Los gráficos se montan solo en el cliente: recharts necesita medir el contenedor.
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

export default function ReportesPage() {
  const { reservations, transactions, movements, products, rooms } = useAppStore();
  const { user } = useSession();

  const ingresosCat = useMemo(() => ingresosPorCategoria(reservations), [reservations]);
  // Por ahora los reportes de productos consideran solo la carta (room service).
  const cartaProducts = useMemo(() => products.filter((p) => p.category === "carta"), [products]);
  const canales = useMemo(
    () => ventasPorCanal(transactions, movements, cartaProducts),
    [transactions, movements, cartaProducts],
  );
  const top = useMemo(() => topProductos(movements, cartaProducts, 5), [movements, cartaProducts]);
  const ocupacion = useMemo(
    () =>
      ROOM_STATUS_ORDER.map((status) => ({
        estado: ROOM_STATUS[status].label,
        n: rooms.filter((r) => r.status === status).length,
        status,
      })),
    [rooms],
  );
  // Reportes = lo que pasa AHORA (turno en vivo); Gerencia = tendencias históricas.

  // Reportes es material de Administración y del Dueño (solo lectura).
  if (user && user.role !== "admin" && user.role !== "dueno") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Reportes</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Los reportes de ocupación e ingresos están disponibles solo para el perfil de
          administración. Tu sesión es de recepción.
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
      <div className="mb-8">
        <span className="kicker text-gold">Reportes</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Reportes y gráficas</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Derivados de la operación en vivo: se mueven con cada reserva, pago y venta de producto.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Ingresos por categoría" hint="Monto de reservas registradas">
          <BarChart data={ingresosCat} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="cat" stroke={AXIS} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              formatter={(value) => [formatCLP(Number(value)), "Ingresos"]}
            />
            <Bar dataKey="monto" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {ingresosCat.map((entry) => (
                <Cell key={entry.cat} fill={entry.black ? WINE : GOLD} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Ventas por canal" hint="Hospedaje, tienda física y tienda online">
          <BarChart data={canales} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="canal" stroke={AXIS} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              formatter={(value) => [formatCLP(Number(value)), "Ingresos"]}
            />
            <Bar dataKey="monto" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Top de productos" hint="Más vendidos del turno, por monto">
          {top.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-dim">Aún no hay ventas de productos.</p>
            </div>
          ) : (
            <BarChart
              data={top}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" stroke={AXIS} tickLine={false} axisLine={false} hide />
              <YAxis
                type="category"
                dataKey="name"
                stroke={AXIS}
                tickLine={false}
                axisLine={false}
                width={110}
                fontSize={11}
              />
              <Tooltip
                cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
                contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
                formatter={(value) => [formatCLP(Number(value)), "Vendido"]}
              />
              <Bar dataKey="monto" fill={GOLD} radius={[0, 2, 2, 0]} maxBarSize={18} />
            </BarChart>
          )}
        </ChartCard>

        <ChartCard title="Ocupación por estado" hint="Situación actual de las 20 habitaciones">
          <BarChart data={ocupacion} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="estado" stroke={AXIS} tickLine={false} axisLine={false} fontSize={11} />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
              contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText}
              formatter={(value) => [`${value} habitaciones`, "Cantidad"]}
            />
            <Bar dataKey="n" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {ocupacion.map((entry) => (
                <Cell key={entry.status} fill={STATUS_HEX[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}
