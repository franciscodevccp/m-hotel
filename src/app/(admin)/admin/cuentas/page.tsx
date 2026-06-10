"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { formatCLP, formatDateTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PaymentMethod, Receivable } from "@/types";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
];

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

export default function CuentasPage() {
  const { receivables, rooms, addReceivable, markReceivablePaid } = useAppStore();
  const { user } = useSession();
  const actor = user ? { name: user.name, role: user.role } : undefined;
  const [open, setOpen] = useState(false);
  const [collecting, setCollecting] = useState<Receivable | null>(null);

  const [customer, setCustomer] = useState("");
  const [roomId, setRoomId] = useState("");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState(0);
  const valid = customer.trim().length > 1 && concept.trim().length > 1 && amount > 0;

  const list = [...receivables].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pendiente" ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const pendingTotal = receivables
    .filter((c) => c.status === "pendiente")
    .reduce((sum, c) => sum + c.amount, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const receivable: Receivable = {
      id: makeId("c"),
      customer: customer.trim(),
      roomId: roomId || undefined,
      concept: concept.trim(),
      amount,
      createdAt: new Date().toISOString(),
      status: "pendiente",
    };
    addReceivable(receivable);
    setCustomer("");
    setRoomId("");
    setConcept("");
    setAmount(0);
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Operación</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Cuentas por cobrar</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Consumos y estancias pendientes de pago. Al cobrar una cuenta, el monto entra al corte
            del turno.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          Nueva cuenta
        </Button>
      </div>

      <div className="mb-6 border border-line bg-surface/40 px-5 py-4">
        <span className="kicker text-dim">Pendiente por cobrar</span>
        <p className="tnum mt-2 font-display text-2xl text-gold">{formatCLP(pendingTotal)}</p>
      </div>

      {list.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay cuentas registradas.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <ul>
            {list.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-cream">{c.customer}</span>
                    <span className={cn("kicker", c.status === "pendiente" ? "text-clean" : "text-ok")}>
                      {c.status === "pendiente" ? "Pendiente" : "Pagada"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{c.concept}</p>
                  <p className="mt-1 text-xs text-dim">{formatDateTime(new Date(c.createdAt))}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="tnum text-sm text-cream">{formatCLP(c.amount)}</span>
                  {c.status === "pendiente" && (
                    <button
                      type="button"
                      onClick={() => setCollecting(c)}
                      className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      Cobrar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nueva cuenta */}
      {open && (
        <Modal title="Nueva cuenta" subtitle="Cuenta por cobrar" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="c-customer">
                Cliente
              </label>
              <input
                id="c-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Nombre o empresa"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="c-room">
                Habitación (opcional)
              </label>
              <Select
                id="c-room"
                value={roomId}
                onValueChange={setRoomId}
                options={[
                  { value: "", label: "Sin habitación" },
                  ...rooms.map((r) => ({ value: r.id, label: `Habitación ${r.number}` })),
                ]}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="c-concept">
                Concepto
              </label>
              <input
                id="c-concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Estancia, consumo, convenio…"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="c-amount">
                Monto
              </label>
              <MoneyInput
                id="c-amount"
                value={amount}
                onValueChange={setAmount}
                placeholder="20.000"
                className={fieldClass}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!valid}>
              Guardar cuenta
            </Button>
          </form>
        </Modal>
      )}

      {/* Cobrar cuenta */}
      {collecting && (
        <Modal title="Cobrar cuenta" subtitle={collecting.customer} onClose={() => setCollecting(null)}>
          <div className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <span className="kicker text-dim">Monto</span>
              <span className="tnum font-display text-2xl text-gold">
                {formatCLP(collecting.amount)}
              </span>
            </div>
            <p className="text-sm text-muted">{collecting.concept}</p>
            <div>
              <span className="kicker text-dim">Medio de pago</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      markReceivablePaid(collecting.id, m.value, actor);
                      setCollecting(null);
                    }}
                    className="border border-line px-3 py-2.5 text-xs text-muted transition-colors hover:border-gold/70 hover:text-gold"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-dim">
              El cobro entra al corte del turno en curso.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
