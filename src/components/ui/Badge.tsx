import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  /** "black" añade el detalle oxblood de la categoría BLACK. */
  tone?: "default" | "black";
  className?: string;
}

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "kicker inline-flex items-center gap-1.5 rounded-xs border px-2.5 py-1 text-[0.6rem]",
        tone === "black" ? "border-wine/60 text-gold" : "border-line-strong text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
