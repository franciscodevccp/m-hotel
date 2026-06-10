"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CorteTicket } from "@/components/admin/CorteTicket";
import { ShiftSummary } from "@/components/admin/ShiftSummary";
import { Modal } from "@/components/ui/Modal";
import { shiftItems } from "@/lib/cash";
import { formatCLP, formatDateTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ClosedShift } from "@/types";

function diffClass(diff: number): string {
  return diff < 0 ? "text-busy" : diff > 0 ? "text-gold" : "text-ok";
}

export default function CortesPage() {
  const { shift, pastShifts, products, movements } = useAppStore();
  const { user } = useSession();
  const [selected, setSelected] = useState<ClosedShift | null>(null);
  // El corte en curso itemiza TODO el catálogo: carta y sexshop entran al mismo corte.
  const items = useMemo(
    () => shiftItems(movements, products, shift.id),
    [movements, products, shift.id],
  );

  // Los cortes son material de Administración y del Dueño (solo lectura).
  if (user && user.role !== "admin" && user.role !== "dueno") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Cortes de caja</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          El historial de cortes está disponible solo para administración y gerencia.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Reportes</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Cortes de caja</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Corte del turno en curso, con el detalle que se imprime. Al cerrar un turno, su corte
          queda archivado en esta sección.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ShiftSummary shift={shift} />
        <div className="border border-line bg-surface/40 p-4">
          <CorteTicket shift={shift} items={items} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl text-cream">Cortes anteriores</h2>
        <p className="mt-1 text-sm text-muted">
          Cada cierre guarda su arqueo, sus pagos y los artículos vendidos del turno.
        </p>

        {pastShifts.length === 0 ? (
          <div className="mt-4 border border-line bg-surface/40 px-5 py-8">
            <p className="text-sm text-dim">
              Aún no hay cortes archivados. Al cerrar un turno queda guardado aquí.
            </p>
          </div>
        ) : (
          <div className="mt-4 border border-line bg-surface/40">
            <div className="hidden grid-cols-[90px_1fr_1fr_120px_180px] gap-4 border-b border-line px-5 py-3 sm:grid">
              <span className="kicker text-dim">Folio</span>
              <span className="kicker text-dim">Cierre</span>
              <span className="kicker text-dim">Responsable</span>
              <span className="kicker text-right text-dim">Ingresos</span>
              <span className="kicker text-right text-dim">Diferencias (ef. · tarj.)</span>
            </div>
            <ul>
              {pastShifts.map((closed) => {
                const cashD = closed.countedCash - closed.cash.expected;
                const cardD = closed.countedCard - closed.card.expected;
                return (
                  <li key={closed.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setSelected(closed)}
                      className="grid w-full grid-cols-1 gap-1 px-5 py-4 text-left transition-colors hover:bg-surface-2/60 sm:grid-cols-[90px_1fr_1fr_120px_180px] sm:items-baseline sm:gap-4"
                    >
                      <span className="tnum text-sm text-gold">{closed.folio}</span>
                      <span className="text-sm text-cream">
                        {formatDateTime(new Date(closed.closedAt))}
                      </span>
                      <span className="truncate text-sm text-muted">{closed.user}</span>
                      <span className="tnum text-sm text-cream sm:text-right">
                        {formatCLP(closed.countedCash + closed.countedCard)}
                      </span>
                      <span className="tnum text-sm sm:text-right">
                        <span className={cn(diffClass(cashD))}>
                          {cashD === 0 ? "—" : formatCLP(cashD)}
                        </span>
                        <span className="text-dim"> · </span>
                        <span className={cn(diffClass(cardD))}>
                          {cardD === 0 ? "—" : formatCLP(cardD)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {selected && (
        <Modal
          title={`Corte folio ${selected.folio}`}
          subtitle={`Cerrado ${formatDateTime(new Date(selected.closedAt))}`}
          onClose={() => setSelected(null)}
        >
          <CorteTicket shift={selected} items={selected.items} />
          <p className="mt-4 text-center text-xs text-dim">
            Snapshot al momento del cierre, con el arqueo contado por el responsable.
          </p>
        </Modal>
      )}
    </div>
  );
}
