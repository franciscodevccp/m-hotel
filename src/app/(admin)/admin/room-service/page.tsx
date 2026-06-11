"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Select } from "@/components/ui/Select";
import { formatCLP, formatDateTime, formatTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { comandaHtml, printTicket, type TicketLine } from "@/lib/printTicket";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  Product,
  Room,
  RoomServiceItem,
  RoomServiceOrder,
  RoomServiceStatus,
} from "@/types";

const STATUS_LABEL: Record<RoomServiceStatus, string> = {
  preparando: "En preparación",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_CLASS: Record<RoomServiceStatus, string> = {
  preparando: "text-clean",
  entregado: "text-ok",
  cancelado: "text-dim",
};

const STATUS_ORDER: Record<RoomServiceStatus, number> = {
  preparando: 0,
  entregado: 1,
  cancelado: 2,
};

// Categorías del punto de venta táctil (pedido del cliente): cinco accesos
// grandes que agrupan los grupos reales del catálogo.
const POS_FILTERS: { id: string; label: string; groups?: string[]; category?: string }[] = [
  {
    id: "bebidas",
    label: "Bebidas",
    groups: ["Bebidas", "Cervezas", "Cócteles", "Destilados", "Espumantes", "Vinos"],
  },
  {
    id: "comidas",
    label: "Comidas",
    groups: [
      "Sugerencias del M",
      "Platos calientes",
      "Para compartir",
      "Sándwich y pizzas",
      "Acompañamientos",
    ],
  },
  {
    id: "snacks",
    label: "Snacks",
    groups: ["Algo dulce", "Extras", "Spa", "Cigarros", "Celebraciones"],
  },
  { id: "sexshop", label: "Sexshop", category: "sexshop" },
  { id: "cortesias", label: "Cortesías", groups: ["Cortesías"] },
];

export default function RoomServicePage() {
  const {
    roomService,
    rooms,
    products,
    addRoomServiceOrder,
    deliverRoomServiceOrder,
    cancelRoomServiceOrder,
  } = useAppStore();
  const { user } = useSession();
  const userLabel = user ? `${user.roleLabel} · ${user.name}` : "Recepción";
  const actor = user ? { name: user.name, role: user.role } : undefined;

  const nameById = new Map(products.map((p) => [p.id, p.name]));

  const [posOpen, setPosOpen] = useState(false);
  const [printMsg, setPrintMsg] = useState<string | null>(null);

  const list = [...roomService].sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return b.createdAt.localeCompare(a.createdAt);
  });
  const preparing = roomService.filter((o) => o.status === "preparando").length;

  function roomNumber(id: string) {
    return rooms.find((r) => r.id === id)?.number ?? id;
  }

  const POPUP_BLOCKED =
    "El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio y vuelve a intentarlo.";

  function orderLines(o: RoomServiceOrder): TicketLine[] {
    return o.items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      const price = p?.price ?? 0;
      return {
        qty: it.quantity,
        name: p?.name ?? it.productId,
        amount: price > 0 ? price * it.quantity : null,
      };
    });
  }

  /** Imprime la comanda del pedido en la térmica (vía diálogo del sistema). */
  function printOrder(o: RoomServiceOrder) {
    const ok = printTicket(
      comandaHtml({
        room: o.roomId ? `Habitación ${roomNumber(o.roomId)}` : "Pedido online",
        at: formatDateTime(new Date(o.createdAt)),
        user: o.user,
        lines: orderLines(o),
        total: o.total,
        notes: o.notes,
        footer: "Preparar en cocina. El cobro queda asociado a la habitación.",
      }),
      "Comanda room service",
    );
    setPrintMsg(ok ? null : POPUP_BLOCKED);
  }

  /** Ticket de prueba: si sale completo y con corte, la impresora quedó reconocida. */
  function printTest() {
    const ok = printTicket(
      comandaHtml({
        banner: "PRUEBA DE IMPRESORA",
        room: "Habitación 12",
        at: formatDateTime(new Date()),
        user: userLabel,
        lines: [
          { qty: 1, name: "Pizza Pepperoni", amount: 4500 },
          { qty: 2, name: "Cerveza Royal Guard 355 cc", amount: 6000 },
          { qty: 1, name: "Porción vaso espumante", amount: 3000 },
          { qty: 2, name: "Alkas", amount: null },
        ],
        total: 13500,
        notes: "Sin ají en la pizza.",
        footer:
          "Si este ticket salió completo, con corte y legible, la impresora térmica quedó reconocida.",
      }),
      "Prueba de impresora",
    );
    setPrintMsg(ok ? null : POPUP_BLOCKED);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="kicker text-gold">Operación</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Room service</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Pedidos a la habitación. Al tomarlos sale la comanda por la impresora térmica para
            la cocina; al entregarlos baja el stock y el total entra al corte del turno.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button variant="secondary" onClick={printTest}>
            Probar impresora
          </Button>
          <Button onClick={() => setPosOpen(true)}>Nuevo pedido</Button>
        </div>
      </div>

      {printMsg && (
        <div className="mb-5 border border-busy/50 bg-busy/10 px-4 py-3">
          <p className="text-sm text-busy">{printMsg}</p>
        </div>
      )}

      <div className="mb-6 flex gap-3">
        <div className="border border-line bg-surface/40 px-5 py-4">
          <span className="kicker text-dim">En preparación</span>
          <p className={cn("tnum mt-2 font-display text-2xl", preparing > 0 ? "text-clean" : "text-cream")}>
            {preparing}
          </p>
        </div>
        <div className="border border-line bg-surface/40 px-5 py-4">
          <span className="kicker text-dim">Pedidos</span>
          <p className="tnum mt-2 font-display text-2xl text-cream">{roomService.length}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay pedidos de room service.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <ul>
            {list.map((o) => (
              <li
                key={o.id}
                className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-cream">
                      {o.roomId ? `Habitación ${roomNumber(o.roomId)}` : "Pedido online"}
                    </span>
                    <span className={cn("kicker", STATUS_CLASS[o.status])}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {o.items
                      .map((it) => `${it.quantity}× ${nameById.get(it.productId) ?? it.productId}`)
                      .join(" · ")}
                  </p>
                  {o.notes && <p className="mt-1 text-xs italic text-dim">“{o.notes}”</p>}
                  <p className="mt-1 text-xs text-dim">
                    {formatTime(new Date(o.createdAt))}
                    {o.deliveredAt ? ` · Entregado ${formatTime(new Date(o.deliveredAt))}` : ""} · {o.user}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="tnum text-sm text-gold">{formatCLP(o.total)}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => printOrder(o)}
                      className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
                    >
                      Comanda
                    </button>
                    {o.status === "preparando" && (
                      <>
                        <button
                          type="button"
                          onClick={() => cancelRoomServiceOrder(o.id)}
                          className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => deliverRoomServiceOrder(o.id, userLabel, actor)}
                          className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                        >
                          Entregar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {posOpen && (
        <PosSheet
          rooms={rooms}
          products={products}
          onClose={() => setPosOpen(false)}
          onSubmit={(roomId, items, notes, total) => {
            const order: RoomServiceOrder = {
              id: makeId("rs"),
              roomId,
              items,
              total,
              notes: notes.trim() || undefined,
              status: "preparando",
              createdAt: new Date().toISOString(),
              user: userLabel,
            };
            addRoomServiceOrder(order);
            setPosOpen(false);
            // La comanda sale sola al tomar el pedido (flujo del cliente).
            printOrder(order);
          }}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Punto de venta táctil: productos en tarjetas con imagen, filtros por
   categoría y carga con un toque. Pensado para pantalla touch grande.
---------------------------------------------------------------------------- */

function PosSheet({
  rooms,
  products,
  onClose,
  onSubmit,
}: {
  rooms: Room[];
  products: Product[];
  onClose: () => void;
  onSubmit: (roomId: string, items: RoomServiceItem[], notes: string, total: number) => void;
}) {
  const [roomId, setRoomId] = useState(rooms.find((r) => r.status === "occupied")?.id ?? rooms[0]?.id ?? "");
  const [filter, setFilter] = useState("bebidas");
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  // Catálogo del punto de venta: carta de room service + sexshop + cortesías.
  const catalog = useMemo(
    () =>
      products.filter(
        (p) =>
          p.active &&
          (p.channels.includes("room_service") ||
            p.category === "sexshop" ||
            p.group === "Cortesías"),
      ),
    [products],
  );

  const active = POS_FILTERS.find((f) => f.id === filter) ?? POS_FILTERS[0];
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      catalog
        .filter((p) =>
          q
            ? p.name.toLowerCase().includes(q)
            : active.category
              ? p.category === active.category
              : (active.groups ?? []).includes(p.group ?? ""),
        )
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [catalog, active, q],
  );

  const lines = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, n]) => n > 0)
        .map(([productId, quantity]) => {
          const product = products.find((p) => p.id === productId);
          return { productId, quantity, product };
        }),
    [qty, products],
  );
  const total = lines.reduce((s, l) => s + (l.product?.price ?? 0) * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const valid = roomId && lines.length > 0;

  function add(p: Product) {
    setQty((prev) => {
      const current = prev[p.id] ?? 0;
      if (current >= p.stock) return prev; // sin stock no hay carga
      return { ...prev, [p.id]: current + 1 };
    });
  }

  function remove(productId: string) {
    setQty((prev) => {
      const current = prev[productId] ?? 0;
      if (current <= 0) return prev;
      return { ...prev, [productId]: current - 1 };
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Nuevo pedido">
      {/* Encabezado del punto de venta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <span className="kicker text-gold">Room service</span>
          <h2 className="mt-1 font-display text-2xl text-cream">Nuevo pedido</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={roomId}
            onValueChange={setRoomId}
            ariaLabel="Habitación"
            className="mt-0 w-48"
            options={rooms.map((r) => ({
              value: r.id,
              label: `Habitación ${r.number}${r.status === "occupied" ? " · ocupada" : ""}`,
            }))}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-2xl leading-none text-dim transition-colors hover:text-cream"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Catálogo táctil */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            {POS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  setQuery("");
                }}
                className={cn(
                  "min-h-[44px] border px-5 text-sm font-medium uppercase tracking-[0.08em] transition-colors",
                  filter === f.id && !q
                    ? "border-gold bg-gold text-bg"
                    : "border-line text-muted hover:border-gold/60 hover:text-gold",
                )}
              >
                {f.label}
              </button>
            ))}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto"
              className="min-h-[44px] flex-1 rounded-sm border border-line bg-surface px-4 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {visible.length === 0 ? (
              <p className="py-16 text-center text-sm text-dim">
                Sin productos para esta categoría.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {visible.map((p) => {
                  const n = qty[p.id] ?? 0;
                  const out = p.stock <= 0;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "relative flex flex-col border text-left transition-colors",
                        n > 0 ? "border-gold/70 bg-surface-2" : "border-line bg-surface/40",
                        out && "opacity-45",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => add(p)}
                        disabled={out}
                        className="flex flex-1 flex-col text-left disabled:pointer-events-none"
                      >
                        <ImagePlaceholder
                          ratio="square"
                          label="Próximamente"
                          accent={p.ageRestricted}
                          className="w-full border-0 border-b border-line"
                        />
                        <span className="px-3 pt-2 text-sm leading-snug text-cream">
                          <span className="line-clamp-2 min-h-[2.4em]">{p.name}</span>
                        </span>
                        <span className="tnum px-3 pb-2 pt-1 text-sm text-gold">
                          {p.price > 0 ? formatCLP(p.price) : "Cortesía"}
                          {out && <span className="ml-2 text-xs text-busy">Agotado</span>}
                        </span>
                      </button>

                      {n > 0 && (
                        <>
                          <span className="tnum absolute right-2 top-2 flex min-h-7 min-w-7 items-center justify-center rounded-full bg-gold px-2 text-sm font-semibold text-bg">
                            {n}
                          </span>
                          <div className="flex border-t border-line">
                            <button
                              type="button"
                              onClick={() => remove(p.id)}
                              aria-label={`Quitar ${p.name}`}
                              className="min-h-[44px] flex-1 text-lg text-muted transition-colors hover:text-busy"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => add(p)}
                              aria-label={`Agregar ${p.name}`}
                              className="min-h-[44px] flex-1 border-l border-line text-lg text-muted transition-colors hover:text-gold"
                            >
                              +
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pedido en curso */}
        <aside className="flex max-h-[42vh] flex-col border-t border-line bg-surface/40 lg:max-h-none lg:w-[340px] lg:border-l lg:border-t-0">
          <p className="kicker border-b border-line px-5 py-3 text-dim">
            Pedido · Habitación {rooms.find((r) => r.id === roomId)?.number ?? "—"}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
            {lines.length === 0 ? (
              <p className="py-8 text-sm text-dim">
                Toca un producto para cargarlo al pedido.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {lines.map((l) => (
                  <li key={l.productId} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate text-sm text-cream">
                      <span className="tnum text-gold">{l.quantity}×</span> {l.product?.name}
                    </span>
                    <span className="tnum shrink-0 text-sm text-muted">
                      {(l.product?.price ?? 0) > 0
                        ? formatCLP((l.product?.price ?? 0) * l.quantity)
                        : "Cortesía"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-3 border-t border-line px-5 py-4">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas del pedido (opcional)"
              className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
            />
            <div className="flex items-baseline justify-between">
              <span className="kicker text-dim">
                Total · {count} ítem{count === 1 ? "" : "s"}
              </span>
              <span className="tnum font-display text-2xl text-gold">{formatCLP(total)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!valid}
              onClick={() =>
                onSubmit(
                  roomId,
                  lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
                  notes,
                  total,
                )
              }
            >
              Crear pedido
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
