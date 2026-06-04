"use client";

import { useState } from "react";
import { CashTable } from "@/components/admin/CashTable";
import { ShiftSummary } from "@/components/admin/ShiftSummary";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PaymentMethod, Transaction } from "@/types";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
];

const fieldClass =
  "mt-2 min-h-[48px] w-full rounded-sm border border-line bg-surface px-4 py-3 text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="kicker text-dim">{label}</dt>
      <dd className={cn("tnum text-sm", accent ? "text-gold" : "text-cream")}>{value}</dd>
    </div>
  );
}

export default function CajaPage() {
  const { rooms, transactions, shift, addTransaction } = useAppStore();
  const [showPayment, setShowPayment] = useState(false);
  const [showClose, setShowClose] = useState(false);

  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");

  const diff = shift.expectedTotal - shift.countedTotal;
  const amountValue = Number.parseInt(amount, 10);
  const amountValid = Number.isFinite(amountValue) && amountValue > 0;

  function registerPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !amountValid) return;
    const transaction: Transaction = {
      id: makeId("t"),
      roomId,
      method,
      amount: amountValue,
      at: new Date().toISOString(),
      user: shift.user,
    };
    addTransaction(transaction);
    setAmount("");
    setMethod("cash");
    setShowPayment(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Caja</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Caja y turnos</h1>
        <p className="mt-2 text-sm text-muted">
          Registra pagos por habitación y cierra el turno con cuadre. Cada movimiento queda con su
          hora y responsable.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <ShiftSummary shift={shift} />
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowPayment(true)}>Registrar pago</Button>
            <Button variant="secondary" onClick={() => setShowClose(true)}>
              Cerrar turno
            </Button>
          </div>
        </div>
        <CashTable transactions={transactions} />
      </div>

      {showPayment && (
        <Modal title="Registrar pago" subtitle="Turno noche" onClose={() => setShowPayment(false)}>
          <form onSubmit={registerPayment} className="space-y-5">
            <div>
              <label className="kicker text-dim" htmlFor="room">
                Habitación
              </label>
              <select
                id="room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={fieldClass}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Habitación {room.number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="kicker text-dim">Medio de pago</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      "border px-3 py-2.5 text-xs transition-colors",
                      method === m.value
                        ? "border-gold/70 text-gold"
                        : "border-line text-muted hover:border-line-strong hover:text-cream",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="kicker text-dim" htmlFor="amount">
                Monto
              </label>
              <input
                id="amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="45000"
                className={fieldClass}
              />
              {amountValid && <p className="mt-1 text-xs text-dim">{formatCLP(amountValue)}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={!amountValid}>
              Guardar pago
            </Button>
          </form>
        </Modal>
      )}

      {showClose && (
        <Modal title="Cierre de turno" subtitle="Cuadre de caja" onClose={() => setShowClose(false)}>
          <dl className="space-y-3">
            <Row label="Esperado" value={formatCLP(shift.expectedTotal)} />
            <Row label="Registrado" value={formatCLP(shift.countedTotal)} />
            <Row
              label="Diferencia"
              value={diff === 0 ? "Cuadrado" : formatCLP(Math.abs(diff))}
              accent
            />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-dim">
            {diff > 0
              ? "Falta dinero en caja. Revisa los cobros del turno antes de cerrar."
              : diff < 0
                ? "Hay un sobrante respecto a lo esperado."
                : "La caja cuadra perfectamente."}
          </p>
          <Button className="mt-6 w-full" onClick={() => setShowClose(false)}>
            Confirmar cierre
          </Button>
        </Modal>
      )}
    </div>
  );
}
