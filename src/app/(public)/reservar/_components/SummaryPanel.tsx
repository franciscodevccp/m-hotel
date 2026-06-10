import { DAY_LABELS, DURATION_LABELS, formatCLP, formatTime12 } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, DayType, Duration } from "@/types";

interface SummaryPanelProps {
  category: Category | null;
  dateLabel?: string;
  dayType: DayType;
  duration: Duration | null;
  arrivalLabel?: string;
  total: number | null;
  endTime: Date | null;
  className?: string;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="kicker text-dim">{label}</dt>
      <dd className={cn("text-right text-sm", muted ? "text-dim" : "text-cream")}>{value}</dd>
    </div>
  );
}

/** Resumen sticky de la reserva, visible durante todo el flujo. */
export function SummaryPanel({
  category,
  dateLabel,
  dayType,
  duration,
  arrivalLabel,
  total,
  endTime,
  className,
}: SummaryPanelProps) {
  return (
    <aside className={cn("border border-line bg-surface/60 p-6", className)}>
      <span className="kicker text-gold">Tu reserva</span>

      <dl className="mt-5 space-y-4">
        <Row label="Fecha" value={dateLabel ?? "Por elegir"} muted={!dateLabel} />
        <Row label="Categoría" value={category ? category.name : "Por elegir"} muted={!category} />
        <Row label="Día" value={dateLabel ? DAY_LABELS[dayType] : "—"} muted={!dateLabel} />
        <Row
          label="Bloque"
          value={duration ? DURATION_LABELS[duration] : "Por elegir"}
          muted={!duration}
        />
        <Row label="Llegada" value={arrivalLabel ?? "Por elegir"} muted={!arrivalLabel} />
        <Row
          label="Término estimado"
          value={endTime && duration ? formatTime12(endTime) : "—"}
          muted={!duration}
        />
      </dl>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
        <span className="kicker">Total</span>
        <span className="tnum font-display text-2xl text-gold">
          {total != null ? formatCLP(total) : "—"}
        </span>
      </div>

      {category && (
        <ul className="mt-6 space-y-2 border-t border-line pt-5">
          {category.amenities.slice(0, 4).map((amenity) => (
            <li key={amenity} className="text-xs text-dim">
              — {amenity}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
