"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AdminArea, Role, SessionUser } from "@/types";

const STORAGE_KEY = "m-motel-session-v1";
const AREA_KEY = "m-motel-area-v1";

/** Usuarios simulados del panel. Cada rol abre una vista distinta. */
export const SESSION_USERS: Record<Role, SessionUser> = {
  recepcion: {
    role: "recepcion",
    name: "Recepcionista",
    roleLabel: "Recepción",
    context: "Turno noche",
  },
  admin: {
    role: "admin",
    name: "Administrador",
    roleLabel: "Administración",
    context: "Acceso total",
  },
  aseo: {
    role: "aseo",
    name: "Aseo",
    roleLabel: "Aseo",
    context: "Turno limpieza",
  },
  encargado: {
    role: "encargado",
    name: "Encargado",
    roleLabel: "Encargado",
    context: "Inventario y compras",
  },
  dueno: {
    role: "dueno",
    name: "Rodrigo",
    roleLabel: "Dueño",
    context: "Solo lectura",
  },
};

interface SessionStore {
  user: SessionUser | null;
  /** Área activa del administrador (motel / tienda online). Parte en motel. */
  area: AdminArea;
  /** true una vez leído localStorage en el cliente. */
  hydrated: boolean;
  /** true si el perfil activo es de solo lectura (rol Dueño). */
  readOnly: boolean;
  login: (role: Role) => void;
  logout: () => void;
  setArea: (area: AdminArea) => void;
}

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [area, setAreaState] = useState<AdminArea>("motel");
  const [hydrated, setHydrated] = useState(false);

  // Restaurar la sesión y el área guardadas en el cliente.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const role = JSON.parse(raw) as Role;
        if (
          role === "recepcion" ||
          role === "admin" ||
          role === "aseo" ||
          role === "encargado" ||
          role === "dueno"
        ) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage en el cliente
          setUser(SESSION_USERS[role]);
        }
      }
      const areaRaw = localStorage.getItem(AREA_KEY);
      if (areaRaw === "motel" || areaRaw === "tienda") {
        setAreaState(areaRaw);
      }
    } catch {
      // Si localStorage no está disponible, seguimos sin sesión.
    }
    setHydrated(true);
  }, []);

  const login = useCallback((role: Role) => {
    setUser(SESSION_USERS[role]);
    setAreaState("motel"); // al entrar, el admin parte en el motel
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(role));
      localStorage.removeItem(AREA_KEY);
    } catch {
      // Ignorar errores de cuota o modo privado.
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAreaState("motel");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AREA_KEY);
    } catch {
      // Ignorar.
    }
  }, []);

  const setArea = useCallback((next: AdminArea) => {
    setAreaState(next);
    try {
      localStorage.setItem(AREA_KEY, next);
    } catch {
      // Ignorar.
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{ user, area, hydrated, readOnly: user?.role === "dueno", login, logout, setArea }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionStore {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
