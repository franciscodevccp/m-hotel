"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import {
  addHours,
  DAY_LABELS,
  DURATION_LABELS,
  formatCLP,
  formatDate,
  hhmmTo12h,
} from "@/lib/format";
import { makeId } from "@/lib/id";
import { DURATIONS, extraHourFor, fromPrice, priceFor } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { CategoryId, DayType, Duration, Reservation } from "@/types";
import { SummaryPanel } from "./SummaryPanel";

const STEP_TITLES = [
  "Elige la fecha",
  "Elige tu categoría",
  "Horario",
  "Tus datos",
  "Resumen",
] as const;

const TOTAL_STEPS = STEP_TITLES.length;

const inputClass =
  "mt-2 min-h-[48px] w-full rounded-sm border border-line bg-surface px-4 py-3 text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

// Tramos de media hora (12h con AM/PM) para estimar la hora de llegada.
const ARRIVAL_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const value = `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
  return { value, label: hhmmTo12h(value) };
});

/** Tarifa según el día elegido: Lun–Jue = entre semana, Vie–Dom = fin de semana. */
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

/** Combina la fecha (YYYY-MM-DD) con la hora (HH:MM) en una fecha completa. */
function combine(date: string, hhmm: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** Da formato de RUT chileno en vivo: "123456789" → "12.345.678-9" (admite K). */
function formatRut(raw: string): string {
  const clean = raw
    .replace(/[^0-9kK]/g, "")
    .toUpperCase()
    .slice(0, 9); // 8 dígitos de cuerpo + verificador
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${clean.slice(-1)}`;
}

/** Validación liviana de RUT (7–8 dígitos + verificador), tolerante a puntos y guion. */
function rutOk(rut: string): boolean {
  return /^\d{7,8}[\dkK]$/.test(rut.replace(/[.\-\s]/g, ""));
}

function emailOk(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function ReservationFlow({ initialCategoryId }: { initialCategoryId: CategoryId | null }) {
  const router = useRouter();
  const { categories, rooms, addReservation } = useAppStore();

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId | null>(initialCategoryId);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [arrival, setArrival] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestRut, setGuestRut] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const dayType = dayTypeFromDate(selectedDate);
  const category = categoryId ? (categories.find((c) => c.id === categoryId) ?? null) : null;
  const total = category && duration ? priceFor(category, dayType, duration) : null;
  const dateObj = dateObjOf(selectedDate);
  const dateLabel = dateObj ? formatDate(dateObj) : undefined;
  const arrivalDate = selectedDate && arrival ? combine(selectedDate, arrival) : null;
  const endTime = arrivalDate && duration ? addHours(arrivalDate, duration) : null;
  const arrivalLabel = arrival ? hhmmTo12h(arrival) : undefined;

  // Disponibilidad por categoría: cuántas piezas libres hay ahora en cada una.
  // El huésped no elige pieza; recepción la asigna al confirmar.
  const availableByCategory = (id: CategoryId) =>
    rooms.filter((r) => r.categoryId === id && r.status === "available").length;
  const categoryAvailable = categoryId ? availableByCategory(categoryId) : 0;

  const canContinue =
    step === 0
      ? Boolean(selectedDate)
      : step === 1
        ? Boolean(categoryId) && categoryAvailable > 0
        : step === 2
          ? Boolean(duration) && Boolean(arrival)
          : step === 3
            ? guestName.trim().length > 1 &&
              rutOk(guestRut) &&
              emailOk(guestEmail) &&
              guestPhone.trim().length >= 8
            : true;

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function selectCategory(id: CategoryId) {
    setCategoryId(id);
  }

  function confirm() {
    if (!selectedDate || !categoryId || !duration || !arrival || total == null) return;
    const arrivalAt = combine(selectedDate, arrival);
    const reservation: Reservation = {
      id: makeId("r"),
      categoryId,
      dayType,
      duration,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestRut: guestRut.trim(),
      guestEmail: guestEmail.trim(),
      total,
      createdAt: new Date().toISOString(),
      arrivalAt: arrivalAt.toISOString(),
      status: "confirmed",
    };
    addReservation(reservation);
    router.push(`/reserva/confirmada?id=${reservation.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 pt-24 sm:px-8 lg:pb-24 lg:pt-28">
      {/* Encabezado y progreso */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="kicker text-dim transition-colors hover:text-muted">
            M · Reserva
          </Link>
          <span className="kicker text-dim">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>
        <div className="mt-4 flex gap-1.5" aria-hidden>
          {STEP_TITLES.map((title, i) => (
            <div
              key={title}
              className={cn("h-px flex-1 transition-colors duration-500", i <= step ? "bg-gold" : "bg-line")}
            />
          ))}
        </div>
        <h1 className="mt-6 font-display text-3xl text-cream sm:text-4xl">{STEP_TITLES[step]}</h1>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Paso 0 — Fecha */}
          {step === 0 && (
            <div className="space-y-5">
              <Calendar value={selectedDate} onChange={setSelectedDate} />
              {dateObj && (
                <p className="text-sm text-muted">
                  <span className="text-cream">{formatDate(dateObj)}</span> · {DAY_LABELS[dayType]}
                </p>
              )}
            </div>
          )}

          {/* Paso 1 — Categoría */}
          {step === 1 && (
            <div className="space-y-3">
              {categories.map((c) => {
                const selected = c.id === categoryId;
                const avail = availableByCategory(c.id);
                const soldOut = avail === 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => selectCategory(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      selected ? "border-gold/70 bg-surface-2" : "border-line hover:border-line-strong",
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-xl text-cream">{c.name}</h3>
                        <Badge tone={c.id === "black" ? "black" : "default"}>{c.area} m²</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{c.tagline}</p>
                      <p className={cn("mt-2 text-xs", soldOut ? "text-busy" : "text-ok")}>
                        {soldOut
                          ? "Sin disponibilidad"
                          : `${avail} ${avail === 1 ? "pieza disponible" : "piezas disponibles"}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="kicker text-dim">Desde</span>
                      <p className="tnum font-display text-lg text-gold">{formatCLP(fromPrice(c))}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Paso 2 — Horario (día derivado de la fecha) */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="border border-line bg-surface/40 px-5 py-4">
                <p className="kicker text-dim">Día</p>
                <p className="mt-1 text-sm text-cream">
                  {dateObj ? formatDate(dateObj) : ""} · {DAY_LABELS[dayType]}
                </p>
                <p className="mt-1 text-xs text-dim">
                  {dayType === "weekday"
                    ? "Tarifa de lunes a jueves."
                    : "Tarifa de viernes a domingo y festivos."}
                </p>
              </div>

              <div>
                <p className="kicker text-dim">Bloque de horas</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {DURATIONS.map((d) => {
                    const selected = d === duration;
                    return (
                      <Chip
                        key={d}
                        selected={selected}
                        onClick={() => setDuration(d)}
                        className="flex flex-col gap-2"
                      >
                        <span className={cn("kicker", selected ? "text-gold" : "text-dim")}>
                          {DURATION_LABELS[d]}
                        </span>
                        <span className="tnum font-display text-2xl">
                          {category ? formatCLP(priceFor(category, dayType, d)) : ""}
                        </span>
                      </Chip>
                    );
                  })}
                </div>
                {category && (
                  <p className="mt-3 text-xs text-dim">
                    Hora adicional: {formatCLP(extraHourFor(category, dayType))}. Se coordina en
                    recepción.
                  </p>
                )}
              </div>

              <div>
                <label className="kicker text-dim" htmlFor="llegada">
                  ¿A qué hora llegas?
                </label>
                <Select
                  id="llegada"
                  value={arrival}
                  onValueChange={setArrival}
                  options={ARRIVAL_OPTIONS}
                  placeholder="Elige la hora"
                  className="sm:max-w-xs"
                />
                <p className="mt-2 text-xs text-dim">
                  Aproximado, solo para estimar la hora de término. Lo confirmamos por WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* Paso 3 — Datos */}
          {step === 3 && (
            <div className="max-w-md space-y-5">
              <div>
                <label className="kicker text-dim" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  id="nombre"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="rut">
                  RUT
                </label>
                <input
                  id="rut"
                  value={guestRut}
                  onChange={(e) => setGuestRut(formatRut(e.target.value))}
                  placeholder="12.345.678-9"
                  autoComplete="off"
                  maxLength={12}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="correo">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  inputMode="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="tucorreo@mail.com"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="telefono">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+56 9 ..."
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputClass}
                />
              </div>
              <p className="text-xs leading-relaxed text-dim">
                No solicitamos pago en línea; tus datos solo se usan para confirmar la reserva por
                WhatsApp.
              </p>
            </div>
          )}

          {/* Paso 4 — Resumen */}
          {step === 4 && (
            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-muted">
                Revisa y confirma. Te enviaremos el detalle por WhatsApp.
              </p>
              <SummaryPanel
                category={category}
                dateLabel={dateLabel}
                dayType={dayType}
                duration={duration}
                arrivalLabel={arrivalLabel}
                total={total}
                endTime={endTime}
                className="bg-surface-2/40 lg:hidden"
              />
              <p className="text-sm text-muted">
                A nombre de <span className="text-cream">{guestName}</span> · {guestPhone}
              </p>
            </div>
          )}

          {/* Controles: estáticos en desktop, barra fija en mobile */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-5 py-4 backdrop-blur lg:static lg:mt-12 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 lg:max-w-none lg:justify-start lg:gap-6">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="text-sm text-muted transition-colors hover:text-cream"
                >
                  Volver
                </button>
              ) : (
                <Link href="/" className="text-sm text-muted transition-colors hover:text-cream">
                  Cancelar
                </Link>
              )}
              <div className="flex items-center gap-4">
                {total != null && (
                  <span className="tnum text-sm text-gold lg:hidden">{formatCLP(total)}</span>
                )}
                {step < TOTAL_STEPS - 1 ? (
                  <Button onClick={next} disabled={!canContinue}>
                    Continuar
                  </Button>
                ) : (
                  <Button onClick={confirm}>Confirmar reserva</Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen sticky (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <SummaryPanel
              category={category}
              dateLabel={dateLabel}
              dayType={dayType}
              duration={duration}
              arrivalLabel={arrivalLabel}
              total={total}
              endTime={endTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
