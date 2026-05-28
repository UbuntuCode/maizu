"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { ordersApi, type Order } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const STATUS_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  pending:   { color: "#D97706", bg: "#FEF3C7", icon: "⏳" },
  confirmed: { color: "#059669", bg: "#D1FAE5", icon: "✅" },
  shipped:   { color: "#2563EB", bg: "#DBEAFE", icon: "🚚" },
  delivered: { color: "#059669", bg: "#D1FAE5", icon: "🎉" },
  cancelled: { color: "#DC2626", bg: "#FEE2E2", icon: "❌" },
};

export default function OrdersPage() {
  const router  = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [busy,   setBusy]       = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    ordersApi.getMyOrders()
      .then(o => setOrders(o))
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [isLoggedIn]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <Header />

      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 3 }}>My Orders</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 18 }}>Track your purchases</div>

        {busy ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: 13 }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>No orders yet</div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>Your orders will appear here once you shop</div>
            <button onClick={() => router.push("/stores")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map(order => {
              const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  style={{ background: C.white, borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 2 }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray }}>
                      {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>R{Number(order.total_amount).toFixed(2)}</div>
                    <div style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600, marginTop: 4 }}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
