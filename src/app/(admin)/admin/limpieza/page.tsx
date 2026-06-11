"use client";

import { useEffect, useMemo, useState } from "react";
import { CleaningReportButton, fmtDuration } from "@/components/admin/CleaningReportButton";
import { Select } from "@/components/ui/Select";
import { cleaningKitFor } from "@/data/cleaning";
import { formatDate, formatTime } from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function elapsed(fromISO: string | undefined, now: number | null): string | null {
  if (!fromISO || now == null) return null;
  const ms = now - new Date(fromISO).getTime();
  if (ms < 60000) return "recién";
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function LimpiezaPage() {
  const { rooms, cleaningLog, setRoomStatus } = useAppStore();
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const [now, setNow] = useState<number | null>(null);
  const [empFilter, setEmpFilter] = useState("all");
  const [page, setPage] = useState(0);

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
        .sort((a, b) => b.at.localeCompare(a.at)),
    [cleaningLog, empFilter],
  );
  const withMin = history.filter((e) => e.minutes != null);
  const totalMin = withMin.reduce((s, e) => s + (e.minutes ?? 0), 0);
  const avgMin = withMin.length > 0 ? Math.round(totalMin / withMin.length) : 0;

  // Consumo de insumos estimado: cada limpieza del historial aporta el kit de
  // su categoría. Respeta el filtro por empleada (consumo por camarera).
  const consumption = useMemo(() => {
    const acc = new Map<string, { label: string; qty: number }>();
    for (const e of history) {
      const room = rooms.find((r) => r.id === e.roomId);
      if (!room) continue;
      for (const k of cleaningKitFor(room.categoryId)) {
        const cur = acc.get(k.productId) ?? { label: k.label, qty: 0 };
        cur.qty += k.quantity;
        acc.set(k.productId, cur);
      }
    }
    return [...acc.values()]
      .map((c) => ({ ...c, qty: Math.round(c.qty * 10) / 10 }))
      .sort((a, b) => b.qty - a.qty);
  }, [history, rooms]);
  const roomNumber = (id: string) => rooms.find((r) => r.id === id)?.number ?? id;
  // El historial de 30 días supera las 200 entradas: se pagina como el resto.
  const PAGE_SIZE = 15;
  const pageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = history.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

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
                Quién hizo cada limpieza y cuánto se demoró. Filtra por empleado y descarga el
                informe.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={empFilter}
                onValueChange={(v) => {
                  setEmpFilter(v);
                  setPage(0);
                }}
                ariaLabel="Empleado"
                className="mt-0 w-52"
                options={[
                  { value: "all", label: "Todos los empleados" },
                  ...employees.map((e) => ({ value: e, label: e })),
                ]}
              />
              <CleaningReportButton entries={cleaningLog} rooms={rooms} employees={employees} />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <Stat label="Limpiezas" value={String(history.length)} />
            <Stat label="Tiempo promedio" value={avgMin > 0 ? fmtDuration(avgMin) : "—"} />
            <Stat label="Tiempo total" value={fmtDuration(totalMin)} />
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
                    <th className="kicker px-5 py-3 font-normal">Empleado</th>
                    <th className="kicker hidden px-5 py-3 font-normal sm:table-cell">Fecha</th>
                    <th className="kicker px-5 py-3 font-normal">Hora</th>
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
                      <td className="tnum px-5 py-3 text-muted">{formatTime(new Date(e.at))}</td>
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

          {/* Consumo de insumos de aseo */}
          <div className="mt-12">
            <h2 className="font-display text-2xl text-cream">Consumo de insumos de aseo</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              Estimado según la medición por categoría: cada limpieza descuenta su kit del
              inventario. El filtro de empleada también aplica aquí.
            </p>
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
                      <td className="tnum px-5 py-3 text-right text-muted">
                        {Number.isInteger(c.qty)
                          ? c.qty
                          : c.qty.toFixed(1).replace(".", ",")}
                      </td>
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
    </div>
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
