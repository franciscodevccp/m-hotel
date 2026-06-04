import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ComponentProps<"button"> {
  selected?: boolean;
}

/** Recuadro seleccionable con hairline. Pieza central del booking (bloques de horas). */
export function Chip({ selected, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "min-h-[44px] rounded-sm border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none",
        selected
          ? "border-gold/70 bg-surface-2 text-gold"
          : "border-line text-muted hover:border-line-strong hover:text-cream",
        className,
      )}
      {...props}
    />
  );
}
