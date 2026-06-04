import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Estilos del botón/CTA. Se exporta para reutilizar el mismo look en <Link>.
export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-sans uppercase tracking-[0.16em] text-xs font-medium transition-colors duration-300 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-gold text-bg hover:bg-gold-soft",
        secondary: "border border-line-strong text-cream hover:border-gold/70 hover:text-gold",
        ghost: "text-muted hover:text-cream",
      },
      size: {
        sm: "h-10 px-5",
        md: "h-12 px-7",
        lg: "h-14 px-9 text-[0.8rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
