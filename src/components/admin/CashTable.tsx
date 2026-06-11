import { formatCLP, formatTime } from "@/lib/format";
import type { PaymentMethod, Transaction } from "@/types";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  debit: "Tarjeta débito",
  credit: "Tarjeta crédito",
  transfer: "Transferencia",
};

export function CashTable({ transactions }: { transactions: Transaction[] }) {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="border border-line bg-surface/40">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl text-cream">Pagos del turno</h2>
        <span className="text-xs text-dim">{transactions.length} registros</span>
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-8 text-sm text-dim">Aún no hay pagos registrados.</p>
      ) : (
        <ul>
          {transactions.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-line px-5 py-3.5 last:border-b-0"
            >
              <div>
                <p className="text-sm text-cream">Habitación {t.roomId}</p>
                <p className="text-xs text-dim">
                  {METHOD_LABEL[t.method]} · {formatTime(new Date(t.at))}
                </p>
              </div>
              <span className="tnum text-sm text-cream">{formatCLP(t.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between px-5 py-4">
        <span className="kicker">Total registrado</span>
        <span className="tnum font-display text-lg text-gold">{formatCLP(total)}</span>
      </div>
    </div>
  );
}
