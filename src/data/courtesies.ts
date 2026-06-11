import { seedProductId } from "@/data/products";
import { hasJacuzzi } from "@/lib/pricing";
import type { CategoryId } from "@/types";

/** Ítem de cortesía: producto real del inventario y cuántas unidades baja cada entrega. */
export interface CourtesyItem {
  productId: string;
  label: string;
  quantity: number;
}

export interface CourtesyGroup {
  label: string;
  items: CourtesyItem[];
}

function item(name: string, label: string, quantity = 1): CourtesyItem {
  return { productId: seedProductId(name), label, quantity };
}

/**
 * Menú completo de cortesías de un toque (pedido del cliente: todos los
 * botones a la vista). Cada botón baja stock del producto real del inventario,
 * sin cobro y con rastro en auditoría.
 */
export const COURTESY_MENU: CourtesyGroup[] = [
  {
    label: "Bebidas",
    items: [
      item("Coca-Cola express 237 ml", "Coca-Cola"),
      item("Coca-Cola zero express 237 ml", "Coca-Cola Zero"),
      item("Sprite express 237 ml", "Sprite"),
      item("Fanta express 237 ml", "Fanta"),
      item("Agua mineral sin gas vidrio 350 cc", "Agua sin gas"),
      item("Agua mineral con gas vidrio 350 cc", "Agua con gas"),
      item("Energética Score guaraná 250 ml", "Energética Score"),
    ],
  },
  {
    label: "Café y té",
    items: [item("Café sachet 45 g 2 un.", "Café"), item("Té Dilmah o té de hierbas", "Té")],
  },
  {
    label: "Coctelería",
    items: [
      item("Porción vaso espumante", "Vaso de espumante"),
      item("Mojito Ice Sierra Morena lata 310 cc", "Mojito"),
      item("Porción normal pisco sour La Pizka", "Pisco sour La Pizka"),
      item("Porción sour menta jengibre La Pizka", "Sour menta jengibre"),
      item("Porción sour maracuyá La Pizka", "Sour maracuyá"),
    ],
  },
  {
    label: "Cervezas",
    items: [
      item("Cerveza Corona 330 cc", "Corona"),
      item("Cerveza Budweiser 330 cc", "Budweiser"),
      item("Cerveza Royal Guard 355 cc", "Royal Guard"),
      item("Cerveza Sol 330 cc", "Sol"),
      item("Cerveza Coors 355 cc", "Coors"),
    ],
  },
  {
    label: "De la pieza",
    items: [
      item("Alkas", "Alkas", 2),
      item("Bombones Bon o Bon", "Bon o Bon", 2),
      item("Papas Kryzpo", "Papas Kryzpo"),
      item("Espuma de baño / burbujas de baño 45 ml", "Espuma de baño"),
      item("Bomba de baño 60 g", "Bomba de baño"),
      item("Sales de baño Stone Paper 35 g", "Sales de baño"),
    ],
  },
].map((group) => ({ ...group, items: group.items.filter((i) => i.productId) }));

// Paquete de ingreso: se descuenta solo, junto al check-in, según la categoría.
// Base para todas; la línea Jacuzzi suma espuma de baño; Jacuzzi Black suma
// además una bomba de baño (alternativa de la casa: sales de baño).
const PACK_BASE: CourtesyItem[] = [
  item("Papel higiénico", "Papel higiénico"),
  item("Alkas", "Alkas", 2),
  item("Bombones Bon o Bon", "Bon o Bon", 2),
  item("Papas Kryzpo", "Papas Kryzpo"),
];

const PACK_JACUZZI: CourtesyItem[] = [
  item("Espuma de baño / burbujas de baño 45 ml", "Espuma de baño"),
];

const PACK_JACUZZI_BLACK: CourtesyItem[] = [item("Bomba de baño 60 g", "Bomba de baño")];

/** Cortesías de apertura según la categoría de la pieza. */
export function openingPackFor(categoryId: CategoryId): CourtesyItem[] {
  return [
    ...PACK_BASE,
    ...(hasJacuzzi(categoryId) ? PACK_JACUZZI : []),
    ...(categoryId === "jacuzzi-black" ? PACK_JACUZZI_BLACK : []),
  ].filter((i) => i.productId);
}
