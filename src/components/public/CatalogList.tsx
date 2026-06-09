import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatCLP } from "@/lib/format";
import type { Product } from "@/types";

/** Catálogo en tarjetas, agrupado por sub-categoría, con placeholder de imagen. */
export function CatalogList({ products }: { products: Product[] }) {
  // Agrupar conservando el orden del catálogo.
  const groups: { name: string; items: Product[] }[] = [];
  for (const product of products) {
    const name = product.group ?? "Otros";
    let bucket = groups.find((g) => g.name === name);
    if (!bucket) {
      bucket = { name, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(product);
  }

  return (
    <div className="space-y-16">
      {groups.map((group) => (
        <section key={group.name}>
          <h2 className="kicker text-gold">{group.name}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((product) => (
              <article key={product.id}>
                <ImagePlaceholder ratio="square" accent={product.ageRestricted} />
                <h3 className="mt-3 text-sm leading-snug text-cream">{product.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="tnum text-sm text-gold">{formatCLP(product.price)}</span>
                  {product.ageRestricted && (
                    <span className="rounded-xs border border-wine/60 px-1.5 py-px text-[0.6rem] font-medium tracking-[0.06em] text-wine-soft">
                      +18
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
