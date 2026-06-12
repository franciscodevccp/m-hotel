"use client";

import { useEffect, useMemo, useState } from "react";
import { StockBadge, stockLevel } from "@/components/admin/StockBadge";
import { StockReportButton } from "@/components/admin/StockReportButton";
import { Button } from "@/components/ui/Button";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { PRODUCT_SALES_30D } from "@/data/history";
import { warehouseName } from "@/data/warehouses";
import { centralOf, lowMovement, totalOf } from "@/lib/inventory";
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
  Transfer,
} from "@/types";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  sexshop: "Sexshop",
  carta: "Carta / room service",
  bebestible: "Bebestible",
  snack: "Snack",
  amenidad: "Amenidad",
  insumo: "Insumos",
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

type SortKey = "name" | "price" | "stock" | "central";
type SortDir = "asc" | "desc";

/** Encabezado de columna ordenable: click alterna menor→mayor / mayor→menor. */
function SortHeader({
  label,
  active,
  dir,
  align = "left",
  withBorder = true,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  align?: "left" | "right" | "center";
  withBorder?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Ordenar por ${label.toLowerCase()}`}
      className={cn(
        "kicker flex items-baseline gap-1.5 self-stretch pt-0.5 transition-colors",
        withBorder && "border-l border-line px-4",
        align === "right" && "justify-end text-right",
        align === "center" && "justify-center text-center",
        active ? "text-gold" : "text-dim hover:text-muted",
      )}
    >
      {label}
      <span className={cn("text-[0.6rem]", !active && "opacity-0")} aria-hidden>
        {dir === "asc" ? "↑" : "↓"}
      </span>
    </button>
  );
}

function emptyProduct(family: ProductCategory): Product {
  const isShop = family === "sexshop";
  const isSupply = family === "insumo";
  return {
    id: makeId("p"),
    sku: "",
    name: "",
    category: family,
    price: 0,
    stock: 0,
    centralStock: 0,
    lowStockThreshold: isSupply ? 8 : 10,
    channels: isShop ? ["online", "presencial"] : isSupply ? [] : ["room_service"],
    ageRestricted: isShop,
    image: null,
    description: "",
    active: true,
  };
}

export default function InventarioPage() {
  const { products, movements, transfers, addProduct, updateProduct, adjustStock } = useAppStore();
  const { user, area } = useSession();
  const canManage = user?.role === "admin";
  const actor = user ? { name: user.name, role: user.role } : undefined;
  // Motel = carta o insumos (toggle); Tienda online = sexshop.
  const [motelFamily, setMotelFamily] = useState<"carta" | "insumo">("carta");
  const family: ProductCategory = area === "tienda" ? "sexshop" : motelFamily;
  const isSupplies = family === "insumo";

  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [showMovements, setShowMovements] = useState(false);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [onlyLowMovement, setOnlyLowMovement] = useState(false);
  // Orden con tres estados por columna: ascendente → descendente → predeterminado
  // (null = alfabético por nombre, sin columna destacada).
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(0);
  }

  // El inventario muestra solo la familia del área activa.
  const familyProducts = useMemo(
    () => products.filter((p) => p.category === family),
    [products, family],
  );
  const groupOptions = useMemo(() => {
    const seen: string[] = [];
    for (const p of familyProducts) if (p.group && !seen.includes(p.group)) seen.push(p.group);
    return seen;
  }, [familyProducts]);
  // Los insumos viven en bodega central: su nivel de stock se evalúa sobre el
  // saldo total del recinto, no solo sobre lo que hay a mano en recepción.
  const levelProduct = (p: Product): Product =>
    p.category === "insumo" ? { ...p, stock: totalOf(p) } : p;
  const lowCount = familyProducts.filter((p) => stockLevel(levelProduct(p)) !== "ok").length;
  const groupCount = new Set(familyProducts.map((p) => p.group).filter(Boolean)).size;
  const lowMovementIds = useMemo(
    () => new Set(lowMovement(familyProducts).map((p) => p.id)),
    [familyProducts],
  );

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const key = sort?.key ?? "name";
    const dir = sort?.dir ?? "asc";
    const numericValue = (p: Product): number => {
      switch (key) {
        case "price":
          return isSupplies ? (p.cost ?? 0) : p.price;
        case "stock":
          return p.stock;
        default:
          return centralOf(p);
      }
    };
    return familyProducts
      .filter((p) => groupFilter === "all" || p.group === groupFilter)
      .filter((p) => !onlyLowMovement || lowMovementIds.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => {
        const cmp =
          key === "name"
            ? a.name.localeCompare(b.name, "es")
            : numericValue(a) - numericValue(b) || a.name.localeCompare(b.name, "es");
        return dir === "desc" ? -cmp : cmp;
      });
  }, [familyProducts, groupFilter, onlyLowMovement, lowMovementIds, q, sort, isSupplies]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Al cambiar de área o familia, reinicia filtros, orden y página.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset al cambiar de familia
    setGroupFilter("all");
    setOnlyLowMovement(false);
    setSort(null);
    setPage(0);
  }, [family]);

  function openNew() {
    setEditing(emptyProduct(family));
    setIsNew(true);
  }
  function openEdit(product: Product) {
    setEditing({ ...product });
    setIsNew(false);
  }
  function saveProduct() {
    if (!editing || !editing.name.trim() || !editing.sku.trim()) return;
    if (isNew) addProduct(editing, actor);
    else updateProduct(editing, actor);
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="kicker text-gold">Inventario</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Productos y stock</h1>
          <p className="mt-2 text-sm text-muted">
            {area === "tienda"
              ? "Catálogo y stock de la tienda online (sexshop). Comparte inventario con la venta en recepción."
              : isSupplies
                ? "Insumos de aseo, operativos, lavandería, blancos y cortesías del recinto."
                : "Carta de room service y venta en recepción. El sexshop se gestiona en la tienda online."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StockReportButton products={products} initialFamily={family} />
          <Button variant="secondary" onClick={() => setShowMovements(true)}>
            Movimientos
          </Button>
          {canManage && <Button onClick={openNew}>Nuevo producto</Button>}
        </div>
      </div>

      {area !== "tienda" && (
        <SegmentedToggle
          segments={[
            { value: "carta", label: "Carta" },
            { value: "insumo", label: "Insumos" },
          ]}
          value={motelFamily}
          onChange={(v) => setMotelFamily(v)}
          className="mb-6 w-full sm:max-w-xs"
        />
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Productos</p>
          <p className="tnum mt-auto pt-2 font-display text-2xl text-cream">
            {familyProducts.length}
          </p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Stock bajo</p>
          <p
            className={cn(
              "tnum mt-auto pt-2 font-display text-2xl",
              lowCount > 0 ? "text-busy" : "text-cream",
            )}
          >
            {lowCount}
          </p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Sub-categorías</p>
          <p className="tnum mt-auto pt-2 font-display text-2xl text-cream">{groupCount}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOnlyLowMovement((v) => !v);
            setPage(0);
          }}
          disabled={isSupplies}
          className={cn(
            "flex flex-col border p-4 text-left transition-colors disabled:pointer-events-none disabled:opacity-50",
            onlyLowMovement
              ? "border-gold/60 bg-surface-2"
              : "border-line bg-surface/40 hover:border-line-strong",
          )}
        >
          <p className="kicker text-dim">Bajo movimiento (30 d)</p>
          <p className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="tnum font-display text-2xl text-cream">
              {isSupplies ? "—" : lowMovementIds.size}
            </span>
            {!isSupplies && (
              <span className="truncate text-[0.65rem] uppercase tracking-[0.1em] text-dim">
                {onlyLowMovement ? "Filtrando · ver todos" : "Ver solo estos"}
              </span>
            )}
          </p>
        </button>
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
        <div className="hidden grid-cols-[minmax(0,2fr)_96px_124px_84px_132px] border-b border-line px-5 py-3 lg:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,0.7fr)_112px_140px_100px_156px]">
          <SortHeader
            label="Producto"
            active={sort?.key === "name"}
            dir={sort?.dir ?? "asc"}
            withBorder={false}
            onClick={() => toggleSort("name")}
          />
          <span className="kicker hidden self-stretch border-l border-line px-4 pt-0.5 text-dim xl:block">
            Categoría
          </span>
          <SortHeader
            label={isSupplies ? "Costo" : "Precio"}
            active={sort?.key === "price"}
            dir={sort?.dir ?? "asc"}
            align="right"
            onClick={() => toggleSort("price")}
          />
          <SortHeader
            label="Recepción"
            active={sort?.key === "stock"}
            dir={sort?.dir ?? "asc"}
            onClick={() => toggleSort("stock")}
          />
          <SortHeader
            label="Central"
            active={sort?.key === "central"}
            dir={sort?.dir ?? "asc"}
            align="center"
            onClick={() => toggleSort("central")}
          />
          <span className="kicker self-stretch border-l border-line pl-4 pt-0.5 text-right text-dim">
            {canManage ? "Acciones" : ""}
          </span>
        </div>

        <ul>
          {pageItems.length === 0 && (
            <li className="px-5 py-8 text-sm text-dim">Sin resultados.</li>
          )}
          {pageItems.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-1 gap-2 border-b border-line px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(0,2fr)_96px_124px_84px_132px] lg:gap-0 xl:grid-cols-[minmax(0,2fr)_minmax(0,0.7fr)_112px_140px_100px_156px]"
            >
              <div className="flex min-w-0 items-center gap-3 lg:pr-4">
                <ProductThumb product={p} />
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
                    {p.channels.length > 0
                      ? p.channels.map((c) => CHANNEL_LABELS[c]).join(" · ")
                      : "Uso interno"}
                    {!isSupplies && (PRODUCT_SALES_30D[p.id] ?? 0) === 0 && p.active && (
                      <span className="text-dim"> · Sin ventas 30 d</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="hidden min-w-0 xl:flex xl:items-center xl:self-stretch xl:border-l xl:border-line xl:px-4">
                <span className="truncate text-sm text-muted">
                  {CATEGORY_LABELS[p.category]}
                </span>
              </div>

              <span className="tnum text-sm text-cream lg:flex lg:items-center lg:justify-end lg:self-stretch lg:border-l lg:border-line lg:px-4">
                {formatCLP(isSupplies ? (p.cost ?? 0) : p.price)}
              </span>

              <span className="flex items-center gap-2 lg:self-stretch lg:border-l lg:border-line lg:px-4">
                <span className="tnum w-7 shrink-0 text-sm text-cream">{p.stock}</span>
                <StockBadge product={levelProduct(p)} />
              </span>

              <span className="tnum hidden text-sm text-muted lg:flex lg:items-center lg:justify-center lg:self-stretch lg:border-l lg:border-line lg:px-4">
                {centralOf(p)}
              </span>

              {canManage ? (
                <span className="flex gap-4 lg:items-center lg:justify-end lg:self-stretch lg:border-l lg:border-line lg:gap-3 lg:pl-4">
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
                <span className="hidden lg:block lg:self-stretch lg:border-l lg:border-line" />
              )}
            </li>
          ))}
        </ul>
      </div>

      {onlyLowMovement && (
        <p className="mt-3 text-xs leading-relaxed text-dim">
          Bajo movimiento con datos de ejemplo — en operación real se calcula con las ventas
          registradas de los últimos 30 días.
        </p>
      )}

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
                  options={[{ value: family, label: CATEGORY_LABELS[family] }]}
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
              disabled={
                !editing.name.trim() ||
                !editing.sku.trim() ||
                (editing.category !== "insumo" && editing.price <= 0)
              }
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
            adjustStock(
              adjusting.id,
              delta,
              user ? `${user.roleLabel} · ${user.name}` : undefined,
              actor,
            );
            setAdjusting(null);
          }}
        />
      )}

      {showMovements && (
        <MovementsModal
          movements={movements}
          products={products}
          transfers={transfers}
          family={family}
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
  traspaso: "Traspaso entre bodegas",
};

function MovementsModal({
  movements,
  products,
  transfers,
  family,
  onClose,
}: {
  movements: InventoryMovement[];
  products: Product[];
  transfers: Transfer[];
  family: ProductCategory;
  onClose: () => void;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const transferById = new Map(transfers.map((t) => [t.id, t]));
  // Solo los movimientos de la familia del área activa (carta o sexshop).
  const recent = [...movements]
    .filter((m) => byId.get(m.productId)?.category === family)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50);

  function movementLabel(m: InventoryMovement): string {
    if (m.type === "traspaso" && m.refId) {
      const t = transferById.get(m.refId);
      if (t) return `Traspaso ${warehouseName(t.from)} → ${warehouseName(t.to)}`;
    }
    return MOVEMENT_LABELS[m.type];
  }

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
                  {movementLabel(m)} · {formatDateTime(new Date(m.at))}
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
