import { CURRENT_SHIFT_ID } from "@/data/shifts";
import type { InventoryMovement, Product } from "@/types";

// Catálogo real de M Motel en dos familias (ver catalogo_productos_m.md):
//  - SEX SHOP: tienda online + venta en recepción, +18.
//  - CARTA GOURMET: room service dentro del recinto.
// IDs y SKU se autogeneran; el stock es variado pero determinístico (igual en
// servidor y cliente, sin Math.random) para no romper la hidratación.

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

let sxN = 0;
let rsN = 0;

/** Producto de sex shop: online + presencial, +18. */
function sx(group: string, name: string, price: number): Product {
  sxN += 1;
  return {
    id: `sx-${slug(name)}-${sxN}`,
    sku: `SX-${String(sxN).padStart(3, "0")}`,
    name,
    category: "sexshop",
    group,
    price,
    stock: ((sxN * 7) % 18) + 2, // 2–19, algunos bajo el umbral
    lowStockThreshold: 5,
    channels: ["online", "presencial"],
    ageRestricted: true,
    image: null,
    active: true,
  };
}

// Grupos de la carta con alcohol/tabaco (requieren +18).
const ADULT_GROUPS = new Set([
  "Cócktails",
  "Cervezas",
  "Destilados",
  "Espumantes",
  "Vinos",
  "Cigarros",
]);

/** Producto de la carta gourmet: room service. */
function rs(group: string, name: string, price: number): Product {
  rsN += 1;
  return {
    id: `rs-${slug(name)}-${rsN}`,
    sku: `RS-${String(rsN).padStart(3, "0")}`,
    name,
    category: "carta",
    group,
    price,
    stock: ((rsN * 13) % 50) + 20, // 20–69
    lowStockThreshold: 10,
    channels: ["room_service"],
    ageRestricted: ADULT_GROUPS.has(group),
    image: null,
    active: true,
  };
}

export const SEED_PRODUCTS: Product[] = [
  // ---------------------------------------------------------------- SEX SHOP
  sx("Preservativos y Viagra", "Caja preservativos Sensor Plus (3 un.)", 3000),
  sx("Preservativos y Viagra", "Viagra / estimulante Enhora", 4000),

  sx("Lubricantes", 'Lubricante femenino Starsex "Placer Intenso"', 2500),
  sx("Lubricantes", 'Lubricante anal Starsex "Más Comodidad"', 2500),
  sx("Lubricantes", 'Lubricante retardante Starsex "Efecto Prolongado"', 2500),
  sx("Lubricantes", "Set antifaz / máscara premium", 17000),
  sx("Lubricantes", "Kit consolador Vryan Deluxe", 12000),
  sx("Lubricantes", 'Estimulante vaginal "Virginxx"', 19900),
  sx("Lubricantes", "Gel calor sabor Frutilla", 9900),
  sx("Lubricantes", "Gel calor sabor Chocolate", 9900),
  sx("Lubricantes", "Gel calor sabor (variedad)", 9900),
  sx("Lubricantes", "Spray sexo oral profundo Menta", 12000),
  sx("Lubricantes", "Spray sexo oral profundo Frutilla", 12000),

  sx("Fetiches", "Disfraz enfermera talla M/L", 19900),
  sx("Fetiches", "Disfraz enfermera S/M", 18900),
  sx("Fetiches", "Esposas Teddy Love", 6000),
  sx("Fetiches", "Kit de Sade", 14900),
  sx("Fetiches", "Paleta BDSM / paddle", 18000),
  sx("Fetiches", "Látigo flogger", 18000),
  sx("Fetiches", "Tobilleras / esposas BDSM", 27000),
  sx("Fetiches", "Disfraz sexy", 19900),
  sx("Fetiches", "Arnés con dildo negro", 34900),
  sx("Fetiches", "Arnés y pollera unisex", 24900),

  sx("Juegos", 'Juego de cartas "Do Fuck"', 9900),
  sx("Juegos", "Baraja / juego erótico", 14900),
  sx("Juegos", "Dados Love Dice", 6000),
  sx("Juegos", "Juego de cartas Oral Sex", 15000),
  sx("Juegos", "Caramelos Pop Rock Candy", 5000),

  sx("Vibradores", "Vibrador biónico / gummy", 19900),
  sx("Vibradores", "Succionador de clítoris", 14900),
  sx("Vibradores", "Bala vibradora Punto G", 22900),
  sx("Vibradores", "Anillo vibrador Pretty Love", 19900),
  sx("Vibradores", "Anillo vibrador recargable Starsex", 12000),
  sx("Vibradores", "Vibrador multivelocidad color piel", 24900),
  sx("Vibradores", "Vibrador realista 23 cm", 24900),
  sx("Vibradores", "Vibrador Cyber 21 cm", 29900),
  sx("Vibradores", "Vibrador realista negro 23 cm", 29900),
  sx("Vibradores", "Vibrador súper soft", 19900),
  sx("Vibradores", "Vibrador Tracy Pretty Love Pink", 49900),
  sx("Vibradores", "Vibrador Power Wand Rosado", 38000),
  sx("Vibradores", "Masajeador Little Cute Verde", 24000),
  sx("Vibradores", "Masajeador Vibe Púrpura", 24000),

  sx("Consoladores", "Consolador Iron Top Negro", 12000),
  sx("Consoladores", "Consolador biónico negro con arnés", 16000),
  sx("Consoladores", "Consolador XXL con ventosa", 15900),
  sx("Consoladores", "Dildo con ventosa 20 cm", 18000),
  sx("Consoladores", "Huevo / masturbador para pene", 16000),
  sx("Consoladores", "Masturbador Holand UV Touch", 29000),

  sx("Anal", "Vara anal / beads Twist", 12000),
  sx("Anal", "Plug unisex S/M", 29900),
  sx("Anal", 'Plug "If you" M/F', 14900),
  sx("Anal", "Mini plug anal joya celeste", 19900),
  sx("Anal", "Plug joya silicona M", 19900),
  sx("Anal", "Plug joya silicona L", 19900),
  sx("Anal", "Plug metal con cola de zorro", 24000),
  sx("Anal", "Vara anal beads Pretty Love", 29900),

  // ------------------------------------------------------------ CARTA GOURMET
  rs("Sugerencias del M", "Machas a la Parmesana", 12900),
  rs("Sugerencias del M", "Empanadas lomo saltado (5 pza)", 6500),
  rs("Sugerencias del M", "Pizza camarón y pesto (1 pza)", 5500),
  rs("Sugerencias del M", "Costillas Baby Back Ribs (450 g)", 19900),

  rs("Platos Calientes", "Ostiones a la parmesana (6 pza)", 13900),
  rs("Platos Calientes", "Chupe de Locos", 14900),
  rs("Platos Calientes", "Chupe de Jaiba", 13900),
  rs("Platos Calientes", "Pastel de choclo", 14900),
  rs("Platos Calientes", "Pastel de papa", 9900),
  rs("Platos Calientes", "Lasaña Salmón y espinaca", 12000),
  rs("Platos Calientes", "Lasaña crema Espinaca", 12900),
  rs("Platos Calientes", "Lasaña de Quesos", 12900),
  rs("Platos Calientes", "Lasaña boloñesa", 12900),
  rs("Platos Calientes", "Pechuga Grillada", 8000),
  rs("Platos Calientes", "Pollo teriyaki", 8000),
  rs("Platos Calientes", "Pollo a la mostaza Miel", 8000),
  rs("Platos Calientes", "Mechada al Vino tinto", 12000),
  rs("Platos Calientes", "Estofado a la cerveza", 10000),
  rs("Platos Calientes", "Cerdo al jugo", 8000),

  rs("Acompañamientos", "Papas fritas (250 g)", 4000),
  rs("Acompañamientos", "Arroz", 3000),
  rs("Acompañamientos", "Arroz al cilantro", 3000),
  rs("Acompañamientos", "Puré clásico", 4000),
  rs("Acompañamientos", "Puré rústico", 4000),
  rs("Acompañamientos", "Pastelera de choclo", 4500),
  rs("Acompañamientos", "Vegetales asados", 7000),

  rs("Para compartir", "Papas fritas con Cheddar (250 g)", 5000),
  rs("Para compartir", "Papas fritas con mechada y queso cheddar", 10500),
  rs("Para compartir", "Mozzarella stick (4 pza)", 4000),
  rs("Para compartir", "Arrollado Jamón Queso (4 pza)", 4000),
  rs("Para compartir", "Enojadas ahí de gallina", 5500),
  rs("Para compartir", "Empanadas Fritas Camarón Mandarín (5 pza)", 6900),
  rs("Para compartir", "Empanada Frita Pollo Queso (5 pza)", 5900),
  rs("Para compartir", "Empanada Frita Champiñón Queso (5 pza)", 4900),
  rs("Para compartir", "Empanadas Mechada Queso Fritas (5 pza)", 5900),
  rs("Para compartir", "Empanadas jamón queso (6 pza)", 4500),
  rs("Para compartir", "Empanadas de queso (6 pza)", 4000),
  rs("Para compartir", "Chicken finger (4 pza)", 4000),

  rs("Sándwich y Pizzas", "Sándwich pulled pork luco con papas fritas", 9900),
  rs("Sándwich y Pizzas", "Sándwich Mechada Luco con Papas Fritas", 9900),
  rs("Sándwich y Pizzas", "Pizza Jamón Morrón", 4500),
  rs("Sándwich y Pizzas", "Pizza Margarita", 4500),
  rs("Sándwich y Pizzas", "Pizza Tocino Ahumado 19 cm", 4500),
  rs("Sándwich y Pizzas", "Pizza napolitana", 4500),
  rs("Sándwich y Pizzas", "Pizza Pollo BBQ", 4500),
  rs("Sándwich y Pizzas", "Pizza Pepperoni", 4500),
  rs("Sándwich y Pizzas", "Pizza Española", 4500),
  rs("Sándwich y Pizzas", "Pizza Vegetariana", 4500),
  rs("Sándwich y Pizzas", "Pizza 4 Estaciones", 4500),

  rs("Desayunos", "Desayuno M", 5900),

  rs("Algo dulce", "Chicle Bigtime", 1000),
  rs("Algo dulce", "Chocolate Sahne-Nuss (250 g)", 10000),
  rs("Algo dulce", "Chocolate Trencito (150 g)", 5000),
  rs("Algo dulce", "Helado Chomp Frambuesa a la Crema (225 ml)", 7000),
  rs("Algo dulce", "Helado Chomp Sahne-Nuss (225 ml)", 7000),

  rs("Cócktails", "Baileys", 4500),
  rs("Cócktails", "Ramazzotti", 6500),
  rs("Cócktails", "Mojito Tradicional La Pizka", 7000),
  rs("Cócktails", "Variedad Sour La Pizka", 4500),
  rs("Cócktails", "Mango Sour", 4000),
  rs("Cócktails", "Piña colada La Pizka", 4500),
  rs("Cócktails", "Chirimoya sour", 4000),
  rs("Cócktails", "Daiquiri Maracuyá", 7000),
  rs("Cócktails", "Spirit Blueberry (275 ml)", 3500),
  rs("Cócktails", "Cóctel de Vodka Spirit Mojito (275 ml)", 3500),
  rs("Cócktails", "Botella Piña Colada (700 ml)", 14000),
  rs("Cócktails", "Botella chirimoya colada (700 ml)", 14000),
  rs("Cócktails", "Botella Pisco sour Andino (1000 ml)", 21000),
  rs("Cócktails", "Botella Mango Sour Andino (1000 ml)", 21000),
  rs("Cócktails", "Botella Baileys original (750 ml)", 40000),
  rs("Cócktails", "Moscow mule La Pizka", 6000),
  rs("Cócktails", "Cosmopolitan La Pizka", 4500),

  rs("Bebidas", "Bebidas en Lata (350 ml)", 2500),
  rs("Bebidas", "Agua embotellada (350 ml)", 2500),
  rs("Bebidas", "Energética Red Bull Tropical (250 ml)", 3000),
  rs("Bebidas", "Energética Red Bull Clásica (250 ml)", 3000),
  rs("Bebidas", "Té - café Nescafé Variedades", 2000),
  rs("Bebidas", "Energética Score guaraná (250 ml)", 2500),

  rs("Cervezas", "Porción Michelada (cerveza aparte)", 1500),
  rs("Cervezas", "Corona (330 ml)", 3000),
  rs("Cervezas", "Heineken (330 ml)", 3000),
  rs("Cervezas", "Royal Guard (355 ml)", 3000),
  rs("Cervezas", "Stella Artois (330 ml)", 3000),
  rs("Cervezas", "Budweiser (330 ml)", 3000),
  rs("Cervezas", "Coors original botella (355 ml)", 3000),
  rs("Cervezas", "Cusqueña Golden Lager (330 ml)", 3000),
  rs("Cervezas", "Cuello Negro Stout (330 ml)", 4500),
  rs("Cervezas", "Cuello Negro Ámbar (330 ml)", 4500),
  rs("Cervezas", "Kunstmann Valdivia Pale Lager (330 ml)", 3900),
  rs("Cervezas", "Kunstmann Miel (330 ml)", 3900),
  rs("Cervezas", "Kunstmann Torobayo (330 ml)", 3900),
  rs("Cervezas", "Lata Cusqueña (473 ml)", 3500),
  rs("Cervezas", "Lata Budweiser (473 ml)", 3500),
  rs("Cervezas", "Lata Stella Artois (473 ml)", 3500),

  rs("Destilados", "Piscola Mistral", 4500),
  rs("Destilados", "Piscola Alto del Carmen", 4500),
  rs("Destilados", "Vaso Pisco Alto del Carmen 40° (750 ml)", 5500),
  rs("Destilados", "Vaso Pisco 40° Ava Premium Silver", 5500),
  rs("Destilados", "Vaso Pisco 40° Horcón Quemado Reserva", 5500),
  rs("Destilados", "Vaso Ron cola Bacardi Añejo", 5000),
  rs("Destilados", "Vaso Ron Cola Habana Club", 5000),
  rs("Destilados", "Vaso Ron cola Barceló Añejo", 5000),
  rs("Destilados", "Vaso Vodka Absolut", 7000),
  rs("Destilados", "Vaso Gin Hendrick's", 8500),
  rs("Destilados", "Vaso Gin Patagon", 5000),
  rs("Destilados", "Vaso Gin Knut Hansen Dry", 7500),
  rs("Destilados", "Vaso Johnnie Walker Red Label", 6500),
  rs("Destilados", "Vaso Johnnie Walker Black Label", 8000),
  rs("Destilados", "Vaso Johnnie Walker Double Black", 12000),
  rs("Destilados", "Vaso Jack Daniel's con bebida", 7000),
  rs("Destilados", "Vaso Jack Daniel's Apple", 6500),
  rs("Destilados", "Vaso Jack Daniel's Honey a las rocas", 6500),
  rs("Destilados", "Botella JW Red Label (750 ml)", 40000),
  rs("Destilados", "Botella Jack Daniel's variedades (750 ml)", 60000),
  rs("Destilados", "Botella JW Black Label (750 ml)", 60000),
  rs("Destilados", "Botella Pisco Mistral 35° (750 ml)", 14900),
  rs("Destilados", "Botella Alto del Carmen 40° (750 ml)", 24000),
  rs("Destilados", "Botella Gin Hendrick's (700 ml)", 60000),
  rs("Destilados", "Botella Gin Patagon (750 ml)", 45000),
  rs("Destilados", "Botella Gin Knut Hansen Dry (500 ml)", 60000),
  rs("Destilados", "Botella ron blanco añejado Barceló (750 ml)", 18000),

  rs("Espumantes", "Copa de Espumante", 3000),
  rs("Espumantes", "Espumante Demi Sec Barón Lacroix (750 ml)", 12900),
  rs("Espumantes", "Espumante Vionelli Rosé (750 ml)", 14900),
  rs("Espumantes", "Espumante Vionelli Gold (750 ml)", 14900),
  rs("Espumantes", "Espumante Fire Black Mamba (750 ml)", 12900),
  rs("Espumantes", "Espumante Opera Gold (750 ml)", 12900),
  rs("Espumantes", "Espumante Opera Blue Moscato (750 ml)", 12900),
  rs("Espumantes", "Espumante Opera Love (750 ml)", 12900),
  rs("Espumantes", "MAVAM Tentation (750 ml)", 14900),
  rs("Espumantes", "MAVAM Beach (750 ml)", 14900),

  rs("Vinos", "Sangría Lola (750 ml)", 13900),
  rs("Vinos", "Tarapacá Gran Reserva Cabernet Sauvignon (750 ml)", 23900),
  rs("Vinos", "Casillero del Diablo Merlot Reserva (750 ml)", 12000),
  rs("Vinos", "Castillo De Molina (500 ml)", 14900),
  rs("Vinos", "Corralillo Sauvignon Blanc 2023 (750 ml)", 22900),
  rs("Vinos", "Casa Silva Colección 2024 Chardonnay (750 ml)", 12000),
  rs("Vinos", "Misiones de Rengo Cabernet Sauvignon (750 ml)", 9000),
  rs("Vinos", "Misiones de Rengo Sauvignon Blanc (750 ml)", 9000),
  rs("Vinos", "Misiones de Rengo Cabernet Sauvignon (187,5 ml)", 3500),
  rs("Vinos", "120 Tres Medallas Cabernet Sauvignon", 3500),
  rs("Vinos", "Tabalí Pedregoso Gran Reserva Carménère (750 ml)", 12900),
  rs("Vinos", "Santa Ema Select Terroir Reserva Cabernet Sauvignon (750 ml)", 12900),
  rs("Vinos", "Santa Ema Select Terroir Reserva Carménère (750 ml)", 12900),
  rs("Vinos", "Santa Ema Select Terroir Reserva Merlot (750 ml)", 12900),
  rs("Vinos", "Santa Ema Select Terroir Reserva Sauvignon Blanc 2024 (750 ml)", 12900),

  rs("Cigarros", "Cajetilla 10 unidades", 5500),
  rs("Cigarros", "Cajetilla 20 cigarros", 10000),
  rs("Cigarros", "Encendedor", 1000),
  rs("Cigarros", "Papelillos OCB Premium 1 1/4", 2500),

  rs("Spa", "Set de Afeitar", 3000),
  rs("Spa", "Bomba de baño (60 g)", 4000),
  rs("Spa", "Sales de baño (35 g)", 3000),
  rs("Spa", "Burbujas de baño (45 ml)", 2000),
  rs("Spa", "Sachet shampoo", 2000),
  rs("Spa", "Sachet acondicionador", 2000),
  rs("Spa", "Pack cepillo dientes", 2000),

  rs("Extras", "Sal de fruta", 1000),
];

/** Busca el id de un producto sembrado por su nombre exacto (para semillas). */
export function seedProductId(name: string): string {
  return SEED_PRODUCTS.find((p) => p.name === name)?.id ?? "";
}

const SHIFT_USER = "Recepción · turno noche";

// Ventas ya registradas en el turno (itemizan el corte de caja).
export const SEED_MOVEMENTS: InventoryMovement[] = [
  { id: "m-001", productId: seedProductId("Caja preservativos Sensor Plus (3 un.)"), type: "venta_presencial", quantity: -2, at: "2026-06-04T22:35:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-002", productId: seedProductId("Esposas Teddy Love"), type: "venta_presencial", quantity: -1, at: "2026-06-04T23:12:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-003", productId: seedProductId("Corona (330 ml)"), type: "venta_presencial", quantity: -4, at: "2026-06-04T23:40:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-004", productId: seedProductId("Pizza Pepperoni"), type: "venta_presencial", quantity: -2, at: "2026-06-05T00:05:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
  { id: "m-005", productId: seedProductId("Lubricante femenino Starsex \"Placer Intenso\""), type: "venta_presencial", quantity: -1, at: "2026-06-05T00:20:00", refId: CURRENT_SHIFT_ID, user: SHIFT_USER },
];
