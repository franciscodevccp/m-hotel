"use client";

import { useMemo, useState } from "react";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatCLP, formatDate, formatDateTime } from "@/lib/format";
import {
  FULFILLMENT_LABEL,
  fulfillmentLine,
  PAYMENT_LABEL,
  SHOP_ADVANCE_LABEL,
  SHOP_NEXT,
  SHOP_STATUS_CLASS,
  SHOP_STATUS_ORDER,
  needsAction,
  statusLabelFor,
} from "@/lib/shop";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ShopOrder } from "@/types";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente de pago" },
  { value: "pagado", label: "Pagado" },
  { value: "preparando", label: "Preparando" },
  { value: "despachado", label: "Despachado" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

export default function PedidosPage() {
  const { shopOrders, advanceShopOrder, cancelShopOrder } = useAppStore();
  const { user } = useSession();
  const actor = user ? { name: user.name, role: user.role } : undefined;
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      [...shopOrders]
        .filter((o) => statusFilter === "all" || o.status === statusFilter)
        .filter(
          (o) =>
            !q ||
            String(o.folio).includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerEmail.toLowerCase().includes(q),
        )
        .sort((a, b) => {
          if (a.status !== b.status) return SHOP_STATUS_ORDER[a.status] - SHOP_STATUS_ORDER[b.status];
          return b.createdAt.localeCompare(a.createdAt);
        }),
    [shopOrders, statusFilter, q],
  );

  const pendientes = shopOrders.filter((o) => o.status === "pendiente").length;
  const porAtender = shopOrders.filter((o) => needsAction(o.status)).length;
  const entregados = shopOrders.filter((o) => o.status === "entregado").length;

  const open = openId ? shopOrders.find((o) => o.id === openId) ?? null : null;

  return (
    <AdminOnly section="Tienda online">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <span className="kicker text-gold">Tienda online</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Pedidos</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Pedidos del sexshop online. Avanza cada uno por su flujo: pago, preparación, despacho y
            entrega.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Pendientes de pago" value={pendientes} tone={pendientes > 0 ? "busy" : "cream"} />
          <Stat label="Por atender" value={porAtender} tone={porAtender > 0 ? "clean" : "cream"} />
          <Stat label="Entregados" value={entregados} tone="cream" />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por folio, cliente o correo"
            className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            ariaLabel="Filtrar por estado"
            className="mt-0 sm:w-56"
            options={STATUS_FILTERS}
          />
        </div>

        {list.length === 0 ? (
          <div className="border border-line bg-surface/40 px-6 py-12 text-center">
            <p className="text-sm text-muted">No hay pedidos con ese filtro.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-line bg-surface/40">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-dim">
                  <th className="px-4 py-3 font-normal kicker">Pedido</th>
                  <th className="px-4 py-3 font-normal kicker">Fecha</th>
                  <th className="hidden px-4 py-3 font-normal kicker sm:table-cell">Entrega</th>
                  <th className="px-4 py-3 text-right font-normal kicker">Total</th>
                  <th className="px-4 py-3 text-right font-normal kicker">Estado</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setOpenId(o.id)}
                    className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <p className="text-cream">#{o.folio}</p>
                      <p className="text-xs text-dim">{o.customerName}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(new Date(o.createdAt))}</td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">
                      {fulfillmentLine(o)}
                    </td>
                    <td className="tnum px-4 py-3 text-right text-gold">{formatCLP(o.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("kicker", SHOP_STATUS_CLASS[o.status])}>
                        {statusLabelFor(o)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {open && (
          <OrderDetail
            order={open}
            onClose={() => setOpenId(null)}
            onAdvance={() => advanceShopOrder(open.id, actor)}
            onCancel={() => cancelShopOrder(open.id, actor)}
          />
        )}
      </div>
    </AdminOnly>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cream" | "busy" | "clean";
}) {
  const toneClass = tone === "busy" ? "text-busy" : tone === "clean" ? "text-clean" : "text-cream";
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className={cn("tnum mt-2 font-display text-2xl", toneClass)}>{value}</p>
    </div>
  );
}

function OrderDetail({
  order,
  onClose,
  onAdvance,
  onCancel,
}: {
  order: ShopOrder;
  onClose: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const next = SHOP_NEXT[order.status];
  const canCancel = order.status !== "entregado" && order.status !== "cancelado";

  const timeline: { label: string; at?: string }[] = [
    { label: "Pedido", at: order.createdAt },
    { label: "Pago confirmado", at: order.paidAt },
    { label: order.fulfillment === "retiro" ? "Listo para retiro" : "Despachado", at: order.shippedAt },
    { label: "Entregado", at: order.deliveredAt },
  ];

  return (
    <Modal
      title={`Pedido #${order.folio}`}
      subtitle={statusLabelFor(order)}
      onClose={onClose}
    >
      <div className="max-h-[68vh] space-y-5 overflow-y-auto pr-1">
        <section>
          <p className="kicker text-dim">Cliente</p>
          <p className="mt-1 text-sm text-cream">{order.customerName}</p>
          <p className="text-xs text-muted">
            {order.customerEmail} · {order.customerPhone}
          </p>
          {order.customerRut && <p className="text-xs text-dim">RUT {order.customerRut}</p>}
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <p className="kicker text-dim">Entrega</p>
            <p className="mt-1 text-sm text-cream">{FULFILLMENT_LABEL[order.fulfillment]}</p>
            {order.fulfillment === "despacho" && (
              <p className="text-xs text-muted">
                {order.address}, {order.comuna}
              </p>
            )}
            {order.fulfillment === "habitacion" && order.address && (
              <p className="text-xs text-muted">{order.address}</p>
            )}
          </div>
          <div>
            <p className="kicker text-dim">Pago</p>
            <p className="mt-1 text-sm text-cream">{PAYMENT_LABEL[order.payment]}</p>
            {order.couponCode && <p className="text-xs text-gold">Cupón {order.couponCode}</p>}
          </div>
        </section>

        <section>
          <p className="kicker text-dim">Productos</p>
          <ul className="mt-2 space-y-1.5">
            {order.items.map((it) => (
              <li key={it.productId} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted">
                  <span className="tnum text-cream">{it.quantity}×</span> {it.name}
                </span>
                <span className="tnum shrink-0 text-muted">
                  {formatCLP(it.unitPrice * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-1 border-t border-line pt-3 text-sm">
          <Row label="Subtotal" value={formatCLP(order.subtotal)} />
          <Row
            label="Envío"
            value={order.shipping > 0 ? formatCLP(order.shipping) : "Gratis"}
          />
          {order.discount > 0 && (
            <Row label={`Descuento${order.couponCode ? ` · ${order.couponCode}` : ""}`} value={`− ${formatCLP(order.discount)}`} accent />
          )}
          <div className="flex items-baseline justify-between border-t border-line pt-2">
            <span className="kicker text-dim">Total</span>
            <span className="tnum font-display text-xl text-gold">{formatCLP(order.total)}</span>
          </div>
        </section>

        {order.notes && (
          <p className="rounded-sm border border-line bg-surface/60 px-3 py-2 text-xs italic text-dim">
            “{order.notes}”
          </p>
        )}

        <section>
          <p className="kicker text-dim">Seguimiento</p>
          <ol className="mt-2 space-y-1.5">
            {timeline.map((t) => (
              <li key={t.label} className="flex items-center justify-between gap-3 text-sm">
                <span className={t.at ? "text-cream" : "text-dim"}>{t.label}</span>
                <span className="tnum text-xs text-muted">
                  {t.at ? formatDateTime(new Date(t.at)) : "—"}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {(next || canCancel) && (
          <div className="flex gap-3 border-t border-line pt-4">
            {canCancel && (
              <button
                type="button"
                onClick={() => {
                  onCancel();
                  onClose();
                }}
                className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
              >
                Cancelar pedido
              </button>
            )}
            {next && (
              <Button
                className="ml-auto"
                onClick={() => {
                  onAdvance();
                  onClose();
                }}
              >
                {SHOP_ADVANCE_LABEL[order.status]}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted">{label}</span>
      <span className={cn("tnum", accent ? "text-gold" : "text-cream")}>{value}</span>
    </div>
  );
}
