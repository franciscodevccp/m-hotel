"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { formatCLP, formatDateTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import type { Product, Purchase, PurchaseItem } from "@/types";

const cellClass =
  "tnum h-11 rounded-sm border border-line bg-surface text-center text-sm text-cream focus:border-gold/60 focus-visible:outline-none";
const textField =
  "min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

/** Da formato de RUT chileno en vivo. */
function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${clean.slice(-1)}`;
}

export default function ComprasPage() {
  const {
    products,
    purchases,
    providers,
    productCategories,
    addPurchase,
    addProvider,
    addProduct,
    addProductCategory,
  } = useAppStore();
  const { user } = useSession();
  const allowed = !user || user.role === "admin" || user.role === "encargado";
  const actor = user ? { name: user.name, role: user.role } : undefined;

  const sellable = useMemo(
    () => [...products].filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );
  const nameById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  const [provider, setProvider] = useState(providers[0]?.name ?? "");
  const [warehouseId, setWarehouseId] = useState("central");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [detail, setDetail] = useState<Purchase | null>(null);

  // Alta de proveedor (modal)
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [npvName, setNpvName] = useState("");
  const [npvRut, setNpvRut] = useState("");

  // Alta de producto (modal)
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [npName, setNpName] = useState("");
  const [npCategory, setNpCategory] = useState(productCategories[0] ?? "Alimentación");
  const [npPrice, setNpPrice] = useState(0);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const total = items.reduce((s, it) => s + it.quantity * it.unitCost, 0);
  const valid = items.length > 0 && items.every((it) => it.quantity > 0 && it.unitCost > 0);
  const selectedProviderRut = providers.find((p) => p.name === provider)?.rut;
  const detailRut = detail ? providers.find((p) => p.name === detail.provider)?.rut : undefined;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Inventario</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Ingreso de stock</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Esta sección es del encargado de inventario y de administración.
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

  function addRow(productId?: string) {
    setItems([...items, { productId: productId ?? sellable[0]?.id ?? "", quantity: 1, unitCost: 0 }]);
  }

  function saveProvider() {
    const name = npvName.trim();
    if (!name) return;
    addProvider({ id: makeId("pv"), name, rut: npvRut.trim() });
    setProvider(name);
    setNpvName("");
    setNpvRut("");
    setShowNewProvider(false);
  }

  function saveCategory() {
    const clean = newCategory.trim();
    if (!clean) return;
    addProductCategory(clean);
    setNpCategory(clean);
    setNewCategory("");
    setAddingCategory(false);
  }

  function saveNewProduct() {
    const name = npName.trim();
    if (!name || npPrice <= 0) return;
    const isSexshop = npCategory.toLowerCase() === "sexshop";
    const product: Product = {
      id: makeId("p"),
      sku: makeId("nv").toUpperCase(),
      name,
      category: isSexshop ? "sexshop" : "carta",
      group: npCategory,
      price: npPrice,
      stock: 0,
      lowStockThreshold: 5,
      channels: isSexshop ? ["online", "presencial"] : ["room_service"],
      ageRestricted: isSexshop,
      image: null,
      active: true,
    };
    addProduct(product, actor);
    addRow(product.id); // ya agrega la fila para cargar cantidad y costo
    setNpName("");
    setNpCategory(productCategories[0] ?? "Alimentación");
    setNpPrice(0);
    setShowNewProduct(false);
  }

  function submit() {
    if (!valid) return;
    const purchase: Purchase = {
      id: makeId("pc"),
      provider,
      items,
      total,
      at: new Date().toISOString(),
      user: user?.name ?? "Encargado",
      warehouseId,
      branchId: "limache",
    };
    addPurchase(purchase, actor);
    setItems([]);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <span className="kicker text-gold">Inventario</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Ingreso de stock</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Registra la lista de compra al proveedor. Al guardar, el stock de cada ítem sube y queda
          el movimiento de ingreso.
        </p>
      </div>

      <section className="border border-line bg-surface/40 p-6">
        {/* Proveedor (con alta de proveedor nuevo) */}
        <div className="max-w-sm">
          <div className="flex items-center justify-between">
            <label className="kicker text-dim">Proveedor</label>
            <button
              type="button"
              onClick={() => setShowNewProvider(true)}
              className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
            >
              + Nuevo proveedor
            </button>
          </div>
          <Select
            value={provider}
            onValueChange={setProvider}
            ariaLabel="Proveedor"
            options={providers.map((p) => ({ value: p.name, label: p.name }))}
          />
          {selectedProviderRut && <p className="mt-2 text-xs text-dim">RUT {selectedProviderRut}</p>}
        </div>

        {/* Bodega de destino: las compras entran a central (bajo llave) por defecto */}
        <div className="mt-5 max-w-sm">
          <label className="kicker text-dim">Bodega de destino</label>
          <Select
            value={warehouseId}
            onValueChange={setWarehouseId}
            ariaLabel="Bodega de destino"
            options={[
              { value: "central", label: "Bodega central (bajo llave)" },
              { value: "recepcion", label: "Bodega de recepción" },
            ]}
          />
        </div>

        {/* Lista de compra */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="kicker text-dim">Lista de compra</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowNewProduct(true)}
                className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
              >
                + Producto nuevo
              </button>
              <button
                type="button"
                onClick={() => addRow()}
                className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
              >
                + Agregar ítem
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {items.length === 0 && (
              <p className="border border-line bg-surface/60 px-4 py-6 text-center text-xs text-dim">
                Agrega los ítems de la compra: producto, cantidad y costo unitario.
              </p>
            )}
            {items.length > 0 && (
              <div className="hidden gap-2 px-1 sm:grid sm:grid-cols-[1fr_72px_130px_44px]">
                <span className="kicker text-dim">Ítem</span>
                <span className="kicker text-center text-dim">Cant.</span>
                <span className="kicker text-right text-dim">Costo unitario</span>
                <span />
              </div>
            )}
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_44px] gap-2 sm:grid-cols-[1fr_72px_130px_44px]">
                <Select
                  value={item.productId}
                  onValueChange={(v) => {
                    const next = [...items];
                    next[i] = { ...next[i], productId: v };
                    setItems(next);
                  }}
                  ariaLabel="Producto"
                  className="mt-0"
                  options={sellable.map((p) => ({ value: p.id, label: p.name }))}
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
                  aria-label="Cantidad"
                  className={`${cellClass} order-3 w-full sm:order-none`}
                />
                <MoneyInput
                  value={item.unitCost}
                  onValueChange={(v) => {
                    const next = [...items];
                    next[i] = { ...next[i], unitCost: v };
                    setItems(next);
                  }}
                  placeholder="Costo"
                  className={`${cellClass} order-4 w-full px-3 text-right sm:order-none`}
                />
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}
                  aria-label="Quitar ítem"
                  className="size-11 shrink-0 border border-line text-dim transition-colors hover:border-busy/60 hover:text-busy"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <span className="kicker text-dim">Monto total</span>
          <span className="tnum font-display text-2xl text-gold">{formatCLP(total)}</span>
        </div>

        <Button className="mt-5 w-full sm:w-auto" onClick={submit} disabled={!valid}>
          Registrar ingreso
        </Button>
      </section>

      {/* Historial de ingresos */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-cream">Últimos ingresos</h2>
        {purchases.length === 0 ? (
          <p className="mt-4 text-sm text-dim">Aún no hay ingresos registrados.</p>
        ) : (
          <div className="mt-4 border border-line bg-surface/40">
            <ul>
              {purchases.map((p) => (
                <li key={p.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setDetail(p)}
                    className="block w-full px-5 py-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm text-cream">{p.provider}</p>
                      <span className="tnum text-sm text-gold">{formatCLP(p.total)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {p.items
                        .map((it) => `${it.quantity}× ${nameById.get(it.productId) ?? "Producto"}`)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-dim">
                      {formatDateTime(new Date(p.at))}
                      {p.user ? ` · ${p.user}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {showNewProduct && (
        <Modal title="Producto nuevo" subtitle="Inventario" onClose={() => setShowNewProduct(false)}>
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="np-name">
                Nombre
              </label>
              <input
                id="np-name"
                value={npName}
                onChange={(e) => setNpName(e.target.value)}
                placeholder="Nombre del producto"
                autoFocus
                className={`${textField} mt-2`}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="kicker text-dim" htmlFor="np-cat">
                  Categoría
                </label>
                {!addingCategory && (
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
                  >
                    + Nueva categoría
                  </button>
                )}
              </div>
              {addingCategory ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveCategory()}
                    placeholder="Nombre de la categoría"
                    autoFocus
                    className={`${textField} flex-1`}
                  />
                  <Button size="sm" onClick={saveCategory} disabled={!newCategory.trim()}>
                    Agregar
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategory("");
                    }}
                    className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <Select
                  id="np-cat"
                  value={npCategory}
                  onValueChange={setNpCategory}
                  options={productCategories.map((c) => ({ value: c, label: c }))}
                />
              )}
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="np-price">
                Precio de venta
              </label>
              <MoneyInput
                id="np-price"
                value={npPrice}
                onValueChange={setNpPrice}
                placeholder="Precio al público"
                className={`${textField} mt-2`}
              />
            </div>
            <p className="text-xs leading-relaxed text-dim">
              Se crea con stock 0; la cantidad de esta compra lo deja con stock.
            </p>
            <Button className="w-full" onClick={saveNewProduct} disabled={!npName.trim() || npPrice <= 0}>
              Crear y agregar al ingreso
            </Button>
          </div>
        </Modal>
      )}

      {showNewProvider && (
        <Modal title="Nuevo proveedor" subtitle="Inventario" onClose={() => setShowNewProvider(false)}>
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="npv-name">
                Nombre
              </label>
              <input
                id="npv-name"
                value={npvName}
                onChange={(e) => setNpvName(e.target.value)}
                placeholder="Razón social o nombre"
                autoFocus
                className={`${textField} mt-2`}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="npv-rut">
                RUT
              </label>
              <input
                id="npv-rut"
                value={npvRut}
                onChange={(e) => setNpvRut(formatRut(e.target.value))}
                placeholder="76.123.456-7"
                maxLength={12}
                className={`${textField} mt-2`}
              />
            </div>
            <Button
              className="w-full"
              onClick={saveProvider}
              disabled={!npvName.trim() || !npvRut.trim()}
            >
              Guardar proveedor
            </Button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title={detail.provider} subtitle="Ingreso de stock" onClose={() => setDetail(null)}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="kicker text-dim">Proveedor</p>
                <p className="mt-1 text-sm text-cream">{detail.provider}</p>
                {detailRut && <p className="text-xs text-dim">RUT {detailRut}</p>}
              </div>
              <div className="text-right">
                <p className="kicker text-dim">Fecha</p>
                <p className="mt-1 text-sm text-cream">{formatDateTime(new Date(detail.at))}</p>
                {detail.user && <p className="text-xs text-dim">{detail.user}</p>}
              </div>
            </div>

            <div>
              <p className="kicker text-dim">Ítems</p>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {detail.items.map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 text-muted">
                      <span className="tnum text-cream">{it.quantity}×</span>{" "}
                      {nameById.get(it.productId) ?? "Producto"}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="tnum text-xs text-dim">{formatCLP(it.unitCost)} c/u</span>
                      <span className="tnum ml-2 text-cream">
                        {formatCLP(it.unitCost * it.quantity)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="kicker text-dim">Monto total</span>
              <span className="tnum font-display text-xl text-gold">{formatCLP(detail.total)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
