"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { getCategory } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";
import { RoomCell } from "./RoomCell";
import { ROOM_STATUS, ROOM_STATUS_ORDER } from "./roomStatus";

export function RoomBoard() {
  const { rooms, setRoomStatus } = useAppStore();
  const [now, setNow] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- siembra la hora actual al montar (tablero en vivo)
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const current = selectedId ? (rooms.find((r) => r.id === selectedId) ?? null) : null;

  return (
    <>
      {/* Leyenda de estados */}
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
        {ROOM_STATUS_ORDER.map((status) => (
          <span key={status} className="flex items-center gap-2 text-xs text-muted">
            <span className={cn("size-2 rounded-full", ROOM_STATUS[status].dot)} aria-hidden />
            {ROOM_STATUS[status].label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {rooms.map((room) => (
          <RoomCell key={room.id} room={room} now={now} onSelect={(r: Room) => setSelectedId(r.id)} />
        ))}
      </div>

      {current && (
        <Modal
          title={`Habitación ${current.number}`}
          subtitle={getCategory(current.categoryId).name}
          onClose={() => setSelectedId(null)}
        >
          <p className="text-sm text-muted">
            Estado actual:{" "}
            <span className={ROOM_STATUS[current.status].text}>
              {ROOM_STATUS[current.status].label}
            </span>
          </p>
          <p className="mt-4 kicker text-dim">Cambiar a</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ROOM_STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setRoomStatus(current.id, status)}
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
        </Modal>
      )}
    </>
  );
}
