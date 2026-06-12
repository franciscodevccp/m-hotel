import { CURRENT_SHIFT_ID } from "@/data/shifts";
import type { RealItem } from "@/data/inventario/base";
import { COCINA } from "@/data/inventario/cocina";
import { HABITACION_LIMPIEZA } from "@/data/inventario/habitacion";
import { TIENDA } from "@/data/inventario/tienda";
import type { InventoryMovement, Product } from "@/types";

// Catálogo ÚNICO del sistema: el inventario real de M Motel (corte al
// 09-06-2026), transcrito de STOCK_09-06-26.xlsm y depurado según
// plan_maestro/spec-1b-inventario-real.md. Tres familias:
//  - carta: vendible al huésped (room service / recepción)
//  - sexshop: tienda online + venta en recepción, +18
//  - insumo: aseo, operativos, lavandería, blancos, amenidades y cortesías
// Determinístico: sin Math.random ni fechas relativas (SSR = cliente).

/** Categorías de producto (amigables) para el ingreso de stock. Extensible. */
export const PRODUCT_CATEGORIES = [
  "Alimentación",
  "Bebestible",
  "Coctelería",
  "Snack",
  "Amenidad",
  "Aseo",
  "Sexshop",
  "Otro",
];

/** Inventario real completo (fila a fila del Excel, ya depurado). */
export const REAL_INVENTORY: RealItem[] = [...COCINA, ...TIENDA, ...HABITACION_LIMPIEZA];

// Orden editorial de los grupos: la carta pública y el sexshop agrupan
// conservando el orden del catálogo, así que aquí se define cómo se lee.
const GROUP_ORDER = [
  // Carta
  "Sugerencias del M",
  "Platos calientes",
  "Para compartir",
  "Sándwich y pizzas",
  "Acompañamientos",
  "Algo dulce",
  "Cócteles",
  "Cervezas",
  "Destilados",
  "Espumantes",
  "Vinos",
  "Bebidas",
  "Spa",
  "Extras",
  "Celebraciones",
  "Cigarros",
  // Sexshop
  "Vibradores",
  "Consoladores",
  "Lubricantes",
  "Preservativos y potenciadores",
  "Fetiches",
  "Anal",
  "Lencería y disfraces",
  "Juegos",
  // Insumos
  "Aseo",
  "Operativos",
  "Lavandería",
  "Amenidades",
  "Blancos y lencería",
  "Menaje",
  "Cortesías",
  "Insumos de cocina",
];

function groupRank(group: string): number {
  const i = GROUP_ORDER.indexOf(group);
  return i === -1 ? GROUP_ORDER.length : i;
}

const FAMILY_ORDER: Record<RealItem["family"], number> = { carta: 0, sexshop: 1, insumo: 2 };

const SORTED_INVENTORY: RealItem[] = [...REAL_INVENTORY].sort((a, b) => {
  if (a.family !== b.family) return FAMILY_ORDER[a.family] - FAMILY_ORDER[b.family];
  const byGroup = groupRank(a.group) - groupRank(b.group);
  if (byGroup !== 0) return byGroup;
  return a.name.localeCompare(b.name, "es");
});

function thresholdFor(item: RealItem): number {
  if (item.family === "sexshop") return 3;
  if (item.family === "insumo") return 4;
  return 5;
}

// Distribución recepción / bodega central (el Excel solo trae el total):
// lo operativo queda a mano en recepción y el grueso bajo llave en central.
const RECEPTION_CAP_VENTA = 12;
const RECEPTION_CAP_INSUMO = 4;

// Los productos de la solicitud tr-103 quedan casi sin saldo en recepción a
// propósito: la reposición pendiente que se aprueba en vivo pide justo esto.
const RECEPTION_OVERRIDES: Record<string, number> = {
  "7802100505538": 3, // Cerveza Royal Guard 355 cc
  "7801620004507": 2, // Agua mineral con gas 350 cc
  "7804676070113": 3, // Preservativos variedades
};

// Los insumos de estos grupos operan desde la bodega de lavandería/aseo:
// el saldo a mano de las camareras vive ahí y el grueso queda en central.
const LAUNDRY_GROUPS = new Set(["Aseo", "Lavandería"]);
const LAUNDRY_CAP = 6;

export const SEED_PRODUCTS: Product[] = SORTED_INVENTORY.map((item) => {
  // Los saldos negativos del sistema anterior se cargan en 0; el detalle queda
  // como movimiento de regularización (ver SEED_MOVEMENTS).
  const total = Math.max(0, item.total);
  const inLaundry = item.family === "insumo" && LAUNDRY_GROUPS.has(item.group);
  const cap = item.family === "insumo" ? RECEPTION_CAP_INSUMO : RECEPTION_CAP_VENTA;
  const stock = inLaundry ? 0 : Math.min(total, RECEPTION_OVERRIDES[item.barcode] ?? cap);
  const laundryStock = inLaundry ? Math.min(total, LAUNDRY_CAP) : 0;
  return {
    id: `p-${item.barcode}`,
    sku: item.barcode,
    name: item.name,
    category: item.family,
    group: item.group,
    price: item.price,
    cost: item.cost,
    stock,
    centralStock: total - stock - laundryStock,
    laundryStock,
    lowStockThreshold: thresholdFor(item),
    channels: item.channels,
    ageRestricted: item.ageRestricted ?? false,
    image: null,
    active: true,
  };
});

/**
 * Alias de los nombres del catálogo v1 → código de barras real. Los seeds
 * históricos (movimientos, pedidos, paquetes, compras) referencian productos
 * por su nombre v1; aquí se resuelven contra el SKU real equivalente.
 */
const V1_ALIASES: Record<string, string> = {
  // Sexshop
  "Caja preservativos Sensor Plus (3 un.)": "7804676070113",
  "Esposas Teddy Love": "920045051013",
  'Lubricante femenino Starsex "Placer Intenso"': "777000805002",
  'Lubricante anal Starsex "Más Comodidad"': "777000803008",
  "Anillo vibrador Pretty Love": "6959532317541",
  "Succionador de clítoris": "6937526503743",
  "Gel calor sabor Frutilla": "7898495410380",
  "Gel calor sabor Chocolate": "7898495410335",
  "Vibrador realista 23 cm": "4440000081009",
  "Kit de Sade": "920008150012",
  "Vibrador Power Wand Rosado": "6959532316452",
  "Bala vibradora Punto G": "6959532312119",
  "Arnés con dildo negro": "221000273076",
  "Vibrador Cyber 21 cm": "7798297919657",
  "Vibrador Tracy Pretty Love Pink": "6959532331479",
  "Plug joya silicona M": "33400002820",
  "Plug joya silicona L": "33400002870",
  "Masturbador Holand UV Touch": "6959532326857",
  "Dildo con ventosa 20 cm": "6959532306750",
  "Vara anal beads Pretty Love": "33401421400",
  "Disfraz enfermera talla M/L": "801553066249",
  'Juego de cartas "Do Fuck"': "825156107607",
  "Dados Love Dice": "920010051018",
  "Set antifaz / máscara premium": "6940927823358",
  // Carta y celebraciones
  "Pizza Pepperoni": "769284135",
  // La Corona real quedó con saldo 0 en el corte: los seeds de venta usan la
  // Royal Guard (126 un.), que sí es vendible en vivo.
  "Corona (330 ml)": "7802100505538",
  "Agua embotellada (350 ml)": "7801620004507",
  "Bebidas en Lata (350 ml)": "7801610350355",
  "Piscola Mistral": "760798819007",
  "Espumante Vionelli Rosé (750 ml)": "5901617017458",
  "Copa de Espumante": "760798819006",
  "Chocolate Sahne-Nuss (250 g)": "7802230070029",
  "Bomba de baño (60 g)": "261220243",
  "Sales de baño (35 g)": "26122024",
  "Espumante Opera Love (750 ml)": "17619025188",
  "Papas fritas con Cheddar (250 g)": "7001",
  "Misiones de Rengo Cabernet Sauvignon (750 ml)": "7808704700058",
  "Espumante Demi Sec Barón Lacroix (750 ml)": "7804315003694",
};

const productIds = new Set(SEED_PRODUCTS.map((p) => p.id));

/** Resuelve el id de un producto sembrado: alias v1 o nombre exacto del catálogo. */
export function seedProductId(name: string): string {
  const barcode = V1_ALIASES[name];
  if (barcode) {
    const id = `p-${barcode}`;
    return productIds.has(id) ? id : "";
  }
  return SEED_PRODUCTS.find((p) => p.name === name)?.id ?? "";
}

const SHIFT_USER = "Recepción · turno noche";

// Regularización de carga inicial: el Excel del cliente traía 30 saldos
// negativos (ventas sin ingreso registrado). Se cargan en 0 y cada uno deja
// su movimiento de ajuste con la magnitud del descuadre heredado.
const REGULARIZATION_MOVEMENTS: InventoryMovement[] = REAL_INVENTORY.filter(
  (item) => item.total < 0,
).map((item, i) => ({
  id: `m-reg-${String(i + 1).padStart(2, "0")}`,
  productId: `p-${item.barcode}`,
  type: "ajuste",
  quantity: item.total,
  at: "2026-06-09T08:00:00",
  refId: "carga-inicial",
  user: "Regularización de carga inicial — saldo negativo en el sistema anterior",
}));

// Ventas ya registradas en el turno (itemizan el corte de caja) + la
// regularización de la carga inicial.
export const SEED_MOVEMENTS: InventoryMovement[] = [
  { id: "m-001", productId: seedProductId("Caja preservativos Sensor Plus (3 un.)"), type: "venta_presencial", quantity: -2, at: "2026-06-04T22:35:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-002", productId: seedProductId("Esposas Teddy Love"), type: "venta_presencial", quantity: -1, at: "2026-06-04T23:12:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-003", productId: seedProductId("Corona (330 ml)"), type: "venta_presencial", quantity: -4, at: "2026-06-04T23:40:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-004", productId: seedProductId("Pizza Pepperoni"), type: "venta_presencial", quantity: -2, at: "2026-06-05T00:05:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-005", productId: seedProductId("Lubricante femenino Starsex \"Placer Intenso\""), type: "venta_presencial", quantity: -1, at: "2026-06-05T00:20:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  ...REGULARIZATION_MOVEMENTS,
];
