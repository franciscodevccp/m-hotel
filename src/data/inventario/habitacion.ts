import type { RealItem } from "./base";

// Habitación, limpieza, blancos y cortesías del inventario real (corte 09-06-2026).
// Insumos con costo estimado; los pocos vendibles heredan el precio del catálogo v1.
// Quedan fuera los activos fijos de estas secciones (lavadoras, plancha, secadora,
// centrífuga, TV, computadores, etc.; lista cerrada en spec-1b §2.1).

export const HABITACION_LIMPIEZA: RealItem[] = [
  // ── Habitación · ESPECIAL → Cortesías (el resto de la subcategoría son activos fijos) ──
  { barcode: "9876543210948", name: "Cinta negra para decorar", family: "insumo", group: "Cortesías", total: 2, price: 0, cost: 900, channels: [] },
  { barcode: "9876543210959", name: "Cinta rosada para decorar", family: "insumo", group: "Cortesías", total: 35, price: 0, cost: 900, channels: [] },

  // ── Habitación · HABITACION → Blancos y lencería ──
  { barcode: "230620251", name: "Batas blancas S/L", family: "insumo", group: "Blancos y lencería", total: 26, price: 0, cost: 12000, channels: [] },
  { barcode: "25062025", name: "Batas grises S/L", family: "insumo", group: "Blancos y lencería", total: 12, price: 0, cost: 12000, channels: [] },
  { barcode: "240620251", name: "Batas negras S/L", family: "insumo", group: "Blancos y lencería", total: 8, price: 0, cost: 12000, channels: [] },
  { barcode: "190720252", name: "Cobertor blanco 2 plazas", family: "insumo", group: "Blancos y lencería", total: 31, price: 0, cost: 16000, channels: [] },
  { barcode: "190720251", name: "Cobertor king crema S/L", family: "insumo", group: "Blancos y lencería", total: 8, price: 0, cost: 18000, channels: [] },
  { barcode: "190720255", name: "Cubrecolchón 2 plazas impermeable", family: "insumo", group: "Blancos y lencería", total: 0, price: 0, cost: 14000, channels: [] },
  { barcode: "190720253", name: "Cubrecolchón blanco 2 plazas (antiguos)", family: "insumo", group: "Blancos y lencería", total: 27, price: 0, cost: 10000, channels: [] },
  { barcode: "190720254", name: "Cubrecolchón king impermeable", family: "insumo", group: "Blancos y lencería", total: 0, price: 0, cost: 16000, channels: [] },
  { barcode: "200620252", name: "Frazadas 2 plazas beige polar", family: "insumo", group: "Blancos y lencería", total: 40, price: 0, cost: 9000, channels: [] },
  { barcode: "200620251", name: "Funda almohadas algodón cobertor", family: "insumo", group: "Blancos y lencería", total: 56, price: 0, cost: 4000, channels: [] },
  { barcode: "190720259", name: "Fundas almohadas 2 plazas antiguas", family: "insumo", group: "Blancos y lencería", total: 0, price: 0, cost: 4000, channels: [] },
  { barcode: "190720258", name: "Fundas almohadas 2 plazas impermeables", family: "insumo", group: "Blancos y lencería", total: 0, price: 0, cost: 5000, channels: [] },
  { barcode: "190720256", name: "Fundas almohadas 2 plazas blancas", family: "insumo", group: "Blancos y lencería", total: 86, price: 0, cost: 4000, channels: [] },
  { barcode: "190720257", name: "Fundas almohadas king crema", family: "insumo", group: "Blancos y lencería", total: 23, price: 0, cost: 4500, channels: [] },

  // ── Habitación · HABITACION → Menaje ──
  { barcode: "9876543210919", name: "Bandejas de servicios", family: "insumo", group: "Menaje", total: 14, price: 0, cost: 3500, channels: [] },
  { barcode: "9876543210917", name: "Ceniceros de vidrio", family: "insumo", group: "Menaje", total: 0, price: 0, cost: 1500, channels: [] },
  { barcode: "9876543210918", name: "Ceniceros metálicos", family: "insumo", group: "Menaje", total: 22, price: 0, cost: 1200, channels: [] },
  { barcode: "9876543210922", name: "Destapador de botellas", family: "insumo", group: "Menaje", total: 24, price: 0, cost: 800, channels: [] },
  { barcode: "130703122025", name: "Vaso para michelada vidrio de 580 ml", family: "insumo", group: "Menaje", total: 7, price: 0, cost: 2500, channels: [] },
  { barcode: "2025011502815", name: "Vaso pisco sour catedral cerámica azul", family: "insumo", group: "Menaje", total: 12, price: 0, cost: 4000, channels: [] },
  { barcode: "2025011501115", name: "Vaso pisco sour cerámica bicolor", family: "insumo", group: "Menaje", total: 21, price: 0, cost: 3500, channels: [] },

  // ── Habitación · ASEO → Aseo (las lavadoras y el lavafondo son activos fijos) ──
  { barcode: "9876543211024", name: "Pegamento en barra stick 21 g", family: "insumo", group: "Aseo", total: 0, price: 0, cost: 1000, channels: [] },

  // ── Limpieza · HABITACION → Blancos y lencería ──
  { barcode: "220620251", name: "Pieceras grises (por cambiar) S/L", family: "insumo", group: "Blancos y lencería", total: 0, price: 0, cost: 8000, channels: [] },
  { barcode: "210620251", name: "Pieceras negras S/L", family: "insumo", group: "Blancos y lencería", total: 36, price: 0, cost: 8000, channels: [] },
  { barcode: "190620259", name: "Sábanas 2 plazas por cambiar", family: "insumo", group: "Blancos y lencería", total: 0, price: 0, cost: 7000, channels: [] },
  { barcode: "190620258", name: "Sábanas 2 plazas S/L buenas", family: "insumo", group: "Blancos y lencería", total: 61, price: 0, cost: 9000, channels: [] },
  { barcode: "190620257", name: "Sábanas blancas king S/L", family: "insumo", group: "Blancos y lencería", total: 8, price: 0, cost: 11000, channels: [] },
  { barcode: "190620252", name: "Toallas grandes blancas logo M", family: "insumo", group: "Blancos y lencería", total: 120, price: 0, cost: 7000, channels: [] },
  { barcode: "190620254", name: "Toallas de mano blancas logo M", family: "insumo", group: "Blancos y lencería", total: 73, price: 0, cost: 4000, channels: [] },

  // ── Limpieza · ASEO → Aseo (plancha y secadora excluidas como activos fijos) ──
  { barcode: "92527112025", name: "Jabón líquido 5 L", family: "insumo", group: "Aseo", total: 8, price: 0, cost: 6500, channels: [] },
  { barcode: "9876543210966", name: "Cloro gel 5 L", family: "insumo", group: "Aseo", total: 13, price: 0, cost: 4500, channels: [] },
  { barcode: "9876543210967", name: "Cloro multiuso 5 L", family: "insumo", group: "Aseo", total: 7, price: 0, cost: 4000, channels: [] },
  { barcode: "9876543210954", name: "Crema limpiadora 700 g", family: "insumo", group: "Aseo", total: 30, price: 0, cost: 1800, channels: [] },
  { barcode: "7805300052048", name: "Desinfectante Anti Bac 220 cc elimina olores", family: "insumo", group: "Aseo", total: 6, price: 0, cost: 2500, channels: [] },
  { barcode: "9876543210936", name: "Destapa cañerías líquido", family: "insumo", group: "Aseo", total: 0, price: 0, cost: 3500, channels: [] },
  { barcode: "9876543210980", name: "Esponja amarilla", family: "insumo", group: "Aseo", total: 23, price: 0, cost: 500, channels: [] },
  { barcode: "9876543210977", name: "Glade desodorante ambiental spray 360 ml", family: "insumo", group: "Aseo", total: 13, price: 0, cost: 3800, channels: [] },
  { barcode: "9876543210935", name: "Guantes multiuso amarillos par", family: "insumo", group: "Aseo", total: 1, price: 0, cost: 1200, channels: [] },
  { barcode: "9876543210941", name: "Guantes talla L 100 un.", family: "insumo", group: "Aseo", total: 4, price: 0, cost: 5500, channels: [] },
  { barcode: "9876543210973", name: "Jabón líquido aromático 750 ml", family: "insumo", group: "Aseo", total: 0, price: 0, cost: 2500, channels: [] },
  { barcode: "9876543210970", name: "Lavalozas 5 L", family: "insumo", group: "Aseo", total: 0, price: 0, cost: 5500, channels: [] },
  { barcode: "9876543210972", name: "Limpia piso 5 L", family: "insumo", group: "Aseo", total: 5, price: 0, cost: 5000, channels: [] },
  { barcode: "9876543210968", name: "Limpia vidrios 5 L", family: "insumo", group: "Aseo", total: 0, price: 0, cost: 5000, channels: [] },
  { barcode: "9876543210965", name: "Limpiador amonio cuaternario 5 L", family: "insumo", group: "Aseo", total: 0, price: 0, cost: 9000, channels: [] },
  { barcode: "9876543210975", name: "Lustramuebles crema Virginia 250 ml", family: "insumo", group: "Aseo", total: 15, price: 0, cost: 2200, channels: [] },
  { barcode: "9876543210974", name: "Lustramuebles spray Virginia 360 ml", family: "insumo", group: "Aseo", total: 0, price: 0, cost: 2800, channels: [] },
  { barcode: "9876543210953", name: "Mopa plana grande", family: "insumo", group: "Aseo", total: 6, price: 0, cost: 6500, channels: [] },
  { barcode: "9876543210952", name: "Mopa plana pequeña", family: "insumo", group: "Aseo", total: 2, price: 0, cost: 4500, channels: [] },
  { barcode: "9876543210964", name: "Papel Nova Ovella 100 m", family: "insumo", group: "Aseo", total: 9, price: 0, cost: 3200, channels: [] },
  { barcode: "9876543210978", name: "Paño de microfibra", family: "insumo", group: "Aseo", total: 8, price: 0, cost: 900, channels: [] },
  { barcode: "9876543210979", name: "Paño esponja 3 un.", family: "insumo", group: "Aseo", total: 6, price: 0, cost: 1500, channels: [] },
  { barcode: "9876543210937", name: "Tabletas triple acción Vulcano 1 kg", family: "insumo", group: "Aseo", total: 3, price: 0, cost: 6000, channels: [] },
  { barcode: "9876543210940", name: "Tanax mata insectos 560 cc", family: "insumo", group: "Aseo", total: 9, price: 0, cost: 3800, channels: [] },
  // Consolidado con el duplicado 9876543210942 de Tienda (4 + 0 = 4, spec-1b §2.2).
  { barcode: "9876543210921", name: "Tapones de lavamanos", family: "insumo", group: "Aseo", total: 4, price: 0, cost: 800, channels: [] },
  { barcode: "9876543210956", name: "Virutilla fina sin jabón 12 un.", family: "insumo", group: "Aseo", total: 36, price: 0, cost: 1800, channels: [] },
  { barcode: "9876543210955", name: "Virutilla gruesa", family: "insumo", group: "Aseo", total: 2, price: 0, cost: 600, channels: [] },

  // ── Limpieza · ASEO → Lavandería ──
  { barcode: "90827112025", name: "Jabón para lavar Popeye", family: "insumo", group: "Lavandería", total: 3, price: 0, cost: 2000, channels: [] },
  { barcode: "9876543210949", name: "Cloro ropa blanca 960 cc", family: "insumo", group: "Lavandería", total: 0, price: 0, cost: 2200, channels: [] },
  { barcode: "9876543210971", name: "Detergente líquido de ropa 5 L", family: "insumo", group: "Lavandería", total: 14, price: 0, cost: 8500, channels: [] },
  { barcode: "9876543210969", name: "Suavizante 5 L", family: "insumo", group: "Lavandería", total: 13, price: 0, cost: 7500, channels: [] },

  // ── Limpieza · ASEO → Operativos ──
  { barcode: "9876543210958", name: "Cofia blanca 100 un.", family: "insumo", group: "Operativos", total: 0, price: 0, cost: 3500, channels: [] },
  { barcode: "9876543210947", name: "Cofia negra 100 un.", family: "insumo", group: "Operativos", total: 18, price: 0, cost: 3500, channels: [] },
  { barcode: "9876543210976", name: "Mascarilla desechable caja de 50", family: "insumo", group: "Operativos", total: 1, price: 0, cost: 4500, channels: [] },

  // ── Cocina · CORTESIA → Cortesías (stock "—" en el Excel se carga en 0) ──
  { barcode: "769284017", name: "Alkas", family: "insumo", group: "Cortesías", total: 310, price: 0, cost: 40, channels: [] },
  { barcode: "78024106", name: "Bombones Bon o Bon", family: "insumo", group: "Cortesías", total: 0, price: 0, cost: 180, channels: [] },
  { barcode: "9876543210995", name: "Coyac (dulce con palito)", family: "insumo", group: "Cortesías", total: 0, price: 0, cost: 100, channels: [] },
  { barcode: "7802800535569", name: "Papas Kryzpo", family: "insumo", group: "Cortesías", total: 522, price: 0, cost: 400, channels: [] },

  // ── Cocina · ASEO → Aseo (reclasificado desde Cocina, spec-1b §2.4) ──
  { barcode: "7692832920", name: "Papel higiénico", family: "insumo", group: "Aseo", total: 31, price: 0, cost: 2500, channels: [] },

  // ── Cocina · ESPECIAL → Spa (único no-activo de la subcategoría; hereda precio v1) ──
  { barcode: "769284077", name: "Espuma de baño / burbujas de baño 45 ml", family: "carta", group: "Spa", total: 0, price: 2000, channels: ["room_service"] },
];
