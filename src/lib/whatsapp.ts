import { DAY_LABELS, DURATION_LABELS, formatCLP, formatTime } from "@/lib/format";
import { getCategory } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import type { Reservation } from "@/types";

/** Arma el texto de la reserva para enviar por WhatsApp. */
export function buildReservationMessage(reservation: Reservation, endTime?: Date): string {
  const category = getCategory(reservation.categoryId);
  const lines = [
    `Hola, quiero confirmar una reserva en ${SITE.name}.`,
    "",
    `Categoría: ${category.name} · ${category.area} m²`,
    `Día: ${DAY_LABELS[reservation.dayType]}`,
    `Bloque: ${DURATION_LABELS[reservation.duration]}`,
    endTime ? `Término estimado: ${formatTime(endTime)}` : "",
    `Total: ${formatCLP(reservation.total)}`,
    "",
    `A nombre de ${reservation.guestName} · ${reservation.guestPhone}`,
  ].filter(Boolean);
  return lines.join("\n");
}

/** Construye el enlace wa.me con el mensaje ya codificado. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}
