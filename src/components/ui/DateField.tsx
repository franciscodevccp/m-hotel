"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar } from "@/components/ui/Calendar";
import { cn } from "@/lib/utils";

interface DateFieldProps {
  /** Fecha en formato YYYY-MM-DD ("" si no hay). */
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  /** Alinea el calendario a la derecha del campo (para campos al borde). */
  align?: "left" | "right";
}

function display(v: string): string {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}-${m}-${y}`;
}

/** Selector de fecha con el calendario de marca en un popover. */
export function DateField({
  value,
  onChange,
  placeholder = "Elegir fecha",
  ariaLabel,
  className,
  align = "left",
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        data-open={open}
        className={cn(
          "flex min-h-[40px] items-center justify-between gap-3 rounded-sm border border-line bg-surface px-3 py-2 text-sm transition-colors hover:border-line-strong focus:border-gold/60 focus-visible:outline-none data-[open=true]:border-gold/60",
          value ? "text-cream" : "text-dim",
          className,
        )}
      >
        <span className="tnum">{value ? display(value) : placeholder}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          className="size-4 shrink-0 text-dim"
          aria-hidden
        >
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
          <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={cn("absolute z-50 mt-2", align === "right" ? "right-0" : "left-0")}>
          <Calendar
            value={value || null}
            onChange={(d) => {
              onChange(d);
              setOpen(false);
            }}
            allowPast
            className="w-[320px] max-w-none bg-surface-2 shadow-2xl shadow-black/40"
          />
        </div>
      )}
    </div>
  );
}
