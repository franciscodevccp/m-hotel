// Códigos QR de habitación para el control de aseo. El contenido es solo el
// identificador de la pieza (sin datos sensibles): MMOTEL-HAB-<número>.

const PREFIX = "MMOTEL-HAB-";

/** Contenido del código QR impreso en cada habitación. */
export function roomQrPayload(roomNumber: number): string {
  return `${PREFIX}${roomNumber}`;
}

/** Extrae el número de habitación desde un código escaneado; null si es ajeno. */
export function parseRoomQr(raw: string): number | null {
  const text = raw.trim();
  if (!text.toUpperCase().startsWith(PREFIX)) return null;
  const number = Number(text.slice(PREFIX.length));
  return Number.isInteger(number) && number > 0 ? number : null;
}
