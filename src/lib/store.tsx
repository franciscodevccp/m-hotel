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
import { DEFAULT_SHOP_SETTINGS } from "@/data/shopSettings";
import { ROOMS, SEED_OCCUPIED_MINUTES } from "@/data/rooms";
import { DEFAULT_SETTINGS, SEED_BLACKLIST, SEED_USERS } from "@/data/settings";
import { SEED_EXPENSES, SEED_SHIFT, SEED_TRANSACTIONS } from "@/data/shifts";
import { makeId } from "@/lib/id";
import { extraHourFor, priceFor } from "@/lib/pricing";
import { SHOP_NEXT } from "@/lib/shop";
import type {
  Anomaly,
  AuditEntry,
  BlacklistEntry,
  Category,
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
  Transaction,
  VenueSettings,
} from "@/types";

const STORAGE_KEY = "m-motel-state-v12";

interface AppState {
  reservations: Reservation[];
  categories: Category[];
  rooms: Room[];
  transactions: Transaction[];
  shift: Shift;
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
}

interface AppStore extends AppState {
  /** true una vez leído localStorage en el cliente. */
  hydrated: boolean;
  addReservation: (reservation: Reservation) => void;
  /** Actualiza las tarifas (y datos) de una categoría. Es la fuente del booking. */
  updateCategory: (category: Category) => void;
  setRoomStatus: (roomId: string, status: RoomStatus) => void;
  /** Asigna (o reasigna) el personal de aseo a una habitación en limpieza. */
  assignCleaning: (roomId: string, staff: string) => void;
  /** Aseo empieza la limpieza de una habitación (queda "en proceso"). */
  startCleaning: (roomId: string, by?: string) => void;
  /** Aseo marca la habitación lista: pasa a disponible y registra la limpieza. */
  finishCleaning: (roomId: string) => void;
  /** Aseo reporta mantención: la habitación pasa a mantención y deja una incidencia. */
  reportMaintenance: (roomId: string, note?: string, by?: string) => void;
  /** Registra una anomalía/incidente del turno. */
  addAnomaly: (anomaly: Anomaly) => void;
  /** Marca una anomalía como resuelta. */
  resolveAnomaly: (id: string) => void;
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
  markReceivablePaid: (id: string, method: PaymentMethod) => void;
  /** Crea un pedido de room service (queda en preparación). */
  addRoomServiceOrder: (order: RoomServiceOrder) => void;
  /** Entrega el pedido: baja stock de cada ítem y cobra el total al corte. */
  deliverRoomServiceOrder: (id: string, user?: string) => void;
  /** Cancela un pedido en preparación. */
  cancelRoomServiceOrder: (id: string) => void;
  /** Check-in: ocupa la habitación con un bloque y registra la estancia. */
  checkIn: (roomId: string, dayType: DayType, duration: Duration, guestName?: string) => void;
  /** Check-out: libera la habitación (queda en limpieza) y opcionalmente cobra la estancia. */
  checkOut: (roomId: string, method?: PaymentMethod, user?: string) => void;
  /** Cambio de pieza: traslada la estancia en curso a otra habitación disponible. */
  moveRoom: (fromId: string, toId: string) => void;
  /** Ampliar estancia: extiende el término y suma la hora adicional al total. */
  extendStay: (roomId: string, extraHours: number) => void;
  addTransaction: (transaction: Transaction) => void;
  /** Registra un gasto del turno: lo suma a expenses.real (baja la utilidad). */
  addExpense: (expense: Expense) => void;
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
  ) => void;
  /** Ajuste manual de stock (+/-): deja un movimiento de ingreso o ajuste. */
  adjustStock: (productId: string, delta: number, user?: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  addPackage: (pkg: Package) => void;
  updatePackage: (pkg: Package) => void;
  /** Vende un paquete: baja el stock de cada ítem y cobra el combo al corte. */
  sellPackage: (packageId: string, user?: string) => void;
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
  advanceShopOrder: (id: string) => void;
  /** Cancela un pedido de la tienda online (si no está entregado/cancelado). */
  cancelShopOrder: (id: string) => void;
  /** Crea un cupón de descuento de la tienda. */
  addCoupon: (coupon: Coupon) => void;
  /** Actualiza un cupón (datos o activación). */
  updateCoupon: (coupon: Coupon) => void;
  /** Actualiza los ajustes de la tienda online. */
  updateShopSettings: (patch: Partial<ShopSettings>) => void;
  /** Registra un ingreso de stock (lista de compra): sube stock y deja movimientos. */
  addPurchase: (purchase: Purchase) => void;
  /** Agrega un proveedor (con RUT) a la lista. */
  addProvider: (provider: Provider) => void;
  /** Agrega una categoría de producto a la lista. */
  addProductCategory: (name: string) => void;
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

  const addReservation = useCallback((reservation: Reservation) => {
    setState((prev) => ({ ...prev, reservations: [reservation, ...prev.reservations] }));
  }, []);

  const updateCategory = useCallback((category: Category) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === category.id ? category : c)),
    }));
  }, []);

  const setRoomStatus = useCallback((roomId: string, status: RoomStatus) => {
    setState((prev) => ({
      ...prev,
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

  const finishCleaning = useCallback((roomId: string) => {
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
      };
    });
  }, []);

  const reportMaintenance = useCallback((roomId: string, note?: string, by?: string) => {
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
      };
    });
  }, []);

  const addAnomaly = useCallback((anomaly: Anomaly) => {
    setState((prev) => ({ ...prev, anomalies: [anomaly, ...prev.anomalies] }));
  }, []);

  const resolveAnomaly = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      anomalies: prev.anomalies.map((a) => (a.id === id ? { ...a, status: "resuelta" } : a)),
    }));
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

  const markReceivablePaid = useCallback((id: string, method: PaymentMethod) => {
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
          [line]: { ...prev.shift[line], real: prev.shift[line].real + receivable.amount },
        },
      };
    });
  }, []);

  const addRoomServiceOrder = useCallback((order: RoomServiceOrder) => {
    setState((prev) => ({ ...prev, roomService: [order, ...prev.roomService] }));
  }, []);

  const deliverRoomServiceOrder = useCallback((id: string, user?: string) => {
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
        return item ? { ...p, stock: p.stock - item.quantity } : p;
      });
      return {
        ...prev,
        products,
        movements: [...movements, ...prev.movements],
        // El pedido entregado se cobra al efectivo del corte del turno.
        shift: { ...prev.shift, cash: { ...prev.shift.cash, real: prev.shift.cash.real + order.total } },
        roomService: prev.roomService.map((o) =>
          o.id === id ? { ...o, status: "entregado", deliveredAt: at } : o,
        ),
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
    (roomId: string, dayType: DayType, duration: Duration, guestName?: string) => {
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
                    checkInAt: checkInAt.toISOString(),
                  },
                }
              : r,
          ),
        };
      });
    },
    [],
  );

  const checkOut = useCallback((roomId: string, method?: PaymentMethod, user?: string) => {
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
        };
        const line = method === "cash" ? "cash" : "card";
        transactions = [tx, ...transactions];
        shift = { ...shift, [line]: { ...shift[line], real: shift[line].real + tx.amount } };
      }
      return {
        ...prev,
        transactions,
        shift,
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

  const moveRoom = useCallback((fromId: string, toId: string) => {
    setState((prev) => {
      const from = prev.rooms.find((r) => r.id === fromId);
      const to = prev.rooms.find((r) => r.id === toId);
      if (!from || !to || to.status !== "available") return prev;
      return {
        ...prev,
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

  const extendStay = useCallback((roomId: string, extraHours: number) => {
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
      };
    });
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    setState((prev) => {
      // Efectivo entra al efectivo del corte; tarjeta y transferencia, a tarjeta.
      const line = transaction.method === "cash" ? "cash" : "card";
      return {
        ...prev,
        transactions: [transaction, ...prev.transactions],
        shift: {
          ...prev.shift,
          [line]: { ...prev.shift[line], real: prev.shift[line].real + transaction.amount },
        },
      };
    });
  }, []);

  const addExpense = useCallback((expense: Expense) => {
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
      shift: {
        ...prev.shift,
        expenses: { ...prev.shift.expenses, real: prev.shift.expenses.real + expense.amount },
      },
    }));
  }, []);

  const sellProduct = useCallback(
    (
      productId: string,
      quantity: number,
      channel: SalesChannel,
      refId?: string,
      user?: string,
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
            ? { ...prev.shift, cash: { ...prev.shift.cash, real: prev.shift.cash.real + saleAmount } }
            : prev.shift;
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === productId ? { ...p, stock: p.stock - quantity } : p,
          ),
          movements: [movement, ...prev.movements],
          shift,
        };
      });
    },
    [],
  );

  const adjustStock = useCallback((productId: string, delta: number, user?: string) => {
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
      };
    });
  }, []);

  const addProduct = useCallback((product: Product) => {
    setState((prev) => ({ ...prev, products: [product, ...prev.products] }));
  }, []);

  const updateProduct = useCallback((product: Product) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === product.id ? product : p)),
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

  const sellPackage = useCallback((packageId: string, user?: string) => {
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
        return item ? { ...p, stock: p.stock - item.quantity } : p;
      });
      return {
        ...prev,
        products,
        movements: [...movements, ...prev.movements],
        // El combo se cobra al precio del paquete y entra al efectivo del corte.
        shift: { ...prev.shift, cash: { ...prev.shift.cash, real: prev.shift.cash.real + pkg.price } },
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

  const advanceShopOrder = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shopOrders: prev.shopOrders.map((o) => {
        if (o.id !== id) return o;
        const next = SHOP_NEXT[o.status];
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
    }));
  }, []);

  const cancelShopOrder = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shopOrders: prev.shopOrders.map((o) =>
        o.id === id && o.status !== "entregado" && o.status !== "cancelado"
          ? { ...o, status: "cancelado" }
          : o,
      ),
    }));
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

  const addPurchase = useCallback((purchase: Purchase) => {
    setState((prev) => {
      const movements: InventoryMovement[] = purchase.items.map((item, i) => ({
        id: `${makeId("m")}-${i}`,
        productId: item.productId,
        type: "ingreso",
        quantity: item.quantity,
        at: purchase.at,
        refId: purchase.id,
        user: purchase.user,
      }));
      const products = prev.products.map((p) => {
        const item = purchase.items.find((it) => it.productId === p.id);
        return item ? { ...p, stock: p.stock + item.quantity } : p;
      });
      return {
        ...prev,
        products,
        movements: [...movements, ...prev.movements],
        purchases: [purchase, ...prev.purchases],
      };
    });
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
    resetDemo,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore debe usarse dentro de AppStoreProvider");
  return ctx;
}
