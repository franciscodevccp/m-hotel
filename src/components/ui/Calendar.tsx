"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4" aria-hidden>
      <path
        d={dir === "left" ? "m10 4-4 4 4 4" : "m6 4 4 4-4 4"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CalendarProps {
  /** Fecha seleccionada en formato YYYY-MM-DD. */
  value: string | null;
  onChange: (date: string) => void;
  /** Permite elegir y navegar fechas pasadas (p. ej. para filtros). */
  allowPast?: boolean;
  className?: string;
}

/** Calendario de marca: mes navegable, día seleccionado en dorado. */
export function Calendar({ value, onChange, allowPast = false, className }: CalendarProps) {
  const [cal, setCal] = useState<{ today: Date; view: { y: number; m: number } } | null>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const view = value
      ? { y: Number(value.split("-")[0]), m: Number(value.split("-")[1]) - 1 }
      : { y: today.getFullYear(), m: today.getMonth() };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- init en cliente para evitar desajuste de hidratación
    setCal({ today, view });
  }, [value]);

  if (!cal) {
    return <div className={cn("min-h-[372px] border border-line bg-surface/40", className)} aria-hidden />;
  }

  const { today, view } = cal;
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const atCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth();

  function shift(delta: number) {
    setCal((c) => {
      if (!c) return c;
      const d = new Date(c.view.y, c.view.m + delta, 1);
      return { ...c, view: { y: d.getFullYear(), m: d.getMonth() } };
    });
  }

  return (
    <div className={cn("max-w-sm border border-line bg-surface/40 p-5", className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!allowPast && atCurrentMonth}
          aria-label="Mes anterior"
          className="flex size-9 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-gold/60 hover:text-gold disabled:pointer-events-none disabled:opacity-30"
        >
          <Chevron dir="left" />
        </button>
        <p className="font-display text-lg text-cream">
          {MONTHS[view.m]} {view.y}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Mes siguiente"
          className="flex size-9 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-gold/60 hover:text-gold"
        >
          <Chevron dir="right" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="kicker pb-2 text-center text-[0.62rem] text-dim">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day == null) return <span key={`b${i}`} />;
          const ds = ymd(view.y, view.m, day);
          const date = new Date(view.y, view.m, day);
          const isPast = date < today;
          const isToday = date.getTime() === today.getTime();
          const isSelected = value === ds;
          return (
            <button
              key={ds}
              type="button"
              disabled={!allowPast && isPast}
              onClick={() => onChange(ds)}
              className={cn(
                "tnum flex h-11 items-center justify-center rounded-sm text-sm transition-colors",
                isSelected
                  ? "bg-gold text-bg"
                  : isPast && !allowPast
                    ? "text-dim/40"
                    : "text-cream hover:bg-surface-2",
                !isSelected && isToday && "border border-gold/50",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
