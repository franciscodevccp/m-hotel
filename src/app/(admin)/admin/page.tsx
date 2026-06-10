"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROOM_STATUS, ROOM_STATUS_ORDER } from "@/components/admin/roomStatus";
import { ingresosTotales, totalDiff } from "@/lib/cash";
import { DURATION_LABELS, formatCLP } from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col border border-line bg-surface/40 p-5">
      <p className="kicker text-dim">{label}</p>
      <div className="mt-auto pt-3">
        <p className={cn("tnum font-display text-3xl", accent ? "text-gold" : "text-cream")}>
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-dim">{hint}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { rooms, reservations, shift, transactions, transfers, resetDemo } = useAppStore();
  const { user } = useSession();

  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const occupancy = Math.round((occupied / rooms.length) * 100);
  const diff = totalDiff(shift);
  const pendingTransfers = transfers.filter((t) => t.status === "solicitado").length;

  const counts = ROOM_STATUS_ORDER.map((status) => ({
    status,
    n: rooms.filter((r) => r.status === status).length,
  }));
  const recent = [...reservations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">{user?.roleLabel ?? "Panel"}</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            {user?.role === "admin" ? "Resumen general" : "Resumen del turno"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {user ? `${user.name} · ${user.context}` : "Panel"}
          </p>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="shrink-0 text-xs uppercase tracking-[0.16em] text-dim transition-colors hover:text-muted"
        >
          Reiniciar demo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ocupación" value={`${occupancy}%`} hint={`${occupied} de ${rooms.length} ocupadas`} />
        <StatCard
          label="Ingresos del turno"
          value={formatCLP(ingresosTotales(shift))}
          accent
          hint={`${transactions.length} pagos`}
        />
        <StatCard label="Reservas activas" value={reservations.length} hint="Incluye reservas online" />
        <StatCard
          label="Diferencia de caja"
          value={diff === 0 ? "Cuadrado" : formatCLP(Math.abs(diff))}
          hint={diff < 0 ? "Falta en caja" : diff > 0 ? "Sobra en caja" : "Sin descuadre"}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {pendingTransfers > 0 && (
          <Link
            href="/admin/bodegas"
            className="flex items-baseline justify-between border border-gold/40 bg-surface/40 px-5 py-4 transition-colors hover:border-gold/70"
          >
            <span className="text-sm text-gold">
              Solicitudes de bodega pendientes: {pendingTransfers}
            </span>
            <span className="kicker text-dim">Resolver →</span>
          </Link>
        )}
        {user?.role === "admin" && (
          <Link
            href="/admin/gerencia"
            className="flex items-baseline justify-between border border-line bg-surface/40 px-5 py-4 transition-colors hover:border-gold/50"
          >
            <span className="text-sm text-cream">Panel gerencial</span>
            <span className="kicker text-dim">Ventas y tendencias →</span>
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-surface/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-cream">Estado de habitaciones</h2>
            <Link
              href="/admin/habitaciones"
              className="text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
            >
              Ver tablero
            </Link>
          </div>
          <ul className="mt-5 space-y-3">
            {counts.map(({ status, n }) => (
              <li key={status} className="flex items-center gap-3">
                <span className={cn("size-2 rounded-full", ROOM_STATUS[status].dot)} aria-hidden />
                <span className="text-sm text-muted">{ROOM_STATUS[status].label}</span>
                <span className="tnum ml-auto text-sm text-cream">{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-line bg-surface/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-cream">Reservas recientes</h2>
            <Link
              href="/admin/reservas"
              className="text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
            >
              Ver todas
            </Link>
          </div>
          <ul className="mt-5 divide-y divide-line">
            {recent.map((r) => {
              const category = getCategory(r.categoryId);
              return (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm text-cream">{category.name}</p>
                    <p className="text-xs text-dim">
                      {r.guestName} · {DURATION_LABELS[r.duration]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tnum text-sm text-gold">{formatCLP(r.total)}</p>
                    <p className="text-xs text-dim">
                      {r.status === "confirmed" ? "Confirmada" : "Pendiente"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
