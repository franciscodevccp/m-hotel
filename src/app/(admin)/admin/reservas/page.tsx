"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  addHours,
  DAY_LABELS,
  DURATION_LABELS,
  formatCLP,
  formatDate,
  formatDateTime,
  formatTime12,
} from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import type { Reservation, ReservationStatus } from "@/types";

function StatusLabel({ status }: { status: ReservationStatus }) {
  return (
    <span className={status === "confirmed" ? "kicker text-ok" : "kicker text-clean"}>
      {status === "confirmed" ? "Confirmada" : "Pendiente"}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="kicker text-dim">{label}</dt>
      <dd className="text-right text-sm text-cream">{value}</dd>
    </div>
  );
}

export default function ReservasPage() {
  const { reservations } = useAppStore();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const list = [...reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const detail = selected
    ? (() => {
        const category = getCategory(selected.categoryId);
        const arrival = new Date(selected.arrivalAt ?? selected.createdAt);
        const endTime = addHours(arrival, selected.duration);
        return { category, arrival, endTime };
      })()
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <span className="kicker text-gold">Reservas</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Reservas</h1>
        <p className="mt-2 text-sm text-muted">
          Reservas precargadas y las que llegan del sitio: aparecen aquí al instante. Toca una para
          ver el detalle.
        </p>
      </div>

      <div className="border border-line bg-surface/40">
        <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 border-b border-line px-5 py-3 sm:grid">
          <span className="kicker text-dim">Categoría / huésped</span>
          <span className="kicker text-dim">Día</span>
          <span className="kicker text-dim">Bloque</span>
          <span className="kicker text-right text-dim">Total</span>
        </div>

        <ul>
          {list.map((r) => {
            const category = getCategory(r.categoryId);
            return (
              <li key={r.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className="grid w-full grid-cols-2 gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-surface/60 sm:grid-cols-[2fr_1.2fr_1fr_1fr] sm:items-center"
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
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && detail && (
        <Modal
          title={`Reserva ${selected.id}`}
          subtitle={detail.category.name}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <StatusLabel status={selected.status} />
              <span className="tnum font-display text-2xl text-gold">
                {formatCLP(selected.total)}
              </span>
            </div>

            <dl className="space-y-3">
              <Row label="Categoría" value={`${detail.category.name} · ${detail.category.area} m²`} />
              {selected.roomId && (
                <Row label="Habitación" value={`Habitación ${selected.roomId}`} />
              )}
              <Row label="Fecha" value={formatDate(detail.arrival)} />
              <Row label="Día" value={DAY_LABELS[selected.dayType]} />
              <Row label="Bloque" value={DURATION_LABELS[selected.duration]} />
              <Row label="Llegada estimada" value={formatTime12(detail.arrival)} />
              <Row label="Término estimado" value={formatTime12(detail.endTime)} />
            </dl>

            <div className="border-t border-line pt-4">
              <p className="kicker text-dim">Huésped</p>
              <dl className="mt-3 space-y-3">
                <Row label="Nombre" value={selected.guestName} />
                <Row label="Teléfono" value={selected.guestPhone} />
                {selected.guestRut && <Row label="RUT" value={selected.guestRut} />}
                {selected.guestEmail && <Row label="Correo" value={selected.guestEmail} />}
              </dl>
            </div>

            <p className="text-xs text-dim">
              Registrada {formatDateTime(new Date(selected.createdAt))}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
