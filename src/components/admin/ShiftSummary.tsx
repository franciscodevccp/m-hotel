import {
  cashDiff,
  cardDiff,
  expensesDiff,
  ingresosTotales,
  utilidadTurno,
} from "@/lib/cash";
import { formatCLP, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CashLine, Shift } from "@/types";

/** Color de una diferencia: rojo si falta, dorado si sobra, ok si cuadra. */
function diffClass(diff: number): string {
  return diff < 0 ? "text-busy" : diff > 0 ? "text-gold" : "text-ok";
}

function LineRow({ label, line }: { label: string; line: CashLine }) {
  const diff = line.real - line.expected;
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-3 py-1.5 sm:gap-x-5">
      <span className="text-sm text-muted">{label}</span>
      <span className="tnum w-20 text-right text-sm text-cream sm:w-24">{formatCLP(line.real)}</span>
      <span className="tnum hidden w-20 text-right text-sm text-muted sm:inline-block sm:w-24">
        {formatCLP(line.expected)}
      </span>
      <span className={cn("tnum w-20 text-right text-sm sm:w-24", diffClass(diff))}>
        {diff === 0 ? "—" : formatCLP(diff)}
      </span>
    </div>
  );
}

export function ShiftSummary({ shift }: { shift: Shift }) {
  const cDiff = cashDiff(shift);
  const tDiff = cardDiff(shift);
  const descuadre = cDiff !== 0 || tDiff !== 0;

  return (
    <div className="border border-line bg-surface/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Corte del turno</span>
          <p className="mt-2 text-sm text-cream">{shift.user}</p>
        </div>
        <div className="text-right">
          <p className="tnum text-sm text-cream">Folio {shift.folio}</p>
          <p className="text-xs text-dim">Abierto {formatTime(new Date(shift.openedAt))}</p>
        </div>
      </div>

      {/* Encabezado de columnas */}
      <div className="mt-6 grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-line pb-2 sm:gap-x-5">
        <span className="kicker text-dim">Concepto</span>
        <span className="kicker w-20 text-right text-dim sm:w-24">Real</span>
        <span className="kicker hidden w-20 text-right text-dim sm:inline-block sm:w-24">Deber</span>
        <span className="kicker w-20 text-right text-dim sm:w-24">Dif.</span>
      </div>

      <div className="divide-y divide-line">
        <LineRow label="Efectivo" line={shift.cash} />
        <LineRow label="Tarjeta y transferencia" line={shift.card} />
        <LineRow label="Gastos" line={shift.expenses} />
      </div>

      <dl className="mt-5 space-y-2 border-t border-line pt-4">
        <div className="flex items-baseline justify-between">
          <dt className="kicker text-dim">Caja inicial</dt>
          <dd className="tnum text-sm text-muted">{formatCLP(shift.openingCash)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="kicker text-dim">Ingresos totales</dt>
          <dd className="tnum text-sm text-cream">{formatCLP(ingresosTotales(shift))}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="kicker text-dim">Propinas (efectivo · tarjeta)</dt>
          <dd className="tnum text-sm text-muted">
            {formatCLP(shift.tipsCash)} · {formatCLP(shift.tipsCard)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="kicker">Utilidad del turno</dt>
          <dd className="tnum font-display text-xl text-gold">{formatCLP(utilidadTurno(shift))}</dd>
        </div>
      </dl>

      {descuadre && (
        <div className="mt-5 border border-busy/40 bg-busy/10 px-4 py-3">
          <p className="text-sm text-busy">Descuadre detectado</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {tDiff !== 0 && (
              <>
                Tarjeta: {tDiff < 0 ? "faltan" : "sobran"} {formatCLP(Math.abs(tDiff))} respecto a los
                comprobantes esperados.{" "}
              </>
            )}
            {cDiff !== 0 && (
              <>
                Efectivo: {cDiff < 0 ? "faltan" : "sobran"} {formatCLP(Math.abs(cDiff))}.
              </>
            )}{" "}
            Revisa los cobros del turno antes de cerrar.
          </p>
        </div>
      )}

      {expensesDiff(shift) !== 0 && (
        <p className="mt-3 text-xs text-dim">
          Diferencia en gastos: {formatCLP(expensesDiff(shift))}.
        </p>
      )}
    </div>
  );
}
