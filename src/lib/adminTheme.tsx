"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "m-motel-admin-theme-v1";

export type AdminTheme = "light" | "dark";

interface AdminThemeStore {
  theme: AdminTheme;
  toggle: () => void;
}

const AdminThemeContext = createContext<AdminThemeStore | null>(null);

/**
 * Tema del panel admin. Claro por defecto (pedido del cliente: operación
 * diaria más legible); el oscuro de marca queda a un toque. El sitio público
 * no participa: conserva siempre el tema oscuro.
 */
export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage en el cliente
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {
      // Sin localStorage seguimos con el claro por defecto.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignorar errores de cuota o modo privado.
      }
      return next;
    });
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div className={cn("admin-ui min-h-dvh", theme === "light" && "admin-light")}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeStore {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme debe usarse dentro de AdminThemeProvider");
  return ctx;
}
