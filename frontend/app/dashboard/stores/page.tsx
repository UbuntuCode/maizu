"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import WaybillInput from "@/components/ui/WaybillInput";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Store {
  id:             string;
  name:           string;
  category:       string;
  logo_url?:      string;
  banner_url?:    string;
  is_active:      boolean;
  is_trending:    boolean;
  product_count:  number;
  follower_count: number;
  rating:         number;
  created_at:     string;
}

interface Order {
  id:             string;
  status:         string;
  total_amount:   number;
  buyer_name?:    string;
  waybill_number?:string;
  courier_name?:  string;
  created_at:     string;
}

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "#D97706", bg: "#FEF3C7", label: "Pending"   },
  confirmed: { color: "#2563EB", bg: "#DBEAFE", label: "Confirmed" },
  shipped:   { color: "#7C3AED", bg: "#EDE9FE", label: "Shipped"   },
  delivered: { color: "#059669", bg: "#D1FAE5", label: "Delivered" },
  cancelled: { color: "#DC2626", bg: "#FEE2E2", label: "Cancelled" },
};

/* ── Order card with waybill action ────────────────────────── */
function OrderCard({ order, onWaybillSaved }: { order: Order; onWaybillSaved: (id: string, waybill: string) => void }) {
  const [showWaybill, setShowWaybill] = useState(false);
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, fontFamily: "monospace" }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
            {order.buyer_name || "Buyer"} · {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>R{Number(order.total_amount).toFixed(2)}</div>
          <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>{cfg.label}</span>
        </div>
      </div>

      {order.waybill_number ? (
        <div style={{ background: "#F0F9FF", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#1D4ED8", fontWeight: 600 }}>
          🚚 Waybill: {order.waybill_number}
        </div>
      ) : order.status === "confirmed" ? (
        <button onClick={() => setShowWaybill(true)}
          style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          🚚 Add Waybill
        </button>
      ) : null}

      {showWaybill && (
        <WaybillInput
          orderId={order.id}
          orderRef={order.id.slice(0, 8).toUpperCase()}
          onSaved={(waybill) => { onWaybillSaved(order.id, waybill); setShowWaybill(false); }}
          onClose={() => setShowWaybill(false)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD — MY STORES
══════════════════════════════════════════════════════════════ */
export default function DashboardStoresPage() {
  const router = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();

  const [stores,        setStores]        = useState<Store[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [storeOrders,   setStoreOrders]   = useState<Record<string, Order[]>>({});
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/vendors/my/stores`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setStores(data.stores || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadStores();
  }, [isLoggedIn, loadStores]);

  const toggleStoreOrders = async (storeId: string) => {
    if (expandedStore === storeId) {
      setExpandedStore(null);
      return;
    }
    setExpandedStore(storeId);

    if (!storeOrders[storeId]) {
      setLoadingOrders(storeId);
      try {
        const token = await getToken();
        const res   = await fetch(`${BASE}/api/orders/store/${storeId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        if (data.success) {
          setStoreOrders(prev => ({ ...prev, [storeId]: data.orders || [] }));
        }
      } catch { /* silent */ }
      finally { setLoadingOrders(null); }
    }
  };

  const handleWaybillSaved = (orderId: string, waybill: string) => {
    setStoreOrders(prev => {
      const updated = { ...prev };
      for (const storeId in updated) {
        updated[storeId] = updated[storeId].map(o =>
          o.id === orderId ? { ...o, waybill_number: waybill, status: "shipped" } : o
        );
      }
      return updated;
    });
  };

  if (authLoading || loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loading your stores…</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", fontSize: 20, color: C.dark, cursor: "pointer" }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>My Stores</div>
          <div style={{ fontSize: 11, color: C.gray }}>{stores.length} store{stores.length !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => router.push("/dashboard/create-store")}
          style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          + New Store
        </button>
      </div>

      <div style={{ padding: "16px" }}>
        {stores.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>No stores yet</div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 20 }}>Open your first store and start selling on Maizu.</div>
            <button onClick={() => router.push("/dashboard/stores/create")}
              style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Open a Store
            </button>
          </div>
        ) : (
          stores.map(store => (
            <div key={store.id} style={{ background: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
              {/* Store header */}
              <div style={{ padding: "14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: store.logo_url ? "transparent" : "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {store.logo_url ? <img src={store.logo_url} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{store.name}</div>
                    {store.is_trending && <span style={{ fontSize: 9, background: "#FFF3EF", color: C.primary, borderRadius: 20, padding: "1px 6px", fontWeight: 700 }}>🔥</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray }}>{store.category} · {store.product_count} products</div>
                </div>
                <span style={{ background: store.is_active ? "#D1FAE5" : "#FEE2E2", color: store.is_active ? "#059669" : "#DC2626", borderRadius: 20, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>
                  {store.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: C.border }}>
                {[
                  { label: "Followers", val: store.follower_count },
                  { label: "Rating",    val: Number(store.rating).toFixed(1) },
                  { label: "Products",  val: store.product_count },
                ].map(s => (
                  <div key={s.label} style={{ background: "#fff", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: C.gray }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, padding: "10px 14px" }}>
                <button onClick={() => router.push(`/dashboard/stores/${store.id}/edit`)}
                  style={{ flex: 1, background: "#F3F4F6", color: C.dark, border: "none", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Edit Store
                </button>
                <button onClick={() => router.push(`/dashboard/products?store=${store.id}`)}
                  style={{ flex: 1, background: "#F3F4F6", color: C.dark, border: "none", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Products
                </button>
                <button onClick={() => toggleStoreOrders(store.id)}
                  style={{ flex: 1, background: expandedStore === store.id ? C.primary : "#F3F4F6", color: expandedStore === store.id ? "#fff" : C.dark, border: "none", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Orders {expandedStore === store.id ? "▲" : "▾"}
                </button>
              </div>

              {/* Orders panel */}
              {expandedStore === store.id && (
                <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  {loadingOrders === store.id ? (
                    <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: C.gray }}>Loading orders…</div>
                  ) : (storeOrders[store.id]?.length || 0) === 0 ? (
                    <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: C.gray }}>No orders yet for this store.</div>
                  ) : (
                    storeOrders[store.id].map(order => (
                      <OrderCard key={order.id} order={order} onWaybillSaved={handleWaybillSaved} />
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
