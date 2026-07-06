"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import BottomNav from "@/components/navigation/BottomNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P    = "#E8401C";
const DARK = "#0F0F0F";
const MUTED= "#71717A";
const BG   = "#F7F7F5";
const WHITE= "#FFFFFF";

function PayFastSuccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const orderId = searchParams.get("order_id");

  const [checking, setChecking] = useState(Boolean(orderId));
  const [confirmed, setConfirmed] = useState(false);
  const [order,     setOrder]    = useState<any>(null);
  const [attempts,  setAttempts] = useState(0);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  /* Poll order status â€” PayFast ITN can take a few seconds to arrive */
  useEffect(() => {
    if (!isLoggedIn || !orderId) return;

    const poll = async () => {
      try {
        const { data: sd } = await supabase.auth.getSession();
        const token = sd.session?.access_token;
        const res   = await fetch(`${BASE}/api/payfast/verify/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success && data.payment_status === "confirmed") {
          setConfirmed(true);
          setOrder(data.order);
          setChecking(false);
        } else if (attempts >= 8) {
          /* After ~16 seconds give up polling */
          setChecking(false);
        } else {
          setAttempts(a => a + 1);
        }
      } catch {
        setChecking(false);
      }
    };

    if (checking) {
      const t = setTimeout(poll, attempts === 0 ? 1000 : 2000);
      return () => clearTimeout(t);
    }
  }, [isLoggedIn, orderId, checking, attempts]);

  /* Loading / polling */
  if (checking) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16, paddingBottom: 90 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFF3EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${P}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>Confirming your paymentâ€¦</div>
        <div style={{ fontSize: 13, color: MUTED, textAlign: "center" }}>This takes just a moment. Please do not close this page.</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <BottomNav />
      </div>
    );
  }

  /* Not confirmed after polling */
  if (!confirmed) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16, paddingBottom: 90 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
          â³
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: DARK }}>Payment processing</div>
        <div style={{ fontSize: 13, color: MUTED, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
          Your payment is being processed by PayFast. Your order will be confirmed within a few minutes. Check your email for confirmation.
        </div>
        <div style={{ display: "flex", gap: 10, flexDirection: "column", width: "100%", maxWidth: 300 }}>
          {orderId && (
            <button onClick={() => router.push(`/orders/${orderId}`)}
              style={{ background: P, color: WHITE, border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              View My Order
            </button>
          )}
          <button onClick={() => router.push("/")}
            style={{ background: WHITE, color: DARK, border: "1px solid #E4E4E7", borderRadius: 14, padding: "12px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Go Home
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* Success */
  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 90 }}>
      {/* Green header */}
      <div style={{ background: "linear-gradient(135deg,#059669,#34D399)", padding: "36px 20px 28px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, margin: "0 auto 14px" }}>
          ðŸŽ‰
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: WHITE, marginBottom: 4 }}>Payment Successful!</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Your order is confirmed and being prepared</div>
      </div>

      <div style={{ padding: "20px 16px" }}>

        {/* Order summary */}
        <div style={{ background: WHITE, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 12 }}>Order Details</div>
          {order && [
            ["Order ID",        `#${order.id.slice(0,8).toUpperCase()}`],
            ["Amount Paid",     `R${Number(order.total_amount).toFixed(2)}`],
            ["Payment Method",  "PayFast (Card / Instant EFT)"],
            ["Status",          "Confirmed"],
          ].map(([l,v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "0.5px solid #E4E4E7" }}>
              <span style={{ color: MUTED }}>{l}</span>
              <span style={{ color: DARK, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* What's next */}
        <div style={{ background: WHITE, borderRadius: 16, padding: "16px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 14 }}>What happens next</div>
          {[
            { n:"1", t:"Vendor confirms",   d:"The vendor reviews and confirms your order." },
            { n:"2", t:"Packed and shipped",d:"Your order gets packed and handed to the courier." },
            { n:"3", t:"Track your parcel", d:"You receive tracking details once dispatched." },
            { n:"4", t:"Delivered",         d:"Your parcel arrives at your delivery address." },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: P, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {orderId && (
            <button onClick={() => router.push(`/orders/${orderId}`)}
              style={{ flex: 2, background: P, color: WHITE, border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              View My Order
            </button>
          )}
          <button onClick={() => router.push("/")}
            style={{ flex: 1, background: WHITE, color: DARK, border: "1px solid #E4E4E7", borderRadius: 14, padding: "13px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Home
          </button>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}

export default function PayFastSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F7F7F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#71717A" }}>Loadingâ€¦</div>
      </div>
    }>
      <PayFastSuccessContent />
    </Suspense>
  );
}

