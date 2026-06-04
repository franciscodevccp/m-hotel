import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatCLP } from "@/lib/format";
import { fromPrice } from "@/lib/pricing";
import type { Category } from "@/types";

export function CategoryCard({ category }: { category: Category }) {
  const isBlack = category.id === "black";

  return (
    <Link href={`/reservar?categoria=${category.id}`} className="group relative block">
      <div className="relative overflow-hidden">
        {/* Imagen o placeholder, con zoom lento en hover */}
        <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
          <ImagePlaceholder ratio="portrait" accent={isBlack} />
        </div>
        {/* Línea dorada que se dibuja en hover */}
        <span
          className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-[width] duration-500 ease-out group-hover:w-full"
          aria-hidden
        />
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <Badge tone={isBlack ? "black" : "default"}>{category.area} m²</Badge>
          <h3 className="mt-3 font-display text-2xl text-cream">{category.name}</h3>
          <p className="mt-1 text-sm text-muted">{category.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="kicker text-dim">Desde</span>
          <p className="tnum mt-1 font-display text-xl text-gold">{formatCLP(fromPrice(category))}</p>
        </div>
      </div>
    </Link>
  );
}
