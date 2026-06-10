import { cn } from "@/lib/utils";

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Dos o más segmentos; el activo en dorado. Usado para el toggle de día. */
export function SegmentedToggle<T extends string>({
  segments,
  value,
  onChange,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn("inline-flex gap-1 rounded-sm border border-line bg-surface/60 p-1", className)}
    >
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              "min-h-[44px] flex-1 whitespace-nowrap rounded-xs px-3 text-xs font-medium uppercase tracking-[0.1em] transition-colors duration-200 focus-visible:outline-none",
              active ? "bg-gold text-bg" : "text-muted hover:text-cream",
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
