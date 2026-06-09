"use client";

import * as RSelect from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

// Radix no admite value="" en un item; usamos un centinela y lo mapeamos de
// vuelta a "" para que el componente sea reemplazo directo del <select> nativo.
const EMPTY = "__empty__";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Select de marca (Radix) con la lista desplegable totalmente estilizada. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  className,
  ariaLabel,
}: SelectProps) {
  return (
    <RSelect.Root
      value={value === "" ? EMPTY : value}
      onValueChange={(v) => onValueChange(v === EMPTY ? "" : v)}
    >
      <RSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          // mt-2 por defecto para acompañar a su <label> (igual que los inputs).
          // Las listas en fila lo anulan con "mt-0".
          "mt-2 flex min-h-[44px] w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-line bg-surface px-3 py-2.5 text-left text-sm text-cream transition-colors hover:border-line-strong focus:border-gold/60 focus-visible:outline-none data-[state=open]:border-gold/60",
          className,
        )}
      >
        <span className="truncate">
          <RSelect.Value placeholder={placeholder} />
        </span>
        <RSelect.Icon className="shrink-0 text-dim">
          <ChevronDown className="size-4" />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="z-[80] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-sm border border-line-strong bg-surface-2 shadow-2xl shadow-black/40"
        >
          <RSelect.ScrollUpButton className="flex h-6 items-center justify-center text-dim">
            <ChevronDown className="size-4 rotate-180" />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value || EMPTY}
                value={opt.value === "" ? EMPTY : opt.value}
                disabled={opt.disabled}
                className="relative flex cursor-pointer select-none items-center justify-between gap-3 rounded-xs px-3 py-2 text-sm text-muted outline-none transition-colors data-[disabled]:cursor-not-allowed data-[highlighted]:bg-surface data-[highlighted]:text-cream data-[state=checked]:text-gold data-[disabled]:opacity-40"
              >
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
                <RSelect.ItemIndicator>
                  <CheckMark className="size-4 text-gold" />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
          <RSelect.ScrollDownButton className="flex h-6 items-center justify-center text-dim">
            <ChevronDown className="size-4" />
          </RSelect.ScrollDownButton>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
