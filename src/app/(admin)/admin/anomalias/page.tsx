"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatDateTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Anomaly, AnomalyType } from "@/types";

const TYPE_LABELS: Record<AnomalyType, string> = {
  dano: "Daño",
  objeto_olvidado: "Objeto olvidado",
  reclamo: "Reclamo",
  otro: "Otro",
};

const TYPE_ORDER: AnomalyType[] = ["dano", "objeto_olvidado", "reclamo", "otro"];

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

export default function AnomaliasPage() {
  const { anomalies, rooms, maintenanceReports, addAnomaly, resolveAnomaly } = useAppStore();
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState<AnomalyType>("dano");
  const [description, setDescription] = useState("");
  const valid = description.trim().length > 3;

  const list = [...anomalies].sort((a, b) => {
    if (a.status !== b.status) return a.status === "abierta" ? -1 : 1;
    return b.at.localeCompare(a.at);
  });
  const openCount = anomalies.filter((a) => a.status === "abierta").length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const anomaly: Anomaly = {
      id: makeId("a"),
      roomId: roomId || undefined,
      type,
      description: description.trim(),
      at: new Date().toISOString(),
      user: user ? `${user.roleLabel} · ${user.name}` : "Recepción",
      status: "abierta",
    };
    addAnomaly(anomaly);
    setRoomId("");
    setType("dano");
    setDescription("");
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Operación</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Registro de anomalías</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Bitácora de incidentes del turno: daños, objetos olvidados y reclamos, con su
            responsable y seguimiento.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          Registrar
        </Button>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="border border-line bg-surface/40 px-5 py-4">
          <span className="kicker text-dim">Abiertas</span>
          <p className={cn("tnum mt-2 font-display text-2xl", openCount > 0 ? "text-busy" : "text-cream")}>
            {openCount}
          </p>
        </div>
        <div className="border border-line bg-surface/40 px-5 py-4">
          <span className="kicker text-dim">Total</span>
          <p className="tnum mt-2 font-display text-2xl text-cream">{anomalies.length}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">Sin anomalías registradas en el turno.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <ul>
            {list.map((a) => {
              const room = a.roomId ? rooms.find((r) => r.id === a.roomId) : null;
              return (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-cream">{TYPE_LABELS[a.type]}</span>
                      {room && <span className="kicker text-dim">Hab. {room.number}</span>}
                      <span
                        className={cn(
                          "kicker",
                          a.status === "abierta" ? "text-busy" : "text-ok",
                        )}
                      >
                        {a.status === "abierta" ? "Abierta" : "Resuelta"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{a.description}</p>
                    <p className="mt-1 text-xs text-dim">
                      {formatDateTime(new Date(a.at))} · {a.user}
                    </p>
                  </div>
                  {a.status === "abierta" && (
                    <button
                      type="button"
                      onClick={() => resolveAnomaly(a.id)}
                      className="shrink-0 border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      Resolver
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {maintenanceReports.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-xl text-cream">Mantención reportada por aseo</h2>
          <div className="border border-line bg-surface/40">
            <ul>
              {maintenanceReports.map((m) => {
                const room = rooms.find((r) => r.id === m.roomId);
                return (
                  <li
                    key={m.id}
                    className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-cream">Habitación {room?.number ?? m.roomId}</p>
                      {m.note && <p className="mt-1 text-sm leading-relaxed text-muted">{m.note}</p>}
                      <p className="mt-1 text-xs text-dim">
                        {formatDateTime(new Date(m.at))}
                        {m.by ? ` · ${m.by}` : ""}
                      </p>
                    </div>
                    <span className="kicker shrink-0 text-maint">Mantención</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {open && (
        <Modal title="Registrar anomalía" subtitle="Bitácora del turno" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="a-room">
                  Habitación
                </label>
                <Select
                  id="a-room"
                  value={roomId}
                  onValueChange={setRoomId}
                  options={[
                    { value: "", label: "Sin habitación" },
                    ...rooms.map((r) => ({ value: r.id, label: `Habitación ${r.number}` })),
                  ]}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="a-type">
                  Tipo
                </label>
                <Select
                  id="a-type"
                  value={type}
                  onValueChange={(v) => setType(v as AnomalyType)}
                  options={TYPE_ORDER.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
                />
              </div>
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="a-desc">
                Descripción
              </label>
              <textarea
                id="a-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Qué pasó y qué se hizo"
                rows={3}
                className={cn(fieldClass, "resize-none")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!valid}>
              Guardar anomalía
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
