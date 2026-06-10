"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LAUNDRY_MACHINES } from "@/data/laundry";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LaundryLoad, LaundryStage } from "@/types";

const STAGE_LABEL: Record<LaundryStage, string> = {
  recolectado: "Recolectado",
  lavando: "Lavando",
  secando: "Secando",
  doblando: "Doblando",
  listo: "Listo",
};

const STAGE_CLASS: Record<LaundryStage, string> = {
  recolectado: "text-dim",
  lavando: "text-clean",
  secando: "text-clean",
  doblando: "text-gold",
  listo: "text-ok",
};

const fieldClass =
  "tnum mt-2 h-12 w-full rounded-sm border border-line bg-surface text-center text-lg text-cream focus:border-gold/60 focus-visible:outline-none";

function elapsed(fromISO: string | undefined, now: number | null): string | null {
  if (!fromISO || now == null) return null;
  const ms = now - new Date(fromISO).getTime();
  if (ms < 60000) return "recién";
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function actionLabel(load: LaundryLoad): string {
  switch (load.stage) {
    case "recolectado":
      return load.by ? "Iniciar lavado" : "Tomar";
    case "lavando":
      return "Pasar a secado";
    case "secando":
      return "Pasar a doblado";
    case "doblando":
      return "Marcar listo";
    default:
      return "";
  }
}

export default function LavanderiaPage() {
  const { laundry, addLaundryLoad, advanceLaundryLoad, takeLaundryLoad } = useAppStore();
  const { user } = useSession();
  const by = user?.name ?? "Aseo";
  const [now, setNow] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [sheets, setSheets] = useState("");
  const [towels, setTowels] = useState("");
  const [robes, setRobes] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- siembra la hora actual al montar (cronómetros en vivo)
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const sheetsN = Number.parseInt(sheets, 10) || 0;
  const towelsN = Number.parseInt(towels, 10) || 0;
  const robesN = Number.parseInt(robes, 10) || 0;
  const valid = sheetsN + towelsN + robesN > 0;

  const list = [...laundry].sort((a, b) => {
    const aDone = a.stage === "listo" ? 1 : 0;
    const bDone = b.stage === "listo" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const activas = laundry.filter((l) => l.stage !== "listo").length;
  const enUso = laundry.filter(
    (l) => l.machine && (l.stage === "lavando" || l.stage === "secando"),
  ).length;
  const porTomar = laundry.filter((l) => l.stage === "recolectado" && !l.by).length;
  const listas = laundry.filter((l) => l.stage === "listo").length;

  const machineLoad = (name: string) =>
    laundry.find((l) => l.machine === name && (l.stage === "lavando" || l.stage === "secando"));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    addLaundryLoad({
      id: makeId("lw"),
      sheets: sheetsN,
      towels: towelsN,
      robes: robesN,
      stage: "recolectado",
      createdAt: new Date().toISOString(),
    });
    setSheets("");
    setTowels("");
    setRobes("");
    setOpen(false);
  }

  function act(load: LaundryLoad) {
    if (load.stage === "recolectado" && !load.by) takeLaundryLoad(load.id, by);
    else advanceLaundryLoad(load.id);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Operación</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Lavandería</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Lavado propio del recinto. Cada carga de ropa de cama y toallas avanza por las máquinas:
            lavado, secado, doblado y lista. El aseo libre toma la siguiente.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          Nuevo lavado
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cargas activas" value={activas} tone="text-clean" />
        <Stat label="Máquinas en uso" value={enUso} />
        <Stat label="Por tomar" value={porTomar} tone={porTomar > 0 ? "text-gold" : undefined} />
        <Stat label="Listas" value={listas} tone="text-ok" />
      </div>

      {/* Máquinas propias */}
      <h2 className="mb-3 font-display text-xl text-cream">Máquinas</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {LAUNDRY_MACHINES.map((m) => {
          const load = machineLoad(m.name);
          return (
            <div
              key={m.name}
              className={cn(
                "border bg-surface/40 p-4",
                load ? "border-gold/40" : "border-line",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-cream">{m.name}</span>
                <span className="kicker text-dim">
                  {m.type === "lavadora" ? "Lavadora" : "Secadora"}
                </span>
              </div>
              {load ? (
                <>
                  <p className="mt-2 text-sm text-clean">
                    {STAGE_LABEL[load.stage]} · {elapsed(load.startedAt, now) ?? "recién"}
                  </p>
                  <p className="text-xs text-dim">
                    {load.sheets} sáb · {load.towels} toa · {load.robes} bat
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-dim">Libre</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Cargas */}
      <h2 className="mb-3 font-display text-xl text-cream">Cargas</h2>
      {list.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay cargas de lavado.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <ul>
            {list.map((l) => (
              <li
                key={l.id}
                className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("kicker", STAGE_CLASS[l.stage])}>{STAGE_LABEL[l.stage]}</span>
                    {l.machine && <span className="kicker text-dim">{l.machine}</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {l.sheets} sábanas · {l.towels} toallas · {l.robes} batas
                  </p>
                  <p className="mt-1 text-xs text-dim">
                    {l.by ? `Tomada por ${l.by}` : "Disponible para tomar"}
                    {l.stage !== "listo" && l.startedAt && elapsed(l.startedAt, now)
                      ? ` · ${elapsed(l.startedAt, now)} en esta etapa`
                      : ""}
                  </p>
                </div>
                {l.stage !== "listo" && (
                  <button
                    type="button"
                    onClick={() => act(l)}
                    className={cn(
                      "shrink-0 px-3 py-2 text-xs uppercase tracking-[0.14em] transition-colors",
                      l.stage === "recolectado" && !l.by
                        ? "border border-gold/60 text-gold hover:bg-gold hover:text-bg"
                        : "border border-line text-muted hover:border-gold/70 hover:text-gold",
                    )}
                  >
                    {actionLabel(l)}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <Modal title="Nuevo lavado" subtitle="Lavandería" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              Registra la carga de ropa sucia. Queda como recolectada y el aseo la toma para empezar
              el lavado.
            </p>
            <div className="grid grid-cols-3 gap-3">
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
              <div>
                <label className="kicker text-dim" htmlFor="l-robes">
                  Batas
                </label>
                <input
                  id="l-robes"
                  inputMode="numeric"
                  value={robes}
                  onChange={(e) => setRobes(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className={fieldClass}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!valid}>
              Registrar carga
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className={cn("tnum mt-2 font-display text-2xl", tone ?? "text-cream")}>{value}</p>
    </div>
  );
}
