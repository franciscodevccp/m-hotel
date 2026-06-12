"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CATEGORIES } from "@/data/categories";
import { SEED_ANOMALIES } from "@/data/anomalies";
import { SEED_AUDIT } from "@/data/audit";
import { SEED_BRANCHES } from "@/data/branches";
import { SEED_CLEANING_KITS, SEED_CLEANING_LOG } from "@/data/cleaning";
import { SEED_CHARGES } from "@/data/charges";
import { SEED_COUPONS } from "@/data/coupons";
import { openingPackFor } from "@/data/courtesies";
import { freeMachineName, SEED_LAUNDRY, seedLaundryTimes } from "@/data/laundry";
import { LINEN_STOCK, SEED_LINEN_INCIDENTS } from "@/data/linens";
import { SEED_PACKAGES } from "@/data/packages";
import { SEED_DISCOUNTS, SEED_PROMOTIONS } from "@/data/pricingRules";
import { PRODUCT_CATEGORIES, SEED_MOVEMENTS, SEED_PRODUCTS } from "@/data/products";
import { PROVIDERS, SEED_PURCHASES } from "@/data/purchases";
import { SEED_RESERVATIONS } from "@/data/reservations";
import { SEED_ROOM_SERVICE } from "@/data/roomService";
import { SEED_SHOP_ORDERS } from "@/data/shopOrders";
import { SEED_STOCK_COUNTS } from "@/data/stockCounts";
import { nextGuideFolio, SEED_TRANSFERS } from "@/data/transfers";
import { WAREHOUSES, warehouseName } from "@/data/warehouses";
import { DEFAULT_SHOP_SETTINGS } from "@/data/shopSettings";
import { ROOMS, SEED_OCCUPIED_MINUTES } from "@/data/rooms";
import { DEFAULT_SETTINGS, SEED_BLACKLIST, SEED_USERS } from "@/data/settings";
import { SEED_EXPENSES, SEED_SHIFT, SEED_TRANSACTIONS } from "@/data/shifts";
import { shiftItems } from "@/lib/cash";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
import { stockOf, withStock } from "@/lib/inventory";
import { extraHourFor, priceFor } from "@/lib/pricing";
import { SHOP_NEXT } from "@/lib/shop";
import type {
  Actor,
  Anomaly,
  AuditEntry,
  AuditType,
  BlacklistEntry,
  Branch,
  CashLine,
  Cuadratura,
  Category,
  CategoryId,
  ClosedShift,
  CleaningKitItem,
  CleaningKits,
  CleaningLogEntry,
  Coupon,
  DayType,
  Discount,
  Duration,
  Expense,
  InventoryMovement,
  LaundryLoad,
  LaundryStage,
  LinenIncident,
  LinenStock,
  MaintenanceReport,
  Package,
  PaymentMethod,
  Product,
  Promotion,
  Provider,
  Purchase,
  Reservation,
  Room,
  RoomCharge,
  RoomServiceOrder,
  RoomStatus,
  SalesChannel,
  Shift,
  RoomCourtesy,
  ShopOrder,
  ShopSettings,
  StaffUser,
  StockCount,
  Transaction,
  Transfer,
  TransferItem,
  VenueSettings,
  Warehouse,
} from "@/types";

// v19: cortesías a nivel habitación (listado editable que acumula toques y
// funciona sin check-in), cobro de la pieza sin liberar y comanda con valor
// de habitación.
const STORAGE_KEY = "m-motel-state-v19";

/** Suma a ambas líneas del corte: lo registrado por el sistema es lo que debería
 * haber (deber) y, con el turno abierto, se asume que también está (real). La
 * diferencia solo nace en el arqueo del cierre. */
function addToLine(line: CashLine, amount: number): CashLine {
  return { real: line.real + amount, expected: line.expected + amount };
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  debit: "Tarjeta débito",
  credit: "Tarjeta crédito",
  transfer: "Transferencia",
};

/** Strings "2× Alkas" del ticket de cobro: cortesías pedidas por citófono
 * (las de apertura se entregan al abrir la pieza y no van en la comanda). */
function courtesyStrings(courtesies: RoomCourtesy[] | undefined): string[] {
  return (courtesies ?? []).filter((c) => !c.opening).map((c) => `${c.quantity}× ${c.label}`);
}

const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  available: "Disponible",
  occupied: "Ocupada",
  cleaning: "Limpieza",
  maintenance: "Mantención",
};

let auditSeq = 0;

/** Entrada de auditoría de una acción del panel (la audita quien la ejecuta). */
function auditEntry(
  type: AuditType,
  action: string,
  module: string,
  target?: string,
  actor?: Actor,
): AuditEntry {
  auditSeq += 1;
  return {
    id: `${makeId("au")}-${auditSeq}`,
    type,
    action,
    target,
    module,
    at: new Date().toISOString(),
    userName: actor?.name ?? "Sistema",
    userRole: actor?.role ?? "recepcion",
  };
}

interface AppState {
  reservations: Reservation[];
  categories: Category[];
  rooms: Room[];
  transactions: Transaction[];
  shift: Shift;
  /** Cortes cerrados y archivados (el más reciente primero). */
  pastShifts: ClosedShift[];
  /** Tickets de cobro en pieza (el bloque se paga al inicio de la estadía). */
  charges: RoomCharge[];
  /** Cuadraturas parciales del turno en curso. */
  cuadraturas: Cuadratura[];
  expenses: Expense[];
  products: Product[];
  movements: InventoryMovement[];
  packages: Package[];
  discounts: Discount[];
  promotions: Promotion[];
  anomalies: Anomaly[];
  laundry: LaundryLoad[];
  roomService: RoomServiceOrder[];
  settings: VenueSettings;
  users: StaffUser[];
  blacklist: BlacklistEntry[];
  maintenanceReports: MaintenanceReport[];
  cleaningLog: CleaningLogEntry[];
  /** Kit de insumos por categoría (medición editable por administración). */
  cleaningKits: CleaningKits;
  shopOrders: ShopOrder[];
  coupons: Coupon[];
  shopSettings: ShopSettings;
  purchases: Purchase[];
  providers: Provider[];
  productCategories: string[];
  audit: AuditEntry[];
  linens: LinenStock[];
  linenIncidents: LinenIncident[];
  branches: Branch[];
  warehouses: Warehouse[];
  transfers: Transfer[];
  stockCounts: StockCount[];
}

/**
 * Mueve los ítems de un traspaso entre bodegas (recepción, central o
 * lavandería). La cantidad a entregar por línea puede venir explícita
 * (entrega parcial decidida por quien entrega); si no, se entrega lo
 * solicitado recortado al saldo disponible. Devuelve los productos
 * actualizados, los ítems con su entregado y las líneas con faltante.
 */
function applyTransferToProducts(
  products: Product[],
  items: TransferItem[],
  from: string,
  to: string,
  quantities?: Record<string, number>,
): { products: Product[]; moved: TransferItem[]; shortages: string[] } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const moved: TransferItem[] = [];
  const shortages: string[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || item.quantity <= 0) continue;
    const available = Math.max(0, stockOf(product, from));
    const wanted = Math.max(0, quantities?.[item.productId] ?? item.quantity);
    const delivered = Math.min(wanted, available, item.quantity);
    moved.push({ productId: item.productId, quantity: item.quantity, delivered });
    if (delivered < item.quantity) {
      shortages.push(`${product.name} (${delivered} de ${item.quantity})`);
    }
  }
  const movedById = new Map(moved.map((m) => [m.productId, m.delivered ?? 0]));
  const updated = products.map((p) => {
    const quantity = movedById.get(p.id);
    if (!quantity) return p;
    const out = withStock(p, from, stockOf(p, from) - quantity);
    return withStock(out, to, stockOf(out, to) + quantity);
  });
  return { products: updated, moved, shortages };
}

interface AppStore extends AppState {
  /** true una vez leído localStorage en el cliente. */
  hydrated: boolean;
  addReservation: (reservation: Reservation, actor?: Actor) => void;
  /** Actualiza las tarifas (y datos) de una categoría. Es la fuente del booking. */
  updateCategory: (category: Category, actor?: Actor) => void;
  setRoomStatus: (roomId: string, status: RoomStatus, actor?: Actor) => void;
  /** Asigna (o reasigna) el personal de aseo a una habitación en limpieza. */
  assignCleaning: (roomId: string, staff: string) => void;
  /** Aseo empieza la limpieza de una habitación (queda "en proceso"). */
  startCleaning: (roomId: string, by?: string, actor?: Actor) => void;
  /** Aseo marca la habitación lista: pasa a disponible y registra la limpieza. */
  finishCleaning: (
    roomId: string,
    actor?: Actor,
    opts?: { checklist?: boolean; note?: string; photo?: string },
  ) => void;
  /** Aseo reporta mantención: la habitación pasa a mantención y deja una incidencia. */
  reportMaintenance: (
    roomId: string,
    note?: string,
    by?: string,
    actor?: Actor,
    photo?: string,
  ) => void;
  /** Ajusta la medición del kit de insumos de una categoría (administración). */
  updateCleaningKit: (categoryId: CategoryId, items: CleaningKitItem[], actor?: Actor) => void;
  /** Registra una anomalía/incidente del turno. */
  addAnomaly: (anomaly: Anomaly, actor?: Actor) => void;
  /** Marca una anomalía como resuelta. */
  resolveAnomaly: (id: string, actor?: Actor) => void;
  /** Crea una carga de lavado (recolectada). */
  addLaundryLoad: (load: LaundryLoad) => void;
  /** Avanza la carga por sus etapas y asigna máquina (lavadora/secadora). */
  advanceLaundryLoad: (id: string) => void;
  /** El aseo toma una carga de lavado (orden de llegada). */
  takeLaundryLoad: (id: string, by?: string) => void;
  /** Registra un percance de blancos (mancha, rotura, pérdida, etc.). */
  addLinenIncident: (incident: LinenIncident) => void;
  /** Crea un pedido de room service (queda en preparación). */
  addRoomServiceOrder: (order: RoomServiceOrder) => void;
  /** Entrega el pedido: baja stock de cada ítem y cobra el total al corte. */
  deliverRoomServiceOrder: (id: string, user?: string, actor?: Actor) => void;
  /** Cancela un pedido en preparación. */
  cancelRoomServiceOrder: (id: string) => void;
  /** Check-in: ocupa la habitación con un bloque y registra la estancia. */
  checkIn: (
    roomId: string,
    dayType: DayType,
    duration: Duration,
    guestName?: string,
    guestRut?: string,
    actor?: Actor,
  ) => void;
  /** Check-out: libera la habitación (queda en limpieza) y opcionalmente cobra la estancia. */
  checkOut: (roomId: string, method?: PaymentMethod, user?: string, actor?: Actor) => void;
  /** Cambio de pieza: traslada la estancia en curso a otra habitación disponible. */
  moveRoom: (fromId: string, toId: string, actor?: Actor) => void;
  /** Registra una cortesía a la habitación (sin cobro): baja stock con rastro. */
  logCourtesy: (
    roomId: string,
    productId: string,
    quantity: number,
    actor?: Actor,
    label?: string,
  ) => void;
  /** Anula una cortesía cargada por error: repone el stock y deja rastro. */
  removeCourtesy: (roomId: string, entryId: string, actor?: Actor) => void;
  /** Corrige la cantidad de una cortesía ya registrada (ajusta el stock por la diferencia). */
  setCourtesyQuantity: (roomId: string, entryId: string, quantity: number, actor?: Actor) => void;
  /** Ampliar estancia: extiende el término y suma la hora adicional al total. */
  extendStay: (roomId: string, extraHours: number, actor?: Actor) => void;
  /** Cobra un ticket pendiente en la pieza: el pago entra al corte del turno. */
  payCharge: (chargeId: string, method: PaymentMethod, user?: string, actor?: Actor) => void;
  /** Registra nombre y RUT del huésped de una pieza ocupada (escaneo de la camarera). */
  updateStayGuest: (roomId: string, name: string, rut: string, actor?: Actor) => void;
  /** Cuadratura parcial: arqueo intermedio del turno, sin cerrar la caja. */
  logCuadratura: (counted: Record<PaymentMethod, number>, user?: string, actor?: Actor) => void;
  addTransaction: (transaction: Transaction, actor?: Actor) => void;
  /** Registra un gasto del turno: entra a la línea de gastos del corte. */
  addExpense: (expense: Expense, actor?: Actor) => void;
  /**
   * Vende un producto: baja stock y deja un movimiento de inventario. Si el canal
   * es presencial, suma el monto al efectivo del turno (entra al corte de caja).
   */
  sellProduct: (
    productId: string,
    quantity: number,
    channel: SalesChannel,
    refId?: string,
    user?: string,
    actor?: Actor,
  ) => void;
  /** Ajuste manual de stock (+/-): deja un movimiento de ingreso o ajuste. */
  adjustStock: (productId: string, delta: number, user?: string, actor?: Actor) => void;
  addProduct: (product: Product, actor?: Actor) => void;
  updateProduct: (product: Product, actor?: Actor) => void;
  addPackage: (pkg: Package) => void;
  updatePackage: (pkg: Package) => void;
  /** Vende un paquete: baja el stock de cada ítem y cobra el combo al corte. */
  sellPackage: (packageId: string, user?: string, actor?: Actor) => void;
  addDiscount: (discount: Discount) => void;
  updateDiscount: (discount: Discount) => void;
  addPromotion: (promotion: Promotion) => void;
  updatePromotion: (promotion: Promotion) => void;
  updateSettings: (patch: Partial<VenueSettings>) => void;
  addUser: (user: StaffUser) => void;
  updateUser: (user: StaffUser) => void;
  addBlacklistEntry: (entry: BlacklistEntry) => void;
  removeBlacklistEntry: (id: string) => void;
  /** Simula un respaldo en la nube: deja la marca de tiempo del último respaldo. */
  backupNow: () => void;
  /** Crea un pedido en la tienda online (checkout público). */
  addShopOrder: (order: ShopOrder) => void;
  /** Avanza el estado de un pedido de la tienda online (pendiente→…→entregado). */
  advanceShopOrder: (id: string, actor?: Actor) => void;
  /** Cancela un pedido de la tienda online (si no está entregado/cancelado). */
  cancelShopOrder: (id: string, actor?: Actor) => void;
  /** Crea un cupón de descuento de la tienda. */
  addCoupon: (coupon: Coupon) => void;
  /** Actualiza un cupón (datos o activación). */
  updateCoupon: (coupon: Coupon) => void;
  /** Actualiza los ajustes de la tienda online. */
  updateShopSettings: (patch: Partial<ShopSettings>) => void;
  /** Registra un ingreso de stock (lista de compra): sube stock y deja movimientos. */
  addPurchase: (purchase: Purchase, actor?: Actor) => void;
  /** Agrega un proveedor (con RUT) a la lista. */
  addProvider: (provider: Provider) => void;
  /** Agrega una categoría de producto a la lista. */
  addProductCategory: (name: string) => void;
  /**
   * Cierra el turno con arqueo: archiva el corte con sus snapshots, fija el real
   * definitivo en lo contado y abre el folio siguiente con la caja inicial dada.
   */
  closeShift: (
    counted: Record<PaymentMethod, number>,
    nextOpeningCash: number,
    user?: string,
    actor?: Actor,
  ) => void;
  /** Solicita reposición a bodega central (a recepción o a lavandería/aseo).
   * Devuelve el id de la solicitud creada (para imprimir el vale al tiro). */
  requestTransfer: (
    items: TransferItem[],
    requestedBy: string,
    note?: string,
    actor?: Actor,
    to?: string,
  ) => string;
  /** Encargado/Admin crea un traspaso directo ya entregado (cualquier dirección). */
  createDirectTransfer: (
    from: string,
    to: string,
    items: TransferItem[],
    deliveredBy: string,
    actor?: Actor,
  ) => void;
  /**
   * Entrega una solicitud pendiente: mueve el stock y registra los movimientos.
   * `quantities` permite la entrega parcial (cantidad por producto decidida por
   * quien entrega cuando el saldo no alcanza); el saldo queda pendiente.
   */
  deliverTransfer: (
    id: string,
    deliveredBy: string,
    actor?: Actor,
    quantities?: Record<string, number>,
  ) => void;
  /** Recepción confirma que recibió conforme (cierra el ciclo, no mueve stock). */
  receiveTransfer: (id: string, receivedBy: string, actor?: Actor) => void;
  /** Rechaza una solicitud pendiente con motivo (no mueve stock). */
  rejectTransfer: (id: string, by: string, note?: string, actor?: Actor) => void;
  /** Abre un conteo de inventario y retorna su id (las líneas parten cuadradas). */
  startStockCount: (
    warehouseId: string,
    group: string | undefined,
    by: string,
    actor?: Actor,
  ) => string;
  /** Registra lo contado físicamente en una línea del conteo. */
  setCountLine: (countId: string, productId: string, counted: number) => void;
  /** Cierra el conteo; con ajuste, corrige los saldos y deja movimientos de ajuste. */
  closeStockCount: (countId: string, applyAdjustment: boolean, actor?: Actor) => void;
  /** Registra un inicio de sesión en la auditoría. */
  logAccess: (actor: Actor, detail?: string) => void;
  resetDemo: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

/** Estado base determinístico (sin horas relativas) para que SSR y cliente coincidan. */
function seedState(): AppState {
  return {
    reservations: SEED_RESERVATIONS,
    categories: CATEGORIES,
    rooms: ROOMS,
    transactions: SEED_TRANSACTIONS,
    shift: SEED_SHIFT,
    pastShifts: [],
    charges: SEED_CHARGES,
    cuadraturas: [],
    expenses: SEED_EXPENSES,
    products: SEED_PRODUCTS,
    movements: SEED_MOVEMENTS,
    packages: SEED_PACKAGES,
    discounts: SEED_DISCOUNTS,
    promotions: SEED_PROMOTIONS,
    anomalies: SEED_ANOMALIES,
    laundry: SEED_LAUNDRY,
    roomService: SEED_ROOM_SERVICE,
    settings: DEFAULT_SETTINGS,
    users: SEED_USERS,
    blacklist: SEED_BLACKLIST,
    maintenanceReports: [],
    cleaningLog: SEED_CLEANING_LOG,
    cleaningKits: SEED_CLEANING_KITS,
    shopOrders: SEED_SHOP_ORDERS,
    coupons: SEED_COUPONS,
    shopSettings: DEFAULT_SHOP_SETTINGS,
    purchases: SEED_PURCHASES,
    providers: PROVIDERS,
    productCategories: PRODUCT_CATEGORIES,
    audit: SEED_AUDIT,
    linens: LINEN_STOCK,
    linenIncidents: SEED_LINEN_INCIDENTS,
    branches: SEED_BRANCHES,
    warehouses: WAREHOUSES,
    transfers: SEED_TRANSFERS,
    stockCounts: SEED_STOCK_COUNTS,
  };
}

/** Siembra las horas relativas de las habitaciones en el cliente (ocupadas y en limpieza). */
function seedRoomTimes(rooms: Room[]): Room[] {
  const now = Date.now();
  return rooms.map((room) => {
    if (room.status === "occupied") {
      const minutes = SEED_OCCUPIED_MINUTES[room.id];
      return minutes != null
        ? { ...room, occupiedUntil: new Date(now + minutes * 60000).toISOString() }
        : room;
    }
    if (room.status === "cleaning" && !room.cleaningSince) {
      // Llevan un rato esperando limpieza, para que la cola del aseo se vea con vida.
      return { ...room, cleaningSince: new Date(now - 18 * 60000).toISOString() };
    }
    return room;
  });
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage o sembrar las horas en el cliente.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        // Mezclar sobre el seed: cualquier slice ausente (p. ej. tras agregar
        // un módulo nuevo) cae al valor sembrado en vez de quedar undefined.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage en el cliente
        setState((prev) => ({
          ...prev,
          ...parsed,
          reservations: parsed.reservations ?? prev.reservations,
          categories: parsed.categories ?? prev.categories,
          rooms: parsed.rooms ?? prev.rooms,
          transactions: parsed.transactions ?? prev.transactions,
          shift: parsed.shift ?? prev.shift,
          pastShifts: parsed.pastShifts ?? prev.pastShifts,
          charges: parsed.charges ?? prev.charges,
          cuadraturas: parsed.cuadraturas ?? prev.cuadraturas,
          expenses: parsed.expenses ?? prev.expenses,
          products: parsed.products ?? prev.products,
          movements: parsed.movements ?? prev.movements,
          packages: parsed.packages ?? prev.packages,
          discounts: parsed.discounts ?? prev.discounts,
          promotions: parsed.promotions ?? prev.promotions,
          anomalies: parsed.anomalies ?? prev.anomalies,
          laundry: parsed.laundry ?? prev.laundry,
          roomService: parsed.roomService ?? prev.roomService,
          settings: parsed.settings ?? prev.settings,
          users: parsed.users ?? prev.users,
          blacklist: parsed.blacklist ?? prev.blacklist,
          maintenanceReports: parsed.maintenanceReports ?? prev.maintenanceReports,
          cleaningLog: parsed.cleaningLog ?? prev.cleaningLog,
          cleaningKits: parsed.cleaningKits ?? prev.cleaningKits,
          shopOrders: parsed.shopOrders ?? prev.shopOrders,
          coupons: parsed.coupons ?? prev.coupons,
          shopSettings: parsed.shopSettings ?? prev.shopSettings,
          purchases: parsed.purchases ?? prev.purchases,
          providers: parsed.providers ?? prev.providers,
          productCategories: parsed.productCategories ?? prev.productCategories,
          audit: parsed.audit ?? prev.audit,
          linens: parsed.linens ?? prev.linens,
          linenIncidents: parsed.linenIncidents ?? prev.linenIncidents,
          branches: parsed.branches ?? prev.branches,
          warehouses: parsed.warehouses ?? prev.warehouses,
          transfers: parsed.transfers ?? prev.transfers,
          stockCounts: parsed.stockCounts ?? prev.stockCounts,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          rooms: seedRoomTimes(prev.rooms),
          laundry: seedLaundryTimes(prev.laundry),
        }));
      }
    } catch {
      // Si localStorage no está disponible, seguimos con el estado base.
    }
    setHydrated(true);
  }, []);

  // Persistir cambios una vez hidratado.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignorar errores de cuota o modo privado.
    }
  }, [state, hydrated]);

  const addReservation = useCallback((reservation: Reservation, actor?: Actor) => {
    setState((prev) => {
      const category = prev.categories.find((c) => c.id === reservation.categoryId);
      return {
        ...prev,
        reservations: [reservation, ...prev.reservations],
        audit: [
          auditEntry(
            "crear",
            "Registró una reserva",
            "Reservas",
            `${category?.shortName ?? reservation.categoryId} · ${reservation.guestName}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const updateCategory = useCallback((category: Category, actor?: Actor) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === category.id ? category : c)),
      audit: [
        auditEntry("editar", "Actualizó tarifas", "Precios", `Categoría ${category.shortName}`, actor),
        ...prev.audit,
      ],
    }));
  }, []);

  const setRoomStatus = useCallback((roomId: string, status: RoomStatus, actor?: Actor) => {
    setState((prev) => ({
      ...prev,
      audit: [
        auditEntry(
          "estado",
          "Cambió el estado de una habitación",
          "Habitaciones",
          `Habitación ${prev.rooms.find((r) => r.id === roomId)?.number ?? roomId} → ${ROOM_STATUS_LABEL[status]}`,
          actor,
        ),
        ...prev.audit,
      ],
      rooms: prev.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              status,
              occupiedUntil:
                status === "occupied"
                  ? room.occupiedUntil ??
                    new Date(Date.now() + 3 * 60 * 60000).toISOString()
                  : undefined,
              stay: status === "occupied" ? room.stay : undefined,
              courtesies: status === "occupied" ? room.courtesies : undefined,
              cleaningAssignee: status === "cleaning" ? room.cleaningAssignee : undefined,
              cleaningStartedAt: status === "cleaning" ? room.cleaningStartedAt : undefined,
              cleaningSince:
                status === "cleaning" ? room.cleaningSince ?? new Date().toISOString() : undefined,
            }
          : room,
      ),
    }));
  }, []);

  const assignCleaning = useCallback((roomId: string, staff: string) => {
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId ? { ...room, cleaningAssignee: staff || undefined } : room,
      ),
    }));
  }, []);

  const startCleaning = useCallback((roomId: string, by?: string, actor?: Actor) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room || room.status !== "cleaning") return prev;
      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                cleaningStartedAt: new Date().toISOString(),
                cleaningAssignee: by ?? r.cleaningAssignee,
              }
            : r,
        ),
        audit: [
          auditEntry(
            "estado",
            "Inició el aseo",
            "Limpieza",
            `Habitación ${room.number}`,
            actor ?? (by ? { name: by, role: "aseo" } : undefined),
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const finishCleaning = useCallback(
    (
      roomId: string,
      actor?: Actor,
      opts?: { checklist?: boolean; note?: string; photo?: string },
    ) => {
      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === roomId);
        if (!room) return prev;
        const minutes = room.cleaningStartedAt
          ? Math.max(
              0,
              Math.round((Date.now() - new Date(room.cleaningStartedAt).getTime()) / 60000),
            )
          : undefined;
        const now = new Date().toISOString();
        const entry: CleaningLogEntry = {
          id: makeId("cl"),
          roomId,
          by: room.cleaningAssignee,
          startedAt: room.cleaningStartedAt,
          at: now,
          minutes,
          checklist: opts?.checklist ?? true,
          note: opts?.note?.trim() || undefined,
          photo: opts?.photo,
        };
        // El aseo descuenta solo los insumos (medición vigente de la categoría,
        // editable por administración) desde la bodega de lavandería/aseo.
        const kit = prev.cleaningKits[room.categoryId] ?? [];
        const kitMovements: InventoryMovement[] = kit.map((k, i) => ({
          id: `${makeId("m")}-a${i}`,
          productId: k.productId,
          type: "ajuste",
          quantity: -k.quantity,
          at: now,
          refId: `aseo-${roomId}`,
          user: `Insumos de aseo · Hab. ${room.number}`,
        }));
        const kitById = new Map(kit.map((k) => [k.productId, k.quantity]));
        return {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  status: "available",
                  cleaningSince: undefined,
                  cleaningStartedAt: undefined,
                  cleaningAssignee: undefined,
                }
              : r,
          ),
          products: prev.products.map((p) => {
            const qty = kitById.get(p.id);
            return qty
              ? {
                  ...p,
                  laundryStock: Math.max(
                    0,
                    Math.round(((p.laundryStock ?? 0) - qty) * 10) / 10,
                  ),
                }
              : p;
          }),
          movements: [...kitMovements, ...prev.movements],
          cleaningLog: [entry, ...prev.cleaningLog],
          audit: [
            auditEntry(
              "estado",
              "Terminó una limpieza",
              "Limpieza",
              `Habitación ${room.number}${minutes != null ? ` · ${minutes} min` : ""} · ${
                entry.checklist ? "checklist completo" : "checklist incompleto"
              }${entry.note ? " · con observación" : ""} · insumos descontados`,
              actor ??
                (room.cleaningAssignee ? { name: room.cleaningAssignee, role: "aseo" } : undefined),
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const updateCleaningKit = useCallback(
    (categoryId: CategoryId, items: CleaningKitItem[], actor?: Actor) => {
      setState((prev) => ({
        ...prev,
        cleaningKits: {
          ...prev.cleaningKits,
          [categoryId]: items.filter((i) => i.productId && i.quantity > 0),
        },
        audit: [
          auditEntry(
            "editar",
            "Ajustó el kit de insumos de aseo",
            "Limpieza",
            `Categoría ${prev.categories.find((c) => c.id === categoryId)?.name ?? categoryId}`,
            actor,
          ),
          ...prev.audit,
        ],
      }));
    },
    [],
  );

  const reportMaintenance = useCallback(
    (roomId: string, note?: string, by?: string, actor?: Actor, photo?: string) => {
    setState((prev) => {
      const report: MaintenanceReport = {
        id: makeId("mr"),
        roomId,
        note: note?.trim() || undefined,
        photo,
        at: new Date().toISOString(),
        by,
      };
      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                status: "maintenance",
                occupiedUntil: undefined,
                stay: undefined,
                courtesies: undefined,
                cleaningSince: undefined,
                cleaningStartedAt: undefined,
                cleaningAssignee: undefined,
              }
            : r,
        ),
        maintenanceReports: [report, ...prev.maintenanceReports],
        audit: [
          auditEntry(
            "estado",
            "Reportó mantención",
            "Limpieza",
            `Habitación ${prev.rooms.find((r) => r.id === roomId)?.number ?? roomId}`,
            actor ?? (by ? { name: by, role: "aseo" } : undefined),
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const addAnomaly = useCallback((anomaly: Anomaly, actor?: Actor) => {
    setState((prev) => ({
      ...prev,
      anomalies: [anomaly, ...prev.anomalies],
      audit: [
        auditEntry(
          "crear",
          "Registró una anomalía",
          "Anomalías",
          anomaly.description.length > 60
            ? `${anomaly.description.slice(0, 57)}…`
            : anomaly.description,
          actor,
        ),
        ...prev.audit,
      ],
    }));
  }, []);

  const resolveAnomaly = useCallback((id: string, actor?: Actor) => {
    setState((prev) => {
      const anomaly = prev.anomalies.find((a) => a.id === id);
      return {
        ...prev,
        anomalies: prev.anomalies.map((a) => (a.id === id ? { ...a, status: "resuelta" } : a)),
        audit: anomaly
          ? [
              auditEntry(
                "estado",
                "Resolvió una anomalía",
                "Anomalías",
                anomaly.description.length > 60
                  ? `${anomaly.description.slice(0, 57)}…`
                  : anomaly.description,
                actor,
              ),
              ...prev.audit,
            ]
          : prev.audit,
      };
    });
  }, []);

  const addLaundryLoad = useCallback((load: LaundryLoad) => {
    setState((prev) => ({ ...prev, laundry: [load, ...prev.laundry] }));
  }, []);

  const advanceLaundryLoad = useCallback((id: string) => {
    const NEXT: Record<LaundryStage, LaundryStage | null> = {
      recolectado: "lavando",
      lavando: "secando",
      secando: "doblando",
      doblando: "listo",
      listo: null,
    };
    setState((prev) => {
      const load = prev.laundry.find((l) => l.id === id);
      if (!load) return prev;
      const next = NEXT[load.stage];
      if (!next) return prev;
      const machine =
        next === "lavando"
          ? freeMachineName(prev.laundry, "lavadora")
          : next === "secando"
            ? freeMachineName(prev.laundry, "secadora")
            : undefined;
      return {
        ...prev,
        laundry: prev.laundry.map((l) =>
          l.id === id ? { ...l, stage: next, machine, startedAt: new Date().toISOString() } : l,
        ),
      };
    });
  }, []);

  const takeLaundryLoad = useCallback((id: string, by?: string) => {
    setState((prev) => ({
      ...prev,
      laundry: prev.laundry.map((l) => (l.id === id && !l.by ? { ...l, by } : l)),
    }));
  }, []);

  const addLinenIncident = useCallback((incident: LinenIncident) => {
    setState((prev) => ({ ...prev, linenIncidents: [incident, ...prev.linenIncidents] }));
  }, []);

  const addRoomServiceOrder = useCallback((order: RoomServiceOrder) => {
    setState((prev) => ({ ...prev, roomService: [order, ...prev.roomService] }));
  }, []);

  const deliverRoomServiceOrder = useCallback((id: string, user?: string, actor?: Actor) => {
    setState((prev) => {
      const order = prev.roomService.find((o) => o.id === id);
      if (!order || order.status !== "preparando") return prev;
      const at = new Date().toISOString();
      const movements: InventoryMovement[] = order.items.map((item, i) => ({
        id: `${makeId("m")}-${i}`,
        productId: item.productId,
        type: "venta_presencial",
        quantity: -item.quantity,
        at,
        refId: prev.shift.id,
        user,
      }));
      const products = prev.products.map((p) => {
        const item = order.items.find((it) => it.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      });
      return {
        ...prev,
        products,
        movements: [...movements, ...prev.movements],
        // El pedido entregado se cobra al efectivo del corte del turno.
        shift: { ...prev.shift, cash: addToLine(prev.shift.cash, order.total) },
        roomService: prev.roomService.map((o) =>
          o.id === id ? { ...o, status: "entregado", deliveredAt: at } : o,
        ),
        audit: [
          auditEntry(
            "estado",
            "Entregó un pedido a la habitación",
            "Room service",
            `Habitación ${order.roomId} · ${formatCLP(order.total)}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const cancelRoomServiceOrder = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      roomService: prev.roomService.map((o) =>
        o.id === id && o.status === "preparando" ? { ...o, status: "cancelado" } : o,
      ),
    }));
  }, []);

  const checkIn = useCallback(
    (
      roomId: string,
      dayType: DayType,
      duration: Duration,
      guestName?: string,
      guestRut?: string,
      actor?: Actor,
    ) => {
      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === roomId);
        if (!room) return prev;
        const category = prev.categories.find((c) => c.id === room.categoryId);
        if (!category) return prev;
        const total = priceFor(category, dayType, duration);
        const checkInAt = new Date();
        const until = new Date(checkInAt.getTime() + duration * 3600000).toISOString();
        // El paquete de ingreso de la categoría se descarga solo del stock de recepción.
        const openingPack = openingPackFor(room.categoryId);
        const courtesyMovements: InventoryMovement[] = openingPack.map((c, i) => ({
          id: `${makeId("m")}-c${i}`,
          productId: c.productId,
          type: "ajuste",
          quantity: -c.quantity,
          at: checkInAt.toISOString(),
          refId: `cortesia-apertura-${roomId}`,
          user: `Paquete de ingreso · Hab. ${room.number}`,
        }));
        const courtesyById = new Map(openingPack.map((c) => [c.productId, c.quantity]));
        // Ticket interno de cobro: la camarera lo cobra en la pieza al inicio.
        const charge: RoomCharge = {
          id: makeId("ch"),
          roomId,
          concept: `Bloque ${duration} h`,
          amount: total,
          courtesies: [],
          status: "pendiente",
          createdAt: checkInAt.toISOString(),
        };
        return {
          ...prev,
          charges: [charge, ...prev.charges],
          products: prev.products.map((p) => {
            const qty = courtesyById.get(p.id);
            return qty ? { ...p, stock: Math.max(0, p.stock - qty) } : p;
          }),
          movements: [...courtesyMovements, ...prev.movements],
          rooms: prev.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  status: "occupied",
                  occupiedUntil: until,
                  stay: {
                    dayType,
                    duration,
                    total,
                    guestName: guestName?.trim() || undefined,
                    guestRut: guestRut?.trim() || undefined,
                    checkInAt: checkInAt.toISOString(),
                  },
                  // El paquete de ingreso abre el listado de cortesías de la pieza.
                  courtesies: openingPack.map((c, i) => ({
                    id: `${makeId("sc")}-${i}`,
                    productId: c.productId,
                    label: c.label,
                    quantity: c.quantity,
                    at: checkInAt.toISOString(),
                    opening: true,
                  })),
                }
              : r,
          ),
          audit: [
            auditEntry(
              "crear",
              "Registró el paquete de ingreso",
              "Cortesías",
              `Habitación ${room.number} · ${openingPack.map((c) => `${c.quantity}× ${c.label}`).join(" · ")}`,
              actor,
            ),
            auditEntry(
              "estado",
              "Hizo un check-in",
              "Habitaciones",
              `Habitación ${room.number} · ${duration} h`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const logCourtesy = useCallback(
    (roomId: string, productId: string, quantity: number, actor?: Actor, label?: string) => {
      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === roomId);
        const product = prev.products.find((p) => p.id === productId);
        if (!room || !product || quantity <= 0) return prev;
        const now = new Date().toISOString();
        const movement: InventoryMovement = {
          id: makeId("m"),
          productId,
          type: "ajuste",
          quantity: -quantity,
          at: now,
          refId: `cortesia-${roomId}`,
          user: `Cortesía · Hab. ${room.number}`,
        };
        // La cortesía queda en el listado de la pieza (visible y editable desde
        // el tablero, con o sin check-in). Tocar de nuevo el mismo producto
        // acumula la cantidad en una sola línea, no crea otra.
        const existing = (room.courtesies ?? []).find(
          (c) => !c.opening && c.productId === productId,
        );
        const courtesies = existing
          ? (room.courtesies ?? []).map((c) =>
              c.id === existing.id ? { ...c, quantity: c.quantity + quantity, at: now } : c,
            )
          : [
              ...(room.courtesies ?? []),
              {
                id: makeId("sc"),
                productId,
                label: label ?? product.name,
                quantity,
                at: now,
              },
            ];
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p,
          ),
          movements: [movement, ...prev.movements],
          rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, courtesies } : r)),
          charges: prev.charges.map((c) =>
            c.roomId === roomId && c.status === "pendiente"
              ? { ...c, courtesies: courtesyStrings(courtesies) }
              : c,
          ),
          audit: [
            auditEntry(
              "crear",
              "Registró una cortesía",
              "Cortesías",
              `Habitación ${room.number} · ${quantity}× ${product.name}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const removeCourtesy = useCallback((roomId: string, entryId: string, actor?: Actor) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      const entry = room?.courtesies?.find((c) => c.id === entryId);
      if (!room || !entry) return prev;
      const now = new Date().toISOString();
      // La anulación repone el stock y deja su propio movimiento con rastro.
      const movement: InventoryMovement = {
        id: makeId("m"),
        productId: entry.productId,
        type: "ajuste",
        quantity: entry.quantity,
        at: now,
        refId: `cortesia-anulada-${roomId}`,
        user: `Cortesía anulada · Hab. ${room.number}`,
      };
      const courtesies = (room.courtesies ?? []).filter((c) => c.id !== entryId);
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === entry.productId ? { ...p, stock: p.stock + entry.quantity } : p,
        ),
        movements: [movement, ...prev.movements],
        rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, courtesies } : r)),
        charges: prev.charges.map((c) =>
          c.roomId === roomId && c.status === "pendiente"
            ? { ...c, courtesies: courtesyStrings(courtesies) }
            : c,
        ),
        audit: [
          auditEntry(
            "eliminar",
            "Anuló una cortesía",
            "Cortesías",
            `Habitación ${room.number} · ${entry.quantity}× ${entry.label} · stock repuesto`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const setCourtesyQuantity = useCallback(
    (roomId: string, entryId: string, quantity: number, actor?: Actor) => {
      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === roomId);
        const entry = room?.courtesies?.find((c) => c.id === entryId);
        if (!room || !entry || quantity <= 0 || quantity === entry.quantity) return prev;
        const delta = quantity - entry.quantity; // + consume más stock, − repone
        const now = new Date().toISOString();
        const movement: InventoryMovement = {
          id: makeId("m"),
          productId: entry.productId,
          type: "ajuste",
          quantity: -delta,
          at: now,
          refId: `cortesia-${roomId}`,
          user: `Cortesía corregida · Hab. ${room.number}`,
        };
        const courtesies = (room.courtesies ?? []).map((c) =>
          c.id === entryId ? { ...c, quantity } : c,
        );
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === entry.productId ? { ...p, stock: Math.max(0, p.stock - delta) } : p,
          ),
          movements: [movement, ...prev.movements],
          rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, courtesies } : r)),
          charges: prev.charges.map((c) =>
            c.roomId === roomId && c.status === "pendiente"
              ? { ...c, courtesies: courtesyStrings(courtesies) }
              : c,
          ),
          audit: [
            auditEntry(
              "editar",
              "Corrigió una cortesía",
              "Cortesías",
              `Habitación ${room.number} · ${entry.label}: ${entry.quantity} → ${quantity}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const payCharge = useCallback(
    (chargeId: string, method: PaymentMethod, user?: string, actor?: Actor) => {
      setState((prev) => {
        const charge = prev.charges.find((c) => c.id === chargeId);
        if (!charge || charge.status !== "pendiente") return prev;
        const room = prev.rooms.find((r) => r.id === charge.roomId);
        const now = new Date().toISOString();
        const tx: Transaction = {
          id: makeId("t"),
          roomId: charge.roomId,
          method,
          amount: charge.amount,
          at: now,
          user: user ?? prev.shift.user,
          branchId: "limache",
        };
        return {
          ...prev,
          transactions: [tx, ...prev.transactions],
          shift: { ...prev.shift, [method]: addToLine(prev.shift[method], charge.amount) },
          charges: prev.charges.map((c) =>
            c.id === chargeId ? { ...c, status: "pagado", paidAt: now, method, by: user } : c,
          ),
          rooms: prev.rooms.map((r) =>
            r.id === charge.roomId && r.stay
              ? { ...r, stay: { ...r.stay, paid: true, paymentMethod: method, paidAt: now } }
              : r,
          ),
          audit: [
            auditEntry(
              "crear",
              "Cobró una estancia en la pieza",
              "Caja",
              `Habitación ${room?.number ?? charge.roomId} · ${charge.concept} · ${PAYMENT_LABEL[method]} · ${formatCLP(charge.amount)}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const updateStayGuest = useCallback(
    (roomId: string, name: string, rut: string, actor?: Actor) => {
      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === roomId);
        if (!room || !room.stay) return prev;
        return {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === roomId && r.stay
              ? {
                  ...r,
                  stay: {
                    ...r.stay,
                    guestName: name.trim() || r.stay.guestName,
                    guestRut: rut.trim() || r.stay.guestRut,
                  },
                }
              : r,
          ),
          audit: [
            auditEntry(
              "editar",
              "Registró al huésped desde la pieza",
              "Habitaciones",
              `Habitación ${room.number} · escaneo de cédula`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const logCuadratura = useCallback(
    (counted: Record<PaymentMethod, number>, user?: string, actor?: Actor) => {
      setState((prev) => {
        const entry: Cuadratura = {
          id: makeId("cq"),
          at: new Date().toISOString(),
          user: user ?? prev.shift.user,
          counted,
          expected: {
            cash: prev.shift.cash.expected,
            debit: prev.shift.debit.expected,
            credit: prev.shift.credit.expected,
            transfer: prev.shift.transfer.expected,
          },
        };
        const diff =
          counted.cash -
          entry.expected.cash +
          (counted.debit - entry.expected.debit) +
          (counted.credit - entry.expected.credit) +
          (counted.transfer - entry.expected.transfer);
        return {
          ...prev,
          cuadraturas: [entry, ...prev.cuadraturas],
          audit: [
            auditEntry(
              "crear",
              "Hizo una cuadratura parcial",
              "Caja",
              `Folio ${prev.shift.folio} · diferencia ${diff === 0 ? "—" : formatCLP(diff)}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const checkOut = useCallback(
    (roomId: string, method?: PaymentMethod, user?: string, actor?: Actor) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room) return prev;
      let transactions = prev.transactions;
      let shift = prev.shift;
      let charges = prev.charges;
      // El bloque se cobra en la pieza al inicio; al check-out solo se liquida
      // lo que siga pendiente (p. ej. horas adicionales).
      const pending = prev.charges.filter((c) => c.roomId === roomId && c.status === "pendiente");
      const pendingSum = pending.reduce((s, c) => s + c.amount, 0);
      if (method && pendingSum > 0) {
        const now = new Date().toISOString();
        const tx: Transaction = {
          id: makeId("t"),
          roomId,
          method,
          amount: pendingSum,
          at: now,
          user: user ?? prev.shift.user,
          branchId: "limache",
        };
        // Cada medio de pago acumula en su propia línea del arqueo.
        transactions = [tx, ...transactions];
        shift = { ...shift, [method]: addToLine(shift[method], tx.amount) };
        charges = charges.map((c) =>
          c.roomId === roomId && c.status === "pendiente"
            ? { ...c, status: "pagado" as const, paidAt: now, method, by: user }
            : c,
        );
      }
      const cobro =
        method && pendingSum > 0
          ? ` · cobro pendiente ${formatCLP(pendingSum)} ${PAYMENT_LABEL[method].toLowerCase()}`
          : "";
      return {
        ...prev,
        transactions,
        shift,
        charges,
        audit: [
          auditEntry(
            "estado",
            "Hizo un check-out",
            "Habitaciones",
            `Habitación ${room.number}${cobro}`,
            actor,
          ),
          ...prev.audit,
        ],
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                status: "cleaning",
                occupiedUntil: undefined,
                stay: undefined,
                courtesies: undefined,
                cleaningSince: new Date().toISOString(),
                cleaningStartedAt: undefined,
                cleaningAssignee: undefined,
              }
            : r,
        ),
      };
    });
  }, []);

  const moveRoom = useCallback((fromId: string, toId: string, actor?: Actor) => {
    setState((prev) => {
      const from = prev.rooms.find((r) => r.id === fromId);
      const to = prev.rooms.find((r) => r.id === toId);
      if (!from || !to || to.status !== "available") return prev;
      return {
        ...prev,
        audit: [
          auditEntry("estado", "Cambió de pieza una estancia", "Habitaciones", `${from.number} → ${to.number}`, actor),
          ...prev.audit,
        ],
        rooms: prev.rooms.map((r) => {
          if (r.id === fromId)
            return {
              ...r,
              status: "cleaning",
              occupiedUntil: undefined,
              stay: undefined,
              courtesies: undefined,
              cleaningSince: new Date().toISOString(),
            };
          if (r.id === toId)
            return {
              ...r,
              status: "occupied",
              occupiedUntil: from.occupiedUntil,
              stay: from.stay,
              // Las cortesías cargadas viajan con la estancia a la pieza nueva.
              courtesies: from.courtesies,
            };
          return r;
        }),
      };
    });
  }, []);

  const extendStay = useCallback((roomId: string, extraHours: number, actor?: Actor) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room || !room.occupiedUntil || extraHours <= 0) return prev;
      const base = new Date(room.occupiedUntil).getTime();
      const until = new Date(base + extraHours * 3600000).toISOString();
      const category = prev.categories.find((c) => c.id === room.categoryId);
      const extra =
        room.stay && category ? extraHourFor(category, room.stay.dayType) * extraHours : 0;
      // La hora adicional genera (o engorda) un ticket de cobro pendiente.
      const openCharge = prev.charges.find(
        (c) => c.roomId === roomId && c.status === "pendiente",
      );
      const charges =
        extra <= 0
          ? prev.charges
          : openCharge
            ? prev.charges.map((c) =>
                c.id === openCharge.id ? { ...c, amount: c.amount + extra } : c,
              )
            : [
                {
                  id: makeId("ch"),
                  roomId,
                  concept: `Hora adicional ×${extraHours}`,
                  amount: extra,
                  courtesies: [],
                  status: "pendiente" as const,
                  createdAt: new Date().toISOString(),
                },
                ...prev.charges,
              ];
      return {
        ...prev,
        charges,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                occupiedUntil: until,
                stay: r.stay ? { ...r.stay, total: r.stay.total + extra } : r.stay,
              }
            : r,
        ),
        audit: [
          auditEntry(
            "estado",
            "Amplió una estancia",
            "Habitaciones",
            `Habitación ${room.number} · +${extraHours} h`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const addTransaction = useCallback((transaction: Transaction, actor?: Actor) => {
    setState((prev) => {
      // Cada medio de pago acumula en su propia línea del arqueo.
      return {
        ...prev,
        transactions: [transaction, ...prev.transactions],
        shift: {
          ...prev.shift,
          [transaction.method]: addToLine(prev.shift[transaction.method], transaction.amount),
        },
        audit: [
          auditEntry(
            "crear",
            "Registró un pago",
            "Caja",
            `${PAYMENT_LABEL[transaction.method]} · ${formatCLP(transaction.amount)} · Hab. ${transaction.roomId}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const addExpense = useCallback((expense: Expense, actor?: Actor) => {
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
      shift: {
        ...prev.shift,
        expenses: addToLine(prev.shift.expenses, expense.amount),
      },
      audit: [
        auditEntry(
          "crear",
          "Registró un gasto",
          "Caja",
          `${expense.concept} · ${formatCLP(expense.amount)}`,
          actor,
        ),
        ...prev.audit,
      ],
    }));
  }, []);

  const sellProduct = useCallback(
    (
      productId: string,
      quantity: number,
      channel: SalesChannel,
      refId?: string,
      user?: string,
      actor?: Actor,
    ) => {
      setState((prev) => {
        const product = prev.products.find((p) => p.id === productId);
        if (!product || quantity <= 0) return prev;
        const movement: InventoryMovement = {
          id: makeId("m"),
          productId,
          type: channel === "online" ? "venta_online" : "venta_presencial",
          quantity: -quantity,
          at: new Date().toISOString(),
          refId,
          user,
        };
        // La venta presencial entra al efectivo del turno (corte de caja).
        const saleAmount = product.price * quantity;
        const shift =
          channel === "presencial"
            ? { ...prev.shift, cash: addToLine(prev.shift.cash, saleAmount) }
            : prev.shift;
        return {
          ...prev,
          // El stock nunca queda negativo: vender sin saldo es justo lo que el
          // sistema viene a impedir (el Excel del cliente acumulaba negativos).
          products: prev.products.map((p) =>
            p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p,
          ),
          movements: [movement, ...prev.movements],
          shift,
          audit: [
            auditEntry(
              "crear",
              channel === "online" ? "Registró una venta online" : "Registró una venta",
              "Caja",
              `${quantity}× ${product.name} · ${formatCLP(saleAmount)}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const adjustStock = useCallback((productId: string, delta: number, user?: string, actor?: Actor) => {
    setState((prev) => {
      const product = prev.products.find((p) => p.id === productId);
      if (!product || delta === 0) return prev;
      const movement: InventoryMovement = {
        id: makeId("m"),
        productId,
        type: delta > 0 ? "ingreso" : "ajuste",
        quantity: delta,
        at: new Date().toISOString(),
        user,
      };
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
        ),
        movements: [movement, ...prev.movements],
        audit: [
          auditEntry(
            "editar",
            "Ajustó stock",
            "Inventario",
            `${product.name} · ${delta > 0 ? "+" : ""}${delta}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const addProduct = useCallback((product: Product, actor?: Actor) => {
    setState((prev) => ({
      ...prev,
      products: [product, ...prev.products],
      audit: [auditEntry("crear", "Creó un producto", "Inventario", product.name, actor), ...prev.audit],
    }));
  }, []);

  const updateProduct = useCallback((product: Product, actor?: Actor) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === product.id ? product : p)),
      audit: [auditEntry("editar", "Editó un producto", "Inventario", product.name, actor), ...prev.audit],
    }));
  }, []);

  const addPackage = useCallback((pkg: Package) => {
    setState((prev) => ({ ...prev, packages: [pkg, ...prev.packages] }));
  }, []);

  const updatePackage = useCallback((pkg: Package) => {
    setState((prev) => ({
      ...prev,
      packages: prev.packages.map((p) => (p.id === pkg.id ? pkg : p)),
    }));
  }, []);

  const sellPackage = useCallback((packageId: string, user?: string, actor?: Actor) => {
    setState((prev) => {
      const pkg = prev.packages.find((p) => p.id === packageId);
      if (!pkg) return prev;
      const at = new Date().toISOString();
      const movements: InventoryMovement[] = pkg.items.map((item, i) => ({
        id: `${makeId("m")}-${i}`,
        productId: item.productId,
        type: "venta_presencial",
        quantity: -item.quantity,
        at,
        refId: prev.shift.id,
        user,
      }));
      const products = prev.products.map((p) => {
        const item = pkg.items.find((it) => it.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      });
      return {
        ...prev,
        products,
        movements: [...movements, ...prev.movements],
        // El combo se cobra al precio del paquete y entra al efectivo del corte.
        shift: { ...prev.shift, cash: addToLine(prev.shift.cash, pkg.price) },
        audit: [
          auditEntry(
            "crear",
            "Vendió un paquete",
            "Caja",
            `${pkg.name} · ${formatCLP(pkg.price)}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const addDiscount = useCallback((discount: Discount) => {
    setState((prev) => ({ ...prev, discounts: [discount, ...prev.discounts] }));
  }, []);

  const updateDiscount = useCallback((discount: Discount) => {
    setState((prev) => ({
      ...prev,
      discounts: prev.discounts.map((d) => (d.id === discount.id ? discount : d)),
    }));
  }, []);

  const addPromotion = useCallback((promotion: Promotion) => {
    setState((prev) => ({ ...prev, promotions: [promotion, ...prev.promotions] }));
  }, []);

  const updatePromotion = useCallback((promotion: Promotion) => {
    setState((prev) => ({
      ...prev,
      promotions: prev.promotions.map((p) => (p.id === promotion.id ? promotion : p)),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<VenueSettings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const addUser = useCallback((user: StaffUser) => {
    setState((prev) => ({ ...prev, users: [...prev.users, user] }));
  }, []);

  const updateUser = useCallback((user: StaffUser) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === user.id ? user : u)),
    }));
  }, []);

  const addBlacklistEntry = useCallback((entry: BlacklistEntry) => {
    setState((prev) => ({ ...prev, blacklist: [entry, ...prev.blacklist] }));
  }, []);

  const removeBlacklistEntry = useCallback((id: string) => {
    setState((prev) => ({ ...prev, blacklist: prev.blacklist.filter((b) => b.id !== id) }));
  }, []);

  const backupNow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, lastBackup: new Date().toISOString() },
    }));
  }, []);

  const addShopOrder = useCallback((order: ShopOrder) => {
    setState((prev) => ({ ...prev, shopOrders: [order, ...prev.shopOrders] }));
  }, []);

  const advanceShopOrder = useCallback((id: string, actor?: Actor) => {
    setState((prev) => {
      const order = prev.shopOrders.find((o) => o.id === id);
      const next = order ? SHOP_NEXT[order.status] : null;
      return {
        ...prev,
        shopOrders: prev.shopOrders.map((o) => {
          if (o.id !== id) return o;
          if (!next) return o;
          const at = new Date().toISOString();
          return {
            ...o,
            status: next,
            paidAt: next === "pagado" ? at : o.paidAt,
            shippedAt: next === "despachado" ? at : o.shippedAt,
            deliveredAt: next === "entregado" ? at : o.deliveredAt,
          };
        }),
        audit:
          order && next
            ? [
                auditEntry(
                  "estado",
                  "Avanzó un pedido de la tienda",
                  "Tienda online",
                  `#${order.folio} → ${next.charAt(0).toUpperCase()}${next.slice(1)}`,
                  actor,
                ),
                ...prev.audit,
              ]
            : prev.audit,
      };
    });
  }, []);

  const cancelShopOrder = useCallback((id: string, actor?: Actor) => {
    setState((prev) => {
      const order = prev.shopOrders.find((o) => o.id === id);
      const cancellable = order && order.status !== "entregado" && order.status !== "cancelado";
      return {
        ...prev,
        shopOrders: prev.shopOrders.map((o) =>
          o.id === id && o.status !== "entregado" && o.status !== "cancelado"
            ? { ...o, status: "cancelado" }
            : o,
        ),
        audit: cancellable
          ? [
              auditEntry("estado", "Canceló un pedido de la tienda", "Tienda online", `#${order.folio}`, actor),
              ...prev.audit,
            ]
          : prev.audit,
      };
    });
  }, []);

  const addCoupon = useCallback((coupon: Coupon) => {
    setState((prev) => ({ ...prev, coupons: [coupon, ...prev.coupons] }));
  }, []);

  const updateCoupon = useCallback((coupon: Coupon) => {
    setState((prev) => ({
      ...prev,
      coupons: prev.coupons.map((c) => (c.id === coupon.id ? coupon : c)),
    }));
  }, []);

  const updateShopSettings = useCallback((patch: Partial<ShopSettings>) => {
    setState((prev) => ({ ...prev, shopSettings: { ...prev.shopSettings, ...patch } }));
  }, []);

  const addProvider = useCallback((provider: Provider) => {
    setState((prev) =>
      prev.providers.some((p) => p.name.toLowerCase() === provider.name.toLowerCase())
        ? prev
        : { ...prev, providers: [...prev.providers, provider] },
    );
  }, []);

  const addProductCategory = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setState((prev) =>
      prev.productCategories.includes(clean)
        ? prev
        : { ...prev, productCategories: [...prev.productCategories, clean] },
    );
  }, []);

  const addPurchase = useCallback((purchase: Purchase, actor?: Actor) => {
    setState((prev) => {
      // Desde la v2, las compras a proveedor entran a bodega central por
      // defecto (bajo llave); el formulario permite ingresar directo a recepción.
      const destination = purchase.warehouseId ?? "central";
      const movements: InventoryMovement[] = purchase.items.map((item, i) => ({
        id: `${makeId("m")}-${i}`,
        productId: item.productId,
        type: "ingreso",
        quantity: item.quantity,
        at: purchase.at,
        refId: purchase.id,
        user: `${purchase.user ?? "Encargado"} · ${warehouseName(destination)}`,
      }));
      const products = prev.products.map((p) => {
        const item = purchase.items.find((it) => it.productId === p.id);
        if (!item) return p;
        return destination === "central"
          ? { ...p, centralStock: (p.centralStock ?? 0) + item.quantity }
          : { ...p, stock: p.stock + item.quantity };
      });
      return {
        ...prev,
        products,
        movements: [...movements, ...prev.movements],
        purchases: [{ ...purchase, warehouseId: destination }, ...prev.purchases],
        audit: [
          auditEntry(
            "crear",
            "Ingresó stock de proveedor",
            "Inventario",
            `${purchase.provider} · ${formatCLP(purchase.total)} · ${warehouseName(destination)}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const requestTransfer = useCallback(
    (
      items: TransferItem[],
      requestedBy: string,
      note?: string,
      actor?: Actor,
      to?: string,
    ): string => {
      const id = makeId("tr");
      setState((prev) => {
        const clean = items.filter((it) => it.quantity > 0);
        if (clean.length === 0) return prev;
        const destination = to && to !== "central" ? to : "recepcion";
        const transfer: Transfer = {
          id,
          from: "central",
          to: destination,
          items: clean,
          status: "solicitado",
          requestedBy,
          note: note?.trim() || undefined,
          createdAt: new Date().toISOString(),
          branchId: "limache",
        };
        return {
          ...prev,
          transfers: [transfer, ...prev.transfers],
          audit: [
            auditEntry(
              "crear",
              "Solicitó reposición a bodega central",
              "Bodegas",
              `${clean.length} producto${clean.length === 1 ? "" : "s"} · central → ${warehouseName(destination).toLowerCase()}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
      return id;
    },
    [],
  );

  const createDirectTransfer = useCallback(
    (from: string, to: string, items: TransferItem[], deliveredBy: string, actor?: Actor) => {
      setState((prev) => {
        const clean = items.filter((it) => it.quantity > 0);
        if (clean.length === 0 || from === to) return prev;
        const now = new Date().toISOString();
        const { products, moved, shortages } = applyTransferToProducts(
          prev.products,
          clean,
          from,
          to,
        );
        const partial = moved.some((m) => (m.delivered ?? 0) < m.quantity);
        const transfer: Transfer = {
          id: makeId("tr"),
          folio: nextGuideFolio(prev.transfers),
          from,
          to,
          items: moved,
          status: partial ? "parcial" : "entregado",
          requestedBy: deliveredBy,
          deliveredBy,
          note: shortages.length
            ? `Entrega parcial por stock insuficiente: ${shortages.join(", ")}. El saldo queda pendiente.`
            : undefined,
          createdAt: now,
          deliveredAt: now,
          branchId: "limache",
        };
        const movements: InventoryMovement[] = moved
          .filter((m) => (m.delivered ?? 0) > 0)
          .map((m, i) => ({
            id: `${makeId("m")}-${i}`,
            productId: m.productId,
            type: "traspaso",
            quantity: m.delivered ?? 0,
            at: now,
            refId: transfer.id,
            user: deliveredBy,
          }));
        return {
          ...prev,
          products,
          transfers: [transfer, ...prev.transfers],
          movements: [...movements, ...prev.movements],
          audit: [
            auditEntry(
              "crear",
              "Registró un traspaso directo",
              "Bodegas",
              `${moved.length} producto${moved.length === 1 ? "" : "s"} · ${warehouseName(from)} → ${warehouseName(to)}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const deliverTransfer = useCallback(
    (id: string, deliveredBy: string, actor?: Actor, quantities?: Record<string, number>) => {
      setState((prev) => {
        const transfer = prev.transfers.find((t) => t.id === id);
        if (!transfer || transfer.status !== "solicitado") return prev;
        const now = new Date().toISOString();
        const { products, moved, shortages } = applyTransferToProducts(
          prev.products,
          transfer.items,
          transfer.from,
          transfer.to,
          quantities,
        );
        const movements: InventoryMovement[] = moved
          .filter((m) => (m.delivered ?? 0) > 0)
          .map((m, i) => ({
            id: `${makeId("m")}-${i}`,
            productId: m.productId,
            type: "traspaso",
            quantity: m.delivered ?? 0,
            at: now,
            refId: transfer.id,
            user: deliveredBy,
          }));
        // Si alguna línea quedó corta, la entrega es parcial: el saldo queda
        // pendiente en la guía y alimenta la sugerencia de reposición.
        const partial = moved.some((m) => (m.delivered ?? 0) < m.quantity);
        const note = shortages.length
          ? `${transfer.note ? `${transfer.note} ` : ""}Entrega parcial por stock insuficiente: ${shortages.join(", ")}. El saldo queda pendiente.`
          : transfer.note;
        const folio = nextGuideFolio(prev.transfers);
        return {
          ...prev,
          products,
          movements: [...movements, ...prev.movements],
          transfers: prev.transfers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: partial ? "parcial" : "entregado",
                  folio,
                  deliveredBy,
                  deliveredAt: now,
                  items: moved,
                  note,
                }
              : t,
          ),
          audit: [
            auditEntry(
              "estado",
              partial
                ? "Entregó una solicitud de bodega (parcial)"
                : "Entregó una solicitud de bodega",
              "Bodegas",
              `Guía ${folio} · ${moved.length} producto${moved.length === 1 ? "" : "s"} · ${warehouseName(transfer.from)} → ${warehouseName(transfer.to)}${partial ? " · saldo pendiente" : ""}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const receiveTransfer = useCallback((id: string, receivedBy: string, actor?: Actor) => {
    setState((prev) => {
      const transfer = prev.transfers.find((t) => t.id === id);
      // La entrega parcial también se confirma: el saldo pendiente queda en la
      // guía y en la sugerencia de reposición.
      if (!transfer || (transfer.status !== "entregado" && transfer.status !== "parcial"))
        return prev;
      return {
        ...prev,
        transfers: prev.transfers.map((t) =>
          t.id === id
            ? { ...t, status: "recibido", receivedBy, receivedAt: new Date().toISOString() }
            : t,
        ),
        audit: [
          auditEntry(
            "estado",
            "Confirmó recepción conforme",
            "Bodegas",
            `Solicitud ${transfer.id} · ${warehouseName(transfer.to)}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const rejectTransfer = useCallback((id: string, by: string, note?: string, actor?: Actor) => {
    setState((prev) => {
      const transfer = prev.transfers.find((t) => t.id === id);
      if (!transfer || transfer.status !== "solicitado") return prev;
      return {
        ...prev,
        transfers: prev.transfers.map((t) =>
          t.id === id
            ? { ...t, status: "rechazado", deliveredBy: by, note: note?.trim() || t.note }
            : t,
        ),
        audit: [
          auditEntry(
            "estado",
            "Rechazó una solicitud de bodega",
            "Bodegas",
            `Solicitud ${transfer.id}${note?.trim() ? ` · ${note.trim()}` : ""}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const startStockCount = useCallback(
    (warehouseId: string, group: string | undefined, by: string, actor?: Actor): string => {
      const id = makeId("cnt");
      setState((prev) => {
        const scopeProducts = prev.products.filter((p) => !group || p.group === group);
        if (scopeProducts.length === 0) return prev;
        const count: StockCount = {
          id,
          scope: group ? "parcial" : "general",
          warehouseId,
          group,
          lines: scopeProducts.map((p) => {
            const expected = stockOf(p, warehouseId);
            // Las líneas parten cuadradas: en el conteo solo se editan las difieren.
            return { productId: p.id, expected, counted: expected };
          }),
          status: "abierto",
          adjusted: false,
          by,
          createdAt: new Date().toISOString(),
          branchId: "limache",
        };
        return {
          ...prev,
          stockCounts: [count, ...prev.stockCounts],
          audit: [
            auditEntry(
              "crear",
              "Abrió un conteo de inventario",
              "Bodegas",
              `${group ? `Parcial · ${group}` : "Inventario general"} · ${warehouseName(warehouseId)}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
      return id;
    },
    [],
  );

  const setCountLine = useCallback((countId: string, productId: string, counted: number) => {
    setState((prev) => ({
      ...prev,
      stockCounts: prev.stockCounts.map((c) =>
        c.id === countId && c.status === "abierto"
          ? {
              ...c,
              lines: c.lines.map((l) =>
                l.productId === productId ? { ...l, counted: Math.max(0, counted) } : l,
              ),
            }
          : c,
      ),
    }));
  }, []);

  const closeStockCount = useCallback(
    (countId: string, applyAdjustment: boolean, actor?: Actor) => {
      setState((prev) => {
        const count = prev.stockCounts.find((c) => c.id === countId);
        if (!count || count.status !== "abierto") return prev;
        const now = new Date().toISOString();
        const diffs = count.lines.filter((l) => l.counted !== l.expected);
        let products = prev.products;
        let movements = prev.movements;
        if (applyAdjustment && diffs.length > 0) {
          const byId = new Map(diffs.map((l) => [l.productId, l]));
          products = prev.products.map((p) => {
            const line = byId.get(p.id);
            if (!line) return p;
            const delta = line.counted - line.expected;
            return withStock(
              p,
              count.warehouseId,
              Math.max(0, stockOf(p, count.warehouseId) + delta),
            );
          });
          const adjustments: InventoryMovement[] = diffs.map((l, i) => ({
            id: `${makeId("m")}-${i}`,
            productId: l.productId,
            type: "ajuste",
            quantity: l.counted - l.expected,
            at: now,
            refId: count.id,
            user: count.by,
          }));
          movements = [...adjustments, ...prev.movements];
        }
        return {
          ...prev,
          products,
          movements,
          stockCounts: prev.stockCounts.map((c) =>
            c.id === countId
              ? {
                  ...c,
                  status: "cerrado",
                  closedAt: now,
                  adjusted: applyAdjustment && diffs.length > 0,
                }
              : c,
          ),
          audit: [
            auditEntry(
              "estado",
              "Cerró un conteo de inventario",
              "Bodegas",
              `${count.scope === "parcial" ? `Parcial · ${count.group}` : "Inventario general"} · ${warehouseName(count.warehouseId)} · ${diffs.length} diferencia${diffs.length === 1 ? "" : "s"}${applyAdjustment && diffs.length > 0 ? " · ajustado" : ""}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const closeShift = useCallback(
    (
      counted: Record<PaymentMethod, number>,
      nextOpeningCash: number,
      user?: string,
      actor?: Actor,
    ) => {
      setState((prev) => {
        const now = new Date().toISOString();
        // Snapshot del ticket con TODO el catálogo (carta + sexshop + lo que venga).
        const items = shiftItems(prev.movements, prev.products, prev.shift.id);
        const closed: ClosedShift = {
          ...prev.shift,
          closedAt: now,
          counted,
          // El real definitivo del corte es lo contado en el arqueo; el expected
          // queda como lo acumuló el sistema. Ahí nace (o muere) el descuadre.
          cash: { ...prev.shift.cash, real: counted.cash },
          debit: { ...prev.shift.debit, real: counted.debit },
          credit: { ...prev.shift.credit, real: counted.credit },
          transfer: { ...prev.shift.transfer, real: counted.transfer },
          transactions: prev.transactions,
          expenseList: prev.expenses,
          items,
          cuadraturas: prev.cuadraturas,
        };
        const cashD = counted.cash - prev.shift.cash.expected;
        const electronicD =
          counted.debit -
          prev.shift.debit.expected +
          (counted.credit - prev.shift.credit.expected) +
          (counted.transfer - prev.shift.transfer.expected);
        return {
          ...prev,
          pastShifts: [closed, ...prev.pastShifts],
          shift: {
            id: makeId("s"),
            folio: prev.shift.folio + 1,
            user: user ?? prev.shift.user,
            openedAt: now,
            openingCash: nextOpeningCash,
            cash: { real: 0, expected: 0 },
            debit: { real: 0, expected: 0 },
            credit: { real: 0, expected: 0 },
            transfer: { real: 0, expected: 0 },
            expenses: { real: 0, expected: 0 },
            tipsCash: 0,
            tipsCard: 0,
            branchId: "limache",
          },
          transactions: [],
          expenses: [],
          // Los tickets cobrados pertenecen al corte archivado; los pendientes
          // siguen vivos (la estancia continúa en el turno siguiente).
          charges: prev.charges.filter((c) => c.status === "pendiente"),
          cuadraturas: [],
          audit: [
            auditEntry(
              "estado",
              "Cerró el turno",
              "Caja",
              `Folio ${prev.shift.folio} · dif. efectivo ${formatCLP(cashD)} · dif. tarjetas/transferencia ${formatCLP(electronicD)}`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
    },
    [],
  );

  const logAccess = useCallback((actor: Actor, detail?: string) => {
    setState((prev) => ({
      ...prev,
      audit: [auditEntry("acceso", "Inició sesión", "Acceso", detail, actor), ...prev.audit],
    }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = seedState();
    setState({
      ...fresh,
      rooms: seedRoomTimes(fresh.rooms),
      laundry: seedLaundryTimes(fresh.laundry),
    });
  }, []);

  const value: AppStore = {
    ...state,
    hydrated,
    addReservation,
    updateCategory,
    setRoomStatus,
    assignCleaning,
    startCleaning,
    finishCleaning,
    updateCleaningKit,
    reportMaintenance,
    addAnomaly,
    resolveAnomaly,
    addLaundryLoad,
    advanceLaundryLoad,
    takeLaundryLoad,
    addLinenIncident,
    addRoomServiceOrder,
    deliverRoomServiceOrder,
    cancelRoomServiceOrder,
    checkIn,
    checkOut,
    moveRoom,
    logCourtesy,
    removeCourtesy,
    setCourtesyQuantity,
    extendStay,
    payCharge,
    updateStayGuest,
    logCuadratura,
    addTransaction,
    addExpense,
    sellProduct,
    adjustStock,
    addProduct,
    updateProduct,
    addPackage,
    updatePackage,
    sellPackage,
    addDiscount,
    updateDiscount,
    addPromotion,
    updatePromotion,
    updateSettings,
    addUser,
    updateUser,
    addBlacklistEntry,
    removeBlacklistEntry,
    backupNow,
    addShopOrder,
    advanceShopOrder,
    cancelShopOrder,
    addCoupon,
    updateCoupon,
    updateShopSettings,
    addPurchase,
    addProvider,
    addProductCategory,
    closeShift,
    logAccess,
    requestTransfer,
    createDirectTransfer,
    deliverTransfer,
    receiveTransfer,
    rejectTransfer,
    startStockCount,
    setCountLine,
    closeStockCount,
    resetDemo,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore debe usarse dentro de AppStoreProvider");
  return ctx;
}
