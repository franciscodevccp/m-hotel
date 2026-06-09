import { seedProductId } from "@/data/products";
import type { Package } from "@/types";

// Combos armados con productos reales del catálogo. El precio del combo es el que
// paga el cliente; al venderlo baja el stock de cada ítem incluido.
export const SEED_PACKAGES: Package[] = [
  {
    id: "pack-romantico",
    name: "Pack Romántico",
    description: "Espumante rosé, dos copas y chocolate para compartir.",
    items: [
      { productId: seedProductId("Espumante Vionelli Rosé (750 ml)"), quantity: 1 },
      { productId: seedProductId("Copa de Espumante"), quantity: 2 },
      { productId: seedProductId("Chocolate Sahne-Nuss (250 g)"), quantity: 1 },
    ],
    price: 18000,
    active: true,
  },
  {
    id: "pack-relax",
    name: "Pack Relax",
    description: "Bomba y sales de baño con un espumante para el jacuzzi.",
    items: [
      { productId: seedProductId("Bomba de baño (60 g)"), quantity: 1 },
      { productId: seedProductId("Sales de baño (35 g)"), quantity: 1 },
      { productId: seedProductId("Espumante Opera Love (750 ml)"), quantity: 1 },
    ],
    price: 16000,
    active: true,
  },
  {
    id: "pack-fiesta",
    name: "Pack Fiesta",
    description: "Cuatro Coronas y papas con cheddar para compartir.",
    items: [
      { productId: seedProductId("Corona (330 ml)"), quantity: 4 },
      { productId: seedProductId("Papas fritas con Cheddar (250 g)"), quantity: 1 },
    ],
    price: 16000,
    active: true,
  },
];
