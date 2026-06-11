"use client";

import { CategoryCard } from "@/components/public/CategoryCard";
import { Reveal } from "@/components/ui/Reveal";
import { useAppStore } from "@/lib/store";

/** Grilla de categorías de la landing, leyendo del store para reflejar los precios editados. */
export function CategoryGrid() {
  const { categories } = useAppStore();
  return (
    <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, i) => (
        <Reveal key={category.id} delay={i * 0.08}>
          <CategoryCard category={category} />
        </Reveal>
      ))}
    </div>
  );
}
