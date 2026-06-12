"use client";

import { useEffect, useState } from "react";
import { IdScanModal } from "@/components/admin/IdScanModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { cleaningChecklistFor } from "@/data/cleaning";
import { SEED_GUESTS } from "@/data/guests";
import { formatCLP, formatTime } from "@/lib/format";
import { exampleIdentity } from "@/lib/idScan";
import { photoToDataUrl } from "@/lib/photo";
import { getCategory } from "@/lib/pricing";
import { normalizeRut } from "@/lib/rut";
import { RoomQrScanModal } from "@/components/admin/RoomQrScanModal";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PaymentMethod, Room, RoomCharge } from "@/types";

type Tab = "pendientes" | "proceso" | "cobros" | "listas";

const PAY_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "debit", label: "Tarjeta débito" },
  { value: "credit", label: "Tarjeta crédito" },
  { value: "transfer", label: "Transferencia" },
];

function elapsed(fromISO: string | undefined, now: number | null): string | null {
  if (!fromISO || now == null) return null;
  const ms = now - new Date(fromISO).getTime();
  if (ms < 60000) return "recién";
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="border border-line bg-surface/40 p-4 text-center">
      <p className={cn("tnum font-display text-3xl", tone)}>{value}</p>
      <p className="kicker mt-1 text-dim">{label}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-line bg-surface/40 px-6 py-16 text-center">
      <p className="font-display text-2xl text-cream">{text}</p>
    </div>
  );
}

/** Adjuntar fotografía (cámara o galería): vista previa y quitar. */
function PhotoField({
  photo,
  onPhoto,
  label = "Adjuntar fotografía",
}: {
  photo: string | null;
  onPhoto: (dataUrl: string | null) => void;
  label?: string;
}) {
  if (photo) {
    return (
      <div className="flex items-center gap-3 border border-line bg-surface/40 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- foto local de la demo */}
        <img
          src={photo}
          alt="Fotografía adjunta"
          className="size-14 shrink-0 rounded-xs border border-line object-cover"
        />
        <span className="min-w-0 flex-1 text-sm text-muted">Fotografía adjunta</span>
        <button
          type="button"
          onClick={() => onPhoto(null)}
          className="shrink-0 text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
        >
          Quitar
        </button>
      </div>
    );
  }
  return (
    <label className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3 border border-dashed border-line px-4 py-3 transition-colors hover:border-gold/60">
      <span className="text-sm text-muted">{label}</span>
      <span className="kicker text-dim">Cámara o galería</span>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            onPhoto(await photoToDataUrl(file));
          } catch {
            onPhoto(null);
          }
        }}
      />
    </label>
  );
}

function RoomTask({
  room,
  now,
  tab,
  onStart,
  onFinish,
  onReport,
}: {
  room: Room;
  now: number | null;
  tab: Tab;
  onStart: () => void;
  onFinish: () => void;
  onReport: () => void;
}) {
  const category = getCategory(room.categoryId);
  const since =
    tab === "pendientes" ? elapsed(room.cleaningSince, now) : elapsed(room.cleaningStartedAt, now);

  return (
    <div className="border border-line bg-surface/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-3xl text-cream">Habitación {room.number}</p>
          <p className="kicker mt-1 text-dim">{category.shortName}</p>
        </div>
        <span className={cn("text-sm", tab === "pendientes" ? "text-clean" : "text-cream")}>
          {tab === "pendientes"
            ? since
              ? `Esperando ${since}`
              : "Por limpiar"
            : since
              ? `En proceso ${since}`
              : "En proceso"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {tab === "pendientes" ? (
          <Button size="lg" className="w-full" onClick={onStart}>
            Empezar limpieza
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={onFinish}>
            Marcar lista
          </Button>
        )}
        <Button size="lg" variant="secondary" className="w-full" onClick={onReport}>
          Reportar mantención
        </Button>
      </div>
    </div>
  );
}

export default function AseoPage() {
  const {
    rooms,
    cleaningLog,
    cleaningKits,
    charges,
    blacklist,
    startCleaning,
    finishCleaning,
    reportMaintenance,
    payCharge,
    updateStayGuest,
  } = useAppStore();
  const { user } = useSession();
  const [now, setNow] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("pendientes");
  const [reporting, setReporting] = useState<Room | null>(null);
  const [note, setNote] = useState("");
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  // Cobro en pieza: ticket seleccionado y método de pago elegido.
  const [paying, setPaying] = useState<RoomCharge | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  // Registro del huésped desde la pieza (escaneo de cédula de la camarera).
  const [scanningRoom, setScanningRoom] = useState<Room | null>(null);
  // Checklist obligatorio antes de marcar la pieza lista (+ observación con foto).
  const [finishing, setFinishing] = useState<Room | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [finishNote, setFinishNote] = useState("");
  const [finishPhoto, setFinishPhoto] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- siembra la hora actual al montar (cronómetros en vivo)
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const by = user?.name;
  const actor = user ? { name: user.name, role: user.role } : undefined;
  const [qrOpen, setQrOpen] = useState(false);
  const [qrMsg, setQrMsg] = useState<{ tone: "ok" | "busy"; text: string } | null>(null);
  const pendientes = rooms.filter((r) => r.status === "cleaning" && !r.cleaningStartedAt);
  const proceso = rooms.filter((r) => r.status === "cleaning" && r.cleaningStartedAt);
  const visible = tab === "pendientes" ? pendientes : tab === "proceso" ? proceso : [];
  // Tickets de cobro pendientes: el bloque se cobra en la pieza al inicio.
  const cobros = charges.filter((c) => c.status === "pendiente");

  function confirmPay() {
    if (!paying) return;
    payCharge(paying.id, payMethod, by, actor);
    const room = rooms.find((r) => r.id === paying.roomId);
    setQrMsg({
      tone: "ok",
      text: `Cobro registrado: ${formatCLP(paying.amount)} en la habitación ${room?.number ?? paying.roomId} (${PAY_METHODS.find((m) => m.value === payMethod)?.label.toLowerCase()}). Entró al corte del turno. Ahora escanea la cédula del huésped.`,
    });
    setPaying(null);
    setPayMethod("cash");
    // Flujo del cliente: cobro → escaneo de carnet → sincronización con
    // recepción. El escáner se abre solo como paso siguiente.
    if (room) setScanningRoom(room);
  }

  /**
   * El escaneo de la camarera registra al huésped y consulta de inmediato la
   * lista negra y el historial (cliente bloqueado, restringido o frecuente).
   */
  function handleGuestScan(name: string, rut: string) {
    if (!scanningRoom) return;
    updateStayGuest(scanningRoom.id, name, rut, actor);
    const blocked = blacklist.find((b) => b.rut && normalizeRut(b.rut) === normalizeRut(rut));
    const known = SEED_GUESTS.find((g) => g.rut && normalizeRut(g.rut) === normalizeRut(rut));
    setQrMsg(
      blocked
        ? {
            tone: "busy",
            text: `Alerta: ${blocked.name} está en la lista negra (${blocked.reason}). Avisa a recepción antes de continuar.`,
          }
        : known && (known.tags.includes("vip") || known.tags.includes("frecuente"))
          ? {
              tone: "ok",
              text: `Cliente ${known.tags.includes("vip") ? "VIP" : "frecuente"}: ${known.name} (${known.visits} visitas). Registrado en la habitación ${scanningRoom.number}; recepción ya lo ve en el tablero.`,
            }
          : {
              tone: "ok",
              text: `Huésped registrado en la habitación ${scanningRoom.number}: ${name || "sin nombre"} · ${rut}. Recepción ya lo ve en el tablero.`,
            },
    );
    setScanningRoom(null);
  }

  /** El QR de la pieza reemplaza el talonario: inicia el aseo a nombre de quien escanea. */
  function handleScannedRoom(roomNumber: number) {
    const room = rooms.find((r) => r.number === roomNumber);
    setQrOpen(false);
    if (!room) {
      setQrMsg({ tone: "busy", text: `La habitación ${roomNumber} no existe en el recinto.` });
      return;
    }
    if (room.status === "cleaning" && !room.cleaningStartedAt) {
      startCleaning(room.id, by, actor);
      setTab("proceso");
      setQrMsg({
        tone: "ok",
        text: `Aseo iniciado en la habitación ${room.number} a nombre de ${by ?? "tu usuario"}. El tiempo está corriendo.`,
      });
      return;
    }
    if (room.status === "cleaning") {
      setQrMsg({
        tone: "busy",
        text: `La habitación ${room.number} ya tiene el aseo en proceso${room.cleaningAssignee ? ` (${room.cleaningAssignee})` : ""}.`,
      });
      return;
    }
    setQrMsg({
      tone: "busy",
      text:
        room.status === "occupied"
          ? `La habitación ${room.number} está ocupada: aún no pasa a limpieza.`
          : room.status === "maintenance"
            ? `La habitación ${room.number} está en mantención.`
            : `La habitación ${room.number} está disponible: no tiene aseo pendiente.`,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="kicker text-gold">Aseo</span>
          <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Mis habitaciones</h1>
          <p className="mt-2 text-sm text-muted">
            Escanea el QR de la pieza al entrar: queda a tu nombre y corre el tiempo. En
            Cobros están los tickets por cobrar en la pieza.
          </p>
        </div>
        <Button size="lg" onClick={() => { setQrMsg(null); setQrOpen(true); }} className="shrink-0">
          Escanear QR
        </Button>
      </div>

      {qrMsg && (
        <div
          className={cn(
            "mb-5 border px-4 py-3 text-sm",
            qrMsg.tone === "ok"
              ? "border-ok/50 bg-ok/10 text-ok"
              : "border-busy/50 bg-busy/10 text-busy",
          )}
        >
          {qrMsg.text}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter label="Por limpiar" value={pendientes.length} tone="text-clean" />
        <Counter label="En proceso" value={proceso.length} tone="text-cream" />
        <Counter label="Cobros" value={cobros.length} tone="text-gold" />
        <Counter label="Terminadas" value={cleaningLog.length} tone="text-ok" />
      </div>

      <SegmentedToggle
        segments={[
          { value: "pendientes", label: "Por limpiar" },
          { value: "proceso", label: "En proceso" },
          { value: "cobros", label: "Cobros" },
          { value: "listas", label: "Listas hoy" },
        ]}
        value={tab}
        onChange={setTab}
        className="w-full"
      />

      <div className="mt-6 space-y-3">
        {tab === "cobros" ? (
          cobros.length === 0 ? (
            <EmptyState text="Sin cobros pendientes ✦" />
          ) : (
            cobros.map((charge) => {
              const room = rooms.find((r) => r.id === charge.roomId);
              if (!room) return null;
              const category = getCategory(room.categoryId);
              const since = elapsed(charge.createdAt, now);
              return (
                <div key={charge.id} className="border border-line bg-surface/40 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-3xl text-cream">Habitación {room.number}</p>
                      <p className="kicker mt-1 text-dim">
                        {category.shortName} · {charge.concept}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tnum font-display text-2xl text-gold">
                        {formatCLP(charge.amount)}
                      </p>
                      {since && <p className="mt-1 text-xs text-dim">Esperando {since}</p>}
                    </div>
                  </div>
                  {charge.courtesies.length > 0 && (
                    <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
                      <span className="kicker text-dim">Preparar y llevar · </span>
                      {charge.courtesies.join(" · ")}
                    </p>
                  )}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        setPayMethod("cash");
                        setPaying(charge);
                      }}
                    >
                      Registrar cobro
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full"
                      onClick={() => setScanningRoom(room)}
                    >
                      Escanear cédula
                    </Button>
                  </div>
                </div>
              );
            })
          )
        ) : tab === "listas" ? (
          cleaningLog.length === 0 ? (
            <EmptyState text="Aún no terminas habitaciones." />
          ) : (
            cleaningLog.map((entry) => {
              const room = rooms.find((r) => r.id === entry.roomId);
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border border-line bg-surface/40 px-5 py-4"
                >
                  <div>
                    <p className="font-display text-xl text-cream">
                      Habitación {room?.number ?? entry.roomId}
                    </p>
                    <p className="kicker mt-1 text-dim">
                      {entry.minutes != null ? `Lista en ${entry.minutes}m` : "Lista"} ·{" "}
                      {formatTime(new Date(entry.at))}
                    </p>
                  </div>
                  <span className="text-sm text-ok">Lista ✦</span>
                </div>
              );
            })
          )
        ) : visible.length === 0 ? (
          <EmptyState text={tab === "pendientes" ? "Todo al día ✦" : "Nada en proceso."} />
        ) : (
          visible.map((room) => (
            <RoomTask
              key={room.id}
              room={room}
              now={now}
              tab={tab}
              onStart={() => startCleaning(room.id, by)}
              onFinish={() => {
                setChecked(new Set());
                setFinishNote("");
                setFinishPhoto(null);
                setFinishing(room);
              }}
              onReport={() => {
                setReporting(room);
                setNote("");
                setReportPhoto(null);
              }}
            />
          ))
        )}
      </div>

      {reporting && (
        <Modal
          title="Reportar mantención"
          subtitle={`Habitación ${reporting.number}`}
          onClose={() => setReporting(null)}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              Describe brevemente el problema. La habitación quedará en mantención y recepción lo
              verá.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ej: ampolleta quemada, llave del jacuzzi gotea"
              className="min-h-[88px] w-full resize-none rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
            />
            <PhotoField
              photo={reportPhoto}
              onPhoto={setReportPhoto}
              label="Adjuntar fotografía del problema"
            />
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                reportMaintenance(reporting.id, note, by, actor, reportPhoto ?? undefined);
                setReporting(null);
                setReportPhoto(null);
              }}
            >
              Reportar mantención
            </Button>
          </div>
        </Modal>
      )}

      {/* Checklist obligatorio antes de confirmar la pieza lista */}
      {finishing && (
        <Modal
          title={`Habitación ${finishing.number} lista`}
          subtitle="Checklist de limpieza"
          onClose={() => setFinishing(null)}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              Marca cada tarea antes de confirmar. La pieza vuelve a Disponible y los insumos
              del aseo se descuentan solos del inventario.
            </p>
            <div className="divide-y divide-line border border-line bg-surface/40">
              {cleaningChecklistFor(finishing.categoryId).map((task) => {
                const done = checked.has(task);
                return (
                  <label
                    key={task}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() =>
                        setChecked((c) => {
                          const next = new Set(c);
                          if (next.has(task)) next.delete(task);
                          else next.add(task);
                          return next;
                        })
                      }
                      className="accent-[var(--gold)]"
                    />
                    <span className={done ? "text-cream" : "text-muted"}>{task}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs leading-relaxed text-dim">
              Insumos de esta categoría:{" "}
              {(cleaningKits[finishing.categoryId] ?? []).map((k) => k.label).join(" · ")}.
            </p>
            <div className="space-y-3 border-t border-line pt-4">
              <label className="kicker text-dim" htmlFor="finish-note">
                Observación (opcional)
              </label>
              <textarea
                id="finish-note"
                value={finishNote}
                onChange={(e) => setFinishNote(e.target.value)}
                rows={2}
                placeholder="Ej: mancha en alfombra, falta un vaso, daño menor"
                className="min-h-[64px] w-full resize-none rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
              />
              {(finishNote.trim() || finishPhoto) && (
                <PhotoField
                  photo={finishPhoto}
                  onPhoto={setFinishPhoto}
                  label="Adjuntar fotografía de la observación"
                />
              )}
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={checked.size < cleaningChecklistFor(finishing.categoryId).length}
              onClick={() => {
                finishCleaning(finishing.id, actor, {
                  checklist: true,
                  note: finishNote,
                  photo: finishPhoto ?? undefined,
                });
                setQrMsg({
                  tone: "ok",
                  text: `Habitación ${finishing.number} lista: checklist completo e insumos descontados del inventario.${finishNote.trim() ? " La observación quedó en el historial." : ""}`,
                });
                setFinishing(null);
              }}
            >
              Confirmar pieza lista
            </Button>
          </div>
        </Modal>
      )}

      {/* Cobro en pieza: registrar el pago del ticket */}
      {paying && (
        <Modal
          title={`Cobro · Habitación ${rooms.find((r) => r.id === paying.roomId)?.number ?? paying.roomId}`}
          subtitle={paying.concept}
          onClose={() => setPaying(null)}
        >
          <div className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <span className="kicker text-dim">Total a cobrar</span>
              <span className="tnum font-display text-2xl text-gold">
                {formatCLP(paying.amount)}
              </span>
            </div>
            {paying.courtesies.length > 0 && (
              <p className="text-sm text-muted">
                <span className="kicker text-dim">Llevar · </span>
                {paying.courtesies.join(" · ")}
              </p>
            )}
            <div>
              <span className="kicker text-dim">Medio de pago</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPayMethod(m.value)}
                    className={cn(
                      "border px-3 py-2.5 text-sm transition-colors",
                      payMethod === m.value
                        ? "border-gold/70 text-gold"
                        : "border-line text-muted hover:border-line-strong hover:text-cream",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-dim">
              El pago queda asociado a la habitación, a tu usuario y al turno en curso.
            </p>
            <Button size="lg" className="w-full" onClick={confirmPay}>
              Confirmar cobro
            </Button>
          </div>
        </Modal>
      )}

      {/* Escaneo de cédula desde la pieza: registra al huésped y consulta lista negra */}
      {scanningRoom && (
        <IdScanModal
          onResult={({ name, rut }) => handleGuestScan(name ?? "", rut ?? "")}
          onSimulate={() => {
            const identity = exampleIdentity(scanningRoom.number);
            handleGuestScan(identity.name, identity.rut);
          }}
          onClose={() => setScanningRoom(null)}
        />
      )}

      {qrOpen && (
        <RoomQrScanModal
          onRoom={handleScannedRoom}
          onExample={
            pendientes[0] ? () => handleScannedRoom(pendientes[0].number) : undefined
          }
          exampleLabel={
            pendientes[0] ? `Usar habitación de ejemplo (${pendientes[0].number})` : undefined
          }
          onClose={() => setQrOpen(false)}
        />
      )}
    </div>
  );
}
