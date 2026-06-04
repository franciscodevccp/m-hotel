"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { CATEGORIES } from "@/data/categories";
import {
  addHours,
  DURATION_LABELS,
  formatCLP,
} from "@/lib/format";
import { makeId } from "@/lib/id";
import { DURATIONS, extraHourFor, fromPrice, getCategory, priceFor } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { CategoryId, DayType, Duration, Reservation } from "@/types";
import { SummaryPanel } from "./SummaryPanel";

const STEP_TITLES = [
  "Elige tu categoría",
  "¿Qué día?",
  "Elige el bloque",
  "Tus datos",
  "Resumen",
] as const;

const TOTAL_STEPS = STEP_TITLES.length;

const inputClass =
  "mt-2 min-h-[48px] w-full rounded-sm border border-line bg-surface px-4 py-3 text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function todayDayType(): DayType {
  const day = new Date().getDay(); // 0 domingo .. 6 sábado
  return day >= 1 && day <= 4 ? "weekday" : "weekend";
}

export function ReservationFlow({ initialCategoryId }: { initialCategoryId: CategoryId | null }) {
  const router = useRouter();
  const { addReservation } = useAppStore();

  const [step, setStep] = useState(initialCategoryId ? 1 : 0);
  const [categoryId, setCategoryId] = useState<CategoryId | null>(initialCategoryId);
  const [dayType, setDayType] = useState<DayType>("weekday");
  const [duration, setDuration] = useState<Duration | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  // Preselecciona el día actual al montar (evita desajuste de hidratación).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicialización en cliente para evitar desajuste de hidratación
    setDayType(todayDayType());
  }, []);

  // Hora de referencia para el término estimado; se refresca al avanzar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresca la hora de referencia al cambiar de paso
    setNow(new Date());
  }, [step]);

  const category = categoryId ? getCategory(categoryId) : null;
  const total = category && duration ? priceFor(category, dayType, duration) : null;
  const endTime = now && duration ? addHours(now, duration) : null;

  const canContinue =
    step === 0
      ? Boolean(categoryId)
      : step === 1
        ? true
        : step === 2
          ? Boolean(duration)
          : step === 3
            ? guestName.trim().length > 1 && guestPhone.trim().length >= 8
            : true;

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function confirm() {
    if (!categoryId || !duration || total == null) return;
    const reservation: Reservation = {
      id: makeId("r"),
      categoryId,
      dayType,
      duration,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      total,
      createdAt: new Date().toISOString(),
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
          {/* Paso 0 — Categoría */}
          {step === 0 && (
            <div className="space-y-3">
              {CATEGORIES.map((c) => {
                const selected = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 border p-5 text-left transition-colors",
                      selected ? "border-gold/70 bg-surface-2" : "border-line hover:border-line-strong",
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-xl text-cream">{c.name}</h3>
                        <Badge tone={c.id === "black" ? "black" : "default"}>{c.area} m²</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{c.tagline}</p>
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

          {/* Paso 1 — Día */}
          {step === 1 && (
            <div className="space-y-6">
              <SegmentedToggle
                segments={[
                  { value: "weekday", label: "Entre semana" },
                  { value: "weekend", label: "Finde y festivos" },
                ]}
                value={dayType}
                onChange={setDayType}
                className="w-full"
              />
              <p className="text-sm leading-relaxed text-muted">
                {dayType === "weekday"
                  ? "Tarifa de lunes a jueves."
                  : "Tarifa de viernes a domingo y festivos."}{" "}
                Cambiar el día recalcula todos los precios.
              </p>
              {category && (
                <div className="grid grid-cols-3 gap-3">
                  {DURATIONS.map((d) => (
                    <div key={d} className="border border-line p-4 text-center">
                      <p className="kicker text-dim">{d} h</p>
                      <p className="tnum mt-2 font-display text-base text-cream sm:text-lg">
                        {formatCLP(priceFor(category, dayType, d))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 2 — Bloque */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
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
                <p className="text-xs text-dim">
                  Hora adicional: {formatCLP(extraHourFor(category, dayType))}. Se coordina en
                  recepción.
                </p>
              )}
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
                Pedimos lo mínimo. No solicitamos pago en línea; la reserva se confirma por WhatsApp.
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
                dayType={dayType}
                duration={duration}
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
              dayType={dayType}
              duration={duration}
              total={total}
              endTime={endTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
