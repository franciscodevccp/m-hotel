"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface Visitor {
  mode: "guest" | "registered";
  name?: string;
  email?: string;
}

interface VisitorStore {
  visitor: Visitor | null;
  hydrated: boolean;
  /** Forzar la apertura del modal (p. ej. un invitado que quiere registrarse). */
  promptOpen: boolean;
  setGuest: () => void;
  setRegistered: (name: string, email: string) => void;
  signOut: () => void;
  openPrompt: () => void;
  closePrompt: () => void;
}

const VisitorContext = createContext<VisitorStore | null>(null);
const KEY = "m-motel-visitor-v1";

function persist(v: Visitor | null) {
  try {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  } catch {
    // Ignorar (modo privado / sin cuota).
  }
}

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Visitor;
        if (parsed && (parsed.mode === "guest" || parsed.mode === "registered")) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage
          setVisitor(parsed);
        }
      }
    } catch {
      // Sin localStorage seguimos sin visitante (mostrará la bienvenida).
    }
    setHydrated(true);
  }, []);

  const setGuest = useCallback(() => {
    const v: Visitor = { mode: "guest" };
    setVisitor(v);
    persist(v);
    setPromptOpen(false);
  }, []);

  const setRegistered = useCallback((name: string, email: string) => {
    const v: Visitor = {
      mode: "registered",
      name: name.trim() || undefined,
      email: email.trim() || undefined,
    };
    setVisitor(v);
    persist(v);
    setPromptOpen(false);
  }, []);

  const signOut = useCallback(() => {
    setVisitor(null);
    persist(null);
  }, []);

  const openPrompt = useCallback(() => setPromptOpen(true), []);
  const closePrompt = useCallback(() => setPromptOpen(false), []);

  const value = useMemo<VisitorStore>(
    () => ({ visitor, hydrated, promptOpen, setGuest, setRegistered, signOut, openPrompt, closePrompt }),
    [visitor, hydrated, promptOpen, setGuest, setRegistered, signOut, openPrompt, closePrompt],
  );

  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>;
}

export function useVisitor(): VisitorStore {
  const ctx = useContext(VisitorContext);
  if (!ctx) throw new Error("useVisitor debe usarse dentro de VisitorProvider");
  return ctx;
}
