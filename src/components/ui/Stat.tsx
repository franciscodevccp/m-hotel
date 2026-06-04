import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  value: ReactNode;
  label: string;
  className?: string;
}

/** Cifra editorial grande con su label en small caps. */
export function Stat({ value, label, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="tnum font-display text-4xl leading-none text-cream sm:text-5xl">
        {value}
      </span>
      <span className="kicker">{label}</span>
    </div>
  );
}
