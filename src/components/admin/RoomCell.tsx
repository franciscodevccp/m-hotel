import { getCategory } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { CategoryId, Room } from "@/types";
import { ROOM_STATUS } from "./roomStatus";

/** Minutos restantes del bloque (solo habitaciones ocupadas). */
function minutesLeft(room: Room, now: number | null): number | null {
  if (room.status !== "occupied" || !room.occupiedUntil || now == null) return null;
  return Math.round((new Date(room.occupiedUntil).getTime() - now) / 60000);
}

function leftLabel(minutes: number): string {
  if (minutes <= 0) return "Finalizando";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Aviso para contactar al huésped antes del término de su bloque. */
const ENDING_SOON_MIN = 30;

// Distintivo de categoría: el recepcionista no memoriza qué pieza es qué.
const CATEGORY_BADGE: Record<CategoryId, string> = {
  "standard-vip": "border-line-strong bg-surface/70 text-muted",
  // Fondo negro fijo: el texto va fijo también (text-cream se invierte en el tema claro).
  "standard-black": "border-gold/40 bg-[#181410] text-[#e7e0d0]",
  "jacuzzi-vip": "border-gold/60 bg-gold/10 text-gold",
  "jacuzzi-premium": "border-wine/60 bg-wine/10 text-wine-soft",
  "jacuzzi-black": "border-gold/70 bg-[#181410] text-gold",
};

interface RoomCellProps {
  room: Room;
  now: number | null;
  /** true si la estadía tiene un ticket de cobro pendiente en la pieza. */
  pendingCharge?: boolean;
  onSelect: (room: Room) => void;
}

export function RoomCell({ room, now, pendingCharge, onSelect }: RoomCellProps) {
  const status = ROOM_STATUS[room.status];
  const category = getCategory(room.categoryId);
  const minutes = minutesLeft(room, now);
  const endingSoon = minutes != null && minutes <= ENDING_SOON_MIN;

  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className={cn(
        "group flex flex-col gap-2.5 border p-4 text-left transition-all hover:brightness-110",
        status.card,
        endingSoon && "border-transparent ring-2 ring-gold",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("tnum font-display text-2xl leading-none", status.fg)}>
          {room.number}
        </span>
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            status.dot,
            endingSoon && "animate-pulse bg-gold",
          )}
          aria-hidden
        />
      </div>

      <p className={cn("text-sm font-medium", status.fg)}>{status.label}</p>

      <span className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded-xs border px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em]",
            CATEGORY_BADGE[room.categoryId],
          )}
        >
          {category.shortName}
        </span>
        {room.status === "occupied" && pendingCharge && (
          <span className="rounded-xs border border-busy/60 bg-busy/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-busy">
            Por cobrar
          </span>
        )}
      </span>

      <p className="tnum min-h-4 text-xs">
        {minutes != null ? (
          endingSoon ? (
            <span className="font-semibold text-gold">
              Por terminar · {leftLabel(minutes)}
            </span>
          ) : (
            <span className={cn("opacity-80", status.fg)}>{leftLabel(minutes)} restante</span>
          )
        ) : (
          " "
        )}
      </p>
    </button>
  );
}
