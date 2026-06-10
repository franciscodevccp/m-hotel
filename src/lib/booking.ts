import { normalizeRut } from "@/lib/rut";
import type { Reservation, Room } from "@/types";

/**
 * Busca una estancia activa para validar pedidos a la habitación:
 * la pieza debe estar ocupada y tener una reserva confirmada con ese RUT.
 */
export function findActiveStay(
  rooms: Room[],
  reservations: Reservation[],
  rut: string,
  roomNumber: string,
): { room: Room; reservation: Reservation } | null {
  const room = rooms.find(
    (r) => String(r.number) === roomNumber.trim() && r.status === "occupied",
  );
  if (!room) return null;
  const reservation = reservations.find(
    (r) =>
      r.status === "confirmed" &&
      r.roomId === room.id &&
      Boolean(r.guestRut) &&
      normalizeRut(r.guestRut ?? "") === normalizeRut(rut),
  );
  return reservation ? { room, reservation } : null;
}
