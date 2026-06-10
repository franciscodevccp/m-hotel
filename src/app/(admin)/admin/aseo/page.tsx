"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { formatTime } from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { RoomQrScanModal } from "@/components/admin/RoomQrScanModal";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";

type Tab = "pendientes" | "proceso" | "listas";

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
  const { rooms, cleaningLog, startCleaning, finishCleaning, reportMaintenance } = useAppStore();
  const { user } = useSession();
  const [now, setNow] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("pendientes");
  const [reporting, setReporting] = useState<Room | null>(null);
  const [note, setNote] = useState("");

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
            Escanea el QR de la pieza al entrar: queda a tu nombre y corre el tiempo.
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

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Counter label="Por limpiar" value={pendientes.length} tone="text-clean" />
        <Counter label="En proceso" value={proceso.length} tone="text-cream" />
        <Counter label="Terminadas" value={cleaningLog.length} tone="text-ok" />
      </div>

      <SegmentedToggle
        segments={[
          { value: "pendientes", label: "Por limpiar" },
          { value: "proceso", label: "En proceso" },
          { value: "listas", label: "Listas hoy" },
        ]}
        value={tab}
        onChange={setTab}
        className="w-full"
      />

      <div className="mt-6 space-y-3">
        {tab === "listas" ? (
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
              onFinish={() => finishCleaning(room.id, actor)}
              onReport={() => {
                setReporting(room);
                setNote("");
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
            <button
              type="button"
              disabled
              className="flex w-full items-baseline justify-between border border-dashed border-line px-4 py-3 text-left opacity-70"
            >
              <span className="text-sm text-muted">Adjuntar fotografía del problema</span>
              <span className="kicker text-dim">Próximamente</span>
            </button>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                reportMaintenance(reporting.id, note, by, actor);
                setReporting(null);
              }}
            >
              Reportar mantención
            </Button>
          </div>
        </Modal>
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
