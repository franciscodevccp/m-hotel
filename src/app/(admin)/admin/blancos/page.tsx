"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { LINEN_KIT } from "@/data/linens";
import { formatDateTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { getCategory } from "@/lib/pricing";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LinenIncidentKind, LinenType, Room } from "@/types";

const LINEN_LABEL: Record<LinenType, string> = {
  sabana: "Sábanas",
  toalla: "Toallas",
  bata: "Batas",
};

const LINEN_SINGULAR: Record<LinenType, string> = {
  sabana: "sábana",
  toalla: "toalla",
  bata: "bata",
};

const KIND_LABEL: Record<LinenIncidentKind, string> = {
  mancha: "Mancha",
  rotura: "Rotura",
  perdida: "Pérdida",
  quemadura: "Quemadura",
  desgaste: "Desgaste",
};

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function unitLabel(type: LinenType, qty: number): string {
  return qty === 1 ? LINEN_SINGULAR[type] : LINEN_LABEL[type].toLowerCase();
}

/** Set de blancos que ocupa una habitación, según su categoría. */
function linenKit(room: Room): Record<LinenType, number> {
  const name = getCategory(room.categoryId).name.toLowerCase();
  const premium = name.includes("jacuzzi") || name.includes("premium") || name.includes("suite");
  return premium ? LINEN_KIT.premium : LINEN_KIT.base;
}

export default function BlancosPage() {
  const { linens, linenIncidents, laundry, rooms, addLinenIncident } = useAppStore();
  const { user } = useSession();
  const by = user?.name ?? "Recepción";

  const [open, setOpen] = useState(false);
  const [usageType, setUsageType] = useState<LinenType | null>(null);
  const [type, setType] = useState<LinenType>("sabana");
  const [kind, setKind] = useState<LinenIncidentKind>("mancha");
  const [quantity, setQuantity] = useState("1");
  const [room, setRoom] = useState("");
  const [note, setNote] = useState("");
  const [retired, setRetired] = useState(true);

  // "En lavado" sale de las cargas activas de lavandería.
  const active = laundry.filter((l) => l.stage !== "listo");
  const enLavado: Record<LinenType, number> = {
    sabana: active.reduce((s, l) => s + l.sheets, 0),
    toalla: active.reduce((s, l) => s + l.towels, 0),
    bata: active.reduce((s, l) => s + l.robes, 0),
  };
  // "En uso" sale de las habitaciones ocupadas (cada una usa su set de blancos).
  const occupied = rooms.filter((r) => r.status === "occupied");
  const enUso: Record<LinenType, number> = occupied.reduce(
    (acc, r) => {
      const k = linenKit(r);
      acc.sabana += k.sabana;
      acc.toalla += k.toalla;
      acc.bata += k.bata;
      return acc;
    },
    { sabana: 0, toalla: 0, bata: 0 },
  );

  const deBaja = (t: LinenType) =>
    linenIncidents.filter((i) => i.type === t && i.retired).reduce((s, i) => s + i.quantity, 0);

  const incidents = [...linenIncidents].sort((a, b) => b.at.localeCompare(a.at));
  const qN = Number.parseInt(quantity, 10) || 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (qN <= 0) return;
    addLinenIncident({
      id: makeId("li"),
      type,
      kind,
      quantity: qN,
      retired,
      roomId: room.trim() || undefined,
      note: note.trim() || undefined,
      by,
      at: new Date().toISOString(),
    });
    setType("sabana");
    setKind("mancha");
    setQuantity("1");
    setRoom("");
    setNote("");
    setRetired(true);
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Operación</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Blancos</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Ropa blanca del recinto: sábanas, toallas y batas. Stock total, disponibilidad y los
            percances (manchas, roturas, pérdidas) que sacan piezas de circulación.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          Reportar percance
        </Button>
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        {linens.map((s) => {
          const lavado = enLavado[s.type];
          const baja = deBaja(s.type);
          const uso = enUso[s.type];
          const disp = Math.max(0, s.total - uso - lavado - baja);
          const pct = s.total > 0 ? Math.round((disp / s.total) * 100) : 0;
          return (
            <div key={s.type} className="border border-line bg-surface/40 p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-cream">{LINEN_LABEL[s.type]}</h2>
                <span className="tnum text-sm text-dim">{s.total} en total</span>
              </div>

              <p className="tnum mt-4 font-display text-4xl text-gold">{disp}</p>
              <p className="kicker text-dim">disponibles · {pct}%</p>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setUsageType(s.type)}
                  className="rounded-sm py-1 transition-colors hover:bg-surface-2"
                >
                  <p className="tnum text-base text-cream underline decoration-dotted decoration-1 underline-offset-4">
                    {uso}
                  </p>
                  <p className="kicker mt-0.5 text-gold/80">En uso ›</p>
                </button>
                <div className="py-1">
                  <p className="tnum text-base text-clean">{lavado}</p>
                  <p className="kicker mt-0.5 text-dim">En lavado</p>
                </div>
                <div className="py-1">
                  <p className={cn("tnum text-base", baja > 0 ? "text-busy" : "text-cream")}>{baja}</p>
                  <p className="kicker mt-0.5 text-dim">De baja</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 font-display text-xl text-cream">Percances</h2>
      {incidents.length === 0 ? (
        <div className="border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay percances registrados.</p>
        </div>
      ) : (
        <div className="border border-line bg-surface/40">
          <ul>
            {incidents.map((i) => (
              <li
                key={i.id}
                className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="kicker text-busy">{KIND_LABEL[i.kind]}</span>
                    <span className="kicker text-dim">{LINEN_LABEL[i.type]}</span>
                  </div>
                  <p className="mt-1 text-sm text-cream">
                    {i.quantity} {unitLabel(i.type, i.quantity)}
                    {i.roomId ? ` · Hab. ${i.roomId}` : ""}
                  </p>
                  {i.note && <p className="text-xs text-muted">{i.note}</p>}
                  <p className="mt-1 text-xs text-dim">
                    {i.by ?? "—"} · {formatDateTime(new Date(i.at))}
                  </p>
                </div>
                <span className={cn("kicker shrink-0", i.retired ? "text-busy" : "text-clean")}>
                  {i.retired ? "De baja" : "Recuperable"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {usageType && (
        <Modal
          title={`En uso · ${LINEN_LABEL[usageType]}`}
          subtitle="Por habitación ocupada"
          onClose={() => setUsageType(null)}
        >
          {occupied.length === 0 ? (
            <p className="text-sm text-muted">No hay habitaciones ocupadas en este momento.</p>
          ) : (
            <div>
              <ul className="max-h-[52vh] divide-y divide-line overflow-y-auto">
                {[...occupied]
                  .sort((a, b) => a.number - b.number)
                  .map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 py-2.5">
                      <span className="text-sm text-cream">
                        Habitación {r.number}
                        <span className="kicker ml-2 text-dim">
                          {getCategory(r.categoryId).shortName}
                        </span>
                      </span>
                      <span className="tnum text-sm text-muted">
                        {linenKit(r)[usageType]} {unitLabel(usageType, linenKit(r)[usageType])}
                      </span>
                    </li>
                  ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="kicker text-dim">Total en uso</span>
                <span className="tnum text-sm text-gold">
                  {enUso[usageType]} {unitLabel(usageType, enUso[usageType])}
                </span>
              </div>
            </div>
          )}
        </Modal>
      )}

      {open && (
        <Modal title="Reportar percance" subtitle="Blancos" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim">Tipo</label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as LinenType)}
                  ariaLabel="Tipo de blanco"
                  options={[
                    { value: "sabana", label: "Sábanas" },
                    { value: "toalla", label: "Toallas" },
                    { value: "bata", label: "Batas" },
                  ]}
                />
              </div>
              <div>
                <label className="kicker text-dim">Motivo</label>
                <Select
                  value={kind}
                  onValueChange={(v) => setKind(v as LinenIncidentKind)}
                  ariaLabel="Motivo del percance"
                  options={[
                    { value: "mancha", label: "Mancha" },
                    { value: "rotura", label: "Rotura" },
                    { value: "perdida", label: "Pérdida" },
                    { value: "quemadura", label: "Quemadura" },
                    { value: "desgaste", label: "Desgaste" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim" htmlFor="li-qty">
                  Cantidad
                </label>
                <input
                  id="li-qty"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
                  placeholder="1"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="li-room">
                  Habitación (opcional)
                </label>
                <input
                  id="li-room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Ej: 207"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className="kicker text-dim" htmlFor="li-note">
                Nota (opcional)
              </label>
              <textarea
                id="li-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Ej: mancha de vino, rasgón en la orilla"
                className="mt-2 min-h-[72px] w-full resize-none rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={retired}
                onChange={(e) => setRetired(e.target.checked)}
                className="size-4 accent-gold"
              />
              <span className="text-sm text-muted">Dar de baja (sale de circulación)</span>
            </label>

            <Button type="submit" className="w-full" disabled={qN <= 0}>
              Registrar percance
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
