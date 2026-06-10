"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DateField } from "@/components/ui/DateField";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatDate, formatTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AuditEntry, AuditType, Role } from "@/types";

const TYPE_LABEL: Record<AuditType, string> = {
  crear: "Creación",
  editar: "Edición",
  estado: "Cambio de estado",
  eliminar: "Eliminación",
  acceso: "Acceso",
};

const TYPE_CLASS: Record<AuditType, string> = {
  crear: "text-ok",
  editar: "text-clean",
  estado: "text-cream",
  eliminar: "text-busy",
  acceso: "text-dim",
};

const ROLE_LABEL: Record<Role, string> = {
  recepcion: "Recepción",
  admin: "Administración",
  aseo: "Aseo",
  encargado: "Encargado",
};

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos los movimientos" },
  { value: "crear", label: "Creación" },
  { value: "editar", label: "Edición" },
  { value: "estado", label: "Cambio de estado" },
  { value: "eliminar", label: "Eliminación" },
  { value: "acceso", label: "Acceso" },
];

const PAGE_SIZE = 10;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="kicker text-dim">{label}</dt>
      <dd className="text-right text-sm text-cream">{value}</dd>
    </div>
  );
}

export default function AuditoriaPage() {
  const { audit } = useAppStore();
  const { user } = useSession();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      [...audit]
        .filter((a) => typeFilter === "all" || a.type === typeFilter)
        .filter((a) => {
          const day = a.at.slice(0, 10);
          return (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
        })
        .filter(
          (a) =>
            !q ||
            a.action.toLowerCase().includes(q) ||
            (a.target ?? "").toLowerCase().includes(q) ||
            a.userName.toLowerCase().includes(q) ||
            a.module.toLowerCase().includes(q),
        )
        .sort((a, b) => b.at.localeCompare(a.at)),
    [audit, typeFilter, q, fromDate, toDate],
  );

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = list.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Al cambiar filtros, vuelve a la primera página.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset de paginación al filtrar
    setPage(0);
  }, [q, typeFilter, fromDate, toDate]);

  // Auditoría es exclusiva de Administración.
  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Auditoría</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          El registro de movimientos es visible solo para el perfil de administración.
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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Configuración</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Auditoría</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Registro de movimientos del panel: creaciones, ediciones y cambios de estado. Toca uno
          para ver el detalle.
        </p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por acción, usuario o sección"
            className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
          />
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
            ariaLabel="Filtrar por tipo"
            className="mt-0 sm:w-60"
            options={TYPE_FILTERS}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="kicker text-dim">Desde</span>
            <DateField value={fromDate} onChange={setFromDate} ariaLabel="Desde" className="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <span className="kicker text-dim">Hasta</span>
            <DateField value={toDate} onChange={setToDate} ariaLabel="Hasta" align="right" className="w-40" />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay movimientos con ese filtro.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <ul>
            {pageItems.map((a) => (
              <li key={a.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelected(a)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("kicker", TYPE_CLASS[a.type])}>{TYPE_LABEL[a.type]}</span>
                      <span className="kicker text-dim">{a.module}</span>
                    </div>
                    <p className="mt-1 text-sm text-cream">{a.action}</p>
                    {a.target && <p className="text-xs text-muted">{a.target}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-cream">{a.userName}</p>
                    <p className="kicker text-dim">{ROLE_LABEL[a.userRole]}</p>
                    <p className="tnum mt-1 text-xs text-dim">
                      {formatDate(new Date(a.at))} · {formatTime(new Date(a.at))}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="kicker text-center text-dim">
            Página {safePage + 1} de {pageCount} · {list.length} movimientos
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {selected && (
        <Modal title={selected.action} subtitle="Movimiento" onClose={() => setSelected(null)}>
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className={cn("kicker", TYPE_CLASS[selected.type])}>
                {TYPE_LABEL[selected.type]}
              </span>
              <span className="kicker text-dim">{selected.module}</span>
            </div>

            <dl className="space-y-3">
              {selected.target && <Row label="Detalle" value={selected.target} />}
              <Row label="Responsable" value={selected.userName} />
              <Row label="Rol" value={ROLE_LABEL[selected.userRole]} />
              <Row label="Fecha" value={formatDate(new Date(selected.at))} />
              <Row label="Hora" value={formatTime(new Date(selected.at))} />
            </dl>
          </div>
        </Modal>
      )}
    </div>
  );
}
