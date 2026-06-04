import { getCategory } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";
import { ROOM_STATUS } from "./roomStatus";

/** Tiempo restante del bloque, calculado en el cliente contra la hora actual. */
function remaining(room: Room, now: number | null): string | null {
  if (room.status !== "occupied" || !room.occupiedUntil || now == null) return null;
  const ms = new Date(room.occupiedUntil).getTime() - now;
  if (ms <= 0) return "Finalizando";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface RoomCellProps {
  room: Room;
  now: number | null;
  onSelect: (room: Room) => void;
}

export function RoomCell({ room, now, onSelect }: RoomCellProps) {
  const status = ROOM_STATUS[room.status];
  const category = getCategory(room.categoryId);
  const left = remaining(room, now);

  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className="group flex flex-col gap-3 border border-line bg-surface/40 p-4 text-left transition-colors hover:border-line-strong"
    >
      <div className="flex items-center justify-between">
        <span className="tnum font-display text-xl text-cream">{room.number}</span>
        <span className={cn("size-2 rounded-full", status.dot)} aria-hidden />
      </div>
      <div>
        <p className={cn("text-xs", status.text)}>{status.label}</p>
        <p className="kicker mt-1 text-dim">{category.shortName}</p>
      </div>
      <p className="tnum min-h-4 text-xs text-muted">{left ? `${left} restante` : " "}</p>
    </button>
  );
}
