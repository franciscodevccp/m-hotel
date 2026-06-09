"use client";

import { useMemo, useState } from "react";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { formatCLP, formatDate } from "@/lib/format";
import { clientesResumen } from "@/lib/shop";
import { useAppStore } from "@/lib/store";

export default function ClientesPage() {
  const { shopOrders } = useAppStore();
  const [query, setQuery] = useState("");

  const clientes = useMemo(() => clientesResumen(shopOrders), [shopOrders]);
  const q = query.trim().toLowerCase();
  const filtered = clientes.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.comuna ?? "").toLowerCase().includes(q),
  );

  const recurrentes = clientes.filter((c) => c.pedidos > 1).length;
  const conCompra = clientes.filter((c) => c.total > 0);
  const gastoProm =
    conCompra.length > 0
      ? Math.round(conCompra.reduce((s, c) => s + c.total, 0) / conCompra.length)
      : 0;

  return (
    <AdminOnly section="Tienda online">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <span className="kicker text-gold">Tienda online</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Clientes</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Quiénes compran en la tienda online, cuánto y hace cuánto. Se arma solo con los pedidos.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Clientes" value={String(clientes.length)} />
          <Stat label="Recurrentes" value={String(recurrentes)} />
          <Stat label="Gasto promedio" value={formatCLP(gastoProm)} />
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, correo o comuna"
          className="mb-4 min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
        />

        {filtered.length === 0 ? (
          <div className="border border-line bg-surface/40 px-6 py-12 text-center">
            <p className="text-sm text-muted">No hay clientes con esa búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-line bg-surface/40">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-dim">
                  <th className="px-4 py-3 font-normal kicker">Cliente</th>
                  <th className="hidden px-4 py-3 font-normal kicker sm:table-cell">Comuna</th>
                  <th className="px-4 py-3 text-right font-normal kicker">Pedidos</th>
                  <th className="px-4 py-3 text-right font-normal kicker">Gastado</th>
                  <th className="hidden px-4 py-3 text-right font-normal kicker md:table-cell">
                    Último
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.email} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="text-cream">{c.name}</p>
                      <p className="text-xs text-dim">{c.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">{c.comuna ?? "—"}</td>
                    <td className="tnum px-4 py-3 text-right text-muted">{c.pedidos}</td>
                    <td className="tnum px-4 py-3 text-right text-gold">{formatCLP(c.total)}</td>
                    <td className="tnum hidden px-4 py-3 text-right text-muted md:table-cell">
                      {formatDate(new Date(c.ultimo))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
