import { formatCLP, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types";

export function ShiftSummary({ shift }: { shift: Shift }) {
  const diff = shift.expectedTotal - shift.countedTotal;

  return (
    <div className="border border-line bg-surface/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Turno en curso</span>
          <p className="mt-2 text-sm text-cream">{shift.user}</p>
        </div>
        <p className="text-xs text-dim">Abierto {formatTime(new Date(shift.openedAt))}</p>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <dt className="kicker text-dim">Esperado</dt>
          <dd className="tnum mt-2 font-display text-lg text-cream sm:text-xl">
            {formatCLP(shift.expectedTotal)}
          </dd>
        </div>
        <div>
          <dt className="kicker text-dim">Registrado</dt>
          <dd className="tnum mt-2 font-display text-lg text-cream sm:text-xl">
            {formatCLP(shift.countedTotal)}
          </dd>
        </div>
        <div>
          <dt className="kicker text-dim">Diferencia</dt>
          <dd
            className={cn(
              "tnum mt-2 font-display text-lg sm:text-xl",
              diff > 0 ? "text-busy" : diff < 0 ? "text-gold" : "text-ok",
            )}
          >
            {diff === 0 ? "—" : formatCLP(Math.abs(diff))}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-dim">
        {diff > 0
          ? "Falta dinero en caja respecto a lo esperado por ocupación y reservas."
          : diff < 0
            ? "Hay más dinero del esperado: revisa cobros duplicados."
            : "La caja cuadra con lo esperado."}
      </p>
    </div>
  );
}
