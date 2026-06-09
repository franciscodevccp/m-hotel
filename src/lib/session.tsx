"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Role, SessionUser } from "@/types";

const STORAGE_KEY = "m-motel-session-v1";

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
};

interface SessionStore {
  user: SessionUser | null;
  /** true una vez leído localStorage en el cliente. */
  hydrated: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restaurar la sesión guardada en el cliente.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const role = JSON.parse(raw) as Role;
        if (role === "recepcion" || role === "admin") {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage en el cliente
          setUser(SESSION_USERS[role]);
        }
      }
    } catch {
      // Si localStorage no está disponible, seguimos sin sesión.
    }
    setHydrated(true);
  }, []);

  const login = useCallback((role: Role) => {
    setUser(SESSION_USERS[role]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(role));
    } catch {
      // Ignorar errores de cuota o modo privado.
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar.
    }
  }, []);

  return (
    <SessionContext.Provider value={{ user, hydrated, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionStore {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
