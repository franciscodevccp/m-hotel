"use client";

import { useMemo, useState } from "react";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCLP } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface GroupStat {
  name: string;
  productos: number;
  activos: number;
  stock: number;
  bajoStock: number;
  valor: number; // valor de inventario a precio de venta
}

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

export default function CategoriasPage() {
  const { products, updateProduct } = useAppStore();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const groups = useMemo<GroupStat[]>(() => {
    const map = new Map<string, GroupStat>();
    for (const p of products) {
      if (p.category !== "sexshop") continue;
      const name = p.group ?? "Sin categoría";
      const g =
        map.get(name) ?? { name, productos: 0, activos: 0, stock: 0, bajoStock: 0, valor: 0 };
      g.productos += 1;
      if (p.active) g.activos += 1;
      g.stock += p.stock;
      if (p.stock <= p.lowStockThreshold) g.bajoStock += 1;
      g.valor += p.price * p.stock;
      map.set(name, g);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  function openRename(name: string) {
    setRenaming(name);
    setNewName(name);
  }

  function saveRename() {
    const from = renaming;
    const to = newName.trim();
    if (!from || !to || to === from) {
      setRenaming(null);
      return;
    }
    for (const p of products) {
      if (p.category === "sexshop" && (p.group ?? "Sin categoría") === from) {
        updateProduct({ ...p, group: to });
      }
    }
    setRenaming(null);
  }

  return (
    <AdminOnly section="Tienda online">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <span className="kicker text-gold">Tienda online</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Categorías</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Las sub-categorías con que se ordena el catálogo del sexshop. Renombrar una actualiza
            todos sus productos.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Categorías" value={String(groups.length)} />
          <Stat
            label="Productos"
            value={String(groups.reduce((s, g) => s + g.productos, 0))}
          />
          <Stat
            label="Valor inventario"
            value={formatCLP(groups.reduce((s, g) => s + g.valor, 0))}
          />
        </div>

        {groups.length === 0 ? (
          <div className="border border-line bg-surface/40 px-6 py-12 text-center">
            <p className="text-sm text-muted">No hay categorías en el catálogo del sexshop.</p>
          </div>
        ) : (
          <div className="border border-line bg-surface/40">
            <ul>
              {groups.map((g) => (
                <li
                  key={g.name}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-cream">{g.name}</span>
                      {g.bajoStock > 0 && (
                        <span className="kicker text-busy">{g.bajoStock} con stock bajo</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-dim">
                      {g.productos} productos · {g.activos} activos · {g.stock} unidades en stock
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="tnum text-sm text-muted">{formatCLP(g.valor)}</span>
                    <button
                      type="button"
                      onClick={() => openRename(g.name)}
                      className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      Renombrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {renaming && (
          <Modal title="Renombrar categoría" subtitle={renaming} onClose={() => setRenaming(null)}>
            <div className="space-y-4">
              <div>
                <label className="kicker text-dim" htmlFor="cat-name">
                  Nuevo nombre
                </label>
                <input
                  id="cat-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={fieldClass}
                  autoFocus
                />
                <p className="mt-2 text-xs text-dim">
                  Se actualizarán todos los productos de esta categoría.
                </p>
              </div>
              <Button
                className={cn("w-full")}
                onClick={saveRename}
                disabled={!newName.trim() || newName.trim() === renaming}
              >
                Guardar
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </AdminOnly>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className="tnum mt-2 font-display text-2xl text-cream">{value}</p>
    </div>
  );
}
