"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { C } from "@/utils/constants";
import { ordersApi, type Order } from "@/utils/api";
import BottomNav from "@/components/navigation/BottomNav";

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

const STATUS_INFO: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  pending:   { icon: "⏳", label: "Order Placed",   color: "#D97706", bg: "#FEF3C7" },
  confirmed: { icon: "✅", label: "Confirmed",       color: "#059669", bg: "#D1FAE5" },
  shipped:   { icon: "🚚", label: "Out for Delivery",color: "#2563EB", bg: "#DBEAFE" },
  delivered: { icon: "🎉", label: "Delivered",       color: "#059669", bg: "#D1FAE5" },
  cancelled: { icon: "❌", label: "Cancelled",       color: "#DC2626", bg: "#FEE2E2" },
};

/* CONTENT — uses useSearchParams() and must live inside <Suspense> */
function OrderDetailContent() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const orderId      = params.id as string;
  const isNew        = searchParams.get("success") === "true";

  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!orderId) return;
    ordersApi.getOne(orderId)
      .then(o => setOrder(o))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loading order…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20, gap: 16 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 14, color: C.dark }}>{error || "Order not found."}</div>
        <button onClick={() => router.push("/")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Go Home
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.pending;
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      {/* Success banner (shown right after placing) */}
      {isNew && (
        <div style={{ background: `linear-gradient(135deg, #059669, #10B981)`, padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Order Placed!</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
            Your order has been received. The vendor will confirm it shortly.
          </div>
        </div>
      )}

      {/* Header */}
      {!isNew && (
        <div style={{ height: 60, background: "#fff", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark }}>‹</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>Order Details</div>
          <div style={{ width: 40 }} />
        </div>
      )}

      <div style={{ padding: "16px" }}>

        {/* Status card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: statusInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              {statusInfo.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{statusInfo.label}</div>
              <div style={{ fontSize: 11, color: C.gray }}>Order #{orderId.slice(0, 8).toUpperCase()}</div>
            </div>
            <div style={{ marginLeft: "auto", background: statusInfo.bg, color: statusInfo.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>

          {/* Progress bar (only for active orders) */}
          {order.status !== "cancelled" && (
            <div style={{ position: "relative", marginTop: 8 }}>
              {/* Track line */}
              <div style={{ position: "absolute", top: 13, left: "12.5%", right: "12.5%", height: 3, background: C.border, borderRadius: 2 }} />
              <div style={{ position: "absolute", top: 13, left: "12.5%", height: 3, background: C.primary, borderRadius: 2, width: `${(currentStep / 3) * 75}%`, transition: "width 0.5s" }} />
              {/* Dots */}
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: i <= currentStep ? C.primary : C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, zIndex: 1 }}>
                      {i < currentStep ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 9, color: i <= currentStep ? C.primary : C.gray, fontWeight: i <= currentStep ? 600 : 400, textAlign: "center", textTransform: "capitalize" }}>
                      {s === "pending" ? "Placed" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delivery address */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>📍 Delivery Address</div>
          <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.7 }}>{order.delivery_address}</div>
        </div>

        {/* Order info */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Order Info</div>
          {[
            ["Order ID",   orderId.slice(0, 8).toUpperCase()],
            ["Placed on",  new Date(order.created_at).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })],
            ["Total",      `R${Number(order.total_amount).toFixed(2)}`],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.gray }}>{l}</span>
              <span style={{ color: C.dark, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => router.push("/stores")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Continue Shopping
          </button>
          <button onClick={() => router.push("/dashboard")} style={{ background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Go to Dashboard
          </button>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}

/* DEFAULT EXPORT — wraps content in Suspense */
export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: C.bg }} />}>
      <OrderDetailContent />
    </Suspense>
  );
}
