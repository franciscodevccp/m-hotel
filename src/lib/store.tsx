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
import { SEED_CLEANING_LOG } from "@/data/cleaning";
import { SEED_COUPONS } from "@/data/coupons";
import { freeMachineName, SEED_LAUNDRY, seedLaundryTimes } from "@/data/laundry";
import { LINEN_STOCK, SEED_LINEN_INCIDENTS } from "@/data/linens";
import { SEED_PACKAGES } from "@/data/packages";
import { SEED_DISCOUNTS, SEED_PROMOTIONS } from "@/data/pricingRules";
import { PRODUCT_CATEGORIES, SEED_MOVEMENTS, SEED_PRODUCTS } from "@/data/products";
import { PROVIDERS, SEED_PURCHASES } from "@/data/purchases";
import { SEED_RECEIVABLES } from "@/data/receivables";
import { SEED_RESERVATIONS } from "@/data/reservations";
import { SEED_ROOM_SERVICE } from "@/data/roomService";
import { SEED_SHOP_ORDERS } from "@/data/shopOrders";
import { SEED_STOCK_COUNTS } from "@/data/stockCounts";
import { SEED_TRANSFERS } from "@/data/transfers";
import { WAREHOUSES, warehouseName } from "@/data/warehouses";
import { DEFAULT_SHOP_SETTINGS } from "@/data/shopSettings";
import { ROOMS, SEED_OCCUPIED_MINUTES } from "@/data/rooms";
import { DEFAULT_SETTINGS, SEED_BLACKLIST, SEED_USERS } from "@/data/settings";
import { SEED_EXPENSES, SEED_SHIFT, SEED_TRANSACTIONS } from "@/data/shifts";
import { shiftItems } from "@/lib/cash";
import { formatCLP } from "@/lib/format";
import { makeId } from "@/lib/id";
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
  Category,
  ClosedShift,
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
  Receivable,
  Reservation,
  Room,
  RoomServiceOrder,
  RoomStatus,
  SalesChannel,
  Shift,
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

const STORAGE_KEY = "m-motel-state-v13";

/** Suma a ambas líneas del corte: lo registrado por el sistema es lo que debería
 * haber (deber) y, con el turno abierto, se asume que también está (real). La
 * diferencia solo nace en el arqueo del cierre. */
function addToLine(line: CashLine, amount: number): CashLine {
  return { real: line.real + amount, expected: line.expected + amount };
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

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
  expenses: Expense[];
  products: Product[];
  movements: InventoryMovement[];
  packages: Package[];
  discounts: Discount[];
  promotions: Promotion[];
  anomalies: Anomaly[];
  laundry: LaundryLoad[];
  receivables: Receivable[];
  roomService: RoomServiceOrder[];
  settings: VenueSettings;
  users: StaffUser[];
  blacklist: BlacklistEntry[];
  maintenanceReports: MaintenanceReport[];
  cleaningLog: CleaningLogEntry[];
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
 * Mueve los ítems de un traspaso entre bodegas. Si el origen no alcanza para
 * una línea, la cantidad se recorta al saldo disponible (regla de maqueta) y
 * queda anotado. Devuelve los productos actualizados y lo realmente movido.
 */
function applyTransferToProducts(
  products: Product[],
  items: TransferItem[],
  from: string,
): { products: Product[]; moved: TransferItem[]; shortages: string[] } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const moved: TransferItem[] = [];
  const shortages: string[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || item.quantity <= 0) continue;
    const available = from === "central" ? (product.centralStock ?? 0) : product.stock;
    const quantity = Math.min(item.quantity, Math.max(0, available));
    moved.push({ productId: item.productId, quantity });
    if (quantity < item.quantity) {
      shortages.push(`${product.name} (${quantity} de ${item.quantity})`);
    }
  }
  const movedById = new Map(moved.map((m) => [m.productId, m.quantity]));
  const updated = products.map((p) => {
    const quantity = movedById.get(p.id);
    if (!quantity) return p;
    return from === "central"
      ? { ...p, centralStock: (p.centralStock ?? 0) - quantity, stock: p.stock + quantity }
      : { ...p, stock: p.stock - quantity, centralStock: (p.centralStock ?? 0) + quantity };
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
  startCleaning: (roomId: string, by?: string) => void;
  /** Aseo marca la habitación lista: pasa a disponible y registra la limpieza. */
  finishCleaning: (roomId: string, actor?: Actor) => void;
  /** Aseo reporta mantención: la habitación pasa a mantención y deja una incidencia. */
  reportMaintenance: (roomId: string, note?: string, by?: string, actor?: Actor) => void;
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
  /** Crea una cuenta por cobrar. */
  addReceivable: (receivable: Receivable) => void;
  /** Marca una cuenta como pagada; el monto entra al corte del turno. */
  markReceivablePaid: (id: string, method: PaymentMethod, actor?: Actor) => void;
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
  /** Ampliar estancia: extiende el término y suma la hora adicional al total. */
  extendStay: (roomId: string, extraHours: number, actor?: Actor) => void;
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
    counted: { cash: number; card: number },
    nextOpeningCash: number,
    user?: string,
    actor?: Actor,
  ) => void;
  /** Recepción solicita reposición a bodega central (central → recepción). */
  requestTransfer: (items: TransferItem[], requestedBy: string, note?: string, actor?: Actor) => void;
  /** Encargado/Admin crea un traspaso directo ya entregado (cualquier dirección). */
  createDirectTransfer: (
    from: string,
    to: string,
    items: TransferItem[],
    deliveredBy: string,
    actor?: Actor,
  ) => void;
  /** Entrega una solicitud pendiente: mueve el stock y registra los movimientos. */
  deliverTransfer: (id: string, deliveredBy: string, actor?: Actor) => void;
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
    expenses: SEED_EXPENSES,
    products: SEED_PRODUCTS,
    movements: SEED_MOVEMENTS,
    packages: SEED_PACKAGES,
    discounts: SEED_DISCOUNTS,
    promotions: SEED_PROMOTIONS,
    anomalies: SEED_ANOMALIES,
    laundry: SEED_LAUNDRY,
    receivables: SEED_RECEIVABLES,
    roomService: SEED_ROOM_SERVICE,
    settings: DEFAULT_SETTINGS,
    users: SEED_USERS,
    blacklist: SEED_BLACKLIST,
    maintenanceReports: [],
    cleaningLog: SEED_CLEANING_LOG,
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
          expenses: parsed.expenses ?? prev.expenses,
          products: parsed.products ?? prev.products,
          movements: parsed.movements ?? prev.movements,
          packages: parsed.packages ?? prev.packages,
          discounts: parsed.discounts ?? prev.discounts,
          promotions: parsed.promotions ?? prev.promotions,
          anomalies: parsed.anomalies ?? prev.anomalies,
          laundry: parsed.laundry ?? prev.laundry,
          receivables: parsed.receivables ?? prev.receivables,
          roomService: parsed.roomService ?? prev.roomService,
          settings: parsed.settings ?? prev.settings,
          users: parsed.users ?? prev.users,
          blacklist: parsed.blacklist ?? prev.blacklist,
          maintenanceReports: parsed.maintenanceReports ?? prev.maintenanceReports,
          cleaningLog: parsed.cleaningLog ?? prev.cleaningLog,
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

  const startCleaning = useCallback((roomId: string, by?: string) => {
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId && room.status === "cleaning"
          ? {
              ...room,
              cleaningStartedAt: new Date().toISOString(),
              cleaningAssignee: by ?? room.cleaningAssignee,
            }
          : room,
      ),
    }));
  }, []);

  const finishCleaning = useCallback((roomId: string, actor?: Actor) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room) return prev;
      const minutes = room.cleaningStartedAt
        ? Math.max(0, Math.round((Date.now() - new Date(room.cleaningStartedAt).getTime()) / 60000))
        : undefined;
      const entry: CleaningLogEntry = {
        id: makeId("cl"),
        roomId,
        by: room.cleaningAssignee,
        at: new Date().toISOString(),
        minutes,
      };
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
        cleaningLog: [entry, ...prev.cleaningLog],
        audit: [
          auditEntry(
            "estado",
            "Terminó una limpieza",
            "Limpieza",
            `Habitación ${room.number}${minutes != null ? ` · ${minutes} min` : ""}`,
            actor ?? (room.cleaningAssignee ? { name: room.cleaningAssignee, role: "aseo" } : undefined),
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const reportMaintenance = useCallback((roomId: string, note?: string, by?: string, actor?: Actor) => {
    setState((prev) => {
      const report: MaintenanceReport = {
        id: makeId("mr"),
        roomId,
        note: note?.trim() || undefined,
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

  const addReceivable = useCallback((receivable: Receivable) => {
    setState((prev) => ({ ...prev, receivables: [receivable, ...prev.receivables] }));
  }, []);

  const markReceivablePaid = useCallback((id: string, method: PaymentMethod, actor?: Actor) => {
    setState((prev) => {
      const receivable = prev.receivables.find((c) => c.id === id);
      if (!receivable || receivable.status === "pagada") return prev;
      const line = method === "cash" ? "cash" : "card";
      return {
        ...prev,
        receivables: prev.receivables.map((c) =>
          c.id === id ? { ...c, status: "pagada" } : c,
        ),
        shift: {
          ...prev.shift,
          [line]: addToLine(prev.shift[line], receivable.amount),
        },
        audit: [
          auditEntry(
            "estado",
            "Cobró una cuenta pendiente",
            "Cuentas",
            `${receivable.customer} · ${formatCLP(receivable.amount)}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
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
        return {
          ...prev,
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
                }
              : r,
          ),
          audit: [
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

  const checkOut = useCallback(
    (roomId: string, method?: PaymentMethod, user?: string, actor?: Actor) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room) return prev;
      let transactions = prev.transactions;
      let shift = prev.shift;
      // El check-out puede gatillar un pago en caja, que entra al corte del turno.
      if (method && room.stay && room.stay.total > 0) {
        const tx: Transaction = {
          id: makeId("t"),
          roomId,
          method,
          amount: room.stay.total,
          at: new Date().toISOString(),
          user: user ?? prev.shift.user,
          branchId: "limache",
        };
        const line = method === "cash" ? "cash" : "card";
        transactions = [tx, ...transactions];
        shift = { ...shift, [line]: addToLine(shift[line], tx.amount) };
      }
      const cobro =
        method && room.stay && room.stay.total > 0
          ? ` · cobro ${formatCLP(room.stay.total)} ${PAYMENT_LABEL[method].toLowerCase()}`
          : "";
      return {
        ...prev,
        transactions,
        shift,
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
              cleaningSince: new Date().toISOString(),
            };
          if (r.id === toId)
            return { ...r, status: "occupied", occupiedUntil: from.occupiedUntil, stay: from.stay };
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
      return {
        ...prev,
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
      // Efectivo entra al efectivo del corte; tarjeta y transferencia, a tarjeta.
      const line = transaction.method === "cash" ? "cash" : "card";
      return {
        ...prev,
        transactions: [transaction, ...prev.transactions],
        shift: {
          ...prev.shift,
          [line]: addToLine(prev.shift[line], transaction.amount),
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
    (items: TransferItem[], requestedBy: string, note?: string, actor?: Actor) => {
      setState((prev) => {
        const clean = items.filter((it) => it.quantity > 0);
        if (clean.length === 0) return prev;
        const transfer: Transfer = {
          id: makeId("tr"),
          from: "central",
          to: "recepcion",
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
              `${clean.length} producto${clean.length === 1 ? "" : "s"} · central → recepción`,
              actor,
            ),
            ...prev.audit,
          ],
        };
      });
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
        );
        const transfer: Transfer = {
          id: makeId("tr"),
          from,
          to,
          items: moved,
          status: "entregado",
          requestedBy: deliveredBy,
          deliveredBy,
          note: shortages.length
            ? `Cantidades recortadas al saldo disponible: ${shortages.join(", ")}.`
            : undefined,
          createdAt: now,
          deliveredAt: now,
          branchId: "limache",
        };
        const movements: InventoryMovement[] = moved
          .filter((m) => m.quantity > 0)
          .map((m, i) => ({
            id: `${makeId("m")}-${i}`,
            productId: m.productId,
            type: "traspaso",
            quantity: m.quantity,
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

  const deliverTransfer = useCallback((id: string, deliveredBy: string, actor?: Actor) => {
    setState((prev) => {
      const transfer = prev.transfers.find((t) => t.id === id);
      if (!transfer || transfer.status !== "solicitado") return prev;
      const now = new Date().toISOString();
      const { products, moved, shortages } = applyTransferToProducts(
        prev.products,
        transfer.items,
        transfer.from,
      );
      const movements: InventoryMovement[] = moved
        .filter((m) => m.quantity > 0)
        .map((m, i) => ({
          id: `${makeId("m")}-${i}`,
          productId: m.productId,
          type: "traspaso",
          quantity: m.quantity,
          at: now,
          refId: transfer.id,
          user: deliveredBy,
        }));
      const note = shortages.length
        ? `${transfer.note ? `${transfer.note} ` : ""}Cantidades recortadas al saldo disponible: ${shortages.join(", ")}.`
        : transfer.note;
      return {
        ...prev,
        products,
        movements: [...movements, ...prev.movements],
        transfers: prev.transfers.map((t) =>
          t.id === id
            ? { ...t, status: "entregado", deliveredBy, deliveredAt: now, items: moved, note }
            : t,
        ),
        audit: [
          auditEntry(
            "estado",
            "Entregó una solicitud de bodega",
            "Bodegas",
            `Solicitud ${transfer.id} · ${moved.length} producto${moved.length === 1 ? "" : "s"} · ${warehouseName(transfer.from)} → ${warehouseName(transfer.to)}`,
            actor,
          ),
          ...prev.audit,
        ],
      };
    });
  }, []);

  const receiveTransfer = useCallback((id: string, receivedBy: string, actor?: Actor) => {
    setState((prev) => {
      const transfer = prev.transfers.find((t) => t.id === id);
      if (!transfer || transfer.status !== "entregado") return prev;
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
            const expected = warehouseId === "central" ? (p.centralStock ?? 0) : p.stock;
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
            return count.warehouseId === "central"
              ? { ...p, centralStock: Math.max(0, (p.centralStock ?? 0) + delta) }
              : { ...p, stock: Math.max(0, p.stock + delta) };
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
      counted: { cash: number; card: number },
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
          countedCash: counted.cash,
          countedCard: counted.card,
          // El real definitivo del corte es lo contado en el arqueo; el expected
          // queda como lo acumuló el sistema. Ahí nace (o muere) el descuadre.
          cash: { ...prev.shift.cash, real: counted.cash },
          card: { ...prev.shift.card, real: counted.card },
          transactions: prev.transactions,
          expenseList: prev.expenses,
          items,
        };
        const cashD = counted.cash - prev.shift.cash.expected;
        const cardD = counted.card - prev.shift.card.expected;
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
            card: { real: 0, expected: 0 },
            expenses: { real: 0, expected: 0 },
            tipsCash: 0,
            tipsCard: 0,
            branchId: "limache",
          },
          transactions: [],
          expenses: [],
          audit: [
            auditEntry(
              "estado",
              "Cerró el turno",
              "Caja",
              `Folio ${prev.shift.folio} · dif. efectivo ${formatCLP(cashD)} · dif. tarjeta ${formatCLP(cardD)}`,
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
    reportMaintenance,
    addAnomaly,
    resolveAnomaly,
    addLaundryLoad,
    advanceLaundryLoad,
    takeLaundryLoad,
    addLinenIncident,
    addReceivable,
    markReceivablePaid,
    addRoomServiceOrder,
    deliverRoomServiceOrder,
    cancelRoomServiceOrder,
    checkIn,
    checkOut,
    moveRoom,
    extendStay,
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
