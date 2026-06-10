"use client";

import Link from "next/link";
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
import { Select } from "@/components/ui/Select";
import { fmtDuration, formatDate, formatTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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

// El "hoy" de la demo, para que los filtros por período sean determinísticos.
const DEMO_TODAY = new Date(2026, 5, 10).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const PERIODS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "all", label: "Todo el historial" },
];

const PAGE_SIZE = 15;

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

interface ActivityRow {
  id: string;
  kind: "limpieza" | "lavanderia";
  label: string;
  by: string;
  at: string;
  detail: string;
}

export default function PersonalPage() {
  const { cleaningLog, laundry, audit } = useAppStore();
  const { user } = useSession();
  const [staffFilter, setStaffFilter] = useState("all");
  const [period, setPeriod] = useState("30");
  const [page, setPage] = useState(0);

  const staffNames = useMemo(() => {
    const seen: string[] = [];
    for (const e of cleaningLog) if (e.by && !seen.includes(e.by)) seen.push(e.by);
    return seen.sort((a, b) => a.localeCompare(b, "es"));
  }, [cleaningLog]);

  const cutoff = period === "all" ? 0 : DEMO_TODAY - Number(period) * DAY_MS;

  const filtered = useMemo(
    () =>
      cleaningLog.filter((e) => {
        if (new Date(e.at).getTime() < cutoff) return false;
        if (staffFilter !== "all" && e.by !== staffFilter) return false;
        return Boolean(e.by);
      }),
    [cleaningLog, cutoff, staffFilter],
  );

  // --- Stats del filtro activo ---
  const withMinutes = filtered.filter((e) => e.minutes != null);
  const avgMinutes =
    withMinutes.length > 0
      ? Math.round(withMinutes.reduce((s, e) => s + (e.minutes ?? 0), 0) / withMinutes.length)
      : null;
  const best = withMinutes.reduce<(typeof withMinutes)[number] | null>(
    (acc, e) => (acc === null || (e.minutes ?? 99) < (acc.minutes ?? 99) ? e : acc),
    null,
  );
  const onTarget =
    withMinutes.length > 0
      ? Math.round(
          (withMinutes.filter((e) => (e.minutes ?? 99) <= 30).length / withMinutes.length) * 100,
        )
      : null;

  // --- Gráficos ---
  const byStaff = useMemo(() => {
    return staffNames
      .map((name) => {
        const entries = filtered.filter((e) => e.by === name && e.minutes != null);
        const count = filtered.filter((e) => e.by === name).length;
        const avg =
          entries.length > 0
            ? Math.round(entries.reduce((s, e) => s + (e.minutes ?? 0), 0) / entries.length)
            : 0;
        return { name: name.split(" ")[0], full: name, limpiezas: count, promedio: avg };
      })
      .filter((r) => r.limpiezas > 0);
  }, [filtered, staffNames]);

  const byShift = useMemo(() => {
    const day = filtered.filter((e) => {
      const h = new Date(e.at).getHours();
      return h >= 8 && h < 20;
    });
    const night = filtered.filter((e) => {
      const h = new Date(e.at).getHours();
      return h < 8 || h >= 20;
    });
    const avg = (list: typeof filtered) => {
      const withM = list.filter((e) => e.minutes != null);
      return withM.length > 0
        ? Math.round(withM.reduce((s, e) => s + (e.minutes ?? 0), 0) / withM.length)
        : 0;
    };
    return [
      { franja: "Día (08–20)", limpiezas: day.length, promedio: avg(day) },
      { franja: "Noche (20–08)", limpiezas: night.length, promedio: avg(night) },
    ];
  }, [filtered]);

  // --- Tabla de actividad (limpiezas + lavandería intercaladas) ---
  const activity = useMemo<ActivityRow[]>(() => {
    const cleanRows: ActivityRow[] = filtered.map((e) => ({
      id: e.id,
      kind: "limpieza",
      label: `Habitación ${e.roomId}`,
      by: e.by ?? "—",
      at: e.at,
      detail: fmtDuration(e.minutes),
    }));
    const laundryRows: ActivityRow[] = laundry
      .filter((l) => l.by)
      .filter((l) => new Date(l.createdAt).getTime() >= cutoff)
      .filter((l) => staffFilter === "all" || l.by === staffFilter)
      .map((l) => ({
        id: l.id,
        kind: "lavanderia",
        label: "Lavandería · carga",
        by: l.by ?? "—",
        at: l.createdAt,
        detail: `${l.sheets} sábanas · ${l.towels} toallas · ${l.robes} batas`,
      }));
    return [...cleanRows, ...laundryRows].sort((a, b) => b.at.localeCompare(a.at));
  }, [filtered, laundry, cutoff, staffFilter]);

  const pageCount = Math.max(1, Math.ceil(activity.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = activity.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // --- Mini-historial de auditoría de la trabajadora seleccionada ---
  const staffAudit = useMemo(
    () =>
      staffFilter === "all"
        ? []
        : audit.filter((a) => a.userName === staffFilter).slice(0, 10),
    [audit, staffFilter],
  );

  // Personal es material de Administración y del Dueño.
  if (user && user.role !== "admin" && user.role !== "dueno") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Personal</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          El rendimiento del personal está disponible para administración y gerencia.
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
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
          Personal y rendimiento
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Habitaciones realizadas, tiempos de aseo y actividad por trabajadora. Se alimenta solo
          con la operación: nadie llena planillas aparte.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Select
          value={staffFilter}
          onValueChange={(v) => {
            setStaffFilter(v);
            setPage(0);
          }}
          ariaLabel="Trabajadora"
          className="mt-0 sm:max-w-xs"
          options={[
            { value: "all", label: "Todas las trabajadoras" },
            ...staffNames.map((n) => ({ value: n, label: n })),
          ]}
        />
        <Select
          value={period}
          onValueChange={(v) => {
            setPeriod(v);
            setPage(0);
          }}
          ariaLabel="Período"
          className="mt-0 sm:max-w-xs"
          options={PERIODS}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Limpiezas realizadas</p>
          <p className="tnum mt-auto pt-2 font-display text-2xl text-cream">{filtered.length}</p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Tiempo promedio</p>
          <p className="tnum mt-auto pt-2 font-display text-2xl text-cream">
            {avgMinutes != null ? fmtDuration(avgMinutes) : "—"}
          </p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Mejor tiempo</p>
          <p className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="tnum font-display text-2xl text-gold">
              {best ? fmtDuration(best.minutes) : "—"}
            </span>
            {best?.by && <span className="truncate text-xs text-dim">{best.by}</span>}
          </p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">≤ 30 min (objetivo)</p>
          <p
            className={cn(
              "tnum mt-auto pt-2 font-display text-2xl",
              onTarget != null && onTarget >= 80 ? "text-ok" : "text-cream",
            )}
          >
            {onTarget != null ? `${onTarget}%` : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Limpiezas por trabajadora" hint="Cantidad en el período filtrado.">
          <BarChart data={byStaff} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} width={56} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText} cursor={{ fill: "rgba(201,162,74,0.06)" }} />
            <Bar dataKey="limpiezas" name="Limpiezas" fill={GOLD} radius={[0, 2, 2, 0]} barSize={18} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Tiempo promedio por trabajadora"
          hint="Minutos por habitación: revela los perfiles de cada una."
        >
          <BarChart data={byStaff} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} unit=" m" />
            <YAxis type="category" dataKey="name" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} width={56} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText} cursor={{ fill: "rgba(201,162,74,0.06)" }} formatter={(v) => [`${v} min`, "Promedio"]} />
            <Bar dataKey="promedio" name="Promedio" fill={GOLD} radius={[0, 2, 2, 0]} barSize={18} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard
          title="Rendimiento por turno"
          hint="Limpiezas y tiempo promedio por franja horaria."
        >
          <BarChart data={byShift} margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="franja" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText} cursor={{ fill: "rgba(201,162,74,0.06)" }} />
            <Bar dataKey="limpiezas" name="Limpiezas" fill={GOLD} radius={[2, 2, 0, 0]} barSize={42} />
            <Bar dataKey="promedio" name="Promedio (min)" fill="#7a2233" radius={[2, 2, 0, 0]} barSize={42} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-2xl text-cream">Actividad</h2>
        <p className="mt-1 text-sm text-muted">
          Tareas ejecutadas: limpiezas terminadas y cargas de lavandería tomadas.
        </p>

        <div className="mt-4 border border-line bg-surface/40">
          <div className="hidden grid-cols-[1.2fr_1fr_120px_110px_130px] gap-4 border-b border-line px-5 py-3 sm:grid">
            <span className="kicker text-dim">Tarea</span>
            <span className="kicker text-dim">Trabajadora</span>
            <span className="kicker text-dim">Fecha</span>
            <span className="kicker text-dim">Hora</span>
            <span className="kicker text-right text-dim">Detalle</span>
          </div>
          <ul>
            {pageRows.length === 0 && (
              <li className="px-5 py-8 text-sm text-dim">Sin actividad en el período.</li>
            )}
            {pageRows.map((row) => (
              <li
                key={row.id}
                className="grid grid-cols-1 gap-1 border-b border-line px-5 py-3.5 last:border-b-0 sm:grid-cols-[1.2fr_1fr_120px_110px_130px] sm:items-baseline sm:gap-4"
              >
                <span className="text-sm text-cream">
                  {row.label}
                  {row.kind === "lavanderia" && (
                    <span className="ml-2 rounded-xs border border-line px-1.5 py-px text-[0.625rem] uppercase tracking-[0.08em] text-dim">
                      Lavandería
                    </span>
                  )}
                </span>
                <span className="truncate text-sm text-muted">{row.by}</span>
                <span className="text-sm text-muted">{formatDate(new Date(row.at))}</span>
                <span className="tnum text-sm text-muted">{formatTime(new Date(row.at))}</span>
                <span className="tnum text-sm text-cream sm:text-right">{row.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {pageCount > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold disabled:pointer-events-none disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="kicker text-dim">
              Página {safePage + 1} de {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
              className="border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold disabled:pointer-events-none disabled:opacity-30"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {staffFilter !== "all" && (
        <div className="mt-8 border border-line bg-surface/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl text-cream">
              Historial de actividades · {staffFilter}
            </h2>
            {user?.role === "admin" && (
              <Link
                href="/admin/auditoria"
                className="text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
              >
                Ver auditoría completa
              </Link>
            )}
          </div>
          {staffAudit.length === 0 ? (
            <p className="mt-4 text-sm text-dim">
              Sin acciones registradas en auditoría para este perfil.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {staffAudit.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="min-w-0 truncate text-sm text-muted">
                    {a.action}
                    {a.target ? ` · ${a.target}` : ""}
                  </span>
                  <span className="tnum shrink-0 text-xs text-dim">
                    {formatDate(new Date(a.at))} · {formatTime(new Date(a.at))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-dim">
        El informe PDF de limpiezas está disponible en Limpieza → Descargar informe.
      </p>
    </div>
  );
}
