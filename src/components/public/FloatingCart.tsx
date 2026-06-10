"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { findActiveStay } from "@/lib/booking";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { formatRut } from "@/lib/rut";
import { useAppStore } from "@/lib/store";
import type { ShopFulfillment, ShopOrder, ShopPaymentMethod } from "@/types";

type View = "cart" | "method" | "checkout" | "identify" | "done" | "rejected";

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

const methodCard =
  "group flex w-full flex-col border border-line bg-surface/40 p-4 text-left transition-colors hover:border-gold/70 hover:bg-surface-2";

export function FloatingCart() {
  const pathname = usePathname();
  const { items, count, subtotal, hydrated, setQty, add, remove, clear } = useCart();
  const { shopSettings, shopOrders, rooms, reservations, addShopOrder } = useAppStore();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("cart");
  const [lastFolio, setLastFolio] = useState(0);
  const [lastRoomLabel, setLastRoomLabel] = useState<string | null>(null);

  // Datos del checkout (despacho / retiro)
  const [name, setName] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<ShopFulfillment>("despacho");
  const [address, setAddress] = useState("");
  const [comuna, setComuna] = useState(shopSettings.shippingComunas[0] ?? "");
  // Datos del pedido a la habitación
  const [roomNumber, setRoomNumber] = useState("");

  const paymentOptions = [
    shopSettings.payments.webpay ? { value: "webpay", label: "Webpay" } : null,
    shopSettings.payments.transferencia ? { value: "transferencia", label: "Transferencia" } : null,
    shopSettings.payments.efectivo ? { value: "efectivo", label: "Efectivo" } : null,
  ].filter(Boolean) as { value: ShopPaymentMethod; label: string }[];
  const [payment, setPayment] = useState<ShopPaymentMethod>(paymentOptions[0]?.value ?? "webpay");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const freeShipping =
    shopSettings.freeShippingThreshold > 0 && subtotal >= shopSettings.freeShippingThreshold;
  const shipping = fulfillment === "despacho" ? (freeShipping ? 0 : shopSettings.shippingCost) : 0;
  const total = subtotal + shipping;

  const validCheckout =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    paymentOptions.length > 0 &&
    (fulfillment !== "despacho" || (address.trim() !== "" && comuna !== ""));
  const canIdentify = rut.trim() !== "" && roomNumber.trim() !== "";

  const showFab = hydrated && (count > 0 || pathname.startsWith("/sexshop"));

  function resetAll() {
    setName("");
    setRut("");
    setEmail("");
    setPhone("");
    setFulfillment("despacho");
    setAddress("");
    setComuna(shopSettings.shippingComunas[0] ?? "");
    setRoomNumber("");
    setPayment(paymentOptions[0]?.value ?? "webpay");
    setLastRoomLabel(null);
  }

  function placeOrder() {
    if (!validCheckout || items.length === 0) return;
    const folio = shopOrders.reduce((m, o) => Math.max(m, o.folio), 1040) + 1;
    const order: ShopOrder = {
      id: makeId("so"),
      folio,
      customerName: name.trim(),
      customerRut: rut.trim() || undefined,
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      fulfillment,
      address: fulfillment === "despacho" ? address.trim() : undefined,
      comuna: fulfillment === "despacho" ? comuna : undefined,
      payment,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      subtotal,
      shipping,
      discount: 0,
      total,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };
    addShopOrder(order);
    setLastFolio(folio);
    setLastRoomLabel(null);
    clear();
    setView("done");
  }

  function placeRoomOrder() {
    if (!canIdentify || items.length === 0) return;
    const match = findActiveStay(rooms, reservations, rut, roomNumber);
    if (!match) {
      setView("rejected");
      return;
    }
    const folio = shopOrders.reduce((m, o) => Math.max(m, o.folio), 1040) + 1;
    const order: ShopOrder = {
      id: makeId("so"),
      folio,
      customerName: match.reservation.guestName,
      customerRut: rut.trim() || undefined,
      customerEmail: match.reservation.guestEmail ?? "",
      customerPhone: match.reservation.guestPhone ?? "",
      fulfillment: "habitacion",
      address: `Habitación ${match.room.number}`,
      payment: "efectivo",
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      subtotal,
      shipping: 0,
      discount: 0,
      total: subtotal,
      status: "preparando",
      createdAt: new Date().toISOString(),
    };
    addShopOrder(order);
    setLastFolio(folio);
    setLastRoomLabel(`Habitación ${match.room.number}`);
    clear();
    setView("done");
  }

  function closeAll() {
    setOpen(false);
    setView("cart");
    resetAll();
  }

  if (!showFab) return null;

  const title =
    view === "cart"
      ? "Tu carro"
      : view === "method"
        ? "Finalizar compra"
        : view === "checkout"
          ? "Despacho o retiro"
          : view === "identify"
            ? "A tu habitación"
            : view === "rejected"
              ? "Sin reserva activa"
              : "Pedido recibido";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setView("cart");
          setOpen(true);
        }}
        aria-label={`Abrir carro (${count})`}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-gold text-bg shadow-lg shadow-black/40 transition-colors hover:bg-gold-soft"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-6">
          <path d="M6 7h12l-1 12.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 7Z" strokeLinejoin="round" />
          <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
        </svg>
        {count > 0 && (
          <span className="tnum absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-bg bg-wine px-1 text-[0.65rem] font-semibold text-cream">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Carro de compra">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={closeAll} aria-hidden />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line-strong bg-surface-2">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <span className="kicker text-gold">Sexshop · M</span>
                <h2 className="mt-1 font-display text-2xl text-cream">{title}</h2>
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
              {view === "cart" && (
                <>
                  {items.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-sm text-muted">Tu carro está vacío.</p>
                      <p className="mt-1 text-xs text-dim">Agrega productos del catálogo.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
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
                                  add({
                                    productId: it.productId,
                                    name: it.name,
                                    price: it.price,
                                    ageRestricted: it.ageRestricted,
                                  })
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

              {view === "method" && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted">¿Cómo quieres recibir tu compra?</p>
                  <button type="button" onClick={() => setView("checkout")} className={methodCard}>
                    <span className="text-sm text-cream">Despacho o retiro</span>
                    <span className="mt-1 text-xs text-muted">
                      Te lo enviamos a domicilio o lo retiras en recepción.
                    </span>
                  </button>
                  <button type="button" onClick={() => setView("identify")} className={methodCard}>
                    <span className="text-sm text-cream">A mi habitación</span>
                    <span className="mt-1 text-xs text-muted">
                      ¿Tienes una reserva activa? Lo llevamos a tu pieza con solo tu RUT y habitación.
                    </span>
                  </button>
                </div>
              )}

              {view === "checkout" && (
                <div className="space-y-4">
                  <div>
                    <label className="kicker text-dim" htmlFor="ck-name">
                      Nombre
                    </label>
                    <input
                      id="ck-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre y apellido"
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="kicker text-dim" htmlFor="ck-rut">
                        RUT (opcional)
                      </label>
                      <input
                        id="ck-rut"
                        value={rut}
                        onChange={(e) => setRut(formatRut(e.target.value))}
                        placeholder="12.345.678-9"
                        maxLength={12}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="kicker text-dim" htmlFor="ck-phone">
                        Teléfono
                      </label>
                      <input
                        id="ck-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+56 9 ..."
                        className={fieldClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="kicker text-dim" htmlFor="ck-email">
                      Correo
                    </label>
                    <input
                      id="ck-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.cl"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="kicker text-dim">Entrega</label>
                    <Select
                      value={fulfillment}
                      onValueChange={(v) => setFulfillment(v as ShopFulfillment)}
                      ariaLabel="Forma de entrega"
                      options={[
                        { value: "despacho", label: "Despacho a domicilio" },
                        { value: "retiro", label: "Retiro en recepción" },
                      ]}
                    />
                  </div>
                  {fulfillment === "despacho" && (
                    <>
                      <div>
                        <label className="kicker text-dim" htmlFor="ck-address">
                          Dirección
                        </label>
                        <input
                          id="ck-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Calle, número, depto"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className="kicker text-dim">Comuna</label>
                        <Select
                          value={comuna}
                          onValueChange={setComuna}
                          ariaLabel="Comuna"
                          options={shopSettings.shippingComunas.map((c) => ({ value: c, label: c }))}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="kicker text-dim">Medio de pago</label>
                    <Select
                      value={payment}
                      onValueChange={(v) => setPayment(v as ShopPaymentMethod)}
                      ariaLabel="Medio de pago"
                      options={paymentOptions}
                    />
                  </div>
                </div>
              )}

              {view === "identify" && (
                <>
                  <p className="text-sm leading-relaxed text-muted">
                    Validamos tu reserva activa para llevarlo a tu habitación. Ingresa tu RUT y
                    número de habitación.
                  </p>
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="kicker text-dim" htmlFor="sx-rut">
                        RUT
                      </label>
                      <input
                        id="sx-rut"
                        value={rut}
                        onChange={(e) => setRut(formatRut(e.target.value))}
                        placeholder="12.345.678-9"
                        maxLength={12}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="kicker text-dim" htmlFor="sx-room">
                        Número de habitación
                      </label>
                      <input
                        id="sx-room"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        placeholder="Ej. 304"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </>
              )}

              {view === "done" && (
                <div className="py-10 text-center">
                  <p className="font-display text-3xl text-gold">#{lastFolio}</p>
                  <p className="mt-3 text-sm text-cream">Recibimos tu pedido.</p>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted">
                    {lastRoomLabel
                      ? `Lo preparamos y lo llevamos a tu ${lastRoomLabel.toLowerCase()}. Empaque neutro, sin marcas a la vista.`
                      : "Te contactaremos a tu correo para confirmar el pago y coordinar la entrega. Empaque neutro, sin marcas a la vista."}
                  </p>
                </div>
              )}

              {view === "rejected" && (
                <div className="py-10 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-busy/50 text-busy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-6">
                      <path d="M12 8v5" strokeLinecap="round" />
                      <path d="M12 16.5h.01" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </span>
                  <p className="mt-4 font-display text-2xl text-cream">No tienes una reserva activa</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                    No encontramos una reserva activa con ese RUT y habitación. Puedes pedir despacho
                    o retiro, o acercarte a recepción.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-line px-6 py-5">
              {view === "cart" && items.length > 0 && (
                <>
                  <div className="mb-3 flex items-baseline justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="tnum text-cream">{formatCLP(subtotal)}</span>
                  </div>
                  <Button className="w-full" size="sm" onClick={() => setView("method")}>
                    Finalizar compra · {formatCLP(subtotal)}
                  </Button>
                </>
              )}

              {view === "method" && (
                <button
                  type="button"
                  onClick={() => setView("cart")}
                  className="w-full text-center text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
                >
                  Volver al carro
                </button>
              )}

              {view === "checkout" && (
                <>
                  <div className="mb-3 flex items-baseline justify-between border-t border-line pt-3">
                    <span className="kicker text-dim">Total</span>
                    <span className="tnum font-display text-xl text-gold">{formatCLP(total)}</span>
                  </div>
                  {!shopSettings.storeOnline && (
                    <p className="mb-3 text-xs text-busy">La tienda está en mantención por ahora.</p>
                  )}
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={placeOrder}
                    disabled={!validCheckout || !shopSettings.storeOnline}
                  >
                    Realizar pedido
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("method")}
                    className="mt-3 w-full text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
                  >
                    Volver
                  </button>
                </>
              )}

              {view === "identify" && (
                <>
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="kicker text-dim">Total</span>
                    <span className="tnum font-display text-xl text-gold">{formatCLP(subtotal)}</span>
                  </div>
                  <Button className="w-full" size="sm" onClick={placeRoomOrder} disabled={!canIdentify}>
                    Enviar a mi habitación
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("method")}
                    className="mt-3 w-full text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
                  >
                    Volver
                  </button>
                </>
              )}

              {view === "done" && (
                <Button className="w-full" size="sm" variant="secondary" onClick={closeAll}>
                  Seguir comprando
                </Button>
              )}

              {view === "rejected" && (
                <>
                  <Button className="w-full" size="sm" onClick={() => setView("identify")}>
                    Revisar datos
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("checkout")}
                    className="mt-3 w-full text-center text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
                  >
                    Prefiero despacho o retiro
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
