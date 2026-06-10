"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import type { Package } from "@/types";

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function emptyPackage(): Package {
  return { id: makeId("pack"), name: "", description: "", items: [], price: 0, active: true };
}

export default function PaquetesPage() {
  const { packages, products, addPackage, updatePackage, sellPackage } = useAppStore();
  const { user } = useSession();
  const canManage = user?.role === "admin";
  const userLabel = user ? `${user.roleLabel} · ${user.name}` : undefined;
  const actor = user ? { name: user.name, role: user.role } : undefined;

  const [editing, setEditing] = useState<Package | null>(null);
  const [isNew, setIsNew] = useState(false);

  const nameById = new Map(products.map((p) => [p.id, p.name]));
  const priceById = new Map(products.map((p) => [p.id, p.price]));
  // Por ahora los combos se arman solo con productos de la carta (room service).
  const sellable = products.filter((p) => p.category === "carta");
  const sumOf = (pkg: Package) =>
    pkg.items.reduce((s, it) => s + (priceById.get(it.productId) ?? 0) * it.quantity, 0);

  function openNew() {
    setEditing(emptyPackage());
    setIsNew(true);
  }
  function openEdit(pkg: Package) {
    setEditing({ ...pkg, items: pkg.items.map((it) => ({ ...it })) });
    setIsNew(false);
  }
  function save() {
    if (!editing || !editing.name.trim() || editing.items.length === 0 || editing.price <= 0) return;
    if (isNew) addPackage(editing);
    else updatePackage(editing);
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Inventario</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Paquetes</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Combos de productos que se venden como uno solo. Al venderlos baja el stock de cada ítem
            y el monto entra al corte del turno.
          </p>
        </div>
        {canManage && (
          <Button onClick={openNew} className="shrink-0">
            Nuevo paquete
          </Button>
        )}
      </div>

      {packages.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay paquetes creados.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex flex-col border border-line bg-surface/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl text-cream">{pkg.name}</h2>
                {!pkg.active && <span className="kicker text-dim">Inactivo</span>}
              </div>
              {pkg.description && (
                <p className="mt-1 text-sm leading-relaxed text-muted">{pkg.description}</p>
              )}
              <ul className="mt-4 space-y-1 border-t border-line pt-4">
                {pkg.items.map((it) => (
                  <li key={it.productId} className="flex justify-between text-xs text-dim">
                    <span>{nameById.get(it.productId) ?? it.productId}</span>
                    <span className="tnum">×{it.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                <div>
                  <span className="kicker text-dim">Precio combo</span>
                  <p className="tnum font-display text-xl text-gold">{formatCLP(pkg.price)}</p>
                  {sumOf(pkg) > pkg.price && (
                    <p className="tnum text-xs text-dim line-through">{formatCLP(sumOf(pkg))}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openEdit(pkg)}
                      className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => sellPackage(pkg.id, userLabel, actor)}
                    disabled={!pkg.active}
                    className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold disabled:opacity-40"
                  >
                    Vender
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? "Nuevo paquete" : "Editar paquete"}
          subtitle="Combo de productos"
          onClose={() => setEditing(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="pk-name">
                Nombre
              </label>
              <input
                id="pk-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Pack Romántico"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="pk-desc">
                Descripción
              </label>
              <input
                id="pk-desc"
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Qué incluye y para qué"
                className={fieldClass}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="kicker text-dim">Ítems</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      items: [...editing.items, { productId: sellable[0]?.id ?? "", quantity: 1 }],
                    })
                  }
                  className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
                >
                  Agregar ítem
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {editing.items.length === 0 && (
                  <p className="text-xs text-dim">Agrega al menos un producto al combo.</p>
                )}
                {editing.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={item.productId}
                      onValueChange={(v) => {
                        const items = [...editing.items];
                        items[i] = { ...items[i], productId: v };
                        setEditing({ ...editing, items });
                      }}
                      ariaLabel="Producto"
                      className="mt-0 flex-1"
                      options={sellable.map((p) => ({ value: p.id, label: p.name }))}
                    />
                    <input
                      inputMode="numeric"
                      value={String(item.quantity)}
                      onChange={(e) => {
                        const items = [...editing.items];
                        items[i] = {
                          ...items[i],
                          quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1),
                        };
                        setEditing({ ...editing, items });
                      }}
                      className="tnum h-11 w-14 rounded-sm border border-line bg-surface text-center text-sm text-cream focus:border-gold/60 focus-visible:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ ...editing, items: editing.items.filter((_, j) => j !== i) })
                      }
                      aria-label="Quitar ítem"
                      className="size-11 shrink-0 border border-line text-dim transition-colors hover:border-busy/60 hover:text-busy"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="pk-price">
                  Precio combo
                </label>
                <MoneyInput
                  id="pk-price"
                  value={editing.price}
                  onValueChange={(v) => setEditing({ ...editing, price: v })}
                  placeholder="14.000"
                  className={fieldClass}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 self-end pb-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="accent-[var(--gold)]"
                />
                Activo
              </label>
            </div>

            {editing.items.length > 0 && (
              <p className="text-xs text-dim">
                Suma de ítems por separado: {formatCLP(sumOf(editing))}.
              </p>
            )}

            <Button
              className="w-full"
              onClick={save}
              disabled={!editing.name.trim() || editing.items.length === 0 || editing.price <= 0}
            >
              {isNew ? "Crear paquete" : "Guardar cambios"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
