"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── Types ──────────────────────────────────────────────────── */
export interface WishlistItem {
  wishlist_id:   string;
  product_id:    string;
  name:          string;
  price:         number;
  image_urls:    string[];
  stock_quantity: number;
  category?:     string;
  is_trending:   boolean;
  like_count:    number;
  view_count:    number;
  store_id:      string;
  store_name:    string;
  store_logo?:   string;
  saved_at:      string;
}

interface WishlistContextValue {
  items:        WishlistItem[];
  totalItems:   number;
  savedIds:     Set<string>;
  loading:      boolean;
  toggle:       (productId: string) => Promise<boolean>;
  isSaved:      (productId: string) => boolean;
  remove:       (productId: string) => void;
  refresh:      () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────── */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [items,   setItems]   = useState<WishlistItem[]>([]);
  const [savedIds,setSavedIds]= useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  /* Load full wishlist */
  const refresh = useCallback(async () => {
    if (!isLoggedIn) { setItems([]); setSavedIds(new Set()); return; }
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data  = await res.json();
      if (data.success) {
        setItems(data.items);
        setSavedIds(new Set(data.items.map((i: WishlistItem) => i.product_id)));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [isLoggedIn]);

  useEffect(() => { refresh(); }, [refresh]);

  /* Toggle — optimistic update */
  const toggle = useCallback(async (productId: string): Promise<boolean> => {
    const wasSaved = savedIds.has(productId);

    /* Optimistic update */
    setSavedIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(productId);
      else          next.add(productId);
      return next;
    });

    if (wasSaved) {
      setItems(prev => prev.filter(i => i.product_id !== productId));
    }

    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/wishlist/toggle`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ product_id: productId }),
      });
      const data  = await res.json();

      if (!data.success) throw new Error();

      /* If newly saved — refresh to get full product data */
      if (data.saved) await refresh();

      return data.saved as boolean;
    } catch {
      /* Revert optimistic update */
      setSavedIds(prev => {
        const next = new Set(prev);
        if (wasSaved) next.add(productId);
        else          next.delete(productId);
        return next;
      });
      return wasSaved;
    }
  }, [savedIds, refresh]);

  const remove = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
    setSavedIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
  }, []);

  const isSaved = useCallback((productId: string) => savedIds.has(productId), [savedIds]);

  return (
    <WishlistContext.Provider value={{
      items, totalItems: items.length, savedIds,
      loading, toggle, isSaved, remove, refresh,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────── */
export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
