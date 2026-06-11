"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { DURATIONS, isBlackLine } from "@/lib/pricing";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Category, DayType, Discount, DiscountType, Duration, Promotion } from "@/types";

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function PriceColumn({ label, category, dayType }: { label: string; category: Category; dayType: DayType }) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <span className="kicker text-dim">{label}</span>
      <dl className="mt-3 space-y-2">
        {DURATIONS.map((d) => (
          <div key={d} className="flex items-baseline justify-between">
            <dt className="text-sm text-muted">{d} horas</dt>
            <dd className="tnum text-sm text-cream">{formatCLP(category.pricing[dayType][d])}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-t border-line pt-2">
          <dt className="kicker text-dim">Hora adicional</dt>
          <dd className="tnum text-sm text-gold">{formatCLP(category.pricing.extraHour[dayType])}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="kicker text-dim">Persona adicional</dt>
          <dd className="tnum text-sm text-gold">{formatCLP(category.pricing.extraPerson[dayType])}</dd>
        </div>
      </dl>
    </div>
  );
}

function cloneCat(c: Category): Category {
  return {
    ...c,
    pricing: {
      weekday: { ...c.pricing.weekday },
      weekend: { ...c.pricing.weekend },
      extraHour: { ...c.pricing.extraHour },
      extraPerson: { ...c.pricing.extraPerson },
    },
  };
}

function emptyDiscount(): Discount {
  return { id: makeId("d"), name: "", type: "porcentaje", value: 0, scope: "", active: true };
}
function emptyPromotion(): Promotion {
  return { id: makeId("promo"), name: "", description: "", startsAt: "", endsAt: "", active: true };
}

export default function PreciosPage() {
  const {
    categories,
    discounts,
    promotions,
    addDiscount,
    updateDiscount,
    addPromotion,
    updatePromotion,
    updateCategory,
  } = useAppStore();
  const { user } = useSession();
  const actor = user ? { name: user.name, role: user.role } : undefined;

  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const [newDiscount, setNewDiscount] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [newPromo, setNewPromo] = useState(false);

  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Precios</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          La edición de precios, descuentos y promociones es exclusiva del perfil de administración.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  function saveDiscount() {
    if (!editDiscount || !editDiscount.name.trim() || editDiscount.value <= 0) return;
    if (newDiscount) addDiscount(editDiscount);
    else updateDiscount(editDiscount);
    setEditDiscount(null);
  }
  function savePromo() {
    if (!editPromo || !editPromo.name.trim()) return;
    if (newPromo) addPromotion(editPromo);
    else updatePromotion(editPromo);
    setEditPromo(null);
  }
  function setPrice(dayType: DayType, duration: Duration, value: number) {
    if (!editCat) return;
    setEditCat({
      ...editCat,
      pricing: {
        ...editCat.pricing,
        [dayType]: { ...editCat.pricing[dayType], [duration]: value },
      },
    });
  }
  function setExtra(kind: "extraHour" | "extraPerson", dayType: DayType, value: number) {
    if (!editCat) return;
    setEditCat({
      ...editCat,
      pricing: {
        ...editCat.pricing,
        [kind]: { ...editCat.pricing[kind], [dayType]: value },
      },
    });
  }
  function saveCat() {
    if (!editCat) return;
    updateCategory(editCat, actor);
    setEditCat(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Precios</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Precios y tarifas</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Tarifas por habitación, descuentos y promociones. Edítalas aquí: son la misma fuente que
          usa la reserva online.
        </p>
      </div>

      {/* Tarifas por habitación */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="border border-line bg-surface/40 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl text-cream sm:text-2xl">{category.name}</h2>
                <p className="mt-1 text-sm text-muted">{category.tagline}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Badge tone={isBlackLine(category.id) ? "black" : "default"}>{category.area} m²</Badge>
                <button
                  type="button"
                  onClick={() => setEditCat(cloneCat(category))}
                  className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                >
                  Editar precios
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <PriceColumn label="Entre semana · Lun a Jue" category={category} dayType="weekday" />
              <PriceColumn label="Finde y festivos · Vie a Dom" category={category} dayType="weekend" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-dim">
        Festivos y vísperas de festivo (desde las 14:00) se cobran con tarifa de fin de semana.
      </p>

      {/* Descuentos */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl text-cream">Descuentos</h2>
        <Button
          variant="secondary"
          onClick={() => {
            setEditDiscount(emptyDiscount());
            setNewDiscount(true);
          }}
        >
          Nuevo descuento
        </Button>
      </div>
      <div className="mt-4 border border-line bg-surface/40">
        {discounts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-dim">No hay descuentos configurados.</p>
        ) : (
          <ul>
            {discounts.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-cream">{d.name}</span>
                    <span className="tnum kicker text-gold">
                      {d.type === "porcentaje" ? `${d.value}%` : formatCLP(d.value)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-dim">{d.scope}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <button
                    type="button"
                    onClick={() => updateDiscount({ ...d, active: !d.active })}
                    className={cn("kicker transition-colors", d.active ? "text-ok" : "text-dim")}
                  >
                    {d.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditDiscount({ ...d });
                      setNewDiscount(false);
                    }}
                    className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                  >
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Promociones */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl text-cream">Promociones</h2>
        <Button
          variant="secondary"
          onClick={() => {
            setEditPromo(emptyPromotion());
            setNewPromo(true);
          }}
        >
          Nueva promoción
        </Button>
      </div>
      <div className="mt-4 border border-line bg-surface/40">
        {promotions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-dim">No hay promociones configuradas.</p>
        ) : (
          <ul>
            {promotions.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <span className="text-sm text-cream">{p.name}</span>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                  <p className="mt-1 text-xs text-dim">
                    {p.startsAt || "—"} a {p.endsAt || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <button
                    type="button"
                    onClick={() => updatePromotion({ ...p, active: !p.active })}
                    className={cn("kicker transition-colors", p.active ? "text-ok" : "text-dim")}
                  >
                    {p.active ? "Activa" : "Inactiva"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPromo({ ...p });
                      setNewPromo(false);
                    }}
                    className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                  >
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-dim">
        Los precios de productos se editan en{" "}
        <Link href="/admin/inventario" className="text-gold transition-colors hover:text-gold-soft">
          Inventario
        </Link>{" "}
        y los combos en{" "}
        <Link href="/admin/paquetes" className="text-gold transition-colors hover:text-gold-soft">
          Paquetes
        </Link>
        .
      </p>

      {/* Modal precios por habitación */}
      {editCat && (
        <Modal
          title={`Precios — ${editCat.name}`}
          subtitle="Tarifas por habitación"
          onClose={() => setEditCat(null)}
        >
          <div className="space-y-5">
            {(["weekday", "weekend"] as DayType[]).map((dt) => (
              <div key={dt}>
                <p className="kicker text-dim">
                  {dt === "weekday" ? "Entre semana · Lun a Jue" : "Finde y festivos · Vie a Dom"}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {DURATIONS.map((d) => (
                    <div key={d}>
                      <label className="kicker text-dim">{d} h</label>
                      <MoneyInput
                        value={editCat.pricing[dt][d]}
                        onValueChange={(v) => setPrice(dt, d, v)}
                        className={fieldClass}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="kicker text-dim">Hora adicional</label>
                    <MoneyInput
                      value={editCat.pricing.extraHour[dt]}
                      onValueChange={(v) => setExtra("extraHour", dt, v)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="kicker text-dim">Persona adicional</label>
                    <MoneyInput
                      value={editCat.pricing.extraPerson[dt]}
                      onValueChange={(v) => setExtra("extraPerson", dt, v)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button className="w-full" onClick={saveCat}>
              Guardar precios
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal descuento */}
      {editDiscount && (
        <Modal
          title={newDiscount ? "Nuevo descuento" : "Editar descuento"}
          subtitle="Regla de precio"
          onClose={() => setEditDiscount(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="d-name">
                Nombre
              </label>
              <input
                id="d-name"
                value={editDiscount.name}
                onChange={(e) => setEditDiscount({ ...editDiscount, name: e.target.value })}
                placeholder="Descuento entre semana"
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="d-type">
                  Tipo
                </label>
                <Select
                  id="d-type"
                  value={editDiscount.type}
                  onValueChange={(v) => setEditDiscount({ ...editDiscount, type: v as DiscountType })}
                  options={[
                    { value: "porcentaje", label: "Porcentaje (%)" },
                    { value: "monto", label: "Monto fijo (CLP)" },
                  ]}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="d-value">
                  Valor
                </label>
                {editDiscount.type === "monto" ? (
                  <MoneyInput
                    id="d-value"
                    value={editDiscount.value}
                    onValueChange={(v) => setEditDiscount({ ...editDiscount, value: v })}
                    placeholder="5.000"
                    className={fieldClass}
                  />
                ) : (
                  <input
                    id="d-value"
                    inputMode="numeric"
                    value={editDiscount.value ? String(editDiscount.value) : ""}
                    onChange={(e) =>
                      setEditDiscount({
                        ...editDiscount,
                        value: Number(e.target.value.replace(/\D/g, "")),
                      })
                    }
                    placeholder="10"
                    className={fieldClass}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="d-scope">
                Aplica a
              </label>
              <input
                id="d-scope"
                value={editDiscount.scope}
                onChange={(e) => setEditDiscount({ ...editDiscount, scope: e.target.value })}
                placeholder="Bloques de lunes a jueves"
                className={fieldClass}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={editDiscount.active}
                onChange={(e) => setEditDiscount({ ...editDiscount, active: e.target.checked })}
                className="accent-[var(--gold)]"
              />
              Activo
            </label>
            <Button
              className="w-full"
              onClick={saveDiscount}
              disabled={!editDiscount.name.trim() || editDiscount.value <= 0}
            >
              {newDiscount ? "Crear descuento" : "Guardar cambios"}
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal promoción */}
      {editPromo && (
        <Modal
          title={newPromo ? "Nueva promoción" : "Editar promoción"}
          subtitle="Campaña"
          onClose={() => setEditPromo(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="p-name">
                Nombre
              </label>
              <input
                id="p-name"
                value={editPromo.name}
                onChange={(e) => setEditPromo({ ...editPromo, name: e.target.value })}
                placeholder="Noche BLACK"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="p-desc">
                Descripción
              </label>
              <input
                id="p-desc"
                value={editPromo.description}
                onChange={(e) => setEditPromo({ ...editPromo, description: e.target.value })}
                placeholder="En qué consiste la promoción"
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="p-start">
                  Desde
                </label>
                <input
                  id="p-start"
                  type="date"
                  value={editPromo.startsAt}
                  onChange={(e) => setEditPromo({ ...editPromo, startsAt: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="p-end">
                  Hasta
                </label>
                <input
                  id="p-end"
                  type="date"
                  value={editPromo.endsAt}
                  onChange={(e) => setEditPromo({ ...editPromo, endsAt: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={editPromo.active}
                onChange={(e) => setEditPromo({ ...editPromo, active: e.target.checked })}
                className="accent-[var(--gold)]"
              />
              Activa
            </label>
            <Button className="w-full" onClick={savePromo} disabled={!editPromo.name.trim()}>
              {newPromo ? "Crear promoción" : "Guardar cambios"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
