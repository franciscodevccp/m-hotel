"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  addHours,
  DAY_LABELS,
  DURATION_LABELS,
  formatCLP,
  formatDate,
  formatDateTime,
  formatTime12,
  hhmmTo12h,
} from "@/lib/format";
import { makeId } from "@/lib/id";
import { DURATIONS, getCategory, priceFor } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import type { CategoryId, DayType, Duration, Reservation, ReservationStatus } from "@/types";

const inputClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

const ARRIVAL_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const value = `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
  return { value, label: hhmmTo12h(value) };
});

/** Tarifa según el día: Lun–Jue = entre semana, Vie–Dom y festivos = fin de semana. */
function dayTypeFromDate(date: string): DayType {
  if (!date) return "weekday";
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day >= 1 && day <= 4 ? "weekday" : "weekend";
}

function dateObjOf(date: string): Date | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Combina fecha (YYYY-MM-DD) y hora (HH:MM) en una fecha completa. */
function combine(date: string, hhmm: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** Da formato de RUT chileno en vivo. */
function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${clean.slice(-1)}`;
}

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
  const { reservations, categories, rooms, addReservation } = useAppStore();
  const [selected, setSelected] = useState<Reservation | null>(null);

  // Carga manual de reserva (lo que más usa recepción).
  const [showNew, setShowNew] = useState(false);
  const [npCategory, setNpCategory] = useState<CategoryId>(categories[0]?.id ?? "standard");
  const [npRoomId, setNpRoomId] = useState("");
  const [npDate, setNpDate] = useState("");
  const [npDuration, setNpDuration] = useState<Duration>(3);
  const [npArrival, setNpArrival] = useState("");
  const [npName, setNpName] = useState("");
  const [npPhone, setNpPhone] = useState("");
  const [npRut, setNpRut] = useState("");

  const list = [...reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const npDay = dayTypeFromDate(npDate);
  const npDateObj = dateObjOf(npDate);
  const npCat = categories.find((c) => c.id === npCategory) ?? null;
  const npTotal = npCat ? priceFor(npCat, npDay, npDuration) : 0;
  const availableRooms = rooms.filter(
    (r) => r.categoryId === npCategory && r.status === "available",
  );

  function openNew() {
    const first = rooms.find((r) => r.categoryId === npCategory && r.status === "available");
    setNpRoomId(first?.id ?? "");
    const now = new Date();
    setNpDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
    setShowNew(true);
  }

  function pickCategory(id: CategoryId) {
    setNpCategory(id);
    const first = rooms.find((r) => r.categoryId === id && r.status === "available");
    setNpRoomId(first?.id ?? "");
  }

  function submitNew() {
    if (!npName.trim() || !npCat || !npDate) return;
    const arrivalAt = combine(npDate, npArrival || "21:00").toISOString();
    const reservation: Reservation = {
      id: makeId("r"),
      categoryId: npCategory,
      roomId: npRoomId || undefined,
      dayType: npDay,
      duration: npDuration,
      guestName: npName.trim(),
      guestPhone: npPhone.trim(),
      guestRut: npRut.trim() || undefined,
      total: npTotal,
      createdAt: new Date().toISOString(),
      arrivalAt,
      status: "confirmed",
    };
    addReservation(reservation);
    setNpName("");
    setNpPhone("");
    setNpRut("");
    setNpArrival("");
    setShowNew(false);
  }

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Reservas</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Reservas</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Reservas precargadas, las del sitio y las que cargas a mano: aparecen aquí al instante.
            Toca una para ver el detalle.
          </p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          Nueva reserva
        </Button>
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

      {showNew && (
        <Modal title="Nueva reserva" subtitle="Carga manual" onClose={() => setShowNew(false)}>
          <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-1">
            <div>
              <label className="kicker text-dim" htmlFor="nr-name">
                Nombre del huésped
              </label>
              <input
                id="nr-name"
                value={npName}
                onChange={(e) => setNpName(e.target.value)}
                placeholder="Nombre"
                autoFocus
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="nr-phone">
                  Teléfono
                </label>
                <input
                  id="nr-phone"
                  value={npPhone}
                  onChange={(e) => setNpPhone(e.target.value)}
                  placeholder="+56 9 ..."
                  inputMode="tel"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="nr-rut">
                  RUT (opcional)
                </label>
                <input
                  id="nr-rut"
                  value={npRut}
                  onChange={(e) => setNpRut(formatRut(e.target.value))}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="kicker text-dim">Categoría</label>
              <Select
                value={npCategory}
                onValueChange={(v) => pickCategory(v as CategoryId)}
                ariaLabel="Categoría"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label className="kicker text-dim">Habitación disponible</label>
              {availableRooms.length === 0 ? (
                <p className="mt-2 border border-line bg-surface/60 px-3 py-2.5 text-xs text-dim">
                  Sin disponibilidad en esta categoría. La reserva queda sin pieza asignada.
                </p>
              ) : (
                <Select
                  value={npRoomId}
                  onValueChange={setNpRoomId}
                  ariaLabel="Habitación"
                  options={availableRooms.map((r) => ({
                    value: r.id,
                    label: `Habitación ${r.number}`,
                  }))}
                />
              )}
            </div>
            <div>
              <label className="kicker text-dim">Fecha</label>
              <div className="mt-2">
                <Calendar value={npDate} onChange={setNpDate} />
              </div>
              {npDateObj && (
                <p className="mt-2 text-xs text-dim">
                  {formatDate(npDateObj)} · {DAY_LABELS[npDay]}
                </p>
              )}
            </div>
            <div>
              <label className="kicker text-dim">Bloque</label>
              <Select
                value={String(npDuration)}
                onValueChange={(v) => setNpDuration(Number(v) as Duration)}
                ariaLabel="Bloque"
                options={DURATIONS.map((d) => ({ value: String(d), label: DURATION_LABELS[d] }))}
              />
            </div>
            <div>
              <label className="kicker text-dim">Hora de llegada (opcional)</label>
              <Select
                value={npArrival}
                onValueChange={setNpArrival}
                ariaLabel="Hora de llegada"
                placeholder="Elige la hora"
                options={ARRIVAL_OPTIONS}
              />
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="kicker text-dim">Total</span>
              <span className="tnum font-display text-xl text-gold">{formatCLP(npTotal)}</span>
            </div>
            <Button className="w-full" onClick={submitNew} disabled={!npName.trim() || !npDate}>
              Crear reserva
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
