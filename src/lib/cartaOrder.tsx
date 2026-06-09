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

export interface CartaItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type CartaProductInput = Omit<CartaItem, "quantity">;

interface CartaOrderStore {
  items: CartaItem[];
  hydrated: boolean;
  count: number;
  total: number;
  add: (product: CartaProductInput, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  qtyOf: (productId: string) => number;
}

const CartaOrderContext = createContext<CartaOrderStore | null>(null);
const KEY = "m-motel-carta-order-v1";

export function CartaOrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartaItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartaItem[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage
          setItems(parsed);
        }
      }
    } catch {
      // Sin localStorage seguimos con el pedido vacío.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Ignorar errores de cuota.
    }
  }, [items, hydrated]);

  const add = useCallback((product: CartaProductInput, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.productId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const qtyOf = useCallback(
    (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0,
    [items],
  );

  const value = useMemo<CartaOrderStore>(
    () => ({ items, hydrated, count, total, add, setQty, remove, clear, qtyOf }),
    [items, hydrated, count, total, add, setQty, remove, clear, qtyOf],
  );

  return <CartaOrderContext.Provider value={value}>{children}</CartaOrderContext.Provider>;
}

export function useCartaOrder(): CartaOrderStore {
  const ctx = useContext(CartaOrderContext);
  if (!ctx) throw new Error("useCartaOrder debe usarse dentro de CartaOrderProvider");
  return ctx;
}
