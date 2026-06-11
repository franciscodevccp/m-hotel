"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SEED_GUESTS } from "@/data/guests";
import { formatCLP, formatDate } from "@/lib/format";
import { normalizeRut } from "@/lib/rut";
import { makeId } from "@/lib/id";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Guest } from "@/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className="tnum mt-2 font-display text-2xl text-cream">{value}</p>
    </div>
  );
}

export default function HuespedesPage() {
  const { blacklist, addBlacklistEntry } = useAppStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Guest | null>(null);

  // El historial cruza con la lista negra por RUT: la ficha alerta sola.
  const isBlocked = useMemo(() => {
    const ruts = new Set(
      blacklist.filter((b) => b.rut).map((b) => normalizeRut(b.rut ?? "")),
    );
    return (g: Guest) => Boolean(g.rut && ruts.has(normalizeRut(g.rut)));
  }, [blacklist]);

  const blockReason = (g: Guest) =>
    blacklist.find((b) => b.rut && normalizeRut(b.rut) === normalizeRut(g.rut ?? ""))?.reason;

  const q = query.trim().toLowerCase();
  const filtered = SEED_GUESTS.filter(
    (g) =>
      !q ||
      g.name.toLowerCase().includes(q) ||
      (g.rut ?? "").toLowerCase().replace(/\./g, "").includes(q.replace(/\./g, "")),
  );

  const frecuentes = SEED_GUESTS.filter((g) => g.tags.includes("frecuente")).length;
  const vip = SEED_GUESTS.filter((g) => g.tags.includes("vip")).length;
  const bloqueados = SEED_GUESTS.filter((g) => isBlocked(g)).length;

  function blockGuest(g: Guest) {
    addBlacklistEntry({
      id: makeId("b"),
      name: g.name,
      rut: g.rut,
      reason: "Bloqueado desde el historial de huéspedes.",
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Operación</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Huéspedes</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Historial interno: visitas anteriores, frecuencia, observaciones y alertas. Cruza
          solo con la lista negra al escanear una cédula.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Huéspedes" value={String(SEED_GUESTS.length)} />
        <Stat label="Frecuentes" value={String(frecuentes)} />
        <Stat label="VIP" value={String(vip)} />
        <Stat label="Bloqueados" value={String(bloqueados)} />
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o RUT"
        className="mb-4 min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
      />

      {filtered.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay huéspedes con esa búsqueda.</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-line bg-surface/40">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-dim">
                <th className="kicker px-4 py-3 font-normal">Huésped</th>
                <th className="kicker px-4 py-3 text-right font-normal">Visitas</th>
                <th className="kicker hidden px-4 py-3 text-right font-normal sm:table-cell">
                  Última
                </th>
                <th className="kicker hidden px-4 py-3 text-right font-normal md:table-cell">
                  Gastado
                </th>
                <th className="kicker px-4 py-3 text-right font-normal">Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const blocked = isBlocked(g);
                return (
                  <tr
                    key={g.id}
                    onClick={() => setSelected(g)}
                    className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/60"
                  >
                    <td className="px-4 py-3">
                      <p className="text-cream">{g.name}</p>
                      <p className="tnum text-xs text-dim">{g.rut ?? "Sin RUT"}</p>
                    </td>
                    <td className="tnum px-4 py-3 text-right text-muted">{g.visits}</td>
                    <td className="tnum hidden px-4 py-3 text-right text-muted sm:table-cell">
                      {formatDate(new Date(g.lastVisit))}
                    </td>
                    <td className="tnum hidden px-4 py-3 text-right text-gold md:table-cell">
                      {formatCLP(g.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex flex-wrap justify-end gap-1.5">
                        {blocked && (
                          <span className="border border-busy/60 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-busy">
                            Lista negra
                          </span>
                        )}
                        {g.tags.includes("vip") && <Badge tone="black">VIP</Badge>}
                        {g.tags.includes("frecuente") && <Badge>Frecuente</Badge>}
                        {!blocked && g.tags.length === 0 && (
                          <span className="text-xs text-dim">—</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-dim">
        En producción, el historial se arma solo con cada check-in y cada cobro; aquí se
        muestra con datos de ejemplo.
      </p>

      {selected && (
        <Modal
          title={selected.name}
          subtitle={selected.rut ?? "Sin RUT registrado"}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-5">
            {isBlocked(selected) && (
              <div className="border border-busy/50 bg-busy/10 px-4 py-3" role="alert">
                <p className="text-sm font-medium text-busy">Cliente en lista negra</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {blockReason(selected) ?? "Sin motivo registrado."}
                </p>
              </div>
            )}
            <dl className="space-y-2 border-y border-line py-4">
              <div className="flex items-baseline justify-between gap-6">
                <dt className="kicker text-dim">Visitas</dt>
                <dd className="tnum text-sm text-cream">{selected.visits}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6">
                <dt className="kicker text-dim">Última visita</dt>
                <dd className="tnum text-sm text-cream">
                  {formatDate(new Date(selected.lastVisit))}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6">
                <dt className="kicker text-dim">Gasto acumulado</dt>
                <dd className="tnum text-sm text-gold">{formatCLP(selected.totalSpent)}</dd>
              </div>
              {selected.phone && (
                <div className="flex items-baseline justify-between gap-6">
                  <dt className="kicker text-dim">Teléfono</dt>
                  <dd className="tnum text-sm text-cream">{selected.phone}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-6">
                <dt className="kicker text-dim">Clasificación</dt>
                <dd className="text-sm text-cream">
                  {selected.tags.length > 0
                    ? selected.tags
                        .map((t) => (t === "vip" ? "VIP" : "Frecuente"))
                        .join(" · ")
                    : "Sin clasificación"}
                </dd>
              </div>
            </dl>
            <div>
              <p className="kicker text-dim">Observaciones internas</p>
              <p className={cn("mt-2 text-sm leading-relaxed", selected.notes ? "text-muted" : "text-dim")}>
                {selected.notes ?? "Sin observaciones registradas."}
              </p>
            </div>
            {!isBlocked(selected) && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  blockGuest(selected);
                }}
              >
                Agregar a lista negra
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
