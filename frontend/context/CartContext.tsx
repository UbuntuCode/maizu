"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export interface CartItem {
  product_id:   string;
  name:         string;
  price:        number;
  image_url?:   string;
  store_id:     string;
  store_name:   string;
  stock_quantity: number;
  quantity:     number;
}

interface CartContextValue {
  items:       CartItem[];
  totalItems:  number;
  totalPrice:  number;
  addItem:     (item: Omit<CartItem, "quantity">) => void;
  removeItem:  (product_id: string) => void;
  updateQty:   (product_id: string, quantity: number) => void;
  clearCart:   () => void;
  isInCart:    (product_id: string) => boolean;
  getQty:      (product_id: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "maizu_cart";

/* â”€â”€ Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* Load from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe localStorage hydration; a lazy initializer would cause a server/client hydration mismatch. Proper fix is useSyncExternalStore (future refactor).
      if (stored) setItems(JSON.parse(stored));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  /* Save to localStorage on every change */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* ignore */ }
  }, [items, hydrated]);

  /* Add item â€” if already in cart, increment quantity */
  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const exists = prev.find(i => i.product_id === newItem.product_id);
      if (exists) {
        return prev.map(i =>
          i.product_id === newItem.product_id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock_quantity) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }, []);

  /* Remove item completely */
  const removeItem = useCallback((product_id: string) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id));
  }, []);

  /* Update quantity â€” remove if 0 */
  const updateQty = useCallback((product_id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product_id !== product_id));
    } else {
      setItems(prev =>
        prev.map(i =>
          i.product_id === product_id
            ? { ...i, quantity: Math.min(quantity, i.stock_quantity) }
            : i
        )
      );
    }
  }, []);

  /* Clear entire cart */
  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const isInCart = useCallback((product_id: string) =>
    items.some(i => i.product_id === product_id), [items]);

  const getQty = useCallback((product_id: string) =>
    items.find(i => i.product_id === product_id)?.quantity || 0, [items]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, totalItems, totalPrice,
      addItem, removeItem, updateQty, clearCart,
      isInCart, getQty,
    }}>
      {children}
    </CartContext.Provider>
  );
}

/* â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

