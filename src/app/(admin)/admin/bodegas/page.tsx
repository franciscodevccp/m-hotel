"use client";

import { useMemo, useState } from "react";
import { StockDot, stockLevelFor } from "@/components/admin/StockBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { Select } from "@/components/ui/Select";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { nextGuideFolio } from "@/data/transfers";
import { WAREHOUSES, warehouseName } from "@/data/warehouses";
import { centralOf, laundryOf, stockOf, totalOf } from "@/lib/inventory";
import { formatDateTime, formatTime } from "@/lib/format";
import { guiaHtml, printTicket, solicitudHtml } from "@/lib/printTicket";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Product, StockCount, Transfer, TransferItem, TransferStatus } from "@/types";

type Tab = "saldos" | "traspasos" | "conteos";

const STATUS_LABEL: Record<TransferStatus, string> = {
  solicitado: "Solicitado",
  parcial: "Entrega parcial",
  entregado: "Entregado",
  recibido: "Recibido",
  rechazado: "Rechazado",
};

const STATUS_CLASS: Record<TransferStatus, string> = {
  solicitado: "text-clean",
  parcial: "text-busy",
  entregado: "text-gold",
  recibido: "text-ok",
  rechazado: "text-dim",
};

const STATUS_ORDER: Record<TransferStatus, number> = {
  solicitado: 0,
  parcial: 1,
  entregado: 2,
  recibido: 3,
  rechazado: 4,
};

/** Unidades pendientes de una línea (solicitado − entregado, si ya se entregó). */
function pendingOf(item: TransferItem): number {
  return item.delivered == null ? 0 : Math.max(0, item.quantity - item.delivered);
}

const FAMILY_FILTERS = [
  { value: "all", label: "Todas las familias" },
  { value: "carta", label: "Carta / room service" },
  { value: "sexshop", label: "Sexshop" },
  { value: "insumo", label: "Insumos" },
];

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

const PAGE_SIZE = 15;

function itemsSummary(items: TransferItem[], nameById: Map<string, string>): string {
  return items
    .map((it) => {
      const name = nameById.get(it.productId) ?? it.productId;
      const pending = pendingOf(it);
      return pending > 0
        ? `${it.delivered}/${it.quantity}× ${name} (pend. ${pending})`
        : `${it.quantity}× ${name}`;
    })
    .join(" · ");
}

export default function BodegasPage() {
  const {
    products,
    transfers,
    stockCounts,
    requestTransfer,
    createDirectTransfer,
    deliverTransfer,
    receiveTransfer,
    rejectTransfer,
    startStockCount,
    setCountLine,
    closeStockCount,
  } = useAppStore();
  const { user } = useSession();
  const actor = user ? { name: user.name, role: user.role } : undefined;
  const userLabel = user
    ? user.name === user.roleLabel
      ? user.name
      : `${user.roleLabel} · ${user.name}`
    : "Recepción";
  const canDeliver = user?.role === "admin" || user?.role === "encargado";
  const canRequest = user?.role === "recepcion" || user?.role === "admin";

  const [tab, setTab] = useState<Tab>("saldos");
  const [query, setQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [printMsg, setPrintMsg] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<"solicitud" | "directo" | null>(null);
  const [prefillId, setPrefillId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Transfer | null>(null);
  const [delivering, setDelivering] = useState<Transfer | null>(null);
  const [rejecting, setRejecting] = useState<Transfer | null>(null);
  const [newCountOpen, setNewCountOpen] = useState(false);
  const [activeCountId, setActiveCountId] = useState<string | null>(null);
  const [countDetail, setCountDetail] = useState<StockCount | null>(null);

  const nameById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  // --- Stats ---
  const pending = transfers.filter((t) => t.status === "solicitado").length;
  const toConfirm = transfers.filter(
    (t) => t.status === "entregado" || t.status === "parcial",
  ).length;
  // Saldos que quedaron pendientes en entregas parciales (stock insuficiente).
  const pendingUnits = transfers
    .filter((t) => t.status !== "rechazado")
    .flatMap((t) => t.items)
    .reduce((s, it) => s + pendingOf(it), 0);
  // Semáforo: productos en rojo (crítico) o gris (sin stock) mirando el saldo
  // total del recinto. La señal accionable para comprar o reponer.
  const critical = products.filter(
    (p) => p.active && ["critical", "out"].includes(stockLevelFor(totalOf(p), p.lowStockThreshold)),
  ).length;

  // --- Sugerencias de reposición (stock insuficiente o pendientes de guía) ---
  const suggestions = useMemo(() => {
    const byProduct = new Map<string, { product: Product; pending: number; reasons: string[] }>();
    for (const t of transfers) {
      if (t.status === "rechazado") continue;
      for (const it of t.items) {
        const pend = pendingOf(it);
        if (pend <= 0) continue;
        const product = products.find((p) => p.id === it.productId);
        if (!product) continue;
        const entry = byProduct.get(product.id) ?? { product, pending: 0, reasons: [] };
        entry.pending += pend;
        entry.reasons.push(`pendiente ${pend} un. (guía ${t.folio ?? t.id})`);
        byProduct.set(product.id, entry);
      }
    }
    for (const p of products) {
      if (!p.active) continue;
      const level = stockLevelFor(totalOf(p), p.lowStockThreshold);
      if (level !== "critical" && level !== "out") continue;
      const entry = byProduct.get(p.id) ?? { product: p, pending: 0, reasons: [] };
      entry.reasons.push(level === "out" ? "sin stock en el recinto" : "stock crítico");
      byProduct.set(p.id, entry);
    }
    return [...byProduct.values()].sort((a, b) => b.pending - a.pending).slice(0, 6);
  }, [transfers, products]);

  // --- Tab saldos ---
  const q = query.trim().toLowerCase();
  const balances = useMemo(
    () =>
      products
        .filter((p) => p.active)
        .filter((p) => familyFilter === "all" || p.category === familyFilter)
        .filter(
          (p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
        )
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [products, familyFilter, q],
  );
  const pageCount = Math.max(1, Math.ceil(balances.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = balances.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // --- Tab traspasos ---
  const sortedTransfers = useMemo(
    () =>
      [...transfers].sort((a, b) => {
        if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [transfers],
  );

  // --- Tab conteos ---
  const activeCount = activeCountId
    ? stockCounts.find((c) => c.id === activeCountId && c.status === "abierto")
    : undefined;
  const closedCounts = stockCounts.filter((c) => c.status === "cerrado");

  function openRequest(productId?: string) {
    setPrefillId(productId ?? null);
    setTransferModal(canDeliver ? "directo" : "solicitud");
  }

  const POPUP_BLOCKED =
    "El navegador bloqueó la ventana de impresión. Permite ventanas emergentes y vuelve a intentarlo.";

  /**
   * Vale de solicitud impreso: el papel que el bodeguero lleva a la bodega
   * central para preparar el pedido (allá no hay computador).
   */
  function printSolicitud(t: Pick<Transfer, "id" | "from" | "to" | "items" | "requestedBy" | "createdAt" | "note">) {
    const ok = printTicket(
      solicitudHtml({
        id: `Solicitud ${t.id}`,
        from: warehouseName(t.from),
        to: warehouseName(t.to),
        at: formatDateTime(new Date(t.createdAt)),
        requestedBy: t.requestedBy,
        lines: t.items.map((it) => ({
          name: nameById.get(it.productId) ?? it.productId,
          requested: it.quantity,
        })),
        note: t.note,
      }),
      `Solicitud de reposición ${t.id}`,
    );
    setPrintMsg(ok ? null : POPUP_BLOCKED);
  }

  /** Guía de despacho impresa (folio asignado al entregar). */
  function printGuia(t: Transfer, folioOverride?: number) {
    const ok = printTicket(
      guiaHtml({
        folio: folioOverride ?? t.folio ?? 0,
        from: warehouseName(t.from),
        to: warehouseName(t.to),
        at: formatDateTime(new Date(t.deliveredAt ?? t.createdAt)),
        requestedBy: t.requestedBy,
        deliveredBy: t.deliveredBy ?? userLabel,
        receivedBy: t.receivedBy,
        lines: t.items.map((it) => ({
          name: nameById.get(it.productId) ?? it.productId,
          requested: it.quantity,
          delivered: it.delivered ?? it.quantity,
        })),
        note: t.note,
      }),
      `Guía de despacho ${folioOverride ?? t.folio ?? t.id}`,
    );
    setPrintMsg(ok ? null : POPUP_BLOCKED);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Inventario</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Bodegas y traspasos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Saldos de las tres bodegas y traspasos con guía interna de despacho: queda
            registro de quién solicita, quién entrega, quién recibe y los saldos al día.
          </p>
        </div>
        <div className="shrink-0">
          {canDeliver ? (
            <Button onClick={() => setTransferModal("directo")}>Nuevo traspaso</Button>
          ) : canRequest ? (
            <Button onClick={() => setTransferModal("solicitud")}>Solicitar reposición</Button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Solicitudes pendientes</p>
          <p
            className={cn(
              "tnum mt-auto pt-2 font-display text-2xl",
              pending > 0 ? "text-gold" : "text-cream",
            )}
          >
            {pending}
          </p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Por confirmar recepción</p>
          <p className="tnum mt-auto pt-2 font-display text-2xl text-cream">{toConfirm}</p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Pendientes por faltante</p>
          <p
            className={cn(
              "tnum mt-auto pt-2 font-display text-2xl",
              pendingUnits > 0 ? "text-busy" : "text-cream",
            )}
          >
            {pendingUnits} un.
          </p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Críticos o sin stock</p>
          <p
            className={cn(
              "tnum mt-auto pt-2 font-display text-2xl",
              critical > 0 ? "text-busy" : "text-cream",
            )}
          >
            {critical}
          </p>
        </div>
      </div>

      {/* Sugerencia de compra/reposición: pendientes de guías + semáforo en rojo */}
      {suggestions.length > 0 && (
        <div className="mb-6 border border-line bg-surface/40">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
            <span className="kicker text-gold">Sugerencia de reposición</span>
            <a
              href="/admin/compras"
              className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
            >
              Ir a compras →
            </a>
          </div>
          <ul className="divide-y divide-line">
            {suggestions.map((s) => (
              <li key={s.product.id} className="flex items-center gap-3 px-5 py-2.5">
                <ProductThumb product={s.product} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-cream">
                  {s.product.name}
                </span>
                <span className="shrink-0 text-xs text-muted">{s.reasons.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {printMsg && (
        <div className="mb-5 border border-busy/50 bg-busy/10 px-4 py-3">
          <p className="text-sm text-busy">{printMsg}</p>
        </div>
      )}

      <SegmentedToggle
        segments={[
          { value: "saldos", label: "Saldos" },
          { value: "traspasos", label: "Traspasos" },
          { value: "conteos", label: "Conteos" },
        ]}
        value={tab}
        onChange={(v) => setTab(v)}
        className="mb-6 w-full sm:max-w-md"
      />

      {/* ------------------------------------------------ Tab Saldos */}
      {tab === "saldos" && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Buscar producto o código"
              className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
            />
            <Select
              value={familyFilter}
              onValueChange={(v) => {
                setFamilyFilter(v);
                setPage(0);
              }}
              ariaLabel="Familia"
              className="mt-0 sm:max-w-xs"
              options={FAMILY_FILTERS}
            />
          </div>

          <div className="border border-line bg-surface/40">
            <div className="hidden grid-cols-[minmax(0,2fr)_96px_96px_96px_72px_104px] gap-4 border-b border-line px-5 py-3 sm:grid">
              <span className="kicker text-dim">Producto</span>
              <span className="kicker text-center text-dim">Recepción</span>
              <span className="kicker text-center text-dim">Central</span>
              <span className="kicker text-center text-dim">Lavandería</span>
              <span className="kicker text-center text-dim">Total</span>
              <span className="kicker text-right text-dim" />
            </div>
            <ul>
              {pageItems.length === 0 && (
                <li className="px-5 py-8 text-sm text-dim">Sin resultados.</li>
              )}
              {pageItems.map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-2 items-center gap-2 border-b border-line px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_96px_96px_96px_72px_104px] sm:gap-4"
                >
                  <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                    <ProductThumb product={p} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-cream">{p.name}</p>
                      <p className="truncate text-xs text-dim">{p.group}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 sm:justify-center">
                    <span className="text-xs text-dim sm:hidden">Recepción</span>
                    <StockDot quantity={p.stock} threshold={p.lowStockThreshold} />
                    <span className="tnum text-sm text-cream">{p.stock}</span>
                  </span>
                  <span className="flex items-center gap-2 sm:justify-center">
                    <span className="text-xs text-dim sm:hidden">Central</span>
                    <StockDot quantity={centralOf(p)} threshold={p.lowStockThreshold} />
                    <span className="tnum text-sm text-muted">{centralOf(p)}</span>
                  </span>
                  <span className="flex items-center gap-2 sm:justify-center">
                    <span className="text-xs text-dim sm:hidden">Lavandería</span>
                    <StockDot quantity={laundryOf(p)} threshold={p.lowStockThreshold} />
                    <span className="tnum text-sm text-muted">{laundryOf(p)}</span>
                  </span>
                  <span className="tnum text-sm text-cream sm:text-center">
                    <span className="mr-2 text-xs text-dim sm:hidden">Total</span>
                    {totalOf(p)}
                  </span>
                  <span className="col-span-2 sm:col-span-1 sm:justify-self-end">
                    {(canRequest || canDeliver) && centralOf(p) > 0 && (
                      <button
                        type="button"
                        onClick={() => openRequest(p.id)}
                        className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                      >
                        Reponer →
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dim">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-ok" aria-hidden /> Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-clean" aria-hidden /> Stock bajo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-busy" aria-hidden /> Crítico
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-maint" aria-hidden /> Sin stock
            </span>
          </p>

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
        </>
      )}

      {/* ------------------------------------------------ Tab Traspasos */}
      {tab === "traspasos" && (
        <div className="space-y-3">
          {sortedTransfers.length === 0 && (
            <p className="border border-line bg-surface/40 px-5 py-8 text-sm text-dim">
              Aún no hay traspasos registrados.
            </p>
          )}
          {sortedTransfers.map((t) => (
            <div key={t.id} className="border border-line bg-surface/40">
              <button
                type="button"
                onClick={() => setDetail(t)}
                className="w-full px-5 py-4 text-left transition-colors hover:bg-surface-2/60"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className={cn("kicker", STATUS_CLASS[t.status])}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <span className="text-xs text-dim">
                    {warehouseName(t.from)} → {warehouseName(t.to)} ·{" "}
                    {formatDateTime(new Date(t.createdAt))}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-cream">
                  {itemsSummary(t.items, nameById)}
                </p>
                <p className="mt-2 text-xs text-dim">
                  Pidió {t.requestedBy}
                  {t.deliveredBy
                    ? ` · ${t.status === "rechazado" ? "Rechazó" : "Entregó"} ${t.deliveredBy}`
                    : ""}
                  {t.receivedBy ? ` · Recibió ${t.receivedBy}` : ""}
                </p>
              </button>
              {t.status !== "rechazado" && (
                <div className="flex flex-wrap gap-3 border-t border-line px-5 py-3">
                  {t.status === "solicitado" && canDeliver && (
                    <>
                      <Button size="sm" onClick={() => setDelivering(t)}>
                        Entregar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejecting(t)}>
                        Rechazar
                      </Button>
                    </>
                  )}
                  {(t.status === "entregado" || t.status === "parcial") && canRequest && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => receiveTransfer(t.id, userLabel, actor)}
                    >
                      Confirmar recepción
                    </Button>
                  )}
                  {/* El papel viaja a bodega central: allá no hay computador. */}
                  {t.status === "solicitado" ? (
                    <Button size="sm" variant="ghost" onClick={() => printSolicitud(t)}>
                      Imprimir solicitud
                    </Button>
                  ) : t.folio ? (
                    <Button size="sm" variant="ghost" onClick={() => printGuia(t)}>
                      Imprimir guía
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------ Tab Conteos */}
      {tab === "conteos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              Inventarios parciales o generales por bodega, con diferencias y ajuste con rastro.
            </p>
            {canDeliver && (
              <Button variant="secondary" onClick={() => setNewCountOpen(true)}>
                Nuevo conteo
              </Button>
            )}
          </div>

          {closedCounts.length === 0 ? (
            <p className="border border-line bg-surface/40 px-5 py-8 text-sm text-dim">
              Aún no hay conteos cerrados. Abre un conteo para detectar diferencias.
            </p>
          ) : (
            <div className="border border-line bg-surface/40">
              {closedCounts.map((c) => {
                const diffs = c.lines.filter((l) => l.counted !== l.expected).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCountDetail(c)}
                    className="grid w-full grid-cols-1 gap-1 border-b border-line px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-surface-2/60 sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-baseline sm:gap-4"
                  >
                    <span className="text-sm text-cream">
                      {c.scope === "parcial" ? `Parcial · ${c.group}` : "Inventario general"}
                      <span className="text-dim"> · {warehouseName(c.warehouseId)}</span>
                    </span>
                    <span className="text-xs text-dim">
                      {formatDateTime(new Date(c.closedAt ?? c.createdAt))} · {c.by}
                    </span>
                    <span
                      className={cn(
                        "tnum text-sm sm:text-right",
                        diffs > 0 ? "text-busy" : "text-ok",
                      )}
                    >
                      {diffs} diferencia{diffs === 1 ? "" : "s"}
                    </span>
                    <span className={cn("kicker sm:text-right", c.adjusted ? "text-gold" : "text-dim")}>
                      {c.adjusted ? "Ajustado" : "Sin ajuste"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ Modales */}
      {transferModal && (
        <TransferModal
          mode={transferModal}
          products={products}
          prefillId={prefillId}
          onClose={() => {
            setTransferModal(null);
            setPrefillId(null);
          }}
          onSubmit={(items, note, from, to) => {
            if (transferModal === "solicitud") {
              const id = requestTransfer(items, userLabel, note, actor, to);
              // El vale sale solo: con ese papel el bodeguero prepara el pedido.
              printSolicitud({
                id,
                from: "central",
                to,
                items,
                requestedBy: userLabel,
                createdAt: new Date().toISOString(),
                note: note.trim() || undefined,
              });
            } else {
              createDirectTransfer(from, to, items, userLabel, actor);
            }
            setTransferModal(null);
            setPrefillId(null);
            setTab("traspasos");
          }}
        />
      )}

      {detail && (
        <Modal
          title={detail.folio ? `Guía de despacho N° ${detail.folio}` : `Solicitud ${detail.id}`}
          subtitle={`${warehouseName(detail.from)} → ${warehouseName(detail.to)}`}
          onClose={() => setDetail(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span className={cn("kicker", STATUS_CLASS[detail.status])}>
                {STATUS_LABEL[detail.status]}
              </span>
              {detail.folio && detail.deliveredAt && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    printTicket(
                      guiaHtml({
                        folio: detail.folio ?? 0,
                        from: warehouseName(detail.from),
                        to: warehouseName(detail.to),
                        at: formatDateTime(new Date(detail.deliveredAt ?? detail.createdAt)),
                        requestedBy: detail.requestedBy,
                        deliveredBy: detail.deliveredBy ?? "—",
                        receivedBy: detail.receivedBy,
                        lines: detail.items.map((it) => ({
                          name: nameById.get(it.productId) ?? it.productId,
                          requested: it.quantity,
                          delivered: it.delivered ?? it.quantity,
                        })),
                        note: detail.note,
                      }),
                      `Guía de despacho ${detail.folio}`,
                    )
                  }
                >
                  Imprimir guía
                </Button>
              )}
            </div>

            <div className="border border-line">
              <div className="grid grid-cols-[1fr_56px_56px_64px] gap-3 border-b border-line bg-surface/40 px-4 py-2">
                <span className="kicker text-dim">Producto</span>
                <span className="kicker text-right text-dim">Solic.</span>
                <span className="kicker text-right text-dim">Entreg.</span>
                <span className="kicker text-right text-dim">Pend.</span>
              </div>
              {detail.items.map((it) => {
                const product = products.find((p) => p.id === it.productId);
                const pend = pendingOf(it);
                return (
                  <div
                    key={it.productId}
                    className="grid grid-cols-[1fr_56px_56px_64px] items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {product && <ProductThumb product={product} size="sm" />}
                      <span className="truncate text-sm text-cream">
                        {nameById.get(it.productId) ?? it.productId}
                      </span>
                    </span>
                    <span className="tnum text-right text-sm text-muted">{it.quantity}</span>
                    <span className="tnum text-right text-sm text-cream">
                      {it.delivered ?? "—"}
                    </span>
                    <span
                      className={cn(
                        "tnum text-right text-sm",
                        pend > 0 ? "text-busy" : "text-dim",
                      )}
                    >
                      {pend > 0 ? pend : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <ol className="space-y-3 border-l border-line pl-4">
              <li>
                <p className="text-sm text-cream">Solicitado por {detail.requestedBy}</p>
                <p className="text-xs text-dim">{formatDateTime(new Date(detail.createdAt))}</p>
              </li>
              {detail.deliveredBy && detail.status !== "rechazado" && (
                <li>
                  <p className="text-sm text-cream">Entregado por {detail.deliveredBy}</p>
                  {detail.deliveredAt && (
                    <p className="text-xs text-dim">
                      {formatDateTime(new Date(detail.deliveredAt))}
                    </p>
                  )}
                </li>
              )}
              {detail.status === "rechazado" && detail.deliveredBy && (
                <li>
                  <p className="text-sm text-busy">Rechazado por {detail.deliveredBy}</p>
                </li>
              )}
              {detail.receivedBy && (
                <li>
                  <p className="text-sm text-cream">
                    Recepción conforme · {detail.receivedBy}
                  </p>
                  {detail.receivedAt && (
                    <p className="text-xs text-dim">
                      {formatDateTime(new Date(detail.receivedAt))}
                    </p>
                  )}
                </li>
              )}
            </ol>

            {detail.note && (
              <p className="border-t border-line pt-4 text-xs leading-relaxed text-muted">
                {detail.note}
              </p>
            )}
          </div>
        </Modal>
      )}

      {delivering && (
        <DeliverModal
          transfer={delivering}
          products={products}
          onClose={() => setDelivering(null)}
          onConfirm={(quantities) => {
            const folio = nextGuideFolio(transfers);
            deliverTransfer(delivering.id, userLabel, actor, quantities);
            // La guía definitiva sale sola: acompaña la mercadería al destino.
            printGuia(
              {
                ...delivering,
                deliveredBy: userLabel,
                deliveredAt: new Date().toISOString(),
                items: delivering.items.map((it) => {
                  const p = products.find((x) => x.id === it.productId);
                  const available = p ? Math.max(0, stockOf(p, delivering.from)) : 0;
                  return {
                    ...it,
                    delivered: Math.min(quantities[it.productId] ?? 0, it.quantity, available),
                  };
                }),
              },
              folio,
            );
            setDelivering(null);
          }}
        />
      )}

      {rejecting && (
        <RejectModal
          transfer={rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={(note) => {
            rejectTransfer(rejecting.id, userLabel, note, actor);
            setRejecting(null);
          }}
        />
      )}

      {newCountOpen && (
        <NewCountModal
          products={products}
          onClose={() => setNewCountOpen(false)}
          onStart={(warehouseId, group) => {
            const id = startStockCount(warehouseId, group, userLabel, actor);
            setNewCountOpen(false);
            setActiveCountId(id);
          }}
        />
      )}

      {activeCount && (
        <CountSheetModal
          count={activeCount}
          nameById={nameById}
          onSetLine={(productId, counted) => setCountLine(activeCount.id, productId, counted)}
          onClose={(apply) => {
            closeStockCount(activeCount.id, apply, actor);
            setActiveCountId(null);
            setTab("conteos");
          }}
          onDismiss={() => {
            // Cerrar sin terminar deja el conteo abierto; en la maqueta lo cerramos sin ajuste.
            closeStockCount(activeCount.id, false, actor);
            setActiveCountId(null);
          }}
        />
      )}

      {countDetail && (
        <Modal
          title={
            countDetail.scope === "parcial"
              ? `Conteo parcial · ${countDetail.group}`
              : "Inventario general"
          }
          subtitle={`${warehouseName(countDetail.warehouseId)} · ${countDetail.by}`}
          onClose={() => setCountDetail(null)}
        >
          {(() => {
            const diffs = countDetail.lines.filter((l) => l.counted !== l.expected);
            if (diffs.length === 0) {
              return <p className="text-sm text-ok">Sin diferencias: el conteo cuadró completo.</p>;
            }
            return (
              <div className="space-y-4">
                <div className="border border-line">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-line bg-surface/40 px-4 py-2">
                    <span className="kicker text-dim">Producto</span>
                    <span className="kicker text-right text-dim">Sistema</span>
                    <span className="kicker text-right text-dim">Contado</span>
                    <span className="kicker text-right text-dim">Dif.</span>
                  </div>
                  {diffs.map((l) => (
                    <div
                      key={l.productId}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                    >
                      <span className="truncate text-sm text-cream">
                        {nameById.get(l.productId) ?? l.productId}
                      </span>
                      <span className="tnum text-right text-sm text-dim">{l.expected}</span>
                      <span className="tnum text-right text-sm text-cream">{l.counted}</span>
                      <span
                        className={cn(
                          "tnum text-right text-sm",
                          l.counted < l.expected ? "text-busy" : "text-gold",
                        )}
                      >
                        {l.counted - l.expected > 0 ? "+" : ""}
                        {l.counted - l.expected}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-dim">
                  {countDetail.adjusted
                    ? "El stock se ajustó al cerrar; cada diferencia dejó su movimiento de ajuste."
                    : "El conteo se cerró sin ajustar el stock."}
                </p>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------ Buscador de producto */

/**
 * Buscador con filtrado en vivo para la reposición (pedido del cliente):
 * se escriben las primeras letras y la lista muestra solo las coincidencias.
 */
function ProductPicker({
  products,
  value,
  onSelect,
}: {
  products: Product[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = products.find((p) => p.id === value) ?? null;
  const q = query.trim().toLowerCase();
  const matches = q
    ? products
        .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        .slice(0, 8)
    : [];

  if (selected) {
    return (
      <div className="mt-2 flex min-h-[44px] items-center gap-2.5 rounded-sm border border-line bg-surface px-3 py-2">
        <ProductThumb product={selected} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-cream">{selected.name}</p>
          <p className="tnum truncate text-xs text-dim">
            central {centralOf(selected)} · recep. {selected.stock} · lav. {laundryOf(selected)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect("");
            setQuery("");
          }}
          className="shrink-0 text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative mt-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Escribe para buscar el producto…"
        aria-label="Buscar producto"
        className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
      />
      {q && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-line-strong bg-surface-2">
          {matches.length === 0 ? (
            <li className="px-3 py-3 text-sm text-dim">Sin coincidencias para “{query}”.</li>
          ) : (
            matches.map((p) => (
              <li key={p.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface"
                >
                  <ProductThumb product={p} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-cream">{p.name}</span>
                    <span className="tnum block truncate text-xs text-dim">
                      central {centralOf(p)} · recep. {p.stock} · lav. {laundryOf(p)}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------ Modal de solicitud / traspaso */

function TransferModal({
  mode,
  products,
  prefillId,
  onClose,
  onSubmit,
}: {
  mode: "solicitud" | "directo";
  products: Product[];
  prefillId: string | null;
  onClose: () => void;
  onSubmit: (items: TransferItem[], note: string, from: string, to: string) => void;
}) {
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: prefillId ?? "", quantity: prefillId ? 12 : 0 },
  ]);
  const [note, setNote] = useState("");
  const [from, setFrom] = useState("central");
  const [to, setTo] = useState("recepcion");

  const sorted = [...products]
    .filter((p) => p.active)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const valid = items.some((it) => it.productId && it.quantity > 0) && from !== to;

  const warehouseOptions = WAREHOUSES.map((w) => ({ value: w.id, label: w.name }));

  function setItem(i: number, patch: Partial<{ productId: string; quantity: number }>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  return (
    <Modal
      title={mode === "solicitud" ? "Solicitar reposición" : "Nuevo traspaso"}
      subtitle={
        mode === "solicitud"
          ? "Desde bodega central"
          : "Movimiento directo entre bodegas"
      }
      onClose={onClose}
    >
      <div className="space-y-5">
        {mode === "directo" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kicker text-dim">Origen</label>
              <Select
                value={from}
                onValueChange={setFrom}
                ariaLabel="Bodega de origen"
                options={warehouseOptions}
              />
            </div>
            <div>
              <label className="kicker text-dim">Destino</label>
              <Select
                value={to}
                onValueChange={setTo}
                ariaLabel="Bodega de destino"
                options={warehouseOptions}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="kicker text-dim">Destino de la reposición</label>
            <Select
              value={to}
              onValueChange={setTo}
              ariaLabel="Bodega de destino"
              options={warehouseOptions.filter((w) => w.value !== "central")}
            />
          </div>
        )}

        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_84px_36px] items-end gap-2">
              <div className="min-w-0">
                {i === 0 && <label className="kicker text-dim">Producto</label>}
                <ProductPicker
                  products={sorted}
                  value={it.productId}
                  onSelect={(id) => setItem(i, { productId: id, quantity: it.quantity || 12 })}
                />
              </div>
              <div>
                {i === 0 && <label className="kicker text-dim">Cant.</label>}
                <input
                  inputMode="numeric"
                  value={String(it.quantity || "")}
                  onChange={(e) =>
                    setItem(i, { quantity: Number(e.target.value.replace(/\D/g, "")) || 0 })
                  }
                  placeholder="12"
                  className="mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={items.length === 1}
                aria-label="Quitar ítem"
                className="mb-1 flex size-9 items-center justify-center border border-line text-base text-dim transition-colors hover:border-busy/60 hover:text-busy disabled:pointer-events-none disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { productId: "", quantity: 0 }])}
            className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
          >
            + Agregar ítem
          </button>
        </div>

        <div>
          <label className="kicker text-dim" htmlFor="tr-note">
            Nota (opcional)
          </label>
          <input
            id="tr-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Motivo o referencia"
            className={fieldClass}
          />
        </div>

        <p className="text-xs leading-relaxed text-dim">
          El stock se mueve al momento de la entrega y queda registrado quién solicita, quién
          entrega y quién recibe.
        </p>

        <Button
          className="w-full"
          disabled={!valid}
          onClick={() =>
            onSubmit(
              items.filter((it) => it.productId && it.quantity > 0),
              note,
              from,
              to,
            )
          }
        >
          {mode === "solicitud" ? "Enviar solicitud" : "Registrar traspaso"}
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------ Modal de entrega */

function DeliverModal({
  transfer,
  products,
  onClose,
  onConfirm,
}: {
  transfer: Transfer;
  products: Product[];
  onClose: () => void;
  onConfirm: (quantities: Record<string, number>) => void;
}) {
  // La entrega parte en lo solicitado, recortado al saldo del origen. Si algo
  // no alcanza, el sistema alerta y la entrega queda parcial con su pendiente.
  const initial = Object.fromEntries(
    transfer.items.map((it) => {
      const product = products.find((p) => p.id === it.productId);
      const available = product ? Math.max(0, stockOf(product, transfer.from)) : 0;
      return [it.productId, Math.min(it.quantity, available)];
    }),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(initial);

  const rows = transfer.items.map((it) => {
    const product = products.find((p) => p.id === it.productId);
    const available = product ? Math.max(0, stockOf(product, transfer.from)) : 0;
    const deliver = Math.min(quantities[it.productId] ?? 0, it.quantity, available);
    return { item: it, product, available, deliver, pending: it.quantity - deliver };
  });
  const insufficient = rows.filter((r) => r.available < r.item.quantity);
  const anyPending = rows.some((r) => r.pending > 0);
  const nothing = rows.every((r) => r.deliver <= 0);

  return (
    <Modal
      title="Entregar solicitud"
      subtitle={`${warehouseName(transfer.from)} → ${warehouseName(transfer.to)}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        {insufficient.length > 0 && (
          <div className="border border-busy/50 bg-busy/10 px-4 py-3" role="alert">
            <p className="text-sm font-medium text-busy">Stock insuficiente</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {insufficient
                .map(
                  (r) =>
                    `${r.product?.name ?? r.item.productId}: solicitado ${r.item.quantity}, disponible ${r.available}`,
                )
                .join(" · ")}
              . Puedes entregar parcial: el saldo queda pendiente en la guía y pasa a la
              sugerencia de reposición.
            </p>
          </div>
        )}

        <div className="border border-line">
          <div className="grid grid-cols-[1fr_64px_64px_72px] gap-3 border-b border-line bg-surface/40 px-4 py-2">
            <span className="kicker text-dim">Producto</span>
            <span className="kicker text-right text-dim">Solic.</span>
            <span className="kicker text-right text-dim">Disp.</span>
            <span className="kicker text-right text-dim">Entregar</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.item.productId}
              className="grid grid-cols-[1fr_64px_64px_72px] items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {r.product && <ProductThumb product={r.product} size="sm" />}
                <span className="truncate text-sm text-cream">
                  {r.product?.name ?? r.item.productId}
                </span>
              </span>
              <span className="tnum text-right text-sm text-muted">{r.item.quantity}</span>
              <span
                className={cn(
                  "tnum flex items-center justify-end gap-1.5 text-right text-sm",
                  r.available < r.item.quantity ? "text-busy" : "text-muted",
                )}
              >
                <StockDot
                  quantity={r.available}
                  threshold={r.product?.lowStockThreshold ?? 5}
                />
                {r.available}
              </span>
              <input
                inputMode="numeric"
                value={String(quantities[r.item.productId] ?? 0)}
                onChange={(e) => {
                  const v = Number(e.target.value.replace(/\D/g, "")) || 0;
                  setQuantities((prev) => ({
                    ...prev,
                    [r.item.productId]: Math.min(v, r.item.quantity, r.available),
                  }));
                }}
                aria-label={`Cantidad a entregar de ${r.product?.name ?? r.item.productId}`}
                className="tnum min-h-[36px] w-full rounded-sm border border-line bg-surface px-2 py-1.5 text-right text-sm text-cream focus:border-gold/60 focus-visible:outline-none"
              />
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-dim">
          {anyPending
            ? "Entrega parcial: lo no entregado queda pendiente, visible en la guía y en la sugerencia de reposición."
            : "El stock se mueve al confirmar y la guía de despacho queda con su folio para imprimir."}
        </p>

        <Button className="w-full" disabled={nothing} onClick={() => onConfirm(quantities)}>
          {anyPending ? "Entregar parcial" : "Confirmar entrega"}
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------ Modal de rechazo */

function RejectModal({
  transfer,
  onClose,
  onConfirm,
}: {
  transfer: Transfer;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <Modal title="Rechazar solicitud" subtitle={`Solicitud ${transfer.id}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          La solicitud quedará rechazada sin mover stock. Indica el motivo para que recepción lo
          vea.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Ej: stock central insuficiente, se repone con la próxima compra"
          className="min-h-[88px] w-full resize-none rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
        />
        <Button className="w-full" disabled={note.trim().length < 4} onClick={() => onConfirm(note)}>
          Rechazar solicitud
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------ Modal de nuevo conteo */

function NewCountModal({
  products,
  onClose,
  onStart,
}: {
  products: Product[];
  onClose: () => void;
  onStart: (warehouseId: string, group: string | undefined) => void;
}) {
  const [warehouseId, setWarehouseId] = useState("recepcion");
  const [scope, setScope] = useState("general");

  const groups = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) if (p.group && !seen.includes(p.group)) seen.push(p.group);
    return seen.sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  return (
    <Modal title="Nuevo conteo" subtitle="Inventario físico" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="kicker text-dim">Bodega</label>
          <Select
            value={warehouseId}
            onValueChange={setWarehouseId}
            ariaLabel="Bodega"
            options={WAREHOUSES.map((w) => ({ value: w.id, label: w.name }))}
          />
        </div>
        <div>
          <label className="kicker text-dim">Alcance</label>
          <Select
            value={scope}
            onValueChange={setScope}
            ariaLabel="Alcance"
            options={[
              { value: "general", label: "Inventario general" },
              ...groups.map((g) => ({ value: g, label: `Parcial · ${g}` })),
            ]}
          />
        </div>
        <p className="text-xs leading-relaxed text-dim">
          Las líneas parten con el saldo del sistema: solo corriges las que difieren al contar.
        </p>
        <Button
          className="w-full"
          onClick={() => onStart(warehouseId, scope === "general" ? undefined : scope)}
        >
          Abrir conteo
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------ Hoja de conteo activa */

function CountSheetModal({
  count,
  nameById,
  onSetLine,
  onClose,
  onDismiss,
}: {
  count: StockCount;
  nameById: Map<string, string>;
  onSetLine: (productId: string, counted: number) => void;
  onClose: (applyAdjustment: boolean) => void;
  onDismiss: () => void;
}) {
  const [apply, setApply] = useState(true);
  const diffs = count.lines.filter((l) => l.counted !== l.expected);
  const net = diffs.reduce((s, l) => s + (l.counted - l.expected), 0);

  return (
    <Modal
      title={count.scope === "parcial" ? `Conteo parcial · ${count.group}` : "Inventario general"}
      subtitle={`${warehouseName(count.warehouseId)} · abierto ${formatTime(new Date(count.createdAt))}`}
      onClose={onDismiss}
    >
      <div className="space-y-4">
        <div className="-mr-2 max-h-[46vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-[1fr_64px_84px] gap-3 border-b border-line pb-2">
            <span className="kicker text-dim">Producto</span>
            <span className="kicker text-right text-dim">Sistema</span>
            <span className="kicker text-right text-dim">Contado</span>
          </div>
          {count.lines.map((l) => {
            const diff = l.counted - l.expected;
            return (
              <div
                key={l.productId}
                className="grid grid-cols-[1fr_64px_84px] items-center gap-3 border-b border-line py-2 last:border-b-0"
              >
                <span
                  className={cn(
                    "truncate text-sm",
                    diff < 0 ? "text-busy" : diff > 0 ? "text-gold" : "text-cream",
                  )}
                >
                  {nameById.get(l.productId) ?? l.productId}
                </span>
                <span className="tnum text-right text-sm text-dim">{l.expected}</span>
                <input
                  inputMode="numeric"
                  value={String(l.counted)}
                  onChange={(e) =>
                    onSetLine(l.productId, Number(e.target.value.replace(/\D/g, "")) || 0)
                  }
                  className={cn(
                    "tnum min-h-[36px] w-full rounded-sm border bg-surface px-2 py-1.5 text-right text-sm focus:border-gold/60 focus-visible:outline-none",
                    diff !== 0 ? "border-gold/50 text-cream" : "border-line text-cream",
                  )}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="kicker text-dim">
            {diffs.length} diferencia{diffs.length === 1 ? "" : "s"}
          </span>
          <span
            className={cn(
              "tnum text-sm",
              net < 0 ? "text-busy" : net > 0 ? "text-gold" : "text-ok",
            )}
          >
            {net === 0 ? "Neto cuadrado" : `Neto ${net > 0 ? "+" : ""}${net} unidades`}
          </span>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={apply}
            onChange={(e) => setApply(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          Ajustar stock al cerrar (deja movimientos de ajuste)
        </label>

        <Button className="w-full" onClick={() => onClose(apply)}>
          Cerrar conteo
        </Button>
      </div>
    </Modal>
  );
}
