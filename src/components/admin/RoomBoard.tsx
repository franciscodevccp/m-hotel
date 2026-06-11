"use client";

import { useEffect, useState } from "react";
import { COURTESY_MENU, openingPackFor, type CourtesyItem } from "@/data/courtesies";
import { IdScanModal } from "@/components/admin/IdScanModal";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { DAY_LABELS, DURATION_LABELS, formatCLP, formatTime } from "@/lib/format";
import { exampleIdentity } from "@/lib/idScan";
import { DURATIONS, getCategory, isBlackLine, priceFor } from "@/lib/pricing";
import { formatRut, normalizeRut } from "@/lib/rut";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { DayType, Duration, PaymentMethod } from "@/types";
import { RoomCell } from "./RoomCell";
import { ROOM_STATUS, ROOM_STATUS_ORDER } from "./roomStatus";

type View = "main" | "checkin" | "checkout" | "move";

function todayDayType(): DayType {
  const day = new Date().getDay();
  return day >= 1 && day <= 4 ? "weekday" : "weekend";
}

function remainingLabel(occupiedUntil: string | undefined, now: number | null): string | null {
  if (!occupiedUntil || now == null) return null;
  const ms = new Date(occupiedUntil).getTime() - now;
  if (ms <= 0) return "Finalizando";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const PAY_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "debit", label: "Tarjeta débito" },
  { value: "credit", label: "Tarjeta crédito" },
  { value: "transfer", label: "Transferencia" },
];


/** Lista "1× Papel higiénico · 2× Alkas · …" del paquete de ingreso de una categoría. */
function openingPackLabel(items: CourtesyItem[]): string {
  return items.map((c) => `${c.quantity}× ${c.label}`).join(" · ");
}

export function RoomBoard() {
  const {
    rooms,
    blacklist,
    charges,
    setRoomStatus,
    checkIn,
    checkOut,
    moveRoom,
    extendStay,
    logCourtesy,
  } = useAppStore();
  const { user, readOnly } = useSession();
  const actor = user ? { name: user.name, role: user.role } : undefined;
  const [courtesyMsg, setCourtesyMsg] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("main");
  const [query, setQuery] = useState("");

  // Estado de los formularios del modal.
  const [day, setDay] = useState<DayType>("weekday");
  const [duration, setDuration] = useState<Duration | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestRut, setGuestRut] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod | "none">("cash");
  const [moveTarget, setMoveTarget] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- siembra la hora actual al montar (tablero en vivo)
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const current = selectedId ? (rooms.find((r) => r.id === selectedId) ?? null) : null;
  const userLabel = user ? `${user.roleLabel} · ${user.name}` : undefined;
  // Con la pieza ocupada, el modal crece y las cortesías quedan a la vista al costado.
  const courtesySidebar = Boolean(current && current.status === "occupied" && !readOnly);

  // Consulta automática contra la lista negra al escanear o escribir el RUT.
  const blMatch =
    guestRut.replace(/[^0-9kK]/g, "").length >= 7
      ? blacklist.find((b) => b.rut && normalizeRut(b.rut) === normalizeRut(guestRut))
      : undefined;

  // Cobro en pieza de la habitación abierta: lo pendiente lo cobra la camarera.
  const currentPending = current
    ? charges.filter((c) => c.roomId === current.id && c.status === "pendiente")
    : [];
  const currentPendingSum = currentPending.reduce((s, c) => s + c.amount, 0);
  const paidLabel = current?.stay?.paymentMethod
    ? PAY_METHODS.find((m) => m.value === current.stay?.paymentMethod)?.label
    : undefined;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rooms.filter(
        (r) =>
          String(r.number).includes(q) ||
          (r.stay?.guestName ?? "").toLowerCase().includes(q),
      )
    : rooms;

  function open(id: string) {
    setSelectedId(id);
    setView("main");
    setDay(todayDayType());
    setDuration(null);
    setGuestName("");
    setGuestRut("");
    setScanOpen(false);
    setPayMethod("cash");
    setMoveTarget("");
    setCourtesyMsg(null);
  }

  function quickCourtesy(roomId: string, item: CourtesyItem) {
    logCourtesy(roomId, item.productId, item.quantity, actor);
    setCourtesyMsg(`Registrada: ${item.quantity}× ${item.label}`);
  }

  /** Respaldo del lector: rellena con una identidad de ejemplo (demo sin carnet). */
  function fillExampleId(roomNumber: number) {
    const identity = exampleIdentity(roomNumber);
    setGuestName(identity.name);
    setGuestRut(identity.rut);
    setScanOpen(false);
  }

  function close() {
    setSelectedId(null);
  }

  return (
    <>
      {/* Búsqueda rápida de habitación o huésped */}
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar habitación o huésped"
          className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-sm"
        />
      </div>

      {/* Leyenda de estados */}
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
        {ROOM_STATUS_ORDER.map((status) => (
          <span key={status} className="flex items-center gap-2 text-xs text-muted">
            <span className={cn("size-2 rounded-full", ROOM_STATUS[status].dot)} aria-hidden />
            {ROOM_STATUS[status].label}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="border border-line bg-surface/40 px-6 py-12 text-center text-sm text-muted">
          Sin resultados para “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((room) => (
            <RoomCell key={room.id} room={room} now={now} onSelect={(r) => open(r.id)} />
          ))}
        </div>
      )}

      {current && (
        <Modal
          title={`Habitación ${current.number}`}
          subtitle={getCategory(current.categoryId).name}
          onClose={close}
          wide={view === "main" && courtesySidebar}
        >
          {/* ---- Vista principal ---- */}
          {view === "main" && (
            <div className={cn(courtesySidebar && "sm:grid sm:grid-cols-[1fr_280px] sm:gap-7")}>
            <div className="space-y-5">
              {/* Foto de referencia de la pieza (pendiente de producción) */}
              <ImagePlaceholder
                ratio="landscape"
                label="Fotografía de la habitación · próximamente"
                accent={isBlackLine(current.categoryId)}
                className="max-h-44 w-full"
              />

              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Estado</span>
                <span className={cn("text-sm", ROOM_STATUS[current.status].text)}>
                  {ROOM_STATUS[current.status].label}
                </span>
              </div>

              {current.status === "occupied" && (
                <dl className="space-y-2 border-y border-line py-4">
                  {current.stay?.guestName && (
                    <div className="flex items-baseline justify-between gap-6">
                      <dt className="kicker text-dim">Huésped</dt>
                      <dd className="text-sm text-cream">{current.stay.guestName}</dd>
                    </div>
                  )}
                  {current.stay?.guestRut && (
                    <div className="flex items-baseline justify-between gap-6">
                      <dt className="kicker text-dim">RUT</dt>
                      <dd className="tnum text-sm text-cream">{current.stay.guestRut}</dd>
                    </div>
                  )}
                  {current.stay && (
                    <>
                      <div className="flex items-baseline justify-between gap-6">
                        <dt className="kicker text-dim">Bloque</dt>
                        <dd className="text-sm text-cream">
                          {DURATION_LABELS[current.stay.duration]} · {DAY_LABELS[current.stay.dayType]}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-6">
                        <dt className="kicker text-dim">Total estancia</dt>
                        <dd className="tnum text-sm text-gold">{formatCLP(current.stay.total)}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex items-baseline justify-between gap-6">
                    <dt className="kicker text-dim">Término</dt>
                    <dd className="tnum text-sm text-cream">
                      {current.occupiedUntil ? formatTime(new Date(current.occupiedUntil)) : "—"}
                      {remainingLabel(current.occupiedUntil, now) && (
                        <span className="text-dim"> · {remainingLabel(current.occupiedUntil, now)}</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-6">
                    <dt className="kicker text-dim">Cobro en pieza</dt>
                    <dd className="tnum text-sm">
                      {currentPendingSum > 0 ? (
                        <span className="text-busy">Pendiente · {formatCLP(currentPendingSum)}</span>
                      ) : (
                        <span className="text-ok">Pagada{paidLabel ? ` · ${paidLabel}` : ""}</span>
                      )}
                    </dd>
                  </div>
                </dl>
              )}

              {/* Acciones contextuales (el perfil de solo lectura ve solo la información) */}
              {!readOnly && current.status === "available" && (
                <Button className="w-full" onClick={() => setView("checkin")}>
                  Check-in
                </Button>
              )}

              {!readOnly && current.status === "occupied" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setView("checkout")}>Check-out</Button>
                    <Button variant="secondary" onClick={() => setView("move")}>
                      Cambiar de pieza
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="kicker text-dim">Ampliar</span>
                    <button
                      type="button"
                      onClick={() => extendStay(current.id, 1, actor)}
                      className="border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      +1 hora
                    </button>
                    <button
                      type="button"
                      onClick={() => extendStay(current.id, 3, actor)}
                      className="border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      +3 horas
                    </button>
                  </div>
                </div>
              )}

              {!readOnly && (current.status === "cleaning" || current.status === "maintenance") && (
                <Button
                  className="w-full"
                  onClick={() => setRoomStatus(current.id, "available", actor)}
                >
                  Marcar disponible
                </Button>
              )}

              {/* Cambio de estado manual */}
              {!readOnly && (
                <div>
                  <p className="kicker text-dim">Cambiar estado</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {ROOM_STATUS_ORDER.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setRoomStatus(current.id, status, actor)}
                        className={cn(
                          "border px-3 py-2.5 text-sm transition-colors",
                          status === current.status
                            ? "border-gold/70 text-gold"
                            : "border-line text-muted hover:border-line-strong hover:text-cream",
                        )}
                      >
                        {ROOM_STATUS[status].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cortesías de un toque: todo el menú a la vista, sin cobro y con rastro */}
            {courtesySidebar && (
              <aside className="mt-6 border-t border-line pt-5 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <p className="kicker text-gold">Cortesías · un toque</p>
                <p className={cn("mt-2 min-h-4 text-xs", courtesyMsg ? "text-ok" : "text-dim")}>
                  {courtesyMsg ?? "Quedan registradas al toque, sin cobro."}
                </p>
                <div className="mt-3 space-y-4">
                  {COURTESY_MENU.map((group) => (
                    <div key={group.label}>
                      <p className="kicker text-dim">{group.label}</p>
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {group.items.map((item) => (
                          <button
                            key={item.productId}
                            type="button"
                            onClick={() => quickCourtesy(current.id, item)}
                            className="border border-line px-2.5 py-2 text-left text-xs text-muted transition-colors hover:border-gold/70 hover:text-gold"
                          >
                            {item.label}
                            {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            )}
            </div>
          )}

          {/* ---- Check-in ---- */}
          {view === "checkin" && (
            <div className="space-y-5">
              <SegmentedToggle
                segments={[
                  { value: "weekday", label: "Entre semana" },
                  { value: "weekend", label: "Finde y festivos" },
                ]}
                value={day}
                onChange={setDay}
                className="w-full"
              />
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => {
                  const selected = d === duration;
                  return (
                    <Chip
                      key={d}
                      selected={selected}
                      onClick={() => setDuration(d)}
                      className="flex flex-col gap-1"
                    >
                      <span className={cn("kicker", selected ? "text-gold" : "text-dim")}>{d} h</span>
                      <span className="tnum font-display text-base">
                        {formatCLP(priceFor(getCategory(current.categoryId), day, d))}
                      </span>
                    </Chip>
                  );
                })}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="kicker text-dim">Registro del huésped (opcional)</span>
                  <button
                    type="button"
                    onClick={() => setScanOpen(true)}
                    className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-muted transition-colors hover:border-gold/70 hover:text-gold"
                  >
                    Escanear cédula
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-[1.4fr_1fr] gap-2">
                  <input
                    id="guest"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nombre"
                    aria-label="Nombre del huésped"
                    className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
                  />
                  <input
                    id="guest-rut"
                    value={guestRut}
                    onChange={(e) => setGuestRut(formatRut(e.target.value))}
                    placeholder="RUT"
                    maxLength={12}
                    aria-label="RUT del huésped"
                    className="min-h-[44px] w-full rounded-sm border border-line bg-surface px-4 py-2.5 text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none"
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-dim">
                  El escáner lee el código de la cédula y completa nombre y RUT en un paso. No
                  se almacenan imágenes del documento.
                </p>
                {blMatch && (
                  <div className="mt-3 border border-busy/50 bg-busy/10 px-4 py-3" role="alert">
                    <p className="text-sm font-medium text-busy">Cliente en lista negra</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {blMatch.name} · {blMatch.reason} Confirma con jefatura antes de
                      continuar con el ingreso.
                    </p>
                  </div>
                )}
                <p className="mt-2 text-xs leading-relaxed text-dim">
                  Al confirmar se descuenta solo el paquete de ingreso de la categoría (
                  {openingPackLabel(openingPackFor(current.categoryId))}) y se genera el ticket
                  de cobro: la camarera cobra el bloque en la pieza.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setView("main")}>
                  Volver
                </Button>
                <Button
                  className="flex-1"
                  disabled={!duration}
                  onClick={() => {
                    if (!duration) return;
                    checkIn(current.id, day, duration, guestName, guestRut, actor);
                    close();
                  }}
                >
                  Confirmar check-in
                </Button>
              </div>
            </div>
          )}

          {/* ---- Check-out ---- */}
          {view === "checkout" && (
            <div className="space-y-5">
              {currentPendingSum > 0 ? (
                <>
                  <div className="flex items-baseline justify-between border-b border-line pb-4">
                    <span className="kicker text-dim">Saldo pendiente</span>
                    <span className="tnum font-display text-2xl text-gold">
                      {formatCLP(currentPendingSum)}
                    </span>
                  </div>
                  <div>
                    <span className="kicker text-dim">Cobro</span>
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
                      <button
                        type="button"
                        onClick={() => setPayMethod("none")}
                        className={cn(
                          "border px-3 py-2.5 text-sm transition-colors",
                          payMethod === "none"
                            ? "border-gold/70 text-gold"
                            : "border-line text-muted hover:border-line-strong hover:text-cream",
                        )}
                      >
                        Sin cobro
                      </button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-dim">
                    {payMethod === "none"
                      ? "La habitación quedará en limpieza sin registrar el saldo."
                      : "El saldo entra al corte del turno y la habitación pasa a limpieza."}
                  </p>
                </>
              ) : (
                <div className="border-b border-line pb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="kicker text-dim">Estancia</span>
                    <span className="text-sm text-ok">
                      Pagada en la pieza{paidLabel ? ` · ${paidLabel}` : ""}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-dim">
                    Sin saldo pendiente: el bloque se cobró al inicio. La habitación pasa a
                    limpieza.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setView("main")}>
                  Volver
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    checkOut(
                      current.id,
                      currentPendingSum > 0 && payMethod !== "none" ? payMethod : undefined,
                      userLabel,
                      actor,
                    );
                    close();
                  }}
                >
                  Confirmar check-out
                </Button>
              </div>
            </div>
          )}

          {/* ---- Cambio de pieza ---- */}
          {view === "move" && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-muted">
                Traslada la estancia en curso a otra habitación disponible. La actual queda en
                limpieza.
              </p>
              <div>
                <label className="kicker text-dim" htmlFor="move-target">
                  Habitación destino
                </label>
                <Select
                  id="move-target"
                  value={moveTarget}
                  onValueChange={setMoveTarget}
                  placeholder="Elegir habitación…"
                  options={rooms
                    .filter((r) => r.status === "available" && r.id !== current.id)
                    .map((r) => ({
                      value: r.id,
                      label: `Habitación ${r.number} · ${getCategory(r.categoryId).shortName}`,
                    }))}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setView("main")}>
                  Volver
                </Button>
                <Button
                  className="flex-1"
                  disabled={!moveTarget}
                  onClick={() => {
                    if (!moveTarget) return;
                    moveRoom(current.id, moveTarget, actor);
                    close();
                  }}
                >
                  Trasladar
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {current && scanOpen && (
        <IdScanModal
          onResult={({ name, rut }) => {
            if (name) setGuestName(name);
            if (rut) setGuestRut(rut);
            setScanOpen(false);
          }}
          onSimulate={() => fillExampleId(current.number)}
          onClose={() => setScanOpen(false)}
        />
      )}
    </>
  );
}
