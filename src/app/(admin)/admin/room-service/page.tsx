"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatCLP, formatTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { RoomServiceItem, RoomServiceOrder, RoomServiceStatus } from "@/types";

const STATUS_LABEL: Record<RoomServiceStatus, string> = {
  preparando: "En preparación",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_CLASS: Record<RoomServiceStatus, string> = {
  preparando: "text-clean",
  entregado: "text-ok",
  cancelado: "text-dim",
};

const STATUS_ORDER: Record<RoomServiceStatus, number> = {
  preparando: 0,
  entregado: 1,
  cancelado: 2,
};

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

export default function RoomServicePage() {
  const {
    roomService,
    rooms,
    products,
    addRoomServiceOrder,
    deliverRoomServiceOrder,
    cancelRoomServiceOrder,
  } = useAppStore();
  const { user } = useSession();
  const userLabel = user ? `${user.roleLabel} · ${user.name}` : "Recepción";

  const sellable = products.filter((p) => p.active && p.channels.includes("room_service"));
  const nameById = new Map(products.map((p) => [p.id, p.name]));
  const priceById = new Map(products.map((p) => [p.id, p.price]));

  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [items, setItems] = useState<RoomServiceItem[]>([]);
  const [notes, setNotes] = useState("");

  const total = items.reduce((s, it) => s + (priceById.get(it.productId) ?? 0) * it.quantity, 0);
  const valid = roomId && items.length > 0;

  const list = [...roomService].sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return b.createdAt.localeCompare(a.createdAt);
  });
  const preparing = roomService.filter((o) => o.status === "preparando").length;

  function resetForm() {
    setRoomId(rooms[0]?.id ?? "");
    setItems([]);
    setNotes("");
  }

  function submit() {
    if (!valid) return;
    const order: RoomServiceOrder = {
      id: makeId("rs"),
      roomId,
      items,
      total,
      notes: notes.trim() || undefined,
      status: "preparando",
      createdAt: new Date().toISOString(),
      user: userLabel,
    };
    addRoomServiceOrder(order);
    resetForm();
    setOpen(false);
  }

  function roomNumber(id: string) {
    return rooms.find((r) => r.id === id)?.number ?? id;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Operación</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Room service</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Pedidos a la habitación. Al entregarlos baja el stock de cada producto y el total entra
            al corte del turno.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="shrink-0"
        >
          Nuevo pedido
        </Button>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="border border-line bg-surface/40 px-5 py-4">
          <span className="kicker text-dim">En preparación</span>
          <p className={cn("tnum mt-2 font-display text-2xl", preparing > 0 ? "text-clean" : "text-cream")}>
            {preparing}
          </p>
        </div>
        <div className="border border-line bg-surface/40 px-5 py-4">
          <span className="kicker text-dim">Pedidos</span>
          <p className="tnum mt-2 font-display text-2xl text-cream">{roomService.length}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay pedidos de room service.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <ul>
            {list.map((o) => (
              <li
                key={o.id}
                className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-cream">Habitación {roomNumber(o.roomId)}</span>
                    <span className={cn("kicker", STATUS_CLASS[o.status])}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {o.items
                      .map((it) => `${it.quantity}× ${nameById.get(it.productId) ?? it.productId}`)
                      .join(" · ")}
                  </p>
                  {o.notes && <p className="mt-1 text-xs italic text-dim">“{o.notes}”</p>}
                  <p className="mt-1 text-xs text-dim">
                    {formatTime(new Date(o.createdAt))}
                    {o.deliveredAt ? ` · Entregado ${formatTime(new Date(o.deliveredAt))}` : ""} · {o.user}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="tnum text-sm text-gold">{formatCLP(o.total)}</span>
                  {o.status === "preparando" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => cancelRoomServiceOrder(o.id)}
                        className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => deliverRoomServiceOrder(o.id, userLabel)}
                        className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                      >
                        Entregar
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <Modal title="Nuevo pedido" subtitle="Room service" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="rs-room">
                Habitación
              </label>
              <Select
                id="rs-room"
                value={roomId}
                onValueChange={setRoomId}
                options={rooms.map((r) => ({ value: r.id, label: `Habitación ${r.number}` }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="kicker text-dim">Productos</span>
                <button
                  type="button"
                  onClick={() =>
                    setItems([...items, { productId: sellable[0]?.id ?? "", quantity: 1 }])
                  }
                  className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
                >
                  Agregar
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {items.length === 0 && (
                  <p className="text-xs text-dim">Agrega al menos un producto al pedido.</p>
                )}
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={item.productId}
                      onValueChange={(v) => {
                        const next = [...items];
                        next[i] = { ...next[i], productId: v };
                        setItems(next);
                      }}
                      ariaLabel="Producto"
                      className="mt-0 flex-1"
                      options={sellable.map((p) => ({
                        value: p.id,
                        label: `${p.name} — ${formatCLP(p.price)}`,
                      }))}
                    />
                    <input
                      inputMode="numeric"
                      value={String(item.quantity)}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = {
                          ...next[i],
                          quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1),
                        };
                        setItems(next);
                      }}
                      className="tnum h-11 w-14 rounded-sm border border-line bg-surface text-center text-sm text-cream focus:border-gold/60 focus-visible:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, j) => j !== i))}
                      aria-label="Quitar producto"
                      className="size-11 shrink-0 border border-line text-dim transition-colors hover:border-busy/60 hover:text-busy"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="kicker text-dim" htmlFor="rs-notes">
                Notas (opcional)
              </label>
              <input
                id="rs-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indicaciones del pedido"
                className={fieldClass}
              />
            </div>

            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="kicker text-dim">Total</span>
              <span className="tnum font-display text-xl text-gold">{formatCLP(total)}</span>
            </div>

            <Button className="w-full" onClick={submit} disabled={!valid}>
              Crear pedido
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
