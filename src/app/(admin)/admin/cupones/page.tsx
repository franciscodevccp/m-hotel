"use client";

import { useState } from "react";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { couponLabel } from "@/lib/shop";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Coupon, CouponType } from "@/types";

const TYPE_OPTIONS: { value: CouponType; label: string }[] = [
  { value: "porcentaje", label: "Porcentaje (%)" },
  { value: "monto", label: "Monto fijo (CLP)" },
  { value: "envio_gratis", label: "Envío gratis" },
];

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function emptyCoupon(): Coupon {
  return {
    id: makeId("cp"),
    code: "",
    type: "porcentaje",
    value: 10,
    minPurchase: 0,
    active: true,
    uses: 0,
  };
}

export default function CuponesPage() {
  const { coupons, addCoupon, updateCoupon } = useAppStore();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [isNew, setIsNew] = useState(false);

  const sorted = [...coupons].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.code.localeCompare(b.code),
  );
  const activos = coupons.filter((c) => c.active).length;
  const canjes = coupons.reduce((s, c) => s + c.uses, 0);

  function openNew() {
    setEditing(emptyCoupon());
    setIsNew(true);
  }
  function openEdit(c: Coupon) {
    setEditing({ ...c });
    setIsNew(false);
  }
  function save() {
    if (!editing || !editing.code.trim()) return;
    const clean: Coupon = {
      ...editing,
      code: editing.code.trim().toUpperCase().replace(/\s+/g, ""),
      value: editing.type === "envio_gratis" ? 0 : editing.value,
    };
    if (isNew) addCoupon(clean);
    else updateCoupon(clean);
    setEditing(null);
  }

  return (
    <AdminOnly section="Tienda online">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="kicker text-gold">Tienda online</span>
            <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Cupones</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Códigos de descuento de la tienda online. Actívalos o pásalos a borrador cuando
              quieras.
            </p>
          </div>
          <Button onClick={openNew} className="shrink-0">
            Nuevo cupón
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Cupones" value={coupons.length} />
          <Stat label="Activos" value={activos} />
          <Stat label="Canjes totales" value={canjes} />
        </div>

        {sorted.length === 0 ? (
          <div className="border border-line bg-surface/40 px-6 py-12 text-center">
            <p className="text-sm text-muted">Aún no hay cupones.</p>
          </div>
        ) : (
          <div className="border border-line bg-surface/40">
            <ul>
              {sorted.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm tracking-wide text-cream">{c.code}</span>
                      <span
                        className={cn(
                          "kicker",
                          c.active ? "text-ok" : "text-dim",
                        )}
                      >
                        {c.active ? "Activo" : "Borrador"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {couponLabel(c)}
                      {c.minPurchase > 0 && ` · mínimo ${formatCLP(c.minPurchase)}`}
                    </p>
                    <p className="mt-0.5 text-xs text-dim">{c.uses} canjes</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateCoupon({ ...c, active: !c.active })}
                      className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                    >
                      {c.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      Editar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {editing && (
          <Modal
            title={isNew ? "Nuevo cupón" : "Editar cupón"}
            subtitle="Tienda online"
            onClose={() => setEditing(null)}
          >
            <div className="space-y-4">
              <div>
                <label className="kicker text-dim" htmlFor="cp-code">
                  Código
                </label>
                <input
                  id="cp-code"
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="VERANO15"
                  className={cn(fieldClass, "font-mono tracking-wide")}
                />
              </div>

              <div>
                <label className="kicker text-dim" htmlFor="cp-type">
                  Tipo
                </label>
                <Select
                  id="cp-type"
                  value={editing.type}
                  onValueChange={(v) => setEditing({ ...editing, type: v as CouponType })}
                  options={TYPE_OPTIONS}
                />
              </div>

              {editing.type !== "envio_gratis" && (
                <div>
                  <label className="kicker text-dim" htmlFor="cp-value">
                    {editing.type === "porcentaje" ? "Porcentaje" : "Monto del descuento"}
                  </label>
                  {editing.type === "porcentaje" ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        id="cp-value"
                        inputMode="numeric"
                        value={editing.value > 0 ? String(editing.value) : ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            value: Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0),
                          })
                        }
                        className="tnum h-11 w-24 rounded-sm border border-line bg-surface text-center text-sm text-cream focus:border-gold/60 focus-visible:outline-none"
                      />
                      <span className="text-sm text-muted">%</span>
                    </div>
                  ) : (
                    <MoneyInput
                      id="cp-value"
                      value={editing.value}
                      onValueChange={(v) => setEditing({ ...editing, value: v })}
                      placeholder="5.000"
                      className={fieldClass}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="kicker text-dim" htmlFor="cp-min">
                  Compra mínima (opcional)
                </label>
                <MoneyInput
                  id="cp-min"
                  value={editing.minPurchase}
                  onValueChange={(v) => setEditing({ ...editing, minPurchase: v })}
                  placeholder="Sin mínimo"
                  className={fieldClass}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="size-4 accent-gold"
                />
                <span className="text-sm text-muted">Cupón activo</span>
              </label>

              <Button className="w-full" onClick={save} disabled={!editing.code.trim()}>
                {isNew ? "Crear cupón" : "Guardar cambios"}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </AdminOnly>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className="tnum mt-2 font-display text-2xl text-cream">{value}</p>
    </div>
  );
}
