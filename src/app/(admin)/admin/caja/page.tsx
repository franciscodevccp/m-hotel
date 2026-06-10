"use client";

import { useMemo, useState } from "react";
import { CashTable } from "@/components/admin/CashTable";
import { CorteTicket } from "@/components/admin/CorteTicket";
import { ShiftSummary } from "@/components/admin/ShiftSummary";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { ingresosTotales, shiftItems, utilidadTurno } from "@/lib/cash";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  Product,
  Shift,
  Transaction,
} from "@/types";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
];

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "insumos", label: "Insumos" },
  { value: "mantencion", label: "Mantención" },
  { value: "sueldos", label: "Sueldos" },
  { value: "servicios", label: "Servicios" },
  { value: "otro", label: "Otro" },
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

type ModalKind = "payment" | "sale" | "expense" | "print" | "close" | null;

export default function CajaPage() {
  const {
    rooms,
    transactions,
    shift,
    products,
    movements,
    addTransaction,
    addExpense,
    sellProduct,
    closeShift,
  } = useAppStore();
  const { user } = useSession();
  const [modal, setModal] = useState<ModalKind>(null);

  const userLabel = user ? `${user.roleLabel} · ${user.name}` : shift.user;
  const actor = user ? { name: user.name, role: user.role } : undefined;
  // El corte itemiza TODO lo vendido en el turno: carta y sexshop entran al mismo
  // inventario y al mismo corte (registro único multicanal).
  const items = useMemo(
    () => shiftItems(movements, products, shift.id),
    [movements, products, shift.id],
  );

  // --- Registrar pago ---
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(0);
  const amountValid = amount > 0;

  function registerPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !amountValid) return;
    const transaction: Transaction = {
      id: makeId("t"),
      roomId,
      method,
      amount,
      at: new Date().toISOString(),
      user: userLabel,
    };
    addTransaction(transaction, actor);
    setAmount(0);
    setMethod("cash");
    setModal(null);
  }

  // --- Registrar venta presencial (POS) ---
  const sellable = products.filter((p) => p.active && p.channels.includes("presencial"));
  const [saleProductId, setSaleProductId] = useState(sellable[0]?.id ?? "");
  const [saleQty, setSaleQty] = useState(1);
  const saleProduct = products.find((p) => p.id === saleProductId) as Product | undefined;
  const saleTotal = saleProduct ? saleProduct.price * saleQty : 0;
  // La venta no puede superar el saldo de recepción: sin stock no hay cobro.
  const saleMax = saleProduct?.stock ?? 0;
  const saleValid = Boolean(saleProduct) && saleQty > 0 && saleQty <= saleMax;

  function registerSale(e: React.FormEvent) {
    e.preventDefault();
    if (!saleProduct || saleQty <= 0) return;
    sellProduct(saleProduct.id, saleQty, "presencial", shift.id, userLabel, actor);
    setSaleQty(1);
    setModal(null);
  }

  // --- Registrar gasto ---
  const [concept, setConcept] = useState("");
  const [expenseCat, setExpenseCat] = useState<ExpenseCategory>("insumos");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const expenseValid = concept.trim().length > 1 && expenseAmount > 0;

  function registerExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseValid) return;
    const expense: Expense = {
      id: makeId("g"),
      concept: concept.trim(),
      amount: expenseAmount,
      category: expenseCat,
      at: new Date().toISOString(),
      user: userLabel,
    };
    addExpense(expense, actor);
    setConcept("");
    setExpenseAmount(0);
    setExpenseCat("insumos");
    setModal(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Caja</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Caja y turnos</h1>
        <p className="mt-2 text-sm text-muted">
          Registra pagos, ventas de productos y gastos. El corte cuadra solo: cada movimiento queda
          con su hora y responsable.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <ShiftSummary shift={shift} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full" onClick={() => setModal("payment")}>
                Registrar pago
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setModal("sale")}>
                Registrar venta
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setModal("expense")}>
                Registrar gasto
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setModal("print")}>
                Imprimir corte
              </Button>
            </div>
            <div className="border-t border-line pt-4">
              <Button variant="ghost" className="w-full" onClick={() => setModal("close")}>
                Cerrar turno
              </Button>
            </div>
          </div>
        </div>
        <CashTable transactions={transactions} />
      </div>

      {/* Registrar pago */}
      {modal === "payment" && (
        <Modal title="Registrar pago" subtitle="Turno noche" onClose={() => setModal(null)}>
          <form onSubmit={registerPayment} className="space-y-5">
            <div>
              <label className="kicker text-dim" htmlFor="room">
                Habitación
              </label>
              <Select
                id="room"
                value={roomId}
                onValueChange={setRoomId}
                options={rooms.map((room) => ({
                  value: room.id,
                  label: `Habitación ${room.number}`,
                }))}
              />
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
              <MoneyInput
                id="amount"
                value={amount}
                onValueChange={setAmount}
                placeholder="45.000"
                className={fieldClass}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!amountValid}>
              Guardar pago
            </Button>
          </form>
        </Modal>
      )}

      {/* Registrar venta presencial */}
      {modal === "sale" && (
        <Modal
          title="Registrar venta"
          subtitle="Venta en recepción"
          onClose={() => setModal(null)}
        >
          <form onSubmit={registerSale} className="space-y-5">
            <div>
              <label className="kicker text-dim" htmlFor="sale-product">
                Producto
              </label>
              <Select
                id="sale-product"
                value={saleProductId}
                onValueChange={setSaleProductId}
                options={sellable.map((p) => ({
                  value: p.id,
                  label: `${p.name} — ${formatCLP(p.price)}${
                    p.stock <= 0 ? " (agotado)" : ` · ${p.stock} en stock`
                  }`,
                  disabled: p.stock <= 0,
                }))}
              />
            </div>

            <div>
              <span className="kicker text-dim">Cantidad</span>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSaleQty((q) => Math.max(1, q - 1))}
                  className="size-11 border border-line text-lg text-cream transition-colors hover:border-gold/70"
                >
                  −
                </button>
                <span className="tnum w-12 text-center text-lg text-cream">{saleQty}</span>
                <button
                  type="button"
                  onClick={() => setSaleQty((q) => q + 1)}
                  className="size-11 border border-line text-lg text-cream transition-colors hover:border-gold/70"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="kicker text-dim">Total venta</span>
              <span className="tnum font-display text-xl text-gold">{formatCLP(saleTotal)}</span>
            </div>
            <p className="text-xs leading-relaxed text-dim">
              Descuenta del stock y entra al efectivo del corte del turno.
            </p>

            <Button
              type="submit"
              className="w-full"
              disabled={!saleValid || (saleProduct?.stock ?? 0) <= 0}
            >
              Cobrar venta
            </Button>
          </form>
        </Modal>
      )}

      {/* Registrar gasto */}
      {modal === "expense" && (
        <Modal title="Registrar gasto" subtitle="Gasto del turno" onClose={() => setModal(null)}>
          <form onSubmit={registerExpense} className="space-y-5">
            <div>
              <label className="kicker text-dim" htmlFor="concept">
                Concepto
              </label>
              <input
                id="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Compra de insumos de limpieza"
                className={fieldClass}
              />
            </div>

            <div>
              <label className="kicker text-dim" htmlFor="expense-cat">
                Categoría
              </label>
              <Select
                id="expense-cat"
                value={expenseCat}
                onValueChange={(v) => setExpenseCat(v as ExpenseCategory)}
                options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              />
            </div>

            <div>
              <label className="kicker text-dim" htmlFor="expense-amount">
                Monto
              </label>
              <MoneyInput
                id="expense-amount"
                value={expenseAmount}
                onValueChange={setExpenseAmount}
                placeholder="12.000"
                className={fieldClass}
              />
            </div>

            <p className="text-xs leading-relaxed text-dim">
              Sube los gastos del turno y baja la utilidad del corte.
            </p>

            <Button type="submit" className="w-full" disabled={!expenseValid}>
              Guardar gasto
            </Button>
          </form>
        </Modal>
      )}

      {/* Imprimir corte */}
      {modal === "print" && (
        <Modal title="Imprimir corte" subtitle={`Folio ${shift.folio}`} onClose={() => setModal(null)}>
          <CorteTicket shift={shift} items={items} />
          <p className="mt-4 text-center text-xs text-dim">
            Vista para imprimir o compartir. En producción se descarga o se envía por correo.
          </p>
        </Modal>
      )}

      {/* Cerrar turno: arqueo de caja */}
      {modal === "close" && (
        <CloseShiftModal
          shift={shift}
          onClose={() => setModal(null)}
          onConfirm={(counted, nextOpeningCash) =>
            closeShift(counted, nextOpeningCash, userLabel, actor)
          }
        />
      )}
    </div>
  );
}

function ArqueoDiff({ diff }: { diff: number }) {
  return (
    <p
      className={cn(
        "mt-1.5 text-xs",
        diff < 0 ? "text-busy" : diff > 0 ? "text-gold" : "text-ok",
      )}
    >
      {diff === 0
        ? "Cuadra con lo esperado"
        : diff < 0
          ? `Falta ${formatCLP(Math.abs(diff))}`
          : `Sobra ${formatCLP(diff)}`}
    </p>
  );
}

function CloseShiftModal({
  shift,
  onClose,
  onConfirm,
}: {
  shift: Shift;
  onClose: () => void;
  onConfirm: (counted: { cash: number; card: number }, nextOpeningCash: number) => void;
}) {
  // El arqueo parte en lo que el sistema espera; el cajero corrige con lo contado.
  const [countedCash, setCountedCash] = useState(shift.cash.expected);
  const [countedCard, setCountedCard] = useState(shift.card.expected);
  const [nextOpening, setNextOpening] = useState(15000);
  const [closedFolio, setClosedFolio] = useState<number | null>(null);

  const cashD = countedCash - shift.cash.expected;
  const cardD = countedCard - shift.card.expected;

  if (closedFolio != null) {
    return (
      <Modal title="Turno cerrado" subtitle={`Folio ${closedFolio}`} onClose={onClose}>
        <p className="text-sm leading-relaxed text-muted">
          El corte del folio {closedFolio} quedó archivado con su arqueo y su detalle. Se abrió
          el folio {closedFolio + 1} con {formatCLP(nextOpening)} de caja inicial.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Volver a caja
          </Button>
          <a href="/admin/cortes" className="contents">
            <Button className="w-full">Ver cortes</Button>
          </a>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Cierre de turno" subtitle={`Arqueo · Folio ${shift.folio}`} onClose={onClose}>
      <dl className="space-y-3">
        <Row label="Efectivo esperado" value={formatCLP(shift.cash.expected)} />
        <Row label="Tarjeta esperada" value={formatCLP(shift.card.expected)} />
        <Row label="Ingresos totales" value={formatCLP(ingresosTotales(shift))} />
        <Row label="Gastos" value={formatCLP(shift.expenses.real)} />
        <Row label="Utilidad del turno" value={formatCLP(utilidadTurno(shift))} accent />
      </dl>

      <div className="mt-5 space-y-4 border-t border-line pt-5">
        <div>
          <label className="kicker text-dim" htmlFor="counted-cash">
            Efectivo contado
          </label>
          <MoneyInput
            id="counted-cash"
            value={countedCash}
            onValueChange={setCountedCash}
            className={fieldClass}
          />
          <ArqueoDiff diff={cashD} />
        </div>
        <div>
          <label className="kicker text-dim" htmlFor="counted-card">
            Comprobantes tarjeta
          </label>
          <MoneyInput
            id="counted-card"
            value={countedCard}
            onValueChange={setCountedCard}
            className={fieldClass}
          />
          <ArqueoDiff diff={cardD} />
        </div>
        <div>
          <label className="kicker text-dim" htmlFor="next-opening">
            Caja inicial del próximo turno
          </label>
          <MoneyInput
            id="next-opening"
            value={nextOpening}
            onValueChange={setNextOpening}
            className={fieldClass}
          />
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-dim">
        {cashD !== 0 || cardD !== 0
          ? "La diferencia queda registrada en el corte archivado, con responsable y hora."
          : "La caja cuadra con lo esperado."}
      </p>

      <Button
        className="mt-5 w-full"
        onClick={() => {
          onConfirm({ cash: countedCash, card: countedCard }, nextOpening);
          setClosedFolio(shift.folio);
        }}
      >
        Confirmar cierre
      </Button>
    </Modal>
  );
}
