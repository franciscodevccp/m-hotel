"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { LAUNDRY_PROVIDERS } from "@/data/laundry";
import { formatDateTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LaundryOrder, LaundryStatus } from "@/types";

const STATUS_LABELS: Record<LaundryStatus, string> = {
  enviado: "Enviado",
  en_proceso: "En proceso",
  recibido: "Recibido",
};

const STATUS_CLASS: Record<LaundryStatus, string> = {
  enviado: "text-clean",
  en_proceso: "text-clean",
  recibido: "text-ok",
};

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function elapsed(fromISO: string | undefined, now: number | null): string | null {
  if (!fromISO || now == null) return null;
  const ms = now - new Date(fromISO).getTime();
  if (ms < 60000) return "recién";
  const min = Math.round(ms / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function LavanderiaPage() {
  const { laundry, addLaundryOrder, advanceLaundry, takeLaundry } = useAppStore();
  const { user } = useSession();
  const by = user?.name ?? "Aseo";
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const [provider, setProvider] = useState(LAUNDRY_PROVIDERS[0]);
  const [sheets, setSheets] = useState("");
  const [towels, setTowels] = useState("");
  const sheetsN = Number.parseInt(sheets, 10) || 0;
  const towelsN = Number.parseInt(towels, 10) || 0;
  const valid = sheetsN + towelsN > 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- siembra la hora actual al montar (cronómetros en vivo)
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const list = [...laundry].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const enCurso = laundry.filter((o) => o.status !== "recibido").length;
  const porTomar = laundry.filter((o) => o.status !== "recibido" && !o.takenBy).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const order: LaundryOrder = {
      id: makeId("l"),
      provider,
      sheets: sheetsN,
      towels: towelsN,
      sentAt: new Date().toISOString(),
      status: "enviado",
    };
    addLaundryOrder(order);
    setSheets("");
    setTowels("");
    setProvider(LAUNDRY_PROVIDERS[0]);
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Operación</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Lavandería</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Envíos de ropa de cama y toallas. El aseo libre toma cada envío primero y lo sigue
            hasta que vuelve al recinto.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          Nuevo envío
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Por tomar</p>
          <p className="tnum mt-2 font-display text-2xl text-cream">{porTomar}</p>
        </div>
        <div className="border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">En curso</p>
          <p className="tnum mt-2 font-display text-2xl text-clean">{enCurso}</p>
        </div>
        <div className="border border-line bg-surface/40 p-4">
          <p className="kicker text-dim">Envíos</p>
          <p className="tnum mt-2 font-display text-2xl text-cream">{laundry.length}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay envíos registrados.</p>
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
                    <span className="text-sm text-cream">{o.provider}</span>
                    <span className={cn("kicker", STATUS_CLASS[o.status])}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {o.sheets} sábanas · {o.towels} toallas
                  </p>
                  <p className={cn("mt-1 text-xs", o.takenBy ? "text-cream" : "text-clean")}>
                    {o.takenBy ? `Tomada por ${o.takenBy}` : "Disponible para tomar"}
                    {o.status !== "recibido" && elapsed(o.sentAt, now)
                      ? ` · hace ${elapsed(o.sentAt, now)}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-dim">
                    Enviado {formatDateTime(new Date(o.sentAt))}
                    {o.receivedAt ? ` · Recibido ${formatDateTime(new Date(o.receivedAt))}` : ""}
                  </p>
                </div>
                {o.status !== "recibido" &&
                  (o.takenBy ? (
                    <button
                      type="button"
                      onClick={() => advanceLaundry(o.id)}
                      className="shrink-0 border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      {o.status === "enviado" ? "Marcar en proceso" : "Marcar recibido"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => takeLaundry(o.id, by)}
                      className="shrink-0 border border-gold/60 px-3 py-2 text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-bg"
                    >
                      Tomar
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <Modal title="Nuevo envío" subtitle="Lavandería" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="l-provider">
                Proveedor
              </label>
              <Select
                id="l-provider"
                value={provider}
                onValueChange={setProvider}
                options={LAUNDRY_PROVIDERS.map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="l-sheets">
                  Sábanas
                </label>
                <input
                  id="l-sheets"
                  inputMode="numeric"
                  value={sheets}
                  onChange={(e) => setSheets(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="l-towels">
                  Toallas
                </label>
                <input
                  id="l-towels"
                  inputMode="numeric"
                  value={towels}
                  onChange={(e) => setTowels(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className={fieldClass}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!valid}>
              Registrar envío
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
