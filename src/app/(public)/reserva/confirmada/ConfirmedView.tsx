"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buttonStyles } from "@/components/ui/Button";
import {
  addHours,
  DAY_LABELS,
  DURATION_LABELS,
  formatCLP,
  formatTime,
} from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { useAppStore } from "@/lib/store";
import { buildReservationMessage, whatsappUrl } from "@/lib/whatsapp";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="kicker text-dim">{label}</dt>
      <dd className="text-right text-sm text-cream">{value}</dd>
    </div>
  );
}

export function ConfirmedView({ id }: { id: string | null }) {
  const { reservations, hydrated } = useAppStore();
  const reservation = useMemo(
    () => reservations.find((r) => r.id === id) ?? null,
    [reservations, id],
  );

  if (!reservation) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 pt-32 text-center sm:px-8">
        <span className="kicker text-gold">Reserva</span>
        <h1 className="mt-4 font-display text-3xl text-cream">
          {hydrated ? "No encontramos tu reserva" : "Cargando…"}
        </h1>
        {hydrated && (
          <>
            <p className="mt-4 leading-relaxed text-muted">
              Puede que el enlace haya expirado. Inicia una nueva reserva cuando quieras.
            </p>
            <div className="mt-8">
              <Link href="/reservar" className={buttonStyles({ variant: "primary" })}>
                Reservar
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  const category = getCategory(reservation.categoryId);
  const endTime = addHours(new Date(reservation.createdAt), reservation.duration);
  const message = buildReservationMessage(reservation, endTime);
  const waUrl = whatsappUrl(message);

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-32 sm:px-8">
      <div className="text-center">
        <span className="kicker text-gold">Reserva lista</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
          Te esperamos.
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
          Tu reserva quedó registrada. Te confirmamos los detalles por WhatsApp.
        </p>
      </div>

      <div className="mt-10 border border-line bg-surface/60 p-6">
        <div className="flex items-center justify-between">
          <span className="kicker text-dim">Código</span>
          <span className="tnum text-sm text-cream">{reservation.id}</span>
        </div>
        <dl className="mt-5 space-y-4 border-t border-line pt-5">
          <Row label="Categoría" value={`${category.name} · ${category.area} m²`} />
          <Row label="Día" value={DAY_LABELS[reservation.dayType]} />
          <Row label="Bloque" value={DURATION_LABELS[reservation.duration]} />
          <Row label="Término estimado" value={formatTime(endTime)} />
          <Row label="A nombre de" value={reservation.guestName} />
        </dl>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <span className="kicker">Total</span>
          <span className="tnum font-display text-2xl text-gold">
            {formatCLP(reservation.total)}
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles({ variant: "primary", size: "lg" })}
        >
          Confirmar por WhatsApp
        </a>
        <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          Volver al inicio
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-dim">
        También puedes escribirnos al {SITE.whatsappDisplay}.
      </p>
    </div>
  );
}
