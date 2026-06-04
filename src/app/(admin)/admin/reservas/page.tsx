"use client";

import { DAY_LABELS, DURATION_LABELS, formatCLP } from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import type { ReservationStatus } from "@/types";

function StatusLabel({ status }: { status: ReservationStatus }) {
  return (
    <span className={status === "confirmed" ? "kicker text-ok" : "kicker text-clean"}>
      {status === "confirmed" ? "Confirmada" : "Pendiente"}
    </span>
  );
}

export default function ReservasPage() {
  const { reservations } = useAppStore();
  const list = [...reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Reservas</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Reservas</h1>
        <p className="mt-2 text-sm text-muted">
          Reservas precargadas y las que llegan del sitio: aparecen aquí al instante.
        </p>
      </div>

      <div className="border border-line bg-surface/40">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3 sm:grid">
          <span className="kicker text-dim">Categoría / huésped</span>
          <span className="kicker text-dim">Día</span>
          <span className="kicker text-dim">Bloque</span>
          <span className="kicker text-right text-dim">Total</span>
        </div>

        <ul>
          {list.map((r) => {
            const category = getCategory(r.categoryId);
            return (
              <li
                key={r.id}
                className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:items-center"
              >
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-cream">{category.name}</p>
                    <StatusLabel status={r.status} />
                  </div>
                  <p className="text-xs text-dim">
                    {r.guestName} · {r.guestPhone}
                  </p>
                </div>
                <span className="text-sm text-muted">{DAY_LABELS[r.dayType]}</span>
                <span className="text-sm text-muted">{DURATION_LABELS[r.duration]}</span>
                <span className="tnum text-right text-sm text-gold">{formatCLP(r.total)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
