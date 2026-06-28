"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C } from "@/utils/constants";
import BottomNav from "@/components/navigation/BottomNav";

export default function PaymentSuccessPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const orderId      = searchParams.get("order_id");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/orders/${orderId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderId, router]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", paddingBottom: 80 }}>

      {/* Success animation */}
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 24 }}>
        🎉
      </div>

      <div style={{ fontSize: 26, fontWeight: 900, color: C.dark, marginBottom: 10, textAlign: "center" }}>
        Payment Successful!
      </div>

      <div style={{ fontSize: 14, color: C.gray, textAlign: "center", lineHeight: 1.7, marginBottom: 28, maxWidth: 300 }}>
        Your payment has been confirmed and your order is being processed. The vendor will prepare your items shortly.
      </div>

      {/* Order ID */}
      {orderId && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 20px", marginBottom: 24, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>Order Reference</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, fontFamily: "monospace" }}>
            #{orderId.slice(0, 8).toUpperCase()}
          </div>
        </div>
      )}

      {/* What happens next */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", width: "100%", maxWidth: 380, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>What happens next?</div>
        {[
          { emoji: "✅", step: "Order confirmed",     desc: "Vendor has been notified" },
          { emoji: "📦", step: "Items prepared",      desc: "Vendor prepares your order" },
          { emoji: "🚚", step: "Out for delivery",    desc: "Your order is on the way" },
          { emoji: "🎉", step: "Delivered!",          desc: "Enjoy your purchase" },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 20 }}>{s.emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{s.step}</div>
              <div style={{ fontSize: 11, color: C.gray }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Auto redirect */}
      <div style={{ fontSize: 12, color: C.gray, marginBottom: 16 }}>
        Redirecting to your order in {countdown}s…
      </div>

      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 380 }}>
        <button onClick={() => router.push(`/orders/${orderId}`)} style={{ flex: 1, background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          View Order
        </button>
        <button onClick={() => router.push("/stores")} style={{ flex: 1, background: "#fff", color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Keep Shopping
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
