"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { AdminNav } from "../page";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Order {
  id:               string;
  buyer_name:       string;
  buyer_email:      string;
  total_amount:     number;
  status:           string;
  delivery_address: string;
  payment_method:   string;
  created_at:       string;
  notes?:           string;
}

const STATUS_CFG: Record<string, { color: string; bg: string; darkBg: string; label: string; icon: string }> = {
  pending:   { color: "#F59E0B", bg: "#FEF3C7", darkBg: "#2D1E00", label: "Pending",   icon: "⏳" },
  confirmed: { color: "#3B82F6", bg: "#DBEAFE", darkBg: "#0F1E3A", label: "Confirmed", icon: "✅" },
  shipped:   { color: "#8B5CF6", bg: "#EDE9FE", darkBg: "#1E1030", label: "Shipped",   icon: "🚚" },
  delivered: { color: "#10B981", bg: "#D1FAE5", darkBg: "#0A2A1A", label: "Delivered", icon: "🎉" },
  cancelled: { color: "#EF4444", bg: "#FEE2E2", darkBg: "#2A0A0A", label: "Cancelled", icon: "❌" },
};

const NEXT: Record<string, string> = {
  pending: "confirmed", confirmed: "shipped", shipped: "delivered",
};

export default function AdminOrdersPage() {
  const router  = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy,         setBusy]         = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || profile?.role !== "admin")) router.push("/");
  }, [authLoading, isLoggedIn, profile, router]);

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token  = await getToken();
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (search)                    params.set("search", search);
      if (statusFilter !== "all")    params.set("status", statusFilter);
      const res  = await fetch(`${BASE}/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setOrders(data.orders); setTotal(data.total); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => {
    if (isLoggedIn && profile?.role === "admin") {
      const t = setTimeout(loadOrders, 300);
      return () => clearTimeout(t);
    }
  }, [loadOrders, isLoggedIn, profile]);

  const updateStatus = async (orderId: string, status: string) => {
    setBusy(orderId);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch { /* silent */ }
    finally { setBusy(null); }
  };

  /* Revenue calc */
  const revenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>⚡ Maizu Admin</div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "#333", color: "#aaa", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>← Back to App</button>
      </div>
      <AdminNav active="/admin/orders" />

      <div style={{ padding: "16px" }}>
        {/* Header stats */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📦 Orders ({total})</div>
          <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>R{revenue.toFixed(2)} total revenue</div>
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
          {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => {
            const count = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
            const cfg   = s !== "all" ? STATUS_CFG[s] : null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ background: statusFilter === s ? (cfg?.color || C.primary) : "#1E1E1E", color: statusFilter === s ? "#fff" : "#888", border: "none", borderRadius: 22, padding: "6px 12px", fontSize: 11, fontWeight: statusFilter === s ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                {cfg?.icon || "📋"} {s === "all" ? "All" : cfg?.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search buyer name or email…"
            style={{ width: "100%", padding: "10px 12px 10px 34px", background: "#1E1E1E", border: "1px solid #333", borderRadius: 10, fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ background: "#1E1E1E", borderRadius: 16, padding: "36px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
            <div style={{ color: "#888", fontSize: 13 }}>{statusFilter === "all" ? "No orders yet" : `No ${statusFilter} orders`}</div>
          </div>
        ) : (
          orders.map(order => {
            const cfg  = STATUS_CFG[order.status] || STATUS_CFG.pending;
            const next = NEXT[order.status];
            const isExpanded = expanded === order.id;

            return (
              <div key={order.id} style={{ background: "#1E1E1E", borderRadius: 14, marginBottom: 10, border: `1px solid ${order.status === "pending" ? "#3A2A00" : "#2A2A2A"}`, overflow: "hidden" }}>
                {/* Main row */}
                <div style={{ padding: "14px", cursor: "pointer" }} onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {order.buyer_name || "Unknown"} · {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#10B981" }}>R{Number(order.total_amount).toFixed(2)}</div>
                      <div style={{ background: cfg.darkBg, color: cfg.color, borderRadius: 20, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>{cfg.icon} {cfg.label}</div>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, background: "#2A2A2A", color: "#888", borderRadius: 20, padding: "2px 8px" }}>
                      {order.payment_method === "eft" ? "🏦 EFT" : order.payment_method === "cod" ? "💵 COD" : "💳 PayFast"}
                    </span>
                    <span style={{ fontSize: 10, color: "#555" }}>{isExpanded ? "▲" : "▾"} details</span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid #2A2A2A" }}>
                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>📧 Buyer</div>
                      <div style={{ fontSize: 12, color: "#ccc" }}>{order.buyer_name} · {order.buyer_email}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>📍 Delivery Address</div>
                      <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>{order.delivery_address}</div>
                    </div>
                    {order.notes && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>📝 Notes</div>
                        <div style={{ fontSize: 12, color: "#ccc" }}>{order.notes}</div>
                      </div>
                    )}

                    {/* Status actions */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {next && (
                        <button onClick={() => updateStatus(order.id, next)} disabled={busy === order.id}
                          style={{ flex: 2, background: STATUS_CFG[next].color, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          {busy === order.id ? "…" : `${STATUS_CFG[next].icon} Mark ${STATUS_CFG[next].label}`}
                        </button>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <button onClick={() => updateStatus(order.id, "cancelled")} disabled={busy === order.id}
                          style={{ flex: 1, background: "#3A1A1A", color: "#EF4444", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          Cancel
                        </button>
                      )}
                      <button onClick={() => router.push(`/orders/${order.id}`)}
                        style={{ background: "#2A2A2A", color: "#aaa", border: "none", borderRadius: 8, padding: "9px 12px", fontSize: 11, cursor: "pointer" }}>
                        👁
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
