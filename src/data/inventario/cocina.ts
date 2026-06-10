import type { RealItem } from "./base";

// Cocina: alimentos y bebidas del inventario real (corte 09-06-2026).
// Secciones del Excel: Cocina · ALIMENTO (74) y Cocina · BEBIDA (138) = 212 ítems.
// Precios heredados del catálogo v1 cuando hay equivalente; las líneas marcadas
// "precio de ejemplo" son estimaciones por confirmar con M Motel.

export const COCINA: RealItem[] = [
  // ------------------------------------------------------- Sugerencias del M
  { barcode: "122213032026", name: "Camarón eby crocante 4 un.", family: "carta", group: "Sugerencias del M", total: 0, price: 7900, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "24203", name: "Chupe de jaiba", family: "carta", group: "Sugerencias del M", total: 10, price: 13900, channels: ["room_service"] },
  { barcode: "24201", name: "Chupe de locos", family: "carta", group: "Sugerencias del M", total: 3, price: 14900, channels: ["room_service"] },
  { barcode: "20091", name: "Machas a la parmesana x 6 un.", family: "carta", group: "Sugerencias del M", total: -4, price: 12900, channels: ["room_service"] },
  { barcode: "1402202501", name: "Ostiones a la parmesana x 6 un.", family: "carta", group: "Sugerencias del M", total: 7, price: 13900, channels: ["room_service"] },

  // -------------------------------------------------------- Platos calientes
  { barcode: "11281404", name: "Comidas ají de gallina (sin acompañamiento)", family: "carta", group: "Platos calientes", total: 2, price: 8000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "12011404", name: "Comidas cerdo a la mostaza miel (sin acompañamiento)", family: "carta", group: "Platos calientes", total: 13, price: 8000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "12031404", name: "Comidas cerdo al jugo (sin acompañamiento)", family: "carta", group: "Platos calientes", total: 7, price: 8000, channels: ["room_service"] },
  { barcode: "19002004", name: "Comidas charquicán con vacuno", family: "carta", group: "Platos calientes", total: 4, price: 8500, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "18462004", name: "Comidas costillas Baby Back Ribs", family: "carta", group: "Platos calientes", total: 9, price: 19900, channels: ["room_service"] },
  { barcode: "12051404", name: "Comidas estofado a la cerveza (sin acompañamiento)", family: "carta", group: "Platos calientes", total: 12, price: 10000, channels: ["room_service"] },
  { barcode: "18552004", name: "Comidas lentejas con tocino", family: "carta", group: "Platos calientes", total: 10, price: 8500, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "12111404", name: "Comidas mechada al vino tinto (sin acompañamiento)", family: "carta", group: "Platos calientes", total: 6, price: 12000, channels: ["room_service"] },
  { barcode: "19022004", name: "Comidas pastel de papa", family: "carta", group: "Platos calientes", total: 6, price: 9900, channels: ["room_service"] },
  { barcode: "12151404", name: "Comidas pechuga grillada", family: "carta", group: "Platos calientes", total: 10, price: 8000, channels: ["room_service"] },
  { barcode: "11521404", name: "Comidas pollo a la mostaza miel (sin acompañamiento)", family: "carta", group: "Platos calientes", total: 5, price: 8000, channels: ["room_service"] },
  { barcode: "18532004", name: "Comidas pollo asado", family: "carta", group: "Platos calientes", total: 11, price: 8500, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "11571404", name: "Comidas pollo teriyaki (sin acompañamiento)", family: "carta", group: "Platos calientes", total: 13, price: 8000, channels: ["room_service"] },
  { barcode: "18562004", name: "Comidas porotos con longaniza", family: "carta", group: "Platos calientes", total: 9, price: 8500, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "12371404", name: "Crema de lentejas", family: "carta", group: "Platos calientes", total: 8, price: 7900, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "12361404", name: "Crema de zapallo camote", family: "carta", group: "Platos calientes", total: 7, price: 7900, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7891515482251", name: "Lasaña a la bolognesa", family: "carta", group: "Platos calientes", total: 7, price: 12900, channels: ["room_service"] },
  { barcode: "7891515482022", name: "Lasaña de crema de espinaca 600 g", family: "carta", group: "Platos calientes", total: 6, price: 12900, channels: ["room_service"] },
  { barcode: "7891515482268", name: "Lasaña mix de quesos", family: "carta", group: "Platos calientes", total: 5, price: 12900, channels: ["room_service"] },
  { barcode: "19142004", name: "Lasaña salmón espinaca", family: "carta", group: "Platos calientes", total: 4, price: 12000, channels: ["room_service"] },
  { barcode: "172520032026", name: "Pastel de choclo horno", family: "carta", group: "Platos calientes", total: 6, price: 14900, channels: ["room_service"] },

  // -------------------------------------------------------- Acompañamientos
  { barcode: "18432004", name: "Acompañamiento arroz al cilantro", family: "carta", group: "Acompañamientos", total: 5, price: 3000, channels: ["room_service"] },
  { barcode: "12301404", name: "Acompañamiento arroz blanco", family: "carta", group: "Acompañamientos", total: 6, price: 3000, channels: ["room_service"] },
  { barcode: "12321404", name: "Acompañamiento pastelera de choclo", family: "carta", group: "Acompañamientos", total: 3, price: 4500, channels: ["room_service"] },
  { barcode: "12171404", name: "Acompañamiento puré rústico", family: "carta", group: "Acompañamientos", total: 6, price: 4000, channels: ["room_service"] },
  { barcode: "12341404", name: "Acompañamiento vegetales asados", family: "carta", group: "Acompañamientos", total: 4, price: 7000, channels: ["room_service"] },
  { barcode: "17482004", name: "Acompañamientos", family: "carta", group: "Acompañamientos", total: 8, price: 4000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "17412004", name: "Acompañamientos puré clásico", family: "carta", group: "Acompañamientos", total: 2, price: 4000, channels: ["room_service"] },

  // --------------------------------------------------------- Para compartir
  { barcode: "132619052026", name: "Arrollado primavera 4 un.", family: "carta", group: "Para compartir", total: 12, price: 4500, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7692832901", name: "Arrollado jamón/queso 4 un.", family: "carta", group: "Para compartir", total: 66, price: 4000, channels: ["room_service"] },
  { barcode: "150110032026", name: "Chicken finger con barbecue 4 un.", family: "carta", group: "Para compartir", total: 37, price: 4000, channels: ["room_service"] },
  { barcode: "161020032026", name: "Empanadas ají de gallina 5 un.", family: "carta", group: "Para compartir", total: 13, price: 5500, channels: ["room_service"] },
  { barcode: "182703022026", name: "Empanadas camarón mandarín 5 un. AsianWok", family: "carta", group: "Para compartir", total: 55, price: 6900, channels: ["room_service"] },
  { barcode: "181603022026", name: "Empanadas camarón queso 5 un. AsianWok", family: "carta", group: "Para compartir", total: 0, price: 6900, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "183203022026", name: "Empanadas champiñón queso 5 un. AsianWok", family: "carta", group: "Para compartir", total: 39, price: 4900, channels: ["room_service"] },
  { barcode: "769284072", name: "Empanadas de queso fritas x 5 un.", family: "carta", group: "Para compartir", total: 27, price: 4000, channels: ["room_service"] },
  { barcode: "133920032026", name: "Empanadas lomo saltado 5 un. con salsa", family: "carta", group: "Para compartir", total: 42, price: 6500, channels: ["room_service"] },
  { barcode: "2804202501", name: "Empanadas mechada queso x 5 un. fritas", family: "carta", group: "Para compartir", total: 20, price: 5900, channels: ["room_service"] },
  { barcode: "183003022026", name: "Empanadas pollo queso 5 un. AsianWok", family: "carta", group: "Para compartir", total: 8, price: 5900, channels: ["room_service"] },
  { barcode: "7718042760002", name: "Empanadas queso jamón horno 6 un.", family: "carta", group: "Para compartir", total: 2, price: 4500, channels: ["room_service"] },
  { barcode: "150410032026", name: "Mozzarella stick 4 un.", family: "carta", group: "Para compartir", total: 32, price: 4000, channels: ["room_service"] },
  { barcode: "7001", name: "Papas fritas porción 250 g", family: "carta", group: "Para compartir", total: 78, price: 4000, channels: ["room_service"] },

  // ------------------------------------------------------- Sándwich y pizzas
  { barcode: "769284132", name: "Pizza 4 estaciones", family: "carta", group: "Sándwich y pizzas", total: 3, price: 4500, channels: ["room_service"] },
  { barcode: "133620032026", name: "Pizza camarón 19 cm", family: "carta", group: "Sándwich y pizzas", total: 4, price: 5500, channels: ["room_service"] },
  { barcode: "2804202502", name: "Pizza española (con chorizo)", family: "carta", group: "Sándwich y pizzas", total: 13, price: 4500, channels: ["room_service"] },
  { barcode: "133420032026", name: "Pizza jamón morrón 19 cm", family: "carta", group: "Sándwich y pizzas", total: 6, price: 4500, channels: ["room_service"] },
  { barcode: "132820032026", name: "Pizza margarita 19 cm", family: "carta", group: "Sándwich y pizzas", total: 7, price: 4500, channels: ["room_service"] },
  { barcode: "76928441137", name: "Pizza napolitana", family: "carta", group: "Sándwich y pizzas", total: 16, price: 4500, channels: ["room_service"] },
  { barcode: "769284135", name: "Pizza pepperoni", family: "carta", group: "Sándwich y pizzas", total: 20, price: 4500, channels: ["room_service"] },
  { barcode: "769284136", name: "Pizza pollo BBQ", family: "carta", group: "Sándwich y pizzas", total: 9, price: 4500, channels: ["room_service"] },
  { barcode: "769283293789", name: "Pizza tocino ahumado", family: "carta", group: "Sándwich y pizzas", total: 14, price: 4500, channels: ["room_service"] },
  { barcode: "7692832939", name: "Pizza vegetariana", family: "carta", group: "Sándwich y pizzas", total: 5, price: 4500, channels: ["room_service"] },
  { barcode: "1604202503", name: "Sándwich aliado J/Q o Q/Q calentar", family: "carta", group: "Sándwich y pizzas", total: 25, price: 4900, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "769284149", name: "Sándwich mechada luco", family: "carta", group: "Sándwich y pizzas", total: -6, price: 9900, channels: ["room_service"] },
  { barcode: "18301404", name: "Sándwich pulled pork con queso", family: "carta", group: "Sándwich y pizzas", total: 3, price: 9900, channels: ["room_service"] },

  // ------------------------------------------------------------- Algo dulce
  { barcode: "7802245000790", name: "Alfajor Entrelagos 45 g", family: "carta", group: "Algo dulce", total: 4, price: 2500, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "78005624", name: "Chicle Bigtime menta", family: "carta", group: "Algo dulce", total: 7, price: 1000, channels: ["room_service"] },
  { barcode: "9876543210994", name: "Chocolate Entrelagos 13 un.", family: "carta", group: "Algo dulce", total: 0, price: 6000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7802230070227", name: "Chocolate Sahne-Nuss 250 g", family: "carta", group: "Algo dulce", total: 0, price: 10000, channels: ["room_service"] },
  { barcode: "7802230070029", name: "Chocolate Trencito barra 150 g", family: "carta", group: "Algo dulce", total: 11, price: 5000, channels: ["room_service"] },
  { barcode: "7613035490734", name: "Helado Savory Chomp frambuesa 225 ml", family: "carta", group: "Algo dulce", total: 1, price: 7000, channels: ["room_service"] },
  { barcode: "7613035493650", name: "Helado Savory Chomp Sahne-Nuss 225 ml", family: "carta", group: "Algo dulce", total: 6, price: 7000, channels: ["room_service"] },

  // ---------------------------------------------------------------- Bebidas
  { barcode: "7801620004507", name: "Agua mineral con gas vidrio 350 cc", family: "carta", group: "Bebidas", total: 89, price: 2500, channels: ["room_service"] },
  { barcode: "7801620004514", name: "Agua mineral sin gas vidrio 350 cc", family: "carta", group: "Bebidas", total: -62, price: 2500, channels: ["room_service"] },
  { barcode: "1604202502", name: "Café sachet 45 g 2 un.", family: "carta", group: "Bebidas", total: 65, price: 2000, channels: ["room_service"] },
  { barcode: "7613033458101", name: "Café para venta cappuccino Nescafé", family: "carta", group: "Bebidas", total: 0, price: 2000, channels: ["room_service"] },
  { barcode: "7613033527173", name: "Café para venta Doble Choca Moka Nescafé", family: "carta", group: "Bebidas", total: 0, price: 2000, channels: ["room_service"] },
  { barcode: "7613033458538", name: "Café venta vainilla latte", family: "carta", group: "Bebidas", total: 0, price: 2000, channels: ["room_service"] },
  { barcode: "7801610880104", name: "Coca-Cola express 237 ml", family: "carta", group: "Bebidas", total: -338, price: 2000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7801610001196", name: "Coca-Cola normal en lata 350 ml", family: "carta", group: "Bebidas", total: -50, price: 2500, channels: ["room_service"] },
  { barcode: "7801610350355", name: "Coca-Cola zero en lata 350 ml", family: "carta", group: "Bebidas", total: 43, price: 2500, channels: ["room_service"] },
  { barcode: "7801610880159", name: "Coca-Cola zero express 237 ml", family: "carta", group: "Bebidas", total: 135, price: 2000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "9002490100070", name: "Energética Red Bull clásica 250 ml", family: "carta", group: "Bebidas", total: 18, price: 3000, channels: ["room_service"] },
  { barcode: "90424496", name: "Energética Red Bull tropical 250 ml", family: "carta", group: "Bebidas", total: 10, price: 3000, channels: ["room_service"] },
  { barcode: "798190226682", name: "Energética Score guaraná 250 ml", family: "carta", group: "Bebidas", total: 21, price: 2500, channels: ["room_service"] },
  { barcode: "7801610002193", name: "Fanta en lata 350 cc", family: "carta", group: "Bebidas", total: 5, price: 2500, channels: ["room_service"] },
  { barcode: "7801610222171", name: "Fanta express 237 ml", family: "carta", group: "Bebidas", total: 76, price: 2000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "304202501", name: "Porción jugo medio vaso", family: "carta", group: "Bebidas", total: 14, price: 2000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7692832922", name: "Sal de fruta Disfruta limón antiácido", family: "carta", group: "Bebidas", total: 183, price: 1000, channels: ["room_service"] },
  { barcode: "7801610560174", name: "Sprite express 237 ml", family: "carta", group: "Bebidas", total: -14, price: 2000, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7801610005194", name: "Sprite lata 350 cc", family: "carta", group: "Bebidas", total: 4, price: 2500, channels: ["room_service"] },
  { barcode: "16042025", name: "Té Dilmah o té de hierbas", family: "carta", group: "Bebidas", total: 29, price: 2000, channels: ["room_service"] },

  // --------------------------------------------------------------- Cervezas
  { barcode: "7891991014762", name: "Cerveza Budweiser 330 cc", family: "carta", group: "Cervezas", total: 1, price: 3000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802100003218", name: "Cerveza Coors 355 cc", family: "carta", group: "Cervezas", total: 15, price: 3000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "75041670", name: "Cerveza Corona 330 cc", family: "carta", group: "Cervezas", total: -83, price: 3000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804673220009", name: "Cerveza Cuello Negro ámbar 330 cc", family: "carta", group: "Cervezas", total: 0, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804673220023", name: "Cerveza Cuello Negro stout", family: "carta", group: "Cervezas", total: 7, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7753749275767", name: "Cerveza Cusqueña Golden Lager 330 cc", family: "carta", group: "Cervezas", total: -42, price: 3000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802100000354", name: "Cerveza Heineken botella 330 cc", family: "carta", group: "Cervezas", total: 28, price: 3000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802107000050", name: "Cerveza Kunstmann miel", family: "carta", group: "Cervezas", total: 0, price: 3900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802107001392", name: "Cerveza Kunstmann Torobayo", family: "carta", group: "Cervezas", total: 0, price: 3900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802107000883", name: "Cerveza Kunstmann Valdivia Pale Lager", family: "carta", group: "Cervezas", total: 5, price: 3900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802100505538", name: "Cerveza Royal Guard 355 cc", family: "carta", group: "Cervezas", total: 126, price: 3000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "75001629", name: "Cerveza Sol 330 cc", family: "carta", group: "Cervezas", total: -1, price: 3000, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7792798006045", name: "Cerveza Stella Artois 330 cc", family: "carta", group: "Cervezas", total: 101, price: 3000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "1801828", name: "Lata cerveza Budweiser 473 cc", family: "carta", group: "Cervezas", total: 8, price: 3500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7753749003216", name: "Lata cerveza Cusqueña dorada 474 ml", family: "carta", group: "Cervezas", total: 56, price: 3500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802130000775", name: "Lata cerveza Stella Artois 473 ml", family: "carta", group: "Cervezas", total: 6, price: 3500, ageRestricted: true, channels: ["room_service"] },

  // --------------------------------------------------------------- Cócteles
  { barcode: "5544332211", name: "Botella Baileys 750 cc", family: "carta", group: "Cócteles", total: 0, price: 40000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211023", name: "Botella chirimoya colada 700 cc", family: "carta", group: "Cócteles", total: 0, price: 14000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802175002185", name: "Botella pisco sour Andino 1 L", family: "carta", group: "Cócteles", total: 4, price: 21000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "8006550340230", name: "Botella Ramazzotti Spritz 700 cc", family: "carta", group: "Cócteles", total: 0, price: 18900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "8411640001371", name: "Cocktail Spirit blueberry 275 ml", family: "carta", group: "Cócteles", total: 12, price: 3500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "8411640001340", name: "Cocktail Spirit mojito 275 ml", family: "carta", group: "Cócteles", total: 3, price: 3500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802175454885", name: "Mistral Ice lata 310 cc", family: "carta", group: "Cócteles", total: 17, price: 3500, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7802175001171", name: "Mojito Ice Sierra Morena lata 310 cc", family: "carta", group: "Cócteles", total: 0, price: 3500, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "5011013100132", name: "Porción 2 oz Baileys", family: "carta", group: "Cócteles", total: 87, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211011", name: "Porción 4 oz daiquiri passion fruit", family: "carta", group: "Cócteles", total: 26, price: 7000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "190925032026", name: "Porción calafate sour La Pizka 2 oz", family: "carta", group: "Cócteles", total: -25, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7802175453956", name: "Porción chirimoya colada Campanario", family: "carta", group: "Cócteles", total: 31, price: 4000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "114018122025", name: "Porción cosmopolitan La Pizka", family: "carta", group: "Cócteles", total: 23, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "194426112025", name: "Porción limón 2 oz para michelada", family: "carta", group: "Cócteles", total: 7, price: 1500, channels: ["room_service"] },
  { barcode: "7802175002171", name: "Porción mango sour Andino", family: "carta", group: "Cócteles", total: 85, price: 4000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "190025032026", name: "Porción mojito La Pizka", family: "carta", group: "Cócteles", total: -123, price: 7000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "114118122025", name: "Porción moscow mule La Pizka", family: "carta", group: "Cócteles", total: 10, price: 6000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "110118122025", name: "Porción normal pisco sour La Pizka", family: "carta", group: "Cócteles", total: -769, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "760798819002", name: "Porción pisco sour Andino", family: "carta", group: "Cócteles", total: 84, price: 4000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "760798819004", name: "Porción piña colada Campanario", family: "carta", group: "Cócteles", total: -74, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "113918122025", name: "Porción piña colada La Pizka", family: "carta", group: "Cócteles", total: -160, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "113618122025", name: "Porción sour maracuyá La Pizka", family: "carta", group: "Cócteles", total: -76, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "112418122025", name: "Porción sour menta jengibre La Pizka", family: "carta", group: "Cócteles", total: 111, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7003", name: "Ramazzotti porción 2 oz", family: "carta", group: "Cócteles", total: 78, price: 6500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "4092025018", name: "Vaso de terremoto", family: "carta", group: "Cócteles", total: 0, price: 4500, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo

  // -------------------------------------------------------------- Destilados
  { barcode: "9876543211025", name: "Botella Alto del Carmen 40° 750 ml", family: "carta", group: "Destilados", total: -1, price: 24000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543210890", name: "Botella gin Hendrick's 700 cc", family: "carta", group: "Destilados", total: 0, price: 60000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543210889", name: "Botella gin Patagon 750 cc", family: "carta", group: "Destilados", total: 0, price: 45000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211002", name: "Botella Johnnie Walker Double Black 750 ml", family: "carta", group: "Destilados", total: 0, price: 60000, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "9876543211026", name: "Botella pisco Alto del Carmen 35° 1 L", family: "carta", group: "Destilados", total: -1, price: 19900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7802175455912", name: "Botella pisco Mistral 35° 750 cc", family: "carta", group: "Destilados", total: 0, price: 14900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7461323129596", name: "Botella ron blanco Barceló 750 ml", family: "carta", group: "Destilados", total: 0, price: 18000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "82184004371", name: "Botella whisky Jack Daniel's Apple 750 ml", family: "carta", group: "Destilados", total: 0, price: 60000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "82184000335", name: "Botella whisky Jack Daniel's Honey 750 ml", family: "carta", group: "Destilados", total: 0, price: 60000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "82184090466", name: "Botella whisky Jack Daniel's Tennessee 750 ml", family: "carta", group: "Destilados", total: 0, price: 60000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "5000267024011", name: "Botella whisky Johnnie Walker Black Label 750 ml", family: "carta", group: "Destilados", total: 0, price: 60000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "5000267014005", name: "Botella whisky Johnnie Walker Red Label 750 ml", family: "carta", group: "Destilados", total: 0, price: 40000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543210891", name: "Gin Knut Hansen 500 cc", family: "carta", group: "Destilados", total: 0, price: 60000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211022", name: "Pisco Mistral 1 L", family: "carta", group: "Destilados", total: 0, price: 18900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "760798819007", name: "Porción 2 oz Alto del Carmen 35°", family: "carta", group: "Destilados", total: 205, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "769284129", name: "Porción 2 oz Alto del Carmen 40°", family: "carta", group: "Destilados", total: 69, price: 5500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "2406202502", name: "Porción 2 oz gin Hendrick's", family: "carta", group: "Destilados", total: 11, price: 8500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "2406202501", name: "Porción 2 oz gin Knut Hansen", family: "carta", group: "Destilados", total: 8, price: 7500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "2406202503", name: "Porción 2 oz gin Patagon", family: "carta", group: "Destilados", total: 14, price: 5000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211001", name: "Porción 2 oz Johnnie Walker Double Black", family: "carta", group: "Destilados", total: 14, price: 12000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7008", name: "Porción 2 oz Johnnie Walker Black Label", family: "carta", group: "Destilados", total: 21, price: 8000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7007", name: "Porción 2 oz Johnnie Walker Red Label", family: "carta", group: "Destilados", total: 34, price: 6500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211007", name: "Porción 2 oz pisco 40° ABA Silver Premium", family: "carta", group: "Destilados", total: 13, price: 5500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211005", name: "Porción 2 oz pisco 40° Horcón Quemado reservado", family: "carta", group: "Destilados", total: 7, price: 5500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "760798819008", name: "Porción 2 oz pisco Mistral 35°", family: "carta", group: "Destilados", total: -12, price: 4500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "987654321008", name: "Porción 2 oz ron Bacardí Carta Oro", family: "carta", group: "Destilados", total: 5, price: 5000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "150020032026", name: "Porción 2 oz ron Barceló añejo", family: "carta", group: "Destilados", total: 8, price: 5000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211019", name: "Porción 2 oz ron Barceló blanco", family: "carta", group: "Destilados", total: 81, price: 5000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "152720032026", name: "Porción 2 oz ron Havana Club especial", family: "carta", group: "Destilados", total: 11, price: 5000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7692832918", name: "Porción 2 oz vodka Absolut", family: "carta", group: "Destilados", total: 13, price: 7000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7006", name: "Porción 2 oz whisky Jack Daniel's Tennessee", family: "carta", group: "Destilados", total: 44, price: 7000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "15240104", name: "Porción ron Habana Club 2 oz", family: "carta", group: "Destilados", total: 9, price: 5000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7005", name: "Porción whisky Jack Daniel's Apple manzana", family: "carta", group: "Destilados", total: 31, price: 6500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7004", name: "Porción whisky Jack Daniel's Honey miel", family: "carta", group: "Destilados", total: 33, price: 6500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543211003", name: "Ron Bacardí Carta Oro 700 cc", family: "carta", group: "Destilados", total: 0, price: 17900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "9876543211021", name: "Ron blanco Maddero 750 cc", family: "carta", group: "Destilados", total: 0, price: 14900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "9876543210892", name: "Vodka Absolut 40° 750 cc", family: "carta", group: "Destilados", total: 0, price: 16900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo

  // -------------------------------------------------------------- Espumantes
  { barcode: "7804315003694", name: "Botella espumante 750 ml Barón Lacroix", family: "carta", group: "Espumantes", total: -26, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804315011668", name: "Botella espumante 750 ml OX Demi Sec", family: "carta", group: "Espumantes", total: 0, price: 12900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "4841676004925", name: "Botella espumante Black Mamba blackberry 750 cc", family: "carta", group: "Espumantes", total: 0, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "8437012783980", name: "Botella espumante MAVAM Beach 750 ml brillos verde", family: "carta", group: "Espumantes", total: 2, price: 14900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "8437012783874", name: "Botella espumante MAVAM Tentation 750 ml brillos rojos", family: "carta", group: "Espumantes", total: 0, price: 14900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "17619025119", name: "Botella espumante Opera Blue 750 ml", family: "carta", group: "Espumantes", total: 3, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "17619025034", name: "Botella espumante Opera Gold 750 ml", family: "carta", group: "Espumantes", total: -2, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "17619025188", name: "Botella espumante Opera Love blackberry 750 ml", family: "carta", group: "Espumantes", total: 4, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "17619025058", name: "Botella espumante Opera Pink 750 ml", family: "carta", group: "Espumantes", total: 3, price: 12900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "5901617017465", name: "Botella espumante Vionelli Gold 750 cc", family: "carta", group: "Espumantes", total: 0, price: 14900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "5901617017458", name: "Botella espumante Vionelli Rosé 750 cc", family: "carta", group: "Espumantes", total: 1, price: 14900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "760798819006", name: "Porción vaso espumante", family: "carta", group: "Espumantes", total: 234, price: 3000, ageRestricted: true, channels: ["room_service"] },

  // ------------------------------------------------------------------- Vinos
  { barcode: "659525562717", name: "Botella vino carménère Royal One 750 ml", family: "carta", group: "Vinos", total: 3, price: 11900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7804330004898", name: "Vino 120 Tres Medallas 187 cc cabernet sauvignon", family: "carta", group: "Vinos", total: 22, price: 3500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804454001278", name: "Vino Casa Silva Colección chardonnay 750 ml", family: "carta", group: "Vinos", total: 2, price: 12000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "780953600160", name: "Vino Casas del Bosque cabernet sauvignon 750 ml", family: "carta", group: "Vinos", total: 1, price: 13900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7804320985633", name: "Vino Casillero merlot 750 ml", family: "carta", group: "Vinos", total: 0, price: 12000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804300143329", name: "Vino Castillo de Molina late harvest 500 ml", family: "carta", group: "Vinos", total: 2, price: 14900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "815992010100", name: "Vino Corralillo sauvignon blanc 2023 750 ml", family: "carta", group: "Vinos", total: 1, price: 22900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804661960245", name: "Vino Entre Vientos carménère reserva", family: "carta", group: "Vinos", total: 0, price: 9900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7804444001172", name: "Vino J. Bouchon reserva cabernet sauvignon 750 ml", family: "carta", group: "Vinos", total: 3, price: 13900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7808704640040", name: "Vino Misiones de Rengo 187 cc cabernet sauvignon", family: "carta", group: "Vinos", total: 47, price: 3500, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7808704700058", name: "Vino Misiones de Rengo 750 ml cabernet sauvignon", family: "carta", group: "Vinos", total: 2, price: 9000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7808704700065", name: "Vino Misiones de Rengo sauvignon blanc 750 ml", family: "carta", group: "Vinos", total: 1, price: 9000, ageRestricted: true, channels: ["room_service"] },
  { barcode: "9876543210925", name: "Vino pipeño 5 L", family: "carta", group: "Vinos", total: 2, price: 9900, ageRestricted: true, channels: ["room_service"] }, // precio de ejemplo
  { barcode: "7804643820130", name: "Vino sangría Lola 750 ml", family: "carta", group: "Vinos", total: 2, price: 13900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804319009241", name: "Vino Santa Ema Select Terroir reserva carménère 750 ml", family: "carta", group: "Vinos", total: 2, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804319007001", name: "Vino Santa Ema Select Terroir sauvignon blanc 750 ml", family: "carta", group: "Vinos", total: 2, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804319003003", name: "Vino Santa Ema Select Terroir reserva cabernet sauvignon 750 ml", family: "carta", group: "Vinos", total: 3, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804319005007", name: "Vino Santa Ema Select Terroir reserva merlot 750 ml", family: "carta", group: "Vinos", total: 2, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804300126940", name: "Vino Tabalí cabernet sauvignon 750 ml", family: "carta", group: "Vinos", total: 1, price: 12900, ageRestricted: true, channels: ["room_service"] },
  { barcode: "7804340909053", name: "Vino Tarapacá Gran Reserva cabernet sauvignon 750 ml", family: "carta", group: "Vinos", total: 1, price: 23900, ageRestricted: true, channels: ["room_service"] },

  // ------------------------------------------- Insumos de cocina (no venta)
  { barcode: "7804612610021", name: "Aceite para freír 10 L", family: "insumo", group: "Insumos de cocina", total: 2, price: 0, cost: 18900, channels: [] },
  { barcode: "70491225008", name: "Base para mojito tradicional 2 oz porción", family: "insumo", group: "Insumos de cocina", total: 81, price: 0, cost: 900, channels: [] },
  { barcode: "9876543211016", name: "Base passion fruit mojito 2 oz", family: "insumo", group: "Insumos de cocina", total: 0, price: 0, cost: 900, channels: [] },
  { barcode: "9876543210987", name: "Bolsa arándanos 400 g", family: "insumo", group: "Insumos de cocina", total: 2, price: 0, cost: 3500, channels: [] },
  { barcode: "9876543211000", name: "Bolsa hielo cubo 2.5 kg", family: "insumo", group: "Insumos de cocina", total: 0, price: 0, cost: 2000, channels: [] },
  { barcode: "9876543211017", name: "Botella base para daiquiri Master of Mixes 1 L", family: "insumo", group: "Insumos de cocina", total: 0, price: 0, cost: 6500, channels: [] },
  { barcode: "125125112025", name: "Cubo hielo unidad", family: "insumo", group: "Insumos de cocina", total: -3124, price: 0, cost: 50, channels: [] },
  { barcode: "9876543211018", name: "Granadina 900 ml 2 oz", family: "insumo", group: "Insumos de cocina", total: 45, price: 0, cost: 3500, channels: [] },
  { barcode: "9876543210986", name: "Helado de piña 2.5 L", family: "insumo", group: "Insumos de cocina", total: 2, price: 0, cost: 8900, channels: [] },
  { barcode: "9876543210984", name: "Limón deshidratado 250 g", family: "insumo", group: "Insumos de cocina", total: -2, price: 0, cost: 4500, channels: [] },
  { barcode: "790798819003", name: "Papas fritas media porción para mechada luco 150 g", family: "insumo", group: "Insumos de cocina", total: -12, price: 0, cost: 1200, channels: [] },
  { barcode: "7804339002598", name: "Porción 2 oz ron blanco Maddero para mojito", family: "insumo", group: "Insumos de cocina", total: 35, price: 0, cost: 700, channels: [] },
  { barcode: "19102004", name: "Porción mechada desmenuzada 120 g para papas fritas", family: "insumo", group: "Insumos de cocina", total: 35, price: 0, cost: 2500, channels: [] },
  { barcode: "191125032026", name: "Porción mineral para mojito La Pizka", family: "insumo", group: "Insumos de cocina", total: -123, price: 0, cost: 300, channels: [] },
  { barcode: "769284140", name: "Porción salsa queso cheddar 40 g", family: "insumo", group: "Insumos de cocina", total: -5, price: 0, cost: 800, channels: [] },
];
