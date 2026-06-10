"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { PRODUCT_SALES_30D } from "@/data/history";
import { warehouseName } from "@/data/warehouses";
import { centralOf, totalOf } from "@/lib/inventory";
import { formatDateTime, formatTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Product, StockCount, Transfer, TransferItem, TransferStatus } from "@/types";

type Tab = "saldos" | "traspasos" | "conteos";

const STATUS_LABEL: Record<TransferStatus, string> = {
  solicitado: "Solicitado",
  entregado: "Entregado",
  recibido: "Recibido",
  rechazado: "Rechazado",
};

const STATUS_CLASS: Record<TransferStatus, string> = {
  solicitado: "text-clean",
  entregado: "text-gold",
  recibido: "text-ok",
  rechazado: "text-dim",
};

const STATUS_ORDER: Record<TransferStatus, number> = {
  solicitado: 0,
  entregado: 1,
  recibido: 2,
  rechazado: 3,
};

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
    .map((it) => `${it.quantity}× ${nameById.get(it.productId) ?? it.productId}`)
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
  const [transferModal, setTransferModal] = useState<"solicitud" | "directo" | null>(null);
  const [prefillId, setPrefillId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Transfer | null>(null);
  const [rejecting, setRejecting] = useState<Transfer | null>(null);
  const [newCountOpen, setNewCountOpen] = useState(false);
  const [activeCountId, setActiveCountId] = useState<string | null>(null);
  const [countDetail, setCountDetail] = useState<StockCount | null>(null);

  const nameById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  // --- Stats ---
  const pending = transfers.filter((t) => t.status === "solicitado").length;
  const toConfirm = transfers.filter((t) => t.status === "entregado").length;
  const monthTransfers = transfers.filter((t) => t.createdAt.startsWith("2026-06")).length;
  // Crítico = producto de alta rotación (12+ ventas en 30 d) quedándose sin
  // saldo en recepción: la señal accionable para pedir reposición.
  const critical = products.filter(
    (p) =>
      p.active && (PRODUCT_SALES_30D[p.id] ?? 0) >= 12 && p.stock <= p.lowStockThreshold,
  ).length;

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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Inventario</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Bodegas y traspasos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Saldos por bodega y traspasos digitales: queda registro de quién solicita, quién
            entrega, qué se traslada y los saldos al día.
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
          <p className="kicker text-dim">Traspasos del mes</p>
          <p className="tnum mt-auto pt-2 font-display text-2xl text-cream">{monthTransfers}</p>
        </div>
        <div className="flex flex-col border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Críticos en recepción</p>
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
            <div className="hidden grid-cols-[minmax(0,2fr)_90px_90px_90px_110px] gap-4 border-b border-line px-5 py-3 sm:grid">
              <span className="kicker text-dim">Producto</span>
              <span className="kicker text-center text-dim">Recepción</span>
              <span className="kicker text-center text-dim">Central</span>
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
                  className="grid grid-cols-2 items-center gap-2 border-b border-line px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_90px_90px_90px_110px] sm:gap-4"
                >
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <p className="truncate text-sm text-cream">{p.name}</p>
                    <p className="truncate text-xs text-dim">{p.group}</p>
                  </div>
                  <span
                    className={cn(
                      "tnum text-sm sm:text-center",
                      p.stock <= p.lowStockThreshold ? "text-busy" : "text-cream",
                    )}
                  >
                    <span className="mr-2 text-xs text-dim sm:hidden">Recepción</span>
                    {p.stock}
                  </span>
                  <span className="tnum text-sm text-muted sm:text-center">
                    <span className="mr-2 text-xs text-dim sm:hidden">Central</span>
                    {centralOf(p)}
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
              {(t.status === "solicitado" && canDeliver) ||
              (t.status === "entregado" && canRequest) ? (
                <div className="flex gap-3 border-t border-line px-5 py-3">
                  {t.status === "solicitado" && canDeliver && (
                    <>
                      <Button size="sm" onClick={() => deliverTransfer(t.id, userLabel, actor)}>
                        Entregar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejecting(t)}>
                        Rechazar
                      </Button>
                    </>
                  )}
                  {t.status === "entregado" && canRequest && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => receiveTransfer(t.id, userLabel, actor)}
                    >
                      Confirmar recepción
                    </Button>
                  )}
                </div>
              ) : null}
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
              requestTransfer(items, userLabel, note, actor);
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
          title={`Traspaso ${detail.id}`}
          subtitle={`${warehouseName(detail.from)} → ${warehouseName(detail.to)}`}
          onClose={() => setDetail(null)}
        >
          <div className="space-y-5">
            <span className={cn("kicker", STATUS_CLASS[detail.status])}>
              {STATUS_LABEL[detail.status]}
            </span>

            <div className="border border-line">
              <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-line bg-surface/40 px-4 py-2">
                <span className="kicker text-dim">Producto</span>
                <span className="kicker text-right text-dim">Cantidad</span>
              </div>
              {detail.items.map((it) => (
                <div
                  key={it.productId}
                  className="grid grid-cols-[1fr_auto] gap-4 border-b border-line px-4 py-2.5 last:border-b-0"
                >
                  <span className="truncate text-sm text-cream">
                    {nameById.get(it.productId) ?? it.productId}
                  </span>
                  <span className="tnum text-sm text-cream">{it.quantity}</span>
                </div>
              ))}
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

  const valid =
    items.some((it) => it.productId && it.quantity > 0) && (mode === "solicitud" || from !== to);

  function setItem(i: number, patch: Partial<{ productId: string; quantity: number }>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  return (
    <Modal
      title={mode === "solicitud" ? "Solicitar reposición" : "Nuevo traspaso"}
      subtitle={
        mode === "solicitud" ? "Bodega central → recepción" : "Movimiento directo entre bodegas"
      }
      onClose={onClose}
    >
      <div className="space-y-5">
        {mode === "directo" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kicker text-dim">Origen</label>
              <Select
                value={from}
                onValueChange={setFrom}
                ariaLabel="Bodega de origen"
                options={[
                  { value: "central", label: "Bodega central" },
                  { value: "recepcion", label: "Bodega de recepción" },
                ]}
              />
            </div>
            <div>
              <label className="kicker text-dim">Destino</label>
              <Select
                value={to}
                onValueChange={setTo}
                ariaLabel="Bodega de destino"
                options={[
                  { value: "recepcion", label: "Bodega de recepción" },
                  { value: "central", label: "Bodega central" },
                ]}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_84px_36px] items-end gap-2">
              <div className="min-w-0">
                {i === 0 && <label className="kicker text-dim">Producto</label>}
                <Select
                  value={it.productId}
                  onValueChange={(v) => setItem(i, { productId: v, quantity: it.quantity || 12 })}
                  placeholder="Elegir producto…"
                  ariaLabel="Producto"
                  options={sorted.map((p) => ({
                    value: p.id,
                    label: `${p.name} · central ${p.centralStock ?? 0} · recep. ${p.stock}`,
                  }))}
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
            options={[
              { value: "recepcion", label: "Bodega de recepción" },
              { value: "central", label: "Bodega central" },
            ]}
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
