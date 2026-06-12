"use client";

import { useEffect, useMemo, useState } from "react";
import { CleaningReportButton, fmtDuration } from "@/components/admin/CleaningReportButton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatDate, formatTime } from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Category, CleaningKitItem, CleaningKits } from "@/types";

function elapsed(fromISO: string | undefined, now: number | null): string | null {
  if (!fromISO || now == null) return null;
  const ms = now - new Date(fromISO).getTime();
  if (ms < 60000) return "recién";
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Turno operativo según la hora de inicio: día (08–20) o noche (20–08). */
function shiftOf(iso: string): "día" | "noche" {
  const h = new Date(iso).getHours();
  return h >= 8 && h < 20 ? "día" : "noche";
}

function fmtQty(qty: number): string {
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(1).replace(".", ",");
}

export default function LimpiezaPage() {
  const { rooms, categories, cleaningLog, cleaningKits, maintenanceReports, setRoomStatus, updateCleaningKit } =
    useAppStore();
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const actor = user ? { name: user.name, role: user.role } : undefined;
  const [now, setNow] = useState<number | null>(null);
  const [empFilter, setEmpFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editingKit, setEditingKit] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- siembra la hora actual al montar (cronómetros en vivo)
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const pending = rooms.filter((r) => r.status === "cleaning");
  const inProgress = pending.filter((r) => r.cleaningStartedAt).length;
  const available = pending.length - inProgress;

  // Historial (vista de administración): quién hizo cada limpieza y cuánto demoró.
  const employees = useMemo(
    () => [...new Set(cleaningLog.map((e) => e.by).filter((b): b is string => !!b))],
    [cleaningLog],
  );
  const history = useMemo(
    () =>
      [...cleaningLog]
        .filter((e) => empFilter === "all" || e.by === empFilter)
        .filter((e) => roomFilter === "all" || e.roomId === roomFilter)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [cleaningLog, empFilter, roomFilter],
  );
  const withMin = history.filter((e) => e.minutes != null);
  const totalMin = withMin.reduce((s, e) => s + (e.minutes ?? 0), 0);
  const avgMin = withMin.length > 0 ? Math.round(totalMin / withMin.length) : 0;

  // Indicadores pedidos por el cliente: observadas, cumplimiento y turno.
  const observed = useMemo(() => history.filter((e) => e.note), [history]);
  const checklistDone = history.filter((e) => e.checklist !== false).length;
  const compliance = history.length > 0 ? Math.round((checklistDone / history.length) * 100) : 100;
  const byShift = useMemo(() => {
    const acc = { día: { count: 0, min: 0 }, noche: { count: 0, min: 0 } };
    for (const e of history) {
      const s = shiftOf(e.startedAt ?? e.at);
      acc[s].count += 1;
      acc[s].min += e.minutes ?? 0;
    }
    return acc;
  }, [history]);

  // Consumo de insumos estimado: cada limpieza del historial aporta el kit
  // vigente de su categoría. Respeta el filtro por empleada (consumo por camarera).
  const consumption = useMemo(() => {
    const acc = new Map<string, { label: string; qty: number }>();
    for (const e of history) {
      const room = rooms.find((r) => r.id === e.roomId);
      if (!room) continue;
      for (const k of cleaningKits[room.categoryId] ?? []) {
        const cur = acc.get(k.productId) ?? { label: k.label, qty: 0 };
        cur.qty += k.quantity;
        acc.set(k.productId, cur);
      }
    }
    return [...acc.values()]
      .map((c) => ({ ...c, qty: Math.round(c.qty * 10) / 10 }))
      .sort((a, b) => b.qty - a.qty);
  }, [history, rooms, cleaningKits]);
  const roomNumber = (id: string) => rooms.find((r) => r.id === id)?.number ?? id;
  // El historial de 30 días supera las 200 entradas: se pagina como el resto.
  const PAGE_SIZE = 15;
  const pageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = history.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const roomOptions = useMemo(
    () =>
      [...rooms]
        .sort((a, b) => a.number - b.number)
        .map((r) => ({ value: r.id, label: `Habitación ${r.number}` })),
    [rooms],
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Operación</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Limpieza</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Habitaciones que quedaron en limpieza tras el check-out. Quien esté libre la toma primero
          y arranca su cronómetro; aquí ves quién la tomó y cuánto lleva.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Pendientes</p>
          <p className="tnum mt-2 font-display text-2xl text-cream">{pending.length}</p>
        </div>
        <div className="border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">En proceso</p>
          <p className="tnum mt-2 font-display text-2xl text-clean">{inProgress}</p>
        </div>
        <div className="col-span-2 border border-line bg-surface/40 p-4 sm:col-span-1">
          <p className="kicker text-dim">Por tomar</p>
          <p className="tnum mt-2 font-display text-2xl text-cream">{available}</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay habitaciones en limpieza. Todo al día.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <div className="hidden grid-cols-[auto_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3 sm:grid">
            <span className="kicker text-dim">Hab.</span>
            <span className="kicker text-dim">Categoría</span>
            <span className="kicker text-dim">Quién la tomó</span>
            <span className="kicker text-right text-dim">Acción</span>
          </div>
          <ul>
            {pending.map((room) => (
              <li
                key={room.id}
                className="grid grid-cols-1 gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center sm:gap-4"
              >
                <span className="tnum font-display text-xl text-cream">{room.number}</span>
                <div>
                  <p className="text-sm text-muted">{getCategory(room.categoryId).name}</p>
                  <p className={cn("text-xs", room.cleaningStartedAt ? "text-clean" : "text-dim")}>
                    {room.cleaningStartedAt
                      ? `En proceso · ${elapsed(room.cleaningStartedAt, now) ?? "recién"}`
                      : "Por limpiar"}
                  </p>
                </div>
                {room.cleaningStartedAt ? (
                  <p className="text-sm text-cream">Tomada por {room.cleaningAssignee ?? "Aseo"}</p>
                ) : (
                  <p className="text-sm text-clean">Disponible para tomar</p>
                )}
                <button
                  type="button"
                  onClick={() => setRoomStatus(room.id, "available")}
                  className="justify-self-start border border-line px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold sm:justify-self-end"
                >
                  Marcar lista
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin && (
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-cream">Historial de limpiezas</h2>
              <p className="mt-1 text-sm text-muted">
                Quién hizo cada limpieza, cuándo empezó, cuánto demoró y con qué cumplimiento.
                Filtra por empleada o habitación y descarga el informe.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={empFilter}
                onValueChange={(v) => {
                  setEmpFilter(v);
                  setPage(0);
                }}
                ariaLabel="Empleado"
                className="mt-0 w-48"
                options={[
                  { value: "all", label: "Todas las empleadas" },
                  ...employees.map((e) => ({ value: e, label: e })),
                ]}
              />
              <Select
                value={roomFilter}
                onValueChange={(v) => {
                  setRoomFilter(v);
                  setPage(0);
                }}
                ariaLabel="Habitación"
                className="mt-0 w-44"
                options={[{ value: "all", label: "Todas las habitaciones" }, ...roomOptions]}
              />
              <CleaningReportButton entries={cleaningLog} rooms={rooms} employees={employees} />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Limpiezas" value={String(history.length)} />
            <Stat label="Tiempo promedio" value={avgMin > 0 ? fmtDuration(avgMin) : "—"} />
            <Stat
              label="Cumplimiento checklist"
              value={`${compliance}%`}
              tone={compliance < 95 ? "text-clean" : "text-ok"}
            />
            <Stat
              label="Con observaciones"
              value={String(observed.length)}
              tone={observed.length > 0 ? "text-clean" : undefined}
            />
          </div>

          {/* Productividad por turno operativo */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {(["día", "noche"] as const).map((s) => (
              <div key={s} className="border border-line bg-surface/40 p-4">
                <p className="kicker text-dim">Turno {s}</p>
                <p className="tnum mt-2 font-display text-2xl text-cream">
                  {byShift[s].count}
                  <span className="ml-2 text-sm text-dim">limpiezas</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {byShift[s].count > 0
                    ? `Promedio ${fmtDuration(Math.round(byShift[s].min / byShift[s].count))} por habitación`
                    : "Sin limpiezas en el período"}
                </p>
              </div>
            ))}
          </div>

          {history.length === 0 ? (
            <div className="border border-line bg-surface/40 px-6 py-10 text-center">
              <p className="text-sm text-dim">Sin limpiezas registradas para este filtro.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-line bg-surface/40">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-dim">
                    <th className="kicker px-5 py-3 font-normal">Habitación</th>
                    <th className="kicker px-5 py-3 font-normal">Empleada</th>
                    <th className="kicker hidden px-5 py-3 font-normal sm:table-cell">Fecha</th>
                    <th className="kicker hidden px-5 py-3 font-normal sm:table-cell">
                      Inicio · término
                    </th>
                    <th className="kicker px-5 py-3 font-normal">Protocolo</th>
                    <th className="kicker px-5 py-3 text-right font-normal">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((e) => (
                    <tr key={e.id} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-3 text-cream">Habitación {roomNumber(e.roomId)}</td>
                      <td className="px-5 py-3 text-muted">{e.by ?? "—"}</td>
                      <td className="hidden px-5 py-3 text-muted sm:table-cell">
                        {formatDate(new Date(e.at))}
                      </td>
                      <td className="tnum hidden px-5 py-3 text-muted sm:table-cell">
                        {e.startedAt ? `${formatTime(new Date(e.startedAt))} · ` : ""}
                        {formatTime(new Date(e.at))}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "text-xs",
                            e.checklist === false
                              ? "text-clean"
                              : e.note
                                ? "text-clean"
                                : "text-ok",
                          )}
                        >
                          {e.checklist === false
                            ? "Checklist incompleto"
                            : e.note
                              ? "Con observación"
                              : "Completo"}
                        </span>
                      </td>
                      <td className="tnum px-5 py-3 text-right text-gold">{fmtDuration(e.minutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-5 flex items-center justify-between">
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

          {/* Habitaciones observadas: incidencias del aseo y de mantención */}
          <div className="mt-12">
            <h2 className="font-display text-2xl text-cream">Habitaciones observadas</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              Observaciones dejadas por las camareras al cerrar una limpieza y reportes de
              mantención, con fotografía cuando se adjuntó.
            </p>
            {observed.length === 0 && maintenanceReports.length === 0 ? (
              <div className="mt-4 border border-line bg-surface/40 px-6 py-10 text-center">
                <p className="text-sm text-dim">Sin observaciones en el período.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line border border-line bg-surface/40">
                {maintenanceReports.map((r) => (
                  <li key={r.id} className="flex items-start gap-4 px-5 py-4">
                    {r.photo && (
                      // eslint-disable-next-line @next/next/no-img-element -- foto local adjunta en la demo
                      <img
                        src={r.photo}
                        alt={`Fotografía habitación ${roomNumber(r.roomId)}`}
                        className="size-14 shrink-0 rounded-xs border border-line object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-cream">
                        Habitación {roomNumber(r.roomId)}
                        <span className="ml-2 text-xs uppercase tracking-[0.1em] text-busy">
                          Mantención
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {r.note ?? "Sin detalle."} · {formatDate(new Date(r.at))}
                        {r.by ? ` · ${r.by}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                {observed.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-start gap-4 px-5 py-4">
                    {e.photo && (
                      // eslint-disable-next-line @next/next/no-img-element -- foto local adjunta en la demo
                      <img
                        src={e.photo}
                        alt={`Fotografía habitación ${roomNumber(e.roomId)}`}
                        className="size-14 shrink-0 rounded-xs border border-line object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-cream">
                        Habitación {roomNumber(e.roomId)}
                        <span className="ml-2 text-xs uppercase tracking-[0.1em] text-clean">
                          Observación
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {e.note} · {formatDate(new Date(e.at))}
                        {e.by ? ` · ${e.by}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Consumo de insumos de aseo */}
          <div className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-cream">Consumo de insumos de aseo</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                  Estimado según la medición por categoría: cada limpieza descuenta su kit de la
                  bodega de lavandería. El filtro de empleada también aplica aquí.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditingKit(true)}>
                Ajustar kit por categoría
              </Button>
            </div>
            <div className="mt-4 overflow-hidden border border-line bg-surface/40">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-dim">
                    <th className="kicker px-5 py-3 font-normal">Insumo</th>
                    <th className="kicker px-5 py-3 text-right font-normal">
                      Unidades (30 días)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consumption.map((c) => (
                    <tr key={c.label} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-3 text-cream">{c.label}</td>
                      <td className="tnum px-5 py-3 text-right text-muted">{fmtQty(c.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Las cantidades por aseo son configurables por tipo de habitación (la línea
              Jacuzzi consume más). Fracciones = parte de un bidón o envase.
            </p>
          </div>
        </section>
      )}

      {editingKit && (
        <KitEditorModal
          categories={categories}
          kits={cleaningKits}
          onClose={() => setEditingKit(false)}
          onSave={(categoryId, items) => {
            updateCleaningKit(categoryId, items, actor);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className={cn("tnum mt-2 font-display text-2xl", tone ?? "text-cream")}>{value}</p>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Editor del kit de insumos: administración ajusta cuánto descuenta cada
   limpieza, por categoría de habitación.
---------------------------------------------------------------------------- */

function KitEditorModal({
  categories,
  kits,
  onClose,
  onSave,
}: {
  categories: Category[];
  kits: CleaningKits;
  onClose: () => void;
  onSave: (categoryId: Category["id"], items: CleaningKitItem[]) => void;
}) {
  const [categoryId, setCategoryId] = useState<Category["id"]>(categories[0]?.id ?? "standard-vip");
  const [draft, setDraft] = useState<CleaningKitItem[]>(kits[categoryId] ?? []);
  const [savedMsg, setSavedMsg] = useState(false);

  function selectCategory(id: Category["id"]) {
    setCategoryId(id);
    setDraft(kits[id] ?? []);
    setSavedMsg(false);
  }

  function setQty(productId: string, raw: string) {
    const value = Number(raw.replace(",", "."));
    setDraft((prev) =>
      prev.map((it) =>
        it.productId === productId
          ? { ...it, quantity: Number.isFinite(value) && value >= 0 ? value : it.quantity }
          : it,
      ),
    );
    setSavedMsg(false);
  }

  return (
    <Modal
      title="Kit de insumos por categoría"
      subtitle="Cuánto descuenta cada limpieza"
      onClose={onClose}
    >
      <div className="space-y-5">
        <Select
          value={categoryId}
          onValueChange={(v) => selectCategory(v as Category["id"])}
          ariaLabel="Categoría"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div className="border border-line">
          <div className="grid grid-cols-[1fr_104px] gap-3 border-b border-line bg-surface/40 px-4 py-2">
            <span className="kicker text-dim">Insumo</span>
            <span className="kicker text-right text-dim">Por aseo</span>
          </div>
          {draft.map((it) => (
            <div
              key={it.productId}
              className="grid grid-cols-[1fr_104px] items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
            >
              <span className="truncate text-sm text-cream">{it.label}</span>
              <input
                inputMode="decimal"
                value={fmtQty(it.quantity)}
                onChange={(e) => setQty(it.productId, e.target.value)}
                aria-label={`Consumo por aseo de ${it.label}`}
                className="tnum min-h-[36px] w-full rounded-sm border border-line bg-surface px-2 py-1.5 text-right text-sm text-cream focus:border-gold/60 focus-visible:outline-none"
              />
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-dim">
          Fracciones = parte de un bidón o envase (0,1 = un décimo del formato de compra). El
          cambio rige para las próximas limpiezas de la categoría y queda en auditoría.
        </p>

        <div className="flex items-center gap-3">
          <Button
            className="flex-1"
            onClick={() => {
              onSave(categoryId, draft);
              setSavedMsg(true);
            }}
          >
            Guardar medición
          </Button>
          <span className={cn("text-xs", savedMsg ? "text-ok" : "text-transparent")} aria-live="polite">
            Guardado
          </span>
        </div>
      </div>
    </Modal>
  );
}
