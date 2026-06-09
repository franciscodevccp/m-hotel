import {
  cashDiff,
  cardDiff,
  expensesDiff,
  ingresosTotales,
  utilidadTurno,
  type ShiftItem,
} from "@/lib/cash";
import { formatCLP, formatDateTime } from "@/lib/format";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types";

function TLine({ label, value, tone }: { label: string; value: string; tone?: "alert" | "dim" }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <span className={cn("text-xs", tone === "dim" ? "text-muted" : "text-muted")}>{label}</span>
      <span
        className={cn(
          "tnum text-xs",
          tone === "alert" ? "text-busy" : tone === "dim" ? "text-muted" : "text-cream",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <p className="kicker mt-4 border-b border-dashed border-line pb-1 text-muted">{title}</p>
  );
}

/** Réplica visual del corte de caja que imprime el cliente. Layout angosto tipo ticket. */
export function CorteTicket({ shift, items }: { shift: Shift; items: ShiftItem[] }) {
  const cDiff = cashDiff(shift);
  const tDiff = cardDiff(shift);
  const eDiff = expensesDiff(shift);

  return (
    <div className="mx-auto max-w-xs bg-surface-2 px-5 py-6">
      <div className="text-center">
        <p className="kicker text-gold">Corte de caja</p>
        <p className="mt-2 text-sm text-cream">{SITE.name} · {SITE.city}</p>
        <p className="tnum mt-1 text-xs text-muted">
          {formatDateTime(new Date(shift.openedAt))} · Folio {shift.folio}
        </p>
        <p className="mt-0.5 text-xs text-muted">Responsable: {shift.user}</p>
      </div>

      <Section title="Dinero en caja" />
      <TLine label="Caja inicial" value={formatCLP(shift.openingCash)} />
      <TLine label="Efectivo real" value={formatCLP(shift.cash.real)} />
      <TLine label="Efectivo deber" value={formatCLP(shift.cash.expected)} tone="dim" />
      <TLine label="Diferencia" value={cDiff === 0 ? "—" : formatCLP(cDiff)} tone={cDiff !== 0 ? "alert" : undefined} />

      <Section title="Pagos con tarjeta" />
      <TLine label="Comprobante real" value={formatCLP(shift.card.real)} />
      <TLine label="Comprobante deber" value={formatCLP(shift.card.expected)} tone="dim" />
      <TLine label="Diferencia" value={tDiff === 0 ? "—" : formatCLP(tDiff)} tone={tDiff !== 0 ? "alert" : undefined} />

      <Section title="Gastos" />
      <TLine label="Real" value={formatCLP(shift.expenses.real)} />
      <TLine label="Deber" value={formatCLP(shift.expenses.expected)} tone="dim" />
      <TLine label="Diferencia" value={eDiff === 0 ? "—" : formatCLP(eDiff)} tone={eDiff !== 0 ? "alert" : undefined} />

      <Section title="Artículos y servicios vendidos" />
      {items.length === 0 ? (
        <p className="py-1 text-xs text-muted">Sin ventas de productos en el turno.</p>
      ) : (
        items.map((item) => (
          <div key={item.productId} className="flex items-baseline justify-between gap-3 py-0.5">
            <span className="truncate text-xs text-muted">{item.name}</span>
            <span className="tnum shrink-0 text-xs text-muted">×{item.quantity}</span>
          </div>
        ))
      )}

      <div className="mt-4 space-y-0.5 border-t border-dashed border-line pt-3">
        <TLine label="Ingresos totales" value={formatCLP(ingresosTotales(shift))} />
        <TLine label="Gastos totales" value={formatCLP(shift.expenses.real)} />
        <div className="flex items-baseline justify-between gap-4 py-1">
          <span className="kicker text-cream">Utilidad del turno</span>
          <span className="tnum text-sm text-gold">{formatCLP(utilidadTurno(shift))}</span>
        </div>
        <TLine label="Propina en efectivo" value={formatCLP(shift.tipsCash)} tone="dim" />
        <TLine label="Propina en tarjeta" value={formatCLP(shift.tipsCard)} tone="dim" />
      </div>
    </div>
  );
}
