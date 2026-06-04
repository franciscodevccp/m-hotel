"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SEED_RESERVATIONS } from "@/data/reservations";
import { ROOMS, SEED_OCCUPIED_MINUTES } from "@/data/rooms";
import { SEED_SHIFT, SEED_TRANSACTIONS } from "@/data/shifts";
import type {
  Reservation,
  Room,
  RoomStatus,
  Shift,
  Transaction,
} from "@/types";

const STORAGE_KEY = "m-motel-state-v1";

interface AppState {
  reservations: Reservation[];
  rooms: Room[];
  transactions: Transaction[];
  shift: Shift;
}

interface AppStore extends AppState {
  /** true una vez leído localStorage en el cliente. */
  hydrated: boolean;
  addReservation: (reservation: Reservation) => void;
  setRoomStatus: (roomId: string, status: RoomStatus) => void;
  addTransaction: (transaction: Transaction) => void;
  resetDemo: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

/** Estado base determinístico (sin horas relativas) para que SSR y cliente coincidan. */
function seedState(): AppState {
  return {
    reservations: SEED_RESERVATIONS,
    rooms: ROOMS,
    transactions: SEED_TRANSACTIONS,
    shift: SEED_SHIFT,
  };
}

/** Siembra occupiedUntil de las ocupadas relativo a la hora actual (solo cliente). */
function seedOccupiedUntil(rooms: Room[]): Room[] {
  const now = Date.now();
  return rooms.map((room) => {
    const minutes = SEED_OCCUPIED_MINUTES[room.id];
    return room.status === "occupied" && minutes != null
      ? { ...room, occupiedUntil: new Date(now + minutes * 60000).toISOString() }
      : room;
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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage en el cliente
        setState(JSON.parse(raw) as AppState);
      } else {
        setState((prev) => ({ ...prev, rooms: seedOccupiedUntil(prev.rooms) }));
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
            }
          : room,
      ),
    }));
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    setState((prev) => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
      shift: { ...prev.shift, countedTotal: prev.shift.countedTotal + transaction.amount },
    }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = seedState();
    setState({ ...fresh, rooms: seedOccupiedUntil(fresh.rooms) });
  }, []);

  const value: AppStore = {
    ...state,
    hydrated,
    addReservation,
    setRoomStatus,
    addTransaction,
    resetDemo,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore debe usarse dentro de AppStoreProvider");
  return ctx;
}
