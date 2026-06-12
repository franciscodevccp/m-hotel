// Tipos compartidos de la maqueta. Importar siempre desde "@/types".

/** Día de tarifa: weekday = Lun–Jue, weekend = Vie–Dom y festivos. */
export type DayType = "weekday" | "weekend";

/** Bloques de horas disponibles en la demo. */
export type Duration = 3 | 6 | 12;

/** Identificador estable de cada categoría. */
export type CategoryId =
  | "standard-vip"
  | "standard-black"
  | "jacuzzi-vip"
  | "jacuzzi-premium"
  | "jacuzzi-black";

export interface CategoryPricing {
  weekday: Record<Duration, number>;
  weekend: Record<Duration, number>;
  extraHour: { weekday: number; weekend: number };
  extraPerson: { weekday: number; weekend: number };
}

export interface Category {
  id: CategoryId;
  name: string; // "Categoria BLACK"
  shortName: string; // "BLACK"
  area: number; // m2
  tagline: string; // frase corta y discreta
  amenities: string[];
  pricing: CategoryPricing;
  image: string | null; // ruta de la foto o null si va placeholder
}

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

/** Cortesía cargada a una habitación (paquete de ingreso o pedida por citófono). */
export interface RoomCourtesy {
  id: string;
  productId: string;
  label: string;
  quantity: number;
  at: string; // ISO
  /** true = parte del paquete de ingreso (se entrega al abrir la pieza). */
  opening?: boolean;
}

/** Estancia en curso de una habitación ocupada (datos del check-in). */
export interface RoomStay {
  dayType: DayType;
  duration: Duration;
  total: number;
  guestName?: string;
  guestRut?: string; // del registro rápido (escaneo de cédula: solo datos, sin imagen)
  checkInAt: string; // ISO
  paid?: boolean; // el bloque se cobra en la pieza, al inicio
  paymentMethod?: PaymentMethod;
  paidAt?: string; // ISO
}

export interface Room {
  id: string;
  number: number;
  categoryId: CategoryId;
  status: RoomStatus;
  occupiedUntil?: string; // ISO, si esta ocupada
  stay?: RoomStay; // datos de la estancia en curso (si hubo check-in)
  /**
   * Cortesías cargadas a la ocupación en curso (listado completo, editable).
   * Vive en la habitación —no en la estadía— para funcionar también cuando
   * la pieza se ocupó con cambio de estado manual, sin check-in.
   */
  courtesies?: RoomCourtesy[];
  cleaningAssignee?: string; // personal de aseo asignado (si esta en limpieza)
  cleaningStartedAt?: string; // ISO, cuando la mucama empezó la limpieza (en proceso)
  cleaningSince?: string; // ISO, cuando la habitación entró a limpieza (espera)
  branchId?: string;
}

export type ReservationStatus = "pending" | "confirmed";

export interface Reservation {
  id: string;
  categoryId: CategoryId;
  roomId?: string; // habitación elegida en disponibilidad
  dayType: DayType;
  duration: Duration;
  guestName: string;
  guestPhone: string;
  guestRut?: string;
  guestEmail?: string;
  total: number;
  createdAt: string; // ISO
  arrivalAt?: string; // ISO, hora estimada de llegada elegida por el huésped
  status: ReservationStatus;
  branchId?: string;
}

export type PaymentMethod = "cash" | "debit" | "credit" | "transfer";

/**
 * Ticket interno generado al confirmar la estadía: lleva el valor a cobrar y
 * la cortesía a preparar. La camarera lo cobra en la pieza desde su dispositivo.
 */
export interface RoomCharge {
  id: string;
  roomId: string;
  concept: string; // "Bloque 6 h" / "Hora adicional"
  amount: number; // valor a cobrar
  courtesies: string[]; // cortesías pedidas por citófono ("2× Alkas", …)
  status: "pendiente" | "pagado";
  createdAt: string; // ISO
  paidAt?: string; // ISO
  method?: PaymentMethod;
  by?: string; // quién cobró (camarera o recepción)
}

/** Cuadratura parcial del turno: arqueo intermedio sin cerrar la caja. */
export interface Cuadratura {
  id: string;
  at: string; // ISO
  user: string;
  counted: Record<PaymentMethod, number>; // contado al momento
  expected: Record<PaymentMethod, number>; // lo que el sistema esperaba
}

export interface Transaction {
  id: string;
  roomId: string;
  method: PaymentMethod;
  amount: number;
  at: string; // ISO
  user: string; // auditoria mock
  branchId?: string;
}

/** Linea del corte: lo contado/registrado (real) vs lo que el sistema esperaba (deber). */
export interface CashLine {
  real: number; // efectivamente contado/registrado
  expected: number; // "deber": lo que el sistema esperaba
}

/**
 * Turno con la estructura del corte de caja real que imprime el cliente.
 * Cada medio de pago lleva su propia línea real/deber en el arqueo
 * (pedido del cliente: efectivo, débito, crédito y transferencia separados).
 */
export interface Shift {
  id: string;
  folio: number; // numero de corte impreso
  user: string; // cajero responsable
  openedAt: string;
  closedAt?: string;
  openingCash: number; // caja inicial
  cash: CashLine; // efectivo
  debit: CashLine; // tarjeta de débito
  credit: CashLine; // tarjeta de crédito
  transfer: CashLine; // transferencias bancarias
  expenses: CashLine; // gastos del turno
  tipsCash: number; // propina en efectivo
  tipsCard: number; // propina en tarjeta
  branchId?: string;
}

/** Artículo vendido en un turno (itemiza el ticket del corte). */
export interface ShiftItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  total: number;
}

/** Corte cerrado y archivado, con snapshot de su detalle al momento del arqueo. */
export interface ClosedShift extends Shift {
  closedAt: string; // ISO del cierre
  counted: Record<PaymentMethod, number>; // contado por medio en el arqueo
  transactions: Transaction[]; // snapshot de los pagos del turno
  expenseList: Expense[]; // snapshot de los gastos del turno
  items: ShiftItem[]; // artículos vendidos (snapshot del ticket)
  cuadraturas?: Cuadratura[]; // cuadraturas parciales hechas durante el turno
}

export type ExpenseCategory = "insumos" | "mantencion" | "sueldos" | "servicios" | "otro";

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  category: ExpenseCategory;
  at: string; // ISO
  user: string;
  branchId?: string;
}

/** Categoria de producto del inventario. */
export type ProductCategory =
  | "bebestible"
  | "snack"
  | "sexshop"
  | "amenidad"
  | "carta"
  | "insumo"
  | "otro";

/** Canal de venta de un producto. */
export type SalesChannel = "presencial" | "online" | "room_service";

export interface Product {
  id: string;
  sku: string; // codigo de barras / SKU
  name: string;
  category: ProductCategory;
  group?: string; // sub-categoria del catalogo (ej. "Vibradores", "Cócktails")
  price: number; // precio de venta en CLP
  cost?: number; // costo unitario (opcional, para margen)
  stock: number; // unidades en bodega de recepción (el stock operativo de venta)
  centralStock?: number; // unidades en bodega central (bajo llave); undefined = 0
  laundryStock?: number; // unidades en bodega de lavandería/aseo; undefined = 0
  lowStockThreshold: number; // umbral para alerta de stock bajo
  channels: SalesChannel[]; // donde se vende
  ageRestricted: boolean; // +18 (sexshop)
  image: string | null;
  description?: string; // ficha para la tienda online
  active: boolean;
}

/** Ítem de un paquete: un producto del inventario y su cantidad. */
export interface PackageItem {
  productId: string;
  quantity: number;
}

/** Paquete o combo de productos que se vende como una sola unidad. */
export interface Package {
  id: string;
  name: string;
  description?: string;
  items: PackageItem[];
  price: number; // precio del combo en CLP
  active: boolean;
}

export type MovementType = "ingreso" | "venta_presencial" | "venta_online" | "ajuste" | "traspaso";

/** Ítem de una lista de compra (ingreso de stock). */
export interface PurchaseItem {
  productId: string;
  quantity: number;
  unitCost: number; // costo unitario de compra en CLP
}

/** Ingreso de stock: lista de compra a un proveedor. */
export interface Purchase {
  id: string;
  provider: string;
  items: PurchaseItem[];
  total: number; // monto total de la compra
  at: string; // ISO
  user?: string;
  /** Bodega de destino del ingreso (central por defecto desde la v2). */
  warehouseId?: string;
  branchId?: string;
}

/** Proveedor del recinto (para el ingreso de stock). */
export interface Provider {
  id: string;
  name: string;
  rut: string;
}

/** Tipo de movimiento para la auditoría. */
export type AuditType = "crear" | "editar" | "estado" | "eliminar" | "acceso";

/** Entrada del registro de auditoría: qué hizo un usuario, cuándo y quién. */
export interface AuditEntry {
  id: string;
  type: AuditType;
  action: string; // etiqueta legible
  target?: string; // detalle del objeto afectado
  module: string; // sección del panel
  at: string; // ISO
  userName: string;
  userRole: Role;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number; // + entrada, - salida
  at: string; // ISO
  refId?: string; // id de venta/pedido/turno asociado
  user?: string;
}

export type AnomalyType = "dano" | "objeto_olvidado" | "reclamo" | "otro";
export type AnomalyStatus = "abierta" | "resuelta";

/** Incidente o anomalía registrada durante un turno. */
export interface Anomaly {
  id: string;
  roomId?: string; // habitación asociada, si aplica
  type: AnomalyType;
  description: string;
  at: string; // ISO
  user: string;
  status: AnomalyStatus;
}

export type DiscountType = "porcentaje" | "monto";

/** Regla de descuento configurable. */
export interface Discount {
  id: string;
  name: string;
  type: DiscountType; // porcentaje (%) o monto fijo (CLP)
  value: number;
  scope: string; // a qué aplica, en texto (ej. "Entre semana", "Categoría BLACK")
  active: boolean;
}

/** Promoción o campaña por fechas. */
export interface Promotion {
  id: string;
  name: string;
  description: string;
  startsAt: string; // YYYY-MM-DD
  endsAt: string; // YYYY-MM-DD
  active: boolean;
}

/** Etapa de una carga de lavado in-house. */
export type LaundryStage = "recolectado" | "lavando" | "secando" | "doblando" | "listo";

/** Carga de lavado propia (lavadoras y secadoras del recinto). */
export interface LaundryLoad {
  id: string;
  sheets: number; // sábanas
  towels: number; // toallas
  robes: number; // batas
  stage: LaundryStage;
  machine?: string; // máquina asignada en uso (lavadora/secadora)
  by?: string; // quién la lleva
  startedAt?: string; // ISO, inicio de la etapa actual (cronómetro)
  createdAt: string; // ISO, cuando se recolectó
}

/** Tipo de blanco (ropa blanca del recinto). */
export type LinenType = "sabana" | "toalla" | "bata";

/** Stock base de un tipo de blanco. */
export interface LinenStock {
  type: LinenType;
  total: number; // total que posee el recinto
}

/** Motivo de un percance de blancos. */
export type LinenIncidentKind = "mancha" | "rotura" | "perdida" | "quemadura" | "desgaste";

/** Percance de un blanco (mancha, rotura, pérdida, etc.). */
export interface LinenIncident {
  id: string;
  type: LinenType;
  kind: LinenIncidentKind;
  quantity: number;
  retired: boolean; // dado de baja (sale de circulación)
  roomId?: string;
  note?: string;
  by?: string;
  at: string; // ISO
}

export type RoomServiceStatus = "preparando" | "entregado" | "cancelado";

export interface RoomServiceItem {
  productId: string;
  quantity: number;
}

/** Pedido de room service a una habitación. */
export interface RoomServiceOrder {
  id: string;
  roomId: string;
  items: RoomServiceItem[];
  total: number;
  notes?: string;
  status: RoomServiceStatus;
  createdAt: string; // ISO
  deliveredAt?: string; // ISO
  user: string;
}

/** Incidencia de mantención reportada por el aseo. */
export interface MaintenanceReport {
  id: string;
  roomId: string;
  note?: string;
  photo?: string; // dataURL de la fotografía adjunta (daños o faltantes)
  at: string; // ISO
  by?: string;
}

/** Registro de una limpieza terminada (para "listas hoy"). */
export interface CleaningLogEntry {
  id: string;
  roomId: string;
  by?: string;
  startedAt?: string; // ISO, hora de inicio del aseo
  at: string; // ISO, hora de término
  minutes?: number; // cuánto tomó la limpieza (desde que se empezó)
  checklist?: boolean; // true = checklist completo al cerrar
  note?: string; // observación de la camarera (incidencia, faltante, daño)
  photo?: string; // dataURL de la fotografía adjunta a la observación
}

/** Ítem del kit de insumos de aseo: producto real y consumo por limpieza. */
export interface CleaningKitItem {
  productId: string;
  label: string;
  /** Consumo estimado por aseo, en unidades del inventario (admite fracción de bidón). */
  quantity: number;
}

/** Kit de aseo por categoría, configurable por administración. */
export type CleaningKits = Record<CategoryId, CleaningKitItem[]>;

// --- Tienda online (e-commerce del sexshop) ---

/** Estado de un pedido de la tienda online. */
export type ShopOrderStatus =
  | "pendiente" // creado, sin pago confirmado
  | "pagado" // pago confirmado
  | "preparando" // en preparación / embalaje
  | "despachado" // en camino (o listo para retiro)
  | "entregado"
  | "cancelado";

/** Forma de entrega del pedido. */
export type ShopFulfillment = "despacho" | "retiro" | "habitacion";

/** Medio de pago del pedido online. */
export type ShopPaymentMethod = "webpay" | "transferencia" | "efectivo";

export interface ShopOrderItem {
  productId: string;
  name: string; // nombre al momento de la compra
  quantity: number;
  unitPrice: number; // precio unitario al momento de la compra
}

/** Pedido de la tienda online. Va por separado de la caja del motel. */
export interface ShopOrder {
  id: string;
  folio: number;
  customerName: string;
  customerRut?: string;
  customerEmail: string;
  customerPhone: string;
  fulfillment: ShopFulfillment;
  address?: string; // si es despacho
  comuna?: string;
  payment: ShopPaymentMethod;
  items: ShopOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number; // descuento por cupón
  couponCode?: string;
  total: number;
  status: ShopOrderStatus;
  createdAt: string; // ISO
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  branchId?: string;
}

/** Tipo de cupón de descuento de la tienda. */
export type CouponType = "porcentaje" | "monto" | "envio_gratis";

/** Cupón de descuento de la tienda online. */
export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // % o CLP; 0 si envío gratis
  minPurchase: number; // compra mínima en CLP (0 = sin mínimo)
  active: boolean;
  uses: number; // veces canjeado
}

/** Ajustes de la tienda online (editables en su Configuración). */
export interface ShopSettings {
  storeName: string;
  contactEmail: string;
  whatsapp: string; // contacto visible de la tienda
  shippingCost: number; // costo de despacho en CLP
  freeShippingThreshold: number; // envío gratis sobre este monto (0 = sin envío gratis)
  pickupAddress: string; // dirección de retiro en local
  shippingComunas: string[]; // comunas con reparto a domicilio
  payments: { webpay: boolean; transferencia: boolean; efectivo: boolean };
  ageNotice: boolean; // mostrar aviso +18 en la tienda
  storeOnline: boolean; // tienda activa o en mantención
  notificationEmails: string[]; // correos que reciben aviso de pedidos
}

/** Rol de acceso al panel admin (demo). */
export type Role = "recepcion" | "admin" | "aseo" | "encargado" | "dueno";

/** Quién ejecuta una acción del store (para la auditoría viva). */
export interface Actor {
  name: string;
  role: Role;
}

/** Área de trabajo del administrador: operación del motel o la tienda online. */
export type AdminArea = "motel" | "tienda";

/** Ajustes generales del recinto (editables en Configuración). */
export interface VenueSettings {
  name: string;
  address: string;
  city: string;
  phone: string;
  whatsappDisplay: string;
  ivaPercent: number;
  notificationEmails: string[];
  lastBackup?: string; // ISO, último respaldo
}

/** Usuario del panel con su rol (Configuración → usuarios). */
export interface StaffUser {
  id: string;
  name: string;
  role: Role;
  active: boolean;
}

/** Entrada de la lista negra de clientes. */
export interface BlacklistEntry {
  id: string;
  name: string;
  rut?: string; // si está, el escaneo de cédula alerta solo
  reason: string;
}

/** Huésped del historial interno: visitas, frecuencia y observaciones. */
export interface Guest {
  id: string;
  name: string;
  rut?: string;
  phone?: string;
  visits: number; // visitas registradas
  lastVisit: string; // ISO
  totalSpent: number; // CLP acumulado
  tags: ("vip" | "frecuente")[];
  notes?: string; // observaciones internas de recepción
}

/** Usuario de sesion simulado del panel. */
export interface SessionUser {
  role: Role;
  name: string; // nombre o etiqueta del perfil
  roleLabel: string; // "Recepcion" / "Administracion"
  context: string; // turno o alcance
}

/** Estado parcial del flujo de reserva mientras el usuario lo completa. */
export interface ReservationDraft {
  categoryId: CategoryId | null;
  dayType: DayType;
  duration: Duration | null;
  guestName: string;
  guestPhone: string;
}

// --- Multi-sucursal (arquitectura preparada desde el día uno) ---

/** Sucursal del grupo. La maqueta opera con Limache; la vista consolidada es fase futura. */
export interface Branch {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

// --- Bodegas y traspasos ---

/** Bodega física del recinto. */
export interface Warehouse {
  id: string;
  name: string;
  /** true = bajo llave (bodega central). */
  locked: boolean;
}

export type TransferStatus = "solicitado" | "parcial" | "entregado" | "recibido" | "rechazado";

export interface TransferItem {
  productId: string;
  /** Cantidad solicitada. */
  quantity: number;
  /** Cantidad efectivamente entregada (si difiere, el saldo queda pendiente). */
  delivered?: number;
}

/**
 * Traspaso entre bodegas. Una solicitud de reposición es un traspaso en estado
 * "solicitado"; el stock se mueve al entregarse. Cada entrega genera una guía
 * interna de despacho (folio correlativo) imprimible desde el historial.
 */
export interface Transfer {
  id: string;
  /** Folio de la guía interna de despacho (se asigna al entregar). */
  folio?: number;
  from: string; // warehouseId origen (central, normalmente)
  to: string; // warehouseId destino (recepción o lavandería)
  items: TransferItem[];
  status: TransferStatus;
  requestedBy: string; // quién solicita (jefe de turno)
  deliveredBy?: string; // quién entrega (encargado/admin)
  receivedBy?: string; // quién confirma recepción
  note?: string;
  createdAt: string; // ISO
  deliveredAt?: string;
  receivedAt?: string;
  branchId?: string;
}

// --- Conteos de inventario ---

export interface StockCountLine {
  productId: string;
  expected: number; // saldo según sistema al abrir el conteo
  counted: number; // lo contado físicamente
}

/** Conteo de inventario (parcial o general) de una bodega. */
export interface StockCount {
  id: string;
  scope: "parcial" | "general";
  warehouseId: string; // qué bodega se contó
  group?: string; // sub-categoría si es parcial
  lines: StockCountLine[];
  status: "abierto" | "cerrado";
  adjusted: boolean; // si al cerrar se ajustó el stock
  by: string;
  createdAt: string;
  closedAt?: string;
  branchId?: string;
}
