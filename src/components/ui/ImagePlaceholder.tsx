import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  label?: string;
  ratio?: "portrait" | "landscape" | "square";
  /** Hairline en tono vino, para la categoría BLACK. */
  accent?: boolean;
  className?: string;
}

const ratioClass = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
} as const;

/**
 * Placa "Imagen próximamente" estilo lookbook: intencional y elegante, jamás una
 * caja rota. Mantiene el aspect ratio de la foto real para que el layout no salte.
 */
export function ImagePlaceholder({
  label = "Imagen próximamente",
  ratio = "portrait",
  accent = false,
  className,
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden border bg-surface-2",
        accent ? "border-wine/40" : "border-line-strong",
        ratioClass[ratio],
        className,
      )}
    >
      <div className="gold-glow absolute inset-0 opacity-70" aria-hidden />
      <div className="vignette absolute inset-0" aria-hidden />
      <div className="relative flex flex-col items-center gap-3">
        <span className="font-display text-5xl leading-none text-cream/35">M</span>
        <span className="kicker text-dim">{label}</span>
      </div>
    </div>
  );
}
