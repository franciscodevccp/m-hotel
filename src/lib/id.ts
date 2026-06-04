// Generador simple de IDs para la demo (no necesita ser criptográficamente robusto).
// Vive fuera de los componentes para mantener su render puro.
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}
