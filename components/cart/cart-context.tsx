"use client";

import * as React from "react";

export interface CartItem {
  id: string;
  code: string;
  priceCents: number;
  sizeM2: number | null;
  segment: string | null;
  tipo?: string | null;
  sector: string | null; // ASA
  positionLabel?: string | null; // Localização
}

interface CartContextValue {
  items: CartItem[];
  totalCents: number;
  has: (id: string) => boolean;
  toggle: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fieb-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignora
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = React.useMemo<CartContextValue>(() => {
    const totalCents = items.reduce((acc, i) => acc + i.priceCents, 0);
    return {
      items,
      totalCents,
      has: (id) => items.some((i) => i.id === id),
      toggle: (item) =>
        setItems((prev) =>
          prev.some((i) => i.id === item.id)
            ? prev.filter((i) => i.id !== item.id)
            : [...prev, item],
        ),
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
