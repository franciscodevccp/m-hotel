"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DAY_LABELS, DURATION_LABELS, formatCLP, formatDate } from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { SHOP_STATUS_CLASS, statusLabelFor } from "@/lib/shop";
import { useAppStore } from "@/lib/store";
import { useVisitor } from "@/lib/visitor";
import { cn } from "@/lib/utils";
import type { ReservationStatus, RoomServiceStatus } from "@/types";

const RES_LABEL: Record<ReservationStatus, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
};
const RES_CLASS: Record<ReservationStatus, string> = {
  confirmed: "text-ok",
  pending: "text-gold",
};
const RS_LABEL: Record<RoomServiceStatus, string> = {
  preparando: "En preparación",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
const RS_CLASS: Record<RoomServiceStatus, string> = {
  preparando: "text-clean",
  entregado: "text-ok",
  cancelado: "text-dim",
};

function Section({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-4 flex items-baseline justify-between border-b border-line pb-2">
        <h2 className="font-display text-2xl text-cream">{title}</h2>
        <span className="tnum text-xs text-dim">{count}</span>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="border border-line bg-surface/40 px-6 py-10 text-center">
      <p className="text-sm text-dim">{text}</p>
    </div>
  );
}

export default function CuentaPage() {
  const { visitor, hydrated, openPrompt } = useVisitor();
  const { reservations, shopOrders, roomService, products } = useAppStore();

  if (!hydrated) return null;

  if (visitor?.mode !== "registered") {
    return (
      <div className="mx-auto max-w-md px-5 py-32 text-center">
        <span className="kicker text-gold">Mi cuenta</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Inicia sesión</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Crea tu cuenta o ingresa para ver tus reservas y pedidos.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Button onClick={openPrompt}>Ingresar o crear cuenta</Button>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.16em] text-dim transition-colors hover:text-muted"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const email = (visitor.email ?? "").toLowerCase();
  const name = visitor.name ?? "";
  const first = name.split(" ")[0] || "cliente";
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  const reservas = reservations.filter(
    (r) => (!!email && r.guestEmail?.toLowerCase() === email) || (!!name && r.guestName === name),
  );
  const pedidosTienda = shopOrders.filter((o) => !!email && o.customerEmail.toLowerCase() === email);
  const pedidosHab = roomService.filter((o) => !!name && o.user === name);

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="kicker text-gold">Mi cuenta</span>
          <h1 className="mt-3 font-display text-4xl leading-tight text-cream sm:text-5xl">
            Hola, {first}
          </h1>
          {visitor.email && <p className="mt-2 text-sm text-muted">{visitor.email}</p>}
        </div>
      </header>

      <div className="space-y-12">
        <Section id="reservas" title="Mis reservas" count={reservas.length}>
          {reservas.length === 0 ? (
            <Empty text="Aún no tienes reservas. Reserva una habitación cuando quieras." />
          ) : (
            <div className="border border-line bg-surface/40">
              <ul>
                {reservas.map((r) => {
                  const cat = getCategory(r.categoryId);
                  return (
                    <li
                      key={r.id}
                      className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-cream">{cat.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {DAY_LABELS[r.dayType]} · {DURATION_LABELS[r.duration]}
                        </p>
                        <p className="mt-0.5 text-xs text-dim">
                          {formatDate(new Date(r.arrivalAt ?? r.createdAt))}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tnum text-sm text-gold">{formatCLP(r.total)}</span>
                        <span className={cn("kicker", RES_CLASS[r.status])}>{RES_LABEL[r.status]}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Section>

        <Section id="pedidos" title="Mis pedidos de la tienda" count={pedidosTienda.length}>
          {pedidosTienda.length === 0 ? (
            <Empty text="No tienes pedidos en la tienda online todavía." />
          ) : (
            <div className="border border-line bg-surface/40">
              <ul>
                {pedidosTienda.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-cream">Pedido #{o.folio}</p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {o.items.map((it) => `${it.quantity}× ${it.name}`).join(" · ")}
                      </p>
                      <p className="mt-0.5 text-xs text-dim">{formatDate(new Date(o.createdAt))}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tnum text-sm text-gold">{formatCLP(o.total)}</span>
                      <span className={cn("kicker", SHOP_STATUS_CLASS[o.status])}>
                        {statusLabelFor(o)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section id="carta" title="Pedidos a la habitación" count={pedidosHab.length}>
          {pedidosHab.length === 0 ? (
            <Empty text="Cuando pidas de la carta con un clic, aparecerá aquí." />
          ) : (
            <div className="border border-line bg-surface/40">
              <ul>
                {pedidosHab.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-cream">
                        {o.items.map((it) => `${it.quantity}× ${nameById.get(it.productId) ?? "Producto"}`).join(" · ")}
                      </p>
                      <p className="mt-0.5 text-xs text-dim">{formatDate(new Date(o.createdAt))}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tnum text-sm text-gold">{formatCLP(o.total)}</span>
                      <span className={cn("kicker", RS_CLASS[o.status])}>{RS_LABEL[o.status]}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
