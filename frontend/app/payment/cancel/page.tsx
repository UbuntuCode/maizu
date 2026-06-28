"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C } from "@/utils/constants";
import BottomNav from "@/components/navigation/BottomNav";

export default function PaymentCancelPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const orderId      = searchParams.get("order_id");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", paddingBottom: 80 }}>

      <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 24 }}>
        😔
      </div>

      <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 10, textAlign: "center" }}>
        Payment Cancelled
      </div>

      <div style={{ fontSize: 14, color: C.gray, textAlign: "center", lineHeight: 1.7, marginBottom: 28, maxWidth: 300 }}>
        Your payment was cancelled. No money has been charged. Your cart items are still available.
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", width: "100%", maxWidth: 380, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>What would you like to do?</div>
        <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.7 }}>
          • Try paying again with a different payment method<br />
          • Go back to your cart and review your order<br />
          • Contact support if you had an issue
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 380 }}>
        <button onClick={() => router.push("/checkout")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Try Again
        </button>
        <button onClick={() => router.push("/cart")} style={{ background: "#fff", color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Back to Cart
        </button>
        <button onClick={() => router.push("/stores")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
          Continue Shopping
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
