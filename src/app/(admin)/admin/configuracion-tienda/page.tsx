"use client";

import { useState } from "react";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-surface/40 p-6">
      <h2 className="font-display text-xl text-cream">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-gold"
      />
      <span>
        <span className="block text-sm text-cream">{label}</span>
        {hint && <span className="block text-xs text-dim">{hint}</span>}
      </span>
    </label>
  );
}

export default function ConfiguracionTiendaPage() {
  const { shopSettings, updateShopSettings } = useAppStore();
  const [newComuna, setNewComuna] = useState("");
  const [newEmail, setNewEmail] = useState("");

  function addComuna() {
    const c = newComuna.trim();
    if (!c || shopSettings.shippingComunas.includes(c)) return;
    updateShopSettings({ shippingComunas: [...shopSettings.shippingComunas, c] });
    setNewComuna("");
  }
  function removeComuna(c: string) {
    updateShopSettings({
      shippingComunas: shopSettings.shippingComunas.filter((x) => x !== c),
    });
  }
  function addEmail() {
    const e = newEmail.trim();
    if (!e || shopSettings.notificationEmails.includes(e)) return;
    updateShopSettings({ notificationEmails: [...shopSettings.notificationEmails, e] });
    setNewEmail("");
  }
  function removeEmail(e: string) {
    updateShopSettings({
      notificationEmails: shopSettings.notificationEmails.filter((x) => x !== e),
    });
  }

  return (
    <AdminOnly section="Tienda online">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <span className="kicker text-gold">Tienda online</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Configuración</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Ajustes de la tienda online: despacho, medios de pago y avisos. Independiente de la
            configuración del motel.
          </p>
        </div>

        <div className="space-y-6">
          <Section title="Datos de la tienda" description="Cómo se identifica y contacta la tienda.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="kicker text-dim" htmlFor="t-name">
                  Nombre de la tienda
                </label>
                <input
                  id="t-name"
                  value={shopSettings.storeName}
                  onChange={(e) => updateShopSettings({ storeName: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="t-wa">
                  WhatsApp de contacto
                </label>
                <input
                  id="t-wa"
                  value={shopSettings.whatsapp}
                  onChange={(e) => updateShopSettings({ whatsapp: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="kicker text-dim" htmlFor="t-email">
                  Correo de contacto
                </label>
                <input
                  id="t-email"
                  type="email"
                  value={shopSettings.contactEmail}
                  onChange={(e) => updateShopSettings({ contactEmail: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Despacho y retiro"
            description="Costo de envío, envío gratis y comunas con reparto."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="kicker text-dim" htmlFor="t-ship">
                  Costo de despacho
                </label>
                <MoneyInput
                  id="t-ship"
                  value={shopSettings.shippingCost}
                  onValueChange={(v) => updateShopSettings({ shippingCost: v })}
                  placeholder="3.990"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="t-free">
                  Envío gratis sobre
                </label>
                <MoneyInput
                  id="t-free"
                  value={shopSettings.freeShippingThreshold}
                  onValueChange={(v) => updateShopSettings({ freeShippingThreshold: v })}
                  placeholder="Sin envío gratis"
                  className={fieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="kicker text-dim" htmlFor="t-pickup">
                  Dirección de retiro en local
                </label>
                <input
                  id="t-pickup"
                  value={shopSettings.pickupAddress}
                  onChange={(e) => updateShopSettings({ pickupAddress: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="kicker text-dim">Comunas con reparto</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {shopSettings.shippingComunas.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-2 border border-line px-3 py-1.5 text-sm text-cream"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeComuna(c)}
                      aria-label={`Quitar ${c}`}
                      className="text-dim transition-colors hover:text-busy"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={newComuna}
                  onChange={(e) => setNewComuna(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComuna()}
                  placeholder="Agregar comuna"
                  className="min-h-[44px] flex-1 rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
                />
                <Button variant="secondary" onClick={addComuna} disabled={!newComuna.trim()}>
                  Agregar
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Medios de pago" description="Qué medios acepta la tienda online.">
            <div className="space-y-3">
              <Toggle
                label="Webpay"
                hint="Tarjetas de crédito y débito."
                checked={shopSettings.payments.webpay}
                onChange={(v) =>
                  updateShopSettings({ payments: { ...shopSettings.payments, webpay: v } })
                }
              />
              <Toggle
                label="Transferencia"
                hint="Pago por transferencia bancaria."
                checked={shopSettings.payments.transferencia}
                onChange={(v) =>
                  updateShopSettings({ payments: { ...shopSettings.payments, transferencia: v } })
                }
              />
              <Toggle
                label="Efectivo"
                hint="Contra entrega o al retirar en local."
                checked={shopSettings.payments.efectivo}
                onChange={(v) =>
                  updateShopSettings({ payments: { ...shopSettings.payments, efectivo: v } })
                }
              />
            </div>
          </Section>

          <Section title="Contenido y disponibilidad" description="Cómo se ve la tienda de cara al público.">
            <div className="space-y-3">
              <Toggle
                label="Tienda online activa"
                hint="Si la apagas, la tienda queda en mantención y no recibe pedidos."
                checked={shopSettings.storeOnline}
                onChange={(v) => updateShopSettings({ storeOnline: v })}
              />
              <Toggle
                label="Mostrar aviso +18"
                hint="Verificación de edad al entrar al sexshop."
                checked={shopSettings.ageNotice}
                onChange={(v) => updateShopSettings({ ageNotice: v })}
              />
            </div>
          </Section>

          <Section
            title="Avisos de pedidos"
            description="Correos que reciben aviso de cada pedido (envío simulado)."
          >
            <ul className="space-y-2">
              {shopSettings.notificationEmails.map((email) => (
                <li key={email} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
                  >
                    Quitar
                  </button>
                </li>
              ))}
              {shopSettings.notificationEmails.length === 0 && (
                <li className="text-sm text-dim">Sin correos configurados.</li>
              )}
            </ul>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmail()}
                placeholder="pedidos@mmotel.cl"
                className={cn(
                  "min-h-[44px] flex-1 rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs",
                )}
              />
              <Button variant="secondary" onClick={addEmail} disabled={!newEmail.trim()}>
                Agregar
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </AdminOnly>
  );
}
