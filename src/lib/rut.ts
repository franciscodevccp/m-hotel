/** Da formato de RUT chileno en vivo: "123456789" → "12.345.678-9" (admite K). */
export function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${clean.slice(-1)}`;
}

/** Normaliza un RUT para comparar (sin puntos, guion ni espacios). */
export function normalizeRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, "").toUpperCase();
}
