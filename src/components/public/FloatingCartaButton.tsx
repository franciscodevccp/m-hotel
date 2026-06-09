"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useCart } from "@/lib/cart";
import { useCartaOrder } from "@/lib/cartaOrder";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useAppStore } from "@/lib/store";
import { useVisitor } from "@/lib/visitor";
import { cn } from "@/lib/utils";
import type { RoomServiceOrder } from "@/types";

type View = "order" | "preview" | "done";

interface Sent {
  roomLabel: string;
  name: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}

export function FloatingCartaButton() {
  const pathname = usePathname();
  const { visitor } = useVisitor();
  const { items, count, total, add, setQty, remove, clear } = useCartaOrder();
  const { count: cartCount } = useCart();
  const { rooms, addRoomServiceOrder } = useAppStore();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("order");
  const [roomId, setRoomId] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (visitor?.mode !== "registered") return null;

  const name = visitor.name ?? "Cliente registrado";
  // Si el cliente tiene una estancia activa, su habitación ya está asignada.
  const myRoom = rooms.find((r) => r.status === "occupied" && r.stay?.guestName === name);
  const effectiveRoomId = myRoom ? myRoom.id : roomId;
  const effectiveRoom = myRoom ?? rooms.find((r) => r.id === roomId);
  const roomLabel = effectiveRoom ? `Habitación ${effectiveRoom.number}` : "";
  const cartVisible = cartCount > 0 || pathname.startsWith("/sexshop");
  const canSend = effectiveRoomId !== "" && count > 0;

  function confirmSend() {
    if (!canSend) return;
    const order: RoomServiceOrder = {
      id: makeId("rs"),
      roomId: effectiveRoomId,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      total,
      notes: `Pedido online del cliente · ${name}`,
      status: "preparando",
      createdAt: new Date().toISOString(),
      user: name,
    };
    setSent({
      roomLabel,
      name,
      items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total,
    });
    addRoomServiceOrder(order);
    clear();
    setView("done");
  }

  function closeAll() {
    setOpen(false);
    setView("order");
    setSent(null);
  }

  return (
    <>
      {count > 0 && (
        <button
          type="button"
          onClick={() => {
            setView("order");
            setOpen(true);
          }}
          aria-label={`Mi pedido (${count})`}
          className={cn(
            "fixed right-6 z-50 flex size-14 items-center justify-center rounded-full bg-gold text-bg shadow-lg shadow-black/40 transition-colors hover:bg-gold-soft",
            cartVisible ? "bottom-24" : "bottom-6",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-6">
            <path d="M5 17.5h14" strokeLinecap="round" />
            <path d="M6 17.5v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 5.5V4" strokeLinecap="round" />
          </svg>
          <span className="tnum absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-bg bg-wine px-1 text-[0.65rem] font-semibold text-cream">
            {count}
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Mi pedido">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={closeAll} aria-hidden />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line-strong bg-surface-2">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <span className="kicker text-gold">Room service</span>
                <h2 className="mt-1 font-display text-2xl text-cream">
                  {view === "order"
                    ? "Mi pedido"
                    : view === "preview"
                      ? "Confirmar pedido"
                      : "Pedido enviado"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeAll}
                aria-label="Cerrar"
                className="text-2xl leading-none text-dim transition-colors hover:text-cream"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {view === "order" && (
                <>
                  {myRoom ? (
                    <div className="mb-5 flex items-center justify-between rounded-sm border border-gold/40 bg-surface/60 px-4 py-3">
                      <div>
                        <p className="kicker text-dim">Tu habitación</p>
                        <p className="mt-1 text-sm text-cream">Habitación {myRoom.number}</p>
                      </div>
                      <span className="kicker text-gold">Estancia activa</span>
                    </div>
                  ) : (
                    <div className="mb-5">
                      <label className="kicker text-dim">¿A qué habitación lo llevamos?</label>
                      <Select
                        value={roomId}
                        onValueChange={setRoomId}
                        ariaLabel="Habitación"
                        placeholder="Selecciona tu habitación"
                        options={rooms.map((r) => ({ value: r.id, label: `Habitación ${r.number}` }))}
                      />
                    </div>
                  )}

                  {items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-dim">Tu pedido está vacío.</p>
                  ) : (
                    <ul className="divide-y divide-line border-t border-line">
                      {items.map((it) => (
                        <li key={it.productId} className="flex gap-3 py-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-cream">{it.name}</p>
                            <p className="tnum mt-1 text-xs text-dim">{formatCLP(it.price)} c/u</p>
                            <button
                              type="button"
                              onClick={() => remove(it.productId)}
                              className="mt-2 text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
                            >
                              Quitar
                            </button>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <span className="tnum text-sm text-gold">
                              {formatCLP(it.price * it.quantity)}
                            </span>
                            <div className="flex items-center gap-1 rounded-full border border-line px-1">
                              <button
                                type="button"
                                onClick={() => setQty(it.productId, it.quantity - 1)}
                                aria-label="Quitar una unidad"
                                className="flex size-7 items-center justify-center text-base leading-none text-muted transition-colors hover:text-gold"
                              >
                                −
                              </button>
                              <span className="tnum w-5 text-center text-sm text-cream">
                                {it.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  add({ productId: it.productId, name: it.name, price: it.price })
                                }
                                aria-label="Agregar una unidad"
                                className="flex size-7 items-center justify-center text-base leading-none text-muted transition-colors hover:text-gold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {view === "preview" && (
                <>
                  <p className="text-sm text-muted">
                    Esto es lo que le llega al encargado de recepción:
                  </p>
                  <div className="mt-3 rounded-sm border border-line bg-surface/60 p-4">
                    <p className="kicker text-gold">Nuevo pedido · Room service</p>
                    <p className="mt-2 text-sm text-cream">
                      {roomLabel} · {name}
                    </p>
                    <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm text-muted">
                      {items.map((it) => (
                        <li key={it.productId} className="flex justify-between gap-3">
                          <span>
                            <span className="tnum text-cream">{it.quantity}×</span> {it.name}
                          </span>
                          <span className="tnum shrink-0">{formatCLP(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-baseline justify-between border-t border-line pt-2">
                      <span className="kicker text-dim">Total</span>
                      <span className="tnum text-gold">{formatCLP(total)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-dim">
                    Recepción lo verá en su tablero de room service y lo preparará para llevarlo a tu
                    habitación.
                  </p>
                </>
              )}

              {view === "done" && sent && (
                <div>
                  <div className="text-center">
                    <p className="font-display text-2xl text-gold">Pedido enviado</p>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                      Llegó a recepción. Lo preparan y lo llevan a tu habitación.
                    </p>
                  </div>
                  <p className="mt-6 text-sm text-muted">Esto recibió recepción:</p>
                  <div className="mt-3 rounded-sm border border-line bg-surface/60 p-4">
                    <p className="kicker text-gold">Nuevo pedido · Room service</p>
                    <p className="mt-2 text-sm text-cream">
                      {sent.roomLabel} · {sent.name}
                    </p>
                    <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm text-muted">
                      {sent.items.map((it) => (
                        <li key={it.name} className="flex justify-between gap-3">
                          <span>
                            <span className="tnum text-cream">{it.quantity}×</span> {it.name}
                          </span>
                          <span className="tnum shrink-0">{formatCLP(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-baseline justify-between border-t border-line pt-2">
                      <span className="kicker text-dim">Total</span>
                      <span className="tnum text-gold">{formatCLP(sent.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-line px-6 py-5">
              {view === "order" && (
                <>
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="kicker text-dim">Total</span>
                    <span className="tnum font-display text-xl text-gold">{formatCLP(total)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setView("preview")}
                    disabled={!canSend}
                  >
                    {effectiveRoomId === "" ? "Elige tu habitación" : "Enviar pedido"}
                  </Button>
                </>
              )}

              {view === "preview" && (
                <>
                  <Button className="w-full" size="sm" onClick={confirmSend}>
                    Confirmar y enviar
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("order")}
                    className="mt-3 w-full text-center text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
                  >
                    Volver
                  </button>
                </>
              )}

              {view === "done" && (
                <Button className="w-full" size="sm" variant="secondary" onClick={closeAll}>
                  Seguir en la carta
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
