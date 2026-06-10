import type { RealItem } from "./base";

// Tienda: sexshop y venta en recepción del inventario real (corte 09-06-2026).
// Precios heredados del catálogo v1 cuando hay equivalente; el resto son
// precios de ejemplo por confirmar con M Motel (marcados "precio de ejemplo").
//
// Depuración aplicada (spec-1b §2):
// - Excluidos: 9876543210920 Porta menú acrílicos (activo fijo) y 9876543210942
//   Tapones de lavamanos (duplicado; lo conserva otro archivo con el código
//   9876543210921).
// - Duplicados consolidados en un solo SKU: arnés con consolador negro
//   (221000273076), consolador vara Sex Pop rosado (222000146100) y vibrador
//   Super Soft mulato (44400104120).
// - 9876543210930 reclasificado de Tienda · HABITACION a sexshop (§2.4).
// - Totales tal cual del Excel, incluso negativos: la regularización la hace
//   el módulo de carga inicial.

export const TIENDA: RealItem[] = [
  // ------------------------------------------------------- Tienda · BEBIDA
  { barcode: "9876543211009", name: "Sal de fruta Disfruta clásico antiácido", family: "carta", group: "Bebidas", total: 189, price: 1000, channels: ["presencial", "room_service"] },

  // ------------------------------------------------------ Tienda · SEXSHOP
  { barcode: "6959532317541", name: "Anillo conejo vibrador Pretty Love Eudora", family: "sexshop", group: "Vibradores", total: 5, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "555000018123", name: "Anillo vibrador Starsex celeste", family: "sexshop", group: "Vibradores", total: 7, price: 12000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "221000273076", name: "Arnés con consolador negro", family: "sexshop", group: "Consoladores", total: 1, price: 34900, ageRestricted: true, channels: ["online", "presencial"] }, // consolida 22100027307
  { barcode: "22100307510", name: "Arnés y prótesis unisex", family: "sexshop", group: "Consoladores", total: 0, price: 24900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6959532312119", name: "Bala vibradora Pretty Love Beck fucsia", family: "sexshop", group: "Vibradores", total: 5, price: 22900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6959532305340", name: "Vara anal Bendy Twist 22,5 cm rosado", family: "sexshop", group: "Anal", total: 5, price: 12000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "7798297913877", name: "Consolador Bananín negro Bronx 21 cm con sopapo", family: "sexshop", group: "Consoladores", total: -1, price: 15900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "22271089000", name: "Consolador Crazy Dildo 19,5 cm", family: "sexshop", group: "Consoladores", total: 3, price: 14900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "7798297917264", name: "Consolador Realistic Nature 4", family: "sexshop", group: "Consoladores", total: 0, price: 15900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "222000039105", name: "Consolador realista curvo 14 cm", family: "sexshop", group: "Consoladores", total: 0, price: 12900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "2220030711334", name: "Consolador Rocco 19,5 cm rosado", family: "sexshop", group: "Consoladores", total: 0, price: 16900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "222000146100", name: "Consolador vara Sex Pop rosado", family: "sexshop", group: "Consoladores", total: 2, price: 12900, ageRestricted: true, channels: ["online", "presencial"] }, // consolida 22200014610; precio de ejemplo
  { barcode: "920010051017", name: "Dados Hot Dice", family: "sexshop", group: "Juegos", total: 0, price: 6000, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "920010051018", name: "Dados Love Dice", family: "sexshop", group: "Juegos", total: 8, price: 6000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6959532306750", name: "Dildo con sopapo 25 cm Barbara", family: "sexshop", group: "Consoladores", total: 0, price: 18000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "11308146600", name: "Disfraz enfermera Sexy Lingerie S/M (caja)", family: "sexshop", group: "Lencería y disfraces", total: 1, price: 18900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "801553066249", name: "Disfraz enfermera talla L (bolsa)", family: "sexshop", group: "Lencería y disfraces", total: 3, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "900119002727", name: "Disfraz enfermera talla M (bolsa)", family: "sexshop", group: "Lencería y disfraces", total: -1, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "5564546161", name: "Disfraz mucama sexy", family: "sexshop", group: "Lencería y disfraces", total: 2, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "7898495410328", name: "Electroshock menta", family: "sexshop", group: "Lubricantes", total: 10, price: 9900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "920045051013", name: "Esposas eróticas Teddy Love", family: "sexshop", group: "Fetiches", total: 3, price: 6000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "7898626040226", name: "Gel Virgin Striper 8 g", family: "sexshop", group: "Lubricantes", total: 8, price: 3900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "6959532326857", name: "Huevo masturbador Pretty Love Venus-X variedad hombre", family: "sexshop", group: "Vibradores", total: 0, price: 16000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "825156107607", name: "Juego de cartas Go Fuck", family: "sexshop", group: "Juegos", total: 0, price: 9900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "825156110539", name: "Juego de cartas Tantric Sex", family: "sexshop", group: "Juegos", total: 0, price: 14900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "825156109731", name: "Juego de cartas The Oral Sex", family: "sexshop", group: "Juegos", total: 3, price: 15000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "920008150012", name: "Kit de Sade", family: "sexshop", group: "Fetiches", total: 5, price: 14900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6940927823372", name: "Látigo Being Fetish flogger", family: "sexshop", group: "Fetiches", total: 2, price: 18000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "777000803008", name: "Lubricante anal", family: "sexshop", group: "Lubricantes", total: 111, price: 2500, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "7898495410335", name: "Lubricante electroshock chocolate 8 g", family: "sexshop", group: "Lubricantes", total: 6, price: 9900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "7898495410380", name: "Lubricante electroshock frutilla 8 g", family: "sexshop", group: "Lubricantes", total: 6, price: 9900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "777000805002", name: "Lubricante femenino", family: "sexshop", group: "Lubricantes", total: 30, price: 2500, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "77700041308", name: "Lubricante Lambida dos Deuses groselha", family: "sexshop", group: "Lubricantes", total: 4, price: 4900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "848631011015", name: "Lubricante Liquid Virgin tubo 30 ml", family: "sexshop", group: "Lubricantes", total: 6, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "777000804005", name: "Lubricante masculino Starsex efecto prolongado 5 ml", family: "sexshop", group: "Lubricantes", total: 160, price: 2500, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "667000312535", name: "Vagina masturbadora Oh Yeah", family: "sexshop", group: "Consoladores", total: 4, price: 19900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "6940927823310", name: "Palmeta paddle", family: "sexshop", group: "Fetiches", total: 2, price: 18000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "92001000007", name: "Pan de vida erótico", family: "sexshop", group: "Lubricantes", total: 4, price: 3500, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "7804620833184", name: "Pastilla tipo Viagra Enhora 100 mg (1 un.)", family: "sexshop", group: "Preservativos y potenciadores", total: 83, price: 4000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "850006647194", name: "Peta zeta Rock Candy uva", family: "sexshop", group: "Lubricantes", total: 8, price: 5000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "33400000100", name: "Plug anal joya celeste talla S", family: "sexshop", group: "Anal", total: 2, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "33400002820", name: "Plug anal joya silicona morado M", family: "sexshop", group: "Anal", total: 1, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "33400002870", name: "Plug anal joya silicona negro L", family: "sexshop", group: "Anal", total: 1, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "3340150040011", name: "Plug anal metalizado cola de zorro", family: "sexshop", group: "Anal", total: 2, price: 24000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "334000105046", name: "Plug anal Sexy Soft", family: "sexshop", group: "Anal", total: 2, price: 14900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "6970260903066", name: "Plug de cristal Lovetoy Glass Romance", family: "sexshop", group: "Anal", total: 1, price: 17900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "6959532317787", name: "Plug Special Anal Simulation", family: "sexshop", group: "Anal", total: 0, price: 13900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "7804676070113", name: "Preservativos variedades", family: "sexshop", group: "Preservativos y potenciadores", total: 198, price: 3000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "44501499810", name: "Pretty Love Little Cute púrpura", family: "sexshop", group: "Vibradores", total: 2, price: 24000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6959532334326", name: "Pretty Love Little Cute Mini Stick verde", family: "sexshop", group: "Vibradores", total: 5, price: 24000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "77700052500", name: "Sachet lubricante Liquid Virgin 2 ml", family: "sexshop", group: "Lubricantes", total: 6, price: 2500, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "5600298351904", name: "Set lubricantes The Play Set Orgie", family: "sexshop", group: "Lubricantes", total: 1, price: 24900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "7898626042657", name: "Spray garganta profunda menta 15 ml", family: "sexshop", group: "Lubricantes", total: 8, price: 12000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "7898626042664", name: "Spray garganta profunda sabor frutilla 15 ml", family: "sexshop", group: "Lubricantes", total: 10, price: 12000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6937526503743", name: "Succionador de clítoris Romance Mind-Blowing", family: "sexshop", group: "Vibradores", total: 3, price: 14900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6940927823358", name: "Tobilleras BDSM Ankle Cuffs Being Fetish", family: "sexshop", group: "Fetiches", total: 1, price: 27000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "33401421400", name: "Vara anal beads Pretty Love fucsia", family: "sexshop", group: "Anal", total: 4, price: 29900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6940927801004", name: "Varita anal 10 bolas negro", family: "sexshop", group: "Anal", total: 2, price: 11900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "7798297913990", name: "Vibrador Bananín negro Vibe American Bronx", family: "sexshop", group: "Vibradores", total: 2, price: 19900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "7798297919657", name: "Vibrador Cyber 21 cm Real Skin N4", family: "sexshop", group: "Vibradores", total: 0, price: 29900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "94555000020", name: "Vibrador Massager Wand micrófono morado", family: "sexshop", group: "Vibradores", total: 0, price: 34900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "44400100210", name: "Vibrador multivelocidades piel", family: "sexshop", group: "Vibradores", total: 4, price: 24900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "6959532316452", name: "Vibrador Power Wand Pretty Love", family: "sexshop", group: "Vibradores", total: 2, price: 38000, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "4440000081009", name: "Vibrador Reales Rocco 23 cm", family: "sexshop", group: "Vibradores", total: 2, price: 24900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "444000660022", name: "Vibrador Sex Soft", family: "sexshop", group: "Vibradores", total: 2, price: 19900, ageRestricted: true, channels: ["online", "presencial"] }, // precio de ejemplo
  { barcode: "44400104120", name: "Vibrador Super Soft mulato", family: "sexshop", group: "Vibradores", total: 7, price: 19900, ageRestricted: true, channels: ["online", "presencial"] }, // consolida 444001041103 (4 + 3)
  { barcode: "6959532331479", name: "Vibrador Tracy Pretty Love Pink", family: "sexshop", group: "Vibradores", total: 1, price: 49900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "22201070254", name: "Vibrador Vibe Bananín gummy", family: "sexshop", group: "Vibradores", total: 2, price: 19900, ageRestricted: true, channels: ["online", "presencial"] },
  { barcode: "9876543210930", name: "Vibrador doble estimulación Sexy Soft", family: "sexshop", group: "Vibradores", total: 0, price: 22900, ageRestricted: true, channels: ["online", "presencial"] }, // reclasificado desde Tienda · HABITACION; precio de ejemplo

  // ----------------------------------------------------- Tienda · ESPECIAL
  { barcode: "9876543210957", name: "Afeitadora amarilla Wilkinson", family: "carta", group: "Extras", total: 0, price: 1500, channels: ["presencial", "room_service"] }, // precio de ejemplo
  { barcode: "78012523", name: "Cigarros Pall Mall azul 20 normal", family: "carta", group: "Cigarros", total: 14, price: 10000, ageRestricted: true, channels: ["presencial", "room_service"] },
  { barcode: "78025035", name: "Cigarros Pall Mall azul Click XL 20 un.", family: "carta", group: "Cigarros", total: 20, price: 10000, ageRestricted: true, channels: ["presencial", "room_service"] },
  { barcode: "78019065", name: "Cigarros Pall Mall Click 10 un. Boost verde", family: "carta", group: "Cigarros", total: 3, price: 5500, ageRestricted: true, channels: ["presencial", "room_service"] },
  { barcode: "78019041", name: "Cigarros Pall Mall Click 10 un. Click On celeste", family: "carta", group: "Cigarros", total: 11, price: 5500, ageRestricted: true, channels: ["presencial", "room_service"] },
  { barcode: "78025059", name: "Cigarros Pall Mall Click 20 Boost verde XL", family: "carta", group: "Cigarros", total: 9, price: 10000, ageRestricted: true, channels: ["presencial", "room_service"] },
  { barcode: "172326112025", name: "Decoración globos (unidad)", family: "carta", group: "Celebraciones", total: 0, price: 1000, channels: ["presencial"] }, // precio de ejemplo
  { barcode: "181426112025", name: "Decoraciones caja de bombones regalo M", family: "carta", group: "Celebraciones", total: 4, price: 9900, channels: ["presencial"] }, // precio de ejemplo
  { barcode: "180326112025", name: "Decoraciones peluche o regalo M", family: "carta", group: "Celebraciones", total: 6, price: 7900, channels: ["presencial"] }, // precio de ejemplo
  { barcode: "9876543210944", name: "Espuma de baño 500 ml", family: "carta", group: "Spa", total: 2, price: 5900, channels: ["presencial", "room_service"] }, // precio de ejemplo
  { barcode: "9876543210926", name: "Jabón de baño 60 g", family: "carta", group: "Extras", total: -3, price: 1000, channels: ["presencial", "room_service"] }, // precio de ejemplo
  { barcode: "9876543210943", name: "Kit de baño", family: "carta", group: "Extras", total: 0, price: 2500, channels: ["presencial", "room_service"] }, // precio de ejemplo
  { barcode: "8012025", name: "Pack kit higiene personal 6 productos", family: "carta", group: "Extras", total: 4, price: 3500, channels: ["presencial", "room_service"] }, // precio de ejemplo
  { barcode: "769284113", name: "Pack kit lavado de dientes", family: "carta", group: "Extras", total: 9, price: 2000, channels: ["presencial", "room_service"] },
  { barcode: "13022025", name: "Pack San Valentín", family: "carta", group: "Celebraciones", total: 0, price: 25000, channels: ["presencial"] }, // precio tomado de su nombre en el Excel
  { barcode: "30052765", name: "Papelillo OCB 1 1/4", family: "carta", group: "Cigarros", total: 19, price: 2500, ageRestricted: true, channels: ["presencial", "room_service"] },
  { barcode: "78016118", name: "Presto barba / set de afeitar / Stone Paper", family: "carta", group: "Extras", total: 104, price: 3000, channels: ["presencial", "room_service"] },

  // ----------------------------------------------------- Tienda · CORTESIA
  // La bomba de baño también se vende como Spa en la v1; se carga vendible.
  { barcode: "261220243", name: "Bomba de baño 60 g", family: "carta", group: "Spa", total: 33, price: 4000, channels: ["presencial", "room_service"] },

  // --------------------------------------------------- Tienda · HABITACION
  // Amenidades de la pieza (solo inventario interno) salvo las excepciones
  // vendibles: sales de baño (Spa) y encendedor (Cigarros).
  { barcode: "7804920008138", name: "Acondicionador personal frasco", family: "insumo", group: "Amenidades", total: 61, price: 0, cost: 700, channels: [] },
  { barcode: "5011435624582", name: "Encendedor", family: "carta", group: "Cigarros", total: 50, price: 1000, ageRestricted: true, channels: ["presencial", "room_service"] },
  { barcode: "9876543210982", name: "Jabón líquido gel de ducha 30 ml", family: "insumo", group: "Amenidades", total: 466, price: 0, cost: 400, channels: [] },
  { barcode: "9876543210939", name: "Sachet shampoo Head & Shoulders 10 ml", family: "insumo", group: "Amenidades", total: 0, price: 0, cost: 300, channels: [] },
  { barcode: "26122024", name: "Sales de baño Stone Paper 35 g", family: "carta", group: "Spa", total: 188, price: 3000, channels: ["presencial", "room_service"] },
  { barcode: "27506309803665", name: "Shampoo personal frasco", family: "insumo", group: "Amenidades", total: 42, price: 0, cost: 700, channels: [] },
];
