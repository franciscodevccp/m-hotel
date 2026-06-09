"use client";

import { useEffect, useState } from "react";
import { getCategory } from "@/lib/pricing";
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
  const { rooms, setRoomStatus } = useAppStore();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- siembra la hora actual al montar (cronómetros en vivo)
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const pending = rooms.filter((r) => r.status === "cleaning");
  const inProgress = pending.filter((r) => r.cleaningStartedAt).length;
  const available = pending.length - inProgress;

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
    </div>
  );
}
