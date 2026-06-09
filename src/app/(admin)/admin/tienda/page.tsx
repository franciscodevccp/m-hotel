"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { formatCLP } from "@/lib/format";
import {
  isRealized,
  needsAction,
  SHOP_STATUS_CLASS,
  SHOP_STATUS_ORDER,
  statusLabelFor,
  topProductosOnline,
} from "@/lib/shop";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function TiendaResumenPage() {
  const { shopOrders, products, coupons } = useAppStore();

  const realized = useMemo(() => shopOrders.filter((o) => isRealized(o.status)), [shopOrders]);
  const ingresos = realized.reduce((s, o) => s + o.total, 0);
  const ticket = realized.length > 0 ? Math.round(ingresos / realized.length) : 0;
  const pendientes = shopOrders.filter((o) => o.status === "pendiente").length;
  const porAtender = useMemo(
    () =>
      [...shopOrders]
        .filter((o) => o.status === "pendiente" || needsAction(o.status))
        .sort((a, b) => {
          if (a.status !== b.status) return SHOP_STATUS_ORDER[a.status] - SHOP_STATUS_ORDER[b.status];
          return b.createdAt.localeCompare(a.createdAt);
        }),
    [shopOrders],
  );

  const top = useMemo(() => topProductosOnline(shopOrders, 6), [shopOrders]);
  const sexshop = useMemo(() => products.filter((p) => p.category === "sexshop"), [products]);
  const lowStock = sexshop.filter((p) => p.stock <= p.lowStockThreshold);
  const cuponesActivos = coupons.filter((c) => c.active).length;

  return (
    <AdminOnly section="Tienda online">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <span className="kicker text-gold">Tienda online</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Resumen</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Estado del e-commerce del sexshop. Ingresos, pedidos por atender y lo más vendido, en
            vivo.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Ingresos tienda" value={formatCLP(ingresos)} accent />
          <Stat label="Pedidos" value={String(shopOrders.length)} />
          <Stat label="Ticket promedio" value={formatCLP(ticket)} />
          <Stat
            label="Pendientes de pago"
            value={String(pendientes)}
            tone={pendientes > 0 ? "busy" : undefined}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="border border-line bg-surface/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-cream">Por atender</h2>
              <Link
                href="/admin/pedidos"
                className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
              >
                Ver pedidos
              </Link>
            </div>
            {porAtender.length === 0 ? (
              <p className="py-6 text-center text-sm text-dim">Todo al día. No hay pedidos pendientes.</p>
            ) : (
              <ul className="divide-y divide-line">
                {porAtender.slice(0, 6).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-cream">
                        #{o.folio} · {o.customerName}
                      </p>
                      <p className="text-xs text-dim">
                        {o.fulfillment === "despacho" ? `Despacho · ${o.comuna}` : "Retiro en local"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="tnum text-sm text-gold">{formatCLP(o.total)}</span>
                      <span className={cn("kicker", SHOP_STATUS_CLASS[o.status])}>
                        {statusLabelFor(o)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-line bg-surface/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-cream">Más vendidos</h2>
              <Link
                href="/admin/reportes-tienda"
                className="text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-soft"
              >
                Ver reportes
              </Link>
            </div>
            {top.length === 0 ? (
              <p className="py-6 text-center text-sm text-dim">Aún no hay ventas registradas.</p>
            ) : (
              <ul className="divide-y divide-line">
                {top.map((t, i) => (
                  <li key={t.name} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="min-w-0 truncate text-sm text-muted">
                      <span className="tnum mr-2 text-dim">{i + 1}.</span>
                      {t.name}
                    </p>
                    <div className="flex shrink-0 items-baseline gap-3">
                      <span className="tnum text-xs text-dim">{t.qty} un.</span>
                      <span className="tnum text-sm text-cream">{formatCLP(t.monto)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <LinkCard
            href="/admin/inventario"
            label="Stock bajo"
            value={String(lowStock.length)}
            hint="Productos del sexshop bajo el umbral"
            tone={lowStock.length > 0 ? "busy" : undefined}
          />
          <LinkCard
            href="/admin/cupones"
            label="Cupones activos"
            value={String(cuponesActivos)}
            hint="Descuentos vigentes en la tienda"
          />
          <LinkCard
            href="/admin/categorias"
            label="Sub-categorías"
            value={String(new Set(sexshop.map((p) => p.group).filter(Boolean)).size)}
            hint="Categorías del catálogo online"
          />
        </div>
      </div>
    </AdminOnly>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "busy";
}) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p
        className={cn(
          "tnum mt-2 font-display text-2xl",
          tone === "busy" ? "text-busy" : accent ? "text-gold" : "text-cream",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function LinkCard({
  href,
  label,
  value,
  hint,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  tone?: "busy";
}) {
  return (
    <Link
      href={href}
      className="group border border-line bg-surface/40 p-4 transition-colors hover:border-gold/60 hover:bg-surface-2"
    >
      <div className="flex items-baseline justify-between">
        <p className="kicker text-dim">{label}</p>
        <span className="tnum text-dim transition-colors group-hover:text-gold">→</span>
      </div>
      <p className={cn("tnum mt-2 font-display text-2xl", tone === "busy" ? "text-busy" : "text-cream")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-dim">{hint}</p>
    </Link>
  );
}
