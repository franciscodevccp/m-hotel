"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCLP } from "@/lib/format";

const GOLD = "#c9a24a";
const WINE = "#7a2233";
const AXIS = "#6f685f";
const GRID = "rgba(244, 241, 236, 0.08)";

// Datos estáticos de demostración.
const INGRESOS_DIA = [
  { dia: "Lun", monto: 380000 },
  { dia: "Mar", monto: 420000 },
  { dia: "Mié", monto: 350000 },
  { dia: "Jue", monto: 460000 },
  { dia: "Vie", monto: 720000 },
  { dia: "Sáb", monto: 880000 },
  { dia: "Dom", monto: 540000 },
];

const OCUPACION_DIA = [
  { dia: "Lun", ocupacion: 48 },
  { dia: "Mar", ocupacion: 55 },
  { dia: "Mié", ocupacion: 44 },
  { dia: "Jue", ocupacion: 60 },
  { dia: "Vie", ocupacion: 82 },
  { dia: "Sáb", ocupacion: 91 },
  { dia: "Dom", ocupacion: 67 },
];

const INGRESOS_CATEGORIA = [
  { cat: "Standard", monto: 520000, black: false },
  { cat: "Vip", monto: 680000, black: false },
  { cat: "Premium", monto: 740000, black: false },
  { cat: "BLACK", monto: 910000, black: true },
];

const tooltipStyle = {
  background: "#211c26",
  border: "1px solid rgba(244, 241, 236, 0.16)",
  borderRadius: 6,
  color: "#f4f1ec",
  fontSize: 12,
};

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
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Reportes</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Reportes</h1>
        <p className="mt-2 text-sm text-muted">
          Ocupación e ingresos de la última semana. Datos de demostración.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Ingresos por día" hint="Últimos 7 días, en pesos">
          <AreaChart data={INGRESOS_DIA} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="dia" stroke={AXIS} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: GRID }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: AXIS }}
              formatter={(value) => [formatCLP(Number(value)), "Ingresos"]}
            />
            <Area
              type="monotone"
              dataKey="monto"
              stroke={GOLD}
              strokeWidth={2}
              fill="url(#goldFill)"
            />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Ocupación por día" hint="Porcentaje de habitaciones ocupadas">
          <BarChart data={OCUPACION_DIA} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="dia" stroke={AXIS} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: AXIS }}
              formatter={(value) => [`${value}%`, "Ocupación"]}
            />
            <Bar dataKey="ocupacion" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Ingresos por categoría" hint="Acumulado de la semana">
          <BarChart data={INGRESOS_CATEGORIA} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="cat" stroke={AXIS} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(244, 241, 236, 0.04)" }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: AXIS }}
              formatter={(value) => [formatCLP(Number(value)), "Ingresos"]}
            />
            <Bar dataKey="monto" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {INGRESOS_CATEGORIA.map((entry) => (
                <Cell key={entry.cat} fill={entry.black ? WINE : GOLD} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}
