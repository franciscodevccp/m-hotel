"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useAppStore } from "@/lib/store";
import type { ShopFulfillment, ShopOrder, ShopPaymentMethod } from "@/types";

type View = "cart" | "checkout" | "done";

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

export function FloatingCart() {
  const pathname = usePathname();
  const { items, count, subtotal, hydrated, setQty, add, remove, clear } = useCart();
  const { shopSettings, shopOrders, addShopOrder } = useAppStore();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("cart");
  const [lastFolio, setLastFolio] = useState(0);

  // Datos del checkout
  const [name, setName] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<ShopFulfillment>("despacho");
  const [address, setAddress] = useState("");
  const [comuna, setComuna] = useState(shopSettings.shippingComunas[0] ?? "");
  const paymentOptions = (
    [
      shopSettings.payments.webpay ? { value: "webpay", label: "Webpay" } : null,
      shopSettings.payments.transferencia ? { value: "transferencia", label: "Transferencia" } : null,
      shopSettings.payments.efectivo ? { value: "efectivo", label: "Efectivo" } : null,
    ].filter(Boolean) as { value: ShopPaymentMethod; label: string }[]
  );
  const [payment, setPayment] = useState<ShopPaymentMethod>(paymentOptions[0]?.value ?? "webpay");

  // Cerrar con Escape.
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
  const shipping = fulfillment === "retiro" ? 0 : freeShipping ? 0 : shopSettings.shippingCost;
  const total = subtotal + shipping;

  const validCheckout =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    paymentOptions.length > 0 &&
    (fulfillment === "retiro" || (address.trim() !== "" && comuna !== ""));

  const showFab = hydrated && (count > 0 || pathname.startsWith("/sexshop"));

  function resetCheckout() {
    setName("");
    setRut("");
    setEmail("");
    setPhone("");
    setFulfillment("despacho");
    setAddress("");
    setComuna(shopSettings.shippingComunas[0] ?? "");
    setPayment(paymentOptions[0]?.value ?? "webpay");
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
    clear();
    setView("done");
  }

  function closeAll() {
    setOpen(false);
    setView("cart");
    resetCheckout();
  }

  if (!showFab) return null;

  return (
    <>
      {/* Botón flotante */}
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
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <span className="kicker text-gold">Sexshop · M</span>
                <h2 className="mt-1 font-display text-2xl text-cream">
                  {view === "cart" ? "Tu carro" : view === "checkout" ? "Finalizar compra" : "Pedido recibido"}
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

            {/* Body */}
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
                        onChange={(e) => setRut(e.target.value)}
                        placeholder="12.345.678-9"
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
                        { value: "retiro", label: "Retiro en local" },
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

              {view === "done" && (
                <div className="py-10 text-center">
                  <p className="font-display text-3xl text-gold">#{lastFolio}</p>
                  <p className="mt-3 text-sm text-cream">Recibimos tu pedido.</p>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted">
                    Te contactaremos a tu correo para confirmar el pago y coordinar la entrega.
                    Empaque neutro, sin marcas a la vista.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-line px-6 py-5">
              {view === "cart" && items.length > 0 && (
                <>
                  <div className="mb-3 space-y-1 text-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted">Subtotal</span>
                      <span className="tnum text-cream">{formatCLP(subtotal)}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted">Despacho</span>
                      <span className="tnum text-cream">
                        {shipping > 0 ? formatCLP(shipping) : "Gratis"}
                      </span>
                    </div>
                    {!freeShipping && shopSettings.freeShippingThreshold > 0 && (
                      <p className="text-xs text-dim">
                        Envío gratis sobre {formatCLP(shopSettings.freeShippingThreshold)}.
                      </p>
                    )}
                  </div>
                  <Button className="w-full" size="sm" onClick={() => setView("checkout")}>
                    Finalizar compra · {formatCLP(total)}
                  </Button>
                </>
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
                    onClick={() => setView("cart")}
                    className="mt-3 w-full text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
                  >
                    Volver al carro
                  </button>
                </>
              )}

              {view === "done" && (
                <Button className="w-full" size="sm" variant="secondary" onClick={closeAll}>
                  Seguir comprando
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
