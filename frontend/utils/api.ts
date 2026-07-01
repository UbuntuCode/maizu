// ─────────────────────────────────────────────────────
// utils/api.ts — all Express backend calls
// ─────────────────────────────────────────────────────
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── Types ─────────────────────────────────────────── */
export interface UserProfile {
  id:          string;
  full_name:   string;
  email:       string;
  role:        "buyer" | "vendor" | "admin";
  avatar_url?: string;
  bio?:        string;
}

export interface Store {
  id:              string;
  owner_id:        string;
  name:            string;
  description?:    string;
  category:        string;
  floor_location?: string;
  logo_url?:       string;
  banner_url?:     string;
  rating:          number;
  total_reviews:   number;
  follower_count:  number;
  product_count:   number;
  is_active:       boolean;
  is_trending:     boolean;
  owner_name?:     string;
}

export interface Product {
  id:             string;
  store_id:       string;
  name:           string;
  description?:   string;
  price:          number;
  category?:      string;
  stock_quantity: number;
  image_urls:     string[];
  like_count:     number;
  view_count:     number;
  is_trending:    boolean;
  store_name?:    string;
}

export interface Order {
  id:               string;
  buyer_id:         string;
  buyer_name?:      string;
  buyer_email?:     string;
  total_amount:     number;
  delivery_address: string;
  notes?:           string;
  status:           "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at:       string;
  updated_at?:      string;
}

/* ── Base fetch ────────────────────────────────────── */
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data as T;
};

const requestForm = async <T>(path: string, method: string, body: FormData): Promise<T> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data as T;
};

/* ── STORES ────────────────────────────────────────── */
export const storesApi = {
  getAll: async (params?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.category && params.category !== "All") q.set("category", params.category);
    if (params?.search)  q.set("search",  params.search);
    if (params?.limit)   q.set("limit",   String(params.limit));
    if (params?.offset)  q.set("offset",  String(params.offset));
    const res = await request<{ success: boolean; stores: Store[] }>(`/api/vendors?${q}`);
    return res.stores;
  },

  getOne: async (id: string) => {
    const res = await request<{ success: boolean; store: Store }>(`/api/vendors/${id}`);
    return res.store;
  },

  getMyStores: async () => {
    const res = await request<{ success: boolean; stores: Store[] }>("/api/vendors/my/stores");
    return res.stores;
  },

  /* NEW: get stores the current user follows */
  getMyFollows: async () => {
    const res = await request<{ success: boolean; stores: Store[] }>("/api/vendors/my/follows");
    return res.stores;
  },

  create: async (data: FormData) => {
    const res = await requestForm<{ success: boolean; store: Store }>("/api/vendors", "POST", data);
    return res.store;
  },

  update: async (id: string, data: FormData) => {
    const res = await requestForm<{ success: boolean; store: Store }>(`/api/vendors/${id}`, "PUT", data);
    return res.store;
  },

  delete: async (id: string) => request(`/api/vendors/${id}`, { method: "DELETE" }),

  follow: async (id: string) => {
    const res = await request<{ success: boolean; following: boolean }>(
      `/api/vendors/${id}/follow`, { method: "POST" }
    );
    return res.following;
  },
};

/* ── PRODUCTS ──────────────────────────────────────── */
export const productsApi = {
  getAll: async (params?: { store_id?: string; category?: string; search?: string; trending?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.store_id) q.set("store_id", params.store_id);
    if (params?.category) q.set("category", params.category);
    if (params?.search)   q.set("search",   params.search);
    if (params?.trending) q.set("trending", "true");
    const res = await request<{ success: boolean; products: Product[] }>(`/api/products?${q}`);
    return res.products;
  },

  getOne: async (id: string) => {
    const res = await request<{ success: boolean; product: Product }>(`/api/products/${id}`);
    return res.product;
  },

  create: async (data: FormData) => {
    const res = await requestForm<{ success: boolean; product: Product }>("/api/products", "POST", data);
    return res.product;
  },

  update: async (id: string, data: Partial<Product>) => {
    const res = await request<{ success: boolean; product: Product }>(
      `/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }
    );
    return res.product;
  },

  delete: async (id: string) => request(`/api/products/${id}`, { method: "DELETE" }),

  like: async (id: string) => {
    const res = await request<{ success: boolean; liked: boolean }>(
      `/api/products/${id}/like`, { method: "POST" }
    );
    return res.liked;
  },
};

/* ── ORDERS ────────────────────────────────────────── */
export const ordersApi = {
  place: async (
    items: { product_id: string; quantity: number }[],
    delivery_address: string,
    notes?: string
  ) => {
    const res = await request<{ success: boolean; order: Order }>(
      "/api/orders",
      { method: "POST", body: JSON.stringify({ items, delivery_address, notes }) }
    );
    return res.order;
  },

  getMyOrders: async () => {
    const res = await request<{ success: boolean; orders: Order[] }>("/api/orders/my-orders");
    return res.orders;
  },

  getOne: async (id: string) => {
    const res = await request<{ success: boolean; order: Order }>(`/api/orders/${id}`);
    return res.order;
  },

  getStoreOrders: async (storeId: string) => {
    const res = await request<{ success: boolean; orders: Order[] }>(
      `/api/orders/store/${storeId}`
    );
    return res.orders;
  },

  updateStatus: async (orderId: string, status: Order["status"]) => {
    const res = await request<{ success: boolean; order: Order }>(
      `/api/orders/${orderId}/status`,
      { method: "PUT", body: JSON.stringify({ status }) }
    );
    return res.order;
  },
};