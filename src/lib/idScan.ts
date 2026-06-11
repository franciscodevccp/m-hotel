import { formatRut } from "@/lib/rut";

// Lectura del código PDF417 del reverso de la cédula de identidad chilena.
// Las cédulas vigentes codifican una URL del Registro Civil con el RUN
// (https://portal.sidiv.registrocivil.cl/docstatus?RUN=...&type=CEDULA&...)
// y, según la emisión, una zona MRZ con "APELLIDOS<<NOMBRES". Se extrae solo
// nombre y RUT: nunca se captura ni almacena la imagen del documento.

export interface ScannedId {
  rut?: string;
  name?: string;
}

/**
 * Identidades de ejemplo para el escaneo simulado (demo sin carnet),
 * determinísticas por número de habitación. La segunda coincide a propósito
 * con la lista negra sembrada, para poder demostrar la alerta.
 */
export const SCAN_IDENTITIES: { name: string; rut: string }[] = [
  { name: "Carolina Mendoza", rut: "16.582.441-7" },
  { name: "Andrés Fuenzalida", rut: "14.220.873-K" },
  { name: "Javiera Campos", rut: "18.115.062-3" },
];

/** Identidad de ejemplo estable para una habitación. */
export function exampleIdentity(roomNumber: number): { name: string; rut: string } {
  return SCAN_IDENTITIES[roomNumber % SCAN_IDENTITIES.length];
}

function capitalize(word: string): string {
  return word.charAt(0) + word.slice(1).toLowerCase();
}

/** Extrae RUT y nombre desde el texto crudo del código de la cédula. */
export function parseCedula(raw: string): ScannedId {
  const result: ScannedId = {};

  // RUN explícito (URL del Registro Civil), con puntos, o suelto en el contenido.
  const runMatch =
    raw.match(/RUN=(\d{7,9}-?[\dkK])/i) ??
    raw.match(/\b(\d{1,2}\.\d{3}\.\d{3}-[\dkK])\b/) ??
    raw.match(/\b(\d{7,8}-[\dkK])\b/);
  if (runMatch) {
    const clean = runMatch[1].replace(/\./g, "");
    const run = clean.includes("-")
      ? clean
      : `${clean.slice(0, -1)}-${clean.slice(-1)}`;
    result.rut = formatRut(run);
  }

  // Zona MRZ: "APELLIDO1<APELLIDO2<<NOMBRE1<NOMBRE2" (relleno con '<').
  const mrzMatch = raw
    .replace(/\s+/g, "")
    .match(/([A-ZÑ]{2,}(?:<[A-ZÑ]+)*)<<([A-ZÑ]+(?:<[A-ZÑ]+)*)/);
  if (mrzMatch) {
    const apellidos = mrzMatch[1].split("<").filter(Boolean).map(capitalize);
    const nombres = mrzMatch[2].split("<").filter(Boolean).map(capitalize);
    const fullName = [...nombres, ...apellidos].join(" ").trim();
    if (fullName.length > 2) result.name = fullName;
  }

  return result;
}
