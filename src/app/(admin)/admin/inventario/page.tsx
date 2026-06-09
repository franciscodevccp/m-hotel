"use client";

import { useMemo, useState } from "react";
import { StockBadge, stockLevel } from "@/components/admin/StockBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { formatCLP, formatDateTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  InventoryMovement,
  MovementType,
  Product,
  ProductCategory,
  SalesChannel,
} from "@/types";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  sexshop: "Sexshop",
  carta: "Carta / room service",
  bebestible: "Bebestible",
  snack: "Snack",
  amenidad: "Amenidad",
  otro: "Otro",
};

const CHANNEL_LABELS: Record<SalesChannel, string> = {
  presencial: "Recepción",
  online: "Tienda online",
  room_service: "Room service",
};

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

const PAGE_SIZE = 15;

function emptyProduct(): Product {
  return {
    id: makeId("p"),
    sku: "",
    name: "",
    category: "carta",
    price: 0,
    stock: 0,
    lowStockThreshold: 10,
    channels: ["room_service"],
    ageRestricted: false,
    image: null,
    description: "",
    active: true,
  };
}

export default function InventarioPage() {
  const { products, movements, addProduct, updateProduct, adjustStock } = useAppStore();
  const { user } = useSession();
  const canManage = user?.role === "admin";

  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [showMovements, setShowMovements] = useState(false);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  // Por ahora el inventario muestra solo la carta (room service); el resto se habilita luego.
  const cartaAll = useMemo(() => products.filter((p) => p.category === "carta"), [products]);
  const groupOptions = useMemo(() => {
    const seen: string[] = [];
    for (const p of cartaAll) if (p.group && !seen.includes(p.group)) seen.push(p.group);
    return seen;
  }, [cartaAll]);
  const lowCount = cartaAll.filter((p) => stockLevel(p) !== "ok").length;
  const groupCount = new Set(cartaAll.map((p) => p.group).filter(Boolean)).size;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      cartaAll
        .filter((p) => groupFilter === "all" || p.group === groupFilter)
        .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [cartaAll, groupFilter, q],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function openNew() {
    setEditing(emptyProduct());
    setIsNew(true);
  }
  function openEdit(product: Product) {
    setEditing({ ...product });
    setIsNew(false);
  }
  function saveProduct() {
    if (!editing || !editing.name.trim() || !editing.sku.trim()) return;
    if (isNew) addProduct(editing);
    else updateProduct(editing);
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Inventario</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Productos y stock</h1>
          <p className="mt-2 text-sm text-muted">
            Carta de room service. El resto del inventario (sexshop y minibar) se habilita más
            adelante.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button variant="secondary" onClick={() => setShowMovements(true)}>
            Movimientos
          </Button>
          {canManage && <Button onClick={openNew}>Nuevo producto</Button>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Productos</p>
          <p className="tnum mt-2 font-display text-2xl text-cream">{cartaAll.length}</p>
        </div>
        <div className="border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Stock bajo</p>
          <p
            className={cn(
              "tnum mt-2 font-display text-2xl",
              lowCount > 0 ? "text-busy" : "text-cream",
            )}
          >
            {lowCount}
          </p>
        </div>
        <div className="col-span-2 border border-line bg-surface/40 p-4 sm:col-span-1">
          <p className="kicker text-dim">Sub-categorías</p>
          <p className="tnum mt-2 font-display text-2xl text-cream">{groupCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Buscar producto"
          className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
        />
        <Select
          value={groupFilter}
          onValueChange={(v) => {
            setGroupFilter(v);
            setPage(0);
          }}
          ariaLabel="Categoría"
          className="mt-0 sm:max-w-xs"
          options={[
            { value: "all", label: "Todas las categorías" },
            ...groupOptions.map((g) => ({ value: g, label: g })),
          ]}
        />
      </div>

      <div className="border border-line bg-surface/40">
        <div className="hidden grid-cols-[minmax(0,1.9fr)_0.9fr_96px_140px_auto] gap-4 border-b border-line px-5 py-3 sm:grid">
          <span className="kicker text-dim">Producto</span>
          <span className="kicker text-dim">Categoría</span>
          <span className="kicker text-dim text-right">Precio</span>
          <span className="kicker text-dim">Stock</span>
          <span className="kicker text-dim justify-self-end">{canManage ? "Acciones" : ""}</span>
        </div>

        <ul>
          {pageItems.length === 0 && (
            <li className="px-5 py-8 text-sm text-dim">Sin resultados.</li>
          )}
          {pageItems.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-1 gap-2 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.9fr)_0.9fr_96px_140px_auto] sm:items-center sm:gap-4"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm text-cream">
                  <span className="truncate">{p.name}</span>
                  {p.ageRestricted && (
                    <span className="shrink-0 rounded-xs border border-wine/60 px-1.5 py-px text-[0.625rem] font-medium tracking-[0.06em] text-wine-soft">
                      +18
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-dim">
                  {p.group ? `${p.group} · ` : ""}
                  {p.channels.map((c) => CHANNEL_LABELS[c]).join(" · ")}
                </p>
              </div>

              <span className="text-sm text-muted">{CATEGORY_LABELS[p.category]}</span>

              <span className="tnum text-sm text-cream sm:text-right">{formatCLP(p.price)}</span>

              <span className="flex items-center gap-2.5">
                <span className="tnum w-6 text-right text-sm text-cream">{p.stock}</span>
                <StockBadge product={p} />
              </span>

              {canManage ? (
                <span className="flex gap-4 sm:justify-self-end">
                  <button
                    type="button"
                    onClick={() => setAdjusting(p)}
                    className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                  >
                    Ajustar
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                  >
                    Editar
                  </button>
                </span>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold disabled:pointer-events-none disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="kicker text-dim">
            Página {safePage + 1} de {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
            className="border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold disabled:pointer-events-none disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? "Nuevo producto" : "Editar producto"}
          subtitle="Inventario"
          onClose={() => setEditing(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="p-name">
                Nombre
              </label>
              <input
                id="p-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Coca-Cola 350cc"
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="p-sku">
                  SKU
                </label>
                <input
                  id="p-sku"
                  value={editing.sku}
                  onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                  placeholder="7801610001017"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="p-cat">
                  Categoría
                </label>
                <Select
                  id="p-cat"
                  value={editing.category}
                  onValueChange={(v) => setEditing({ ...editing, category: v as ProductCategory })}
                  options={[{ value: "carta", label: CATEGORY_LABELS.carta }]}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="p-price">
                  Precio
                </label>
                <MoneyInput
                  id="p-price"
                  value={editing.price}
                  onValueChange={(v) => setEditing({ ...editing, price: v })}
                  placeholder="2.000"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="p-stock">
                  Stock
                </label>
                <input
                  id="p-stock"
                  inputMode="numeric"
                  value={String(editing.stock)}
                  onChange={(e) =>
                    setEditing({ ...editing, stock: Number(e.target.value.replace(/\D/g, "")) })
                  }
                  placeholder="0"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="p-thr">
                  Umbral
                </label>
                <input
                  id="p-thr"
                  inputMode="numeric"
                  value={String(editing.lowStockThreshold)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      lowStockThreshold: Number(e.target.value.replace(/\D/g, "")),
                    })
                  }
                  placeholder="10"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <span className="kicker text-dim">Canales de venta</span>
              <div className="mt-2 flex gap-2">
                {(["presencial", "online", "room_service"] as SalesChannel[]).map((ch) => {
                  const on = editing.channels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          channels: on
                            ? editing.channels.filter((c) => c !== ch)
                            : [...editing.channels, ch],
                        })
                      }
                      className={cn(
                        "flex-1 border px-3 py-2.5 text-xs transition-colors",
                        on
                          ? "border-gold/70 text-gold"
                          : "border-line text-muted hover:border-line-strong hover:text-cream",
                      )}
                    >
                      {CHANNEL_LABELS[ch]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-5 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={editing.ageRestricted}
                  onChange={(e) => setEditing({ ...editing, ageRestricted: e.target.checked })}
                  className="accent-[var(--gold)]"
                />
                Solo +18
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="accent-[var(--gold)]"
                />
                Activo
              </label>
            </div>

            <Button
              className="w-full"
              onClick={saveProduct}
              disabled={!editing.name.trim() || !editing.sku.trim() || editing.price <= 0}
            >
              {isNew ? "Crear producto" : "Guardar cambios"}
            </Button>
          </div>
        </Modal>
      )}

      {adjusting && (
        <AdjustModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onApply={(delta) => {
            adjustStock(adjusting.id, delta, user ? `${user.roleLabel} · ${user.name}` : undefined);
            setAdjusting(null);
          }}
        />
      )}

      {showMovements && (
        <MovementsModal
          movements={movements}
          products={products}
          onClose={() => setShowMovements(false)}
        />
      )}
    </div>
  );
}

const MOVEMENT_LABELS: Record<MovementType, string> = {
  ingreso: "Ingreso",
  venta_presencial: "Venta recepción",
  venta_online: "Venta online",
  ajuste: "Ajuste",
};

function MovementsModal({
  movements,
  products,
  onClose,
}: {
  movements: InventoryMovement[];
  products: Product[];
  onClose: () => void;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  // Por ahora solo se muestran los movimientos de la carta (room service).
  const recent = [...movements]
    .filter((m) => byId.get(m.productId)?.category === "carta")
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50);

  return (
    <Modal title="Movimientos de inventario" subtitle="Historial del stock" onClose={onClose}>
      {recent.length === 0 ? (
        <p className="text-sm text-dim">Aún no hay movimientos registrados.</p>
      ) : (
        <ul className="-mr-2 max-h-[60vh] divide-y divide-line overflow-y-auto pr-2">
          {recent.map((m) => (
            <li key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-2 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-cream">
                  {byId.get(m.productId)?.name ?? m.productId}
                </p>
                <p className="text-xs text-dim">
                  {MOVEMENT_LABELS[m.type]} · {formatDateTime(new Date(m.at))}
                  {m.user ? ` · ${m.user}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "tnum text-sm",
                  m.quantity > 0 ? "text-ok" : "text-busy",
                )}
              >
                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function AdjustModal({
  product,
  onClose,
  onApply,
}: {
  product: Product;
  onClose: () => void;
  onApply: (delta: number) => void;
}) {
  const [delta, setDelta] = useState(0);
  const next = Math.max(0, product.stock + delta);

  return (
    <Modal title="Ajustar stock" subtitle={product.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-baseline justify-between">
          <span className="kicker text-dim">Stock actual</span>
          <span className="tnum text-sm text-cream">{product.stock}</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setDelta((d) => d - 1)}
            className="size-11 border border-line text-lg text-cream transition-colors hover:border-gold/70"
          >
            −
          </button>
          <input
            inputMode="numeric"
            value={String(delta)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d-]/g, "");
              setDelta(Number(raw) || 0);
            }}
            className="tnum h-11 w-24 rounded-sm border border-line bg-surface text-center text-sm text-cream focus:border-gold/60 focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => setDelta((d) => d + 1)}
            className="size-11 border border-line text-lg text-cream transition-colors hover:border-gold/70"
          >
            +
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDelta((d) => d + n)}
              className="border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/70 hover:text-gold"
            >
              +{n}
            </button>
          ))}
        </div>

        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="kicker text-dim">Stock resultante</span>
          <span className="tnum text-sm text-gold">{next}</span>
        </div>

        <Button className="w-full" onClick={() => onApply(delta)} disabled={delta === 0}>
          Aplicar ajuste
        </Button>
      </div>
    </Modal>
  );
}
