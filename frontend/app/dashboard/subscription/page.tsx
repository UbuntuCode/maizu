"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const BANK_DETAILS = {
  bank:           "First National Bank (FNB)",
  account_name:   "Maizu Business Hub (Pty) Ltd",
  account_number: "62812345678",
  branch_code:    "250655",
  reference:      "SUB-{USER_ID}",
};

const PLAN_INFO: Record<string, { name: string; price: number; color: string; features: string[] }> = {
  basic: {
    name:  "Basic",
    price: 99,
    color: "#2563EB",
    features: ["Up to 3 stores", "50 products", "3% commission", "Full analytics", "Promo codes", "Priority support"],
  },
  pro: {
    name:  "Pro",
    price: 299,
    color: C.primary,
    features: ["Unlimited stores", "Unlimited products", "Only 1% commission", "Advanced analytics", "Featured placement", "Priority support"],
  },
};

interface CurrentSub {
  plan:            string;
  plan_info:       { name: string; price: number };
  plan_expires_at: string | null;
  usage:           { stores: number; products: number };
}

function SubscriptionContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { authUser, isLoggedIn, loading: authLoading } = useAuth();

  const planKey = searchParams.get("plan") || "basic";
  const plan    = PLAN_INFO[planKey] || PLAN_INFO.basic;

  const [current,    setCurrent]    = useState<CurrentSub | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [upgrading,  setUpgrading]  = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        const token = await getToken();
        const res   = await fetch(`${BASE}/api/subscriptions/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data  = await res.json();
        if (data.success) setCurrent(data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [isLoggedIn]);

  const handleUpgrade = async () => {
    if (!paymentRef.trim()) { setError("Please enter your payment reference number."); return; }
    setUpgrading(true); setError("");
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/subscriptions/upgrade`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan: planKey, payment_method: "eft", payment_ref: paymentRef }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upgrade failed. Please try again.");
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You will be moved to the Free plan.")) return;
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/subscriptions/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/dashboard");
    } catch { /* silent */ }
  };

  const userShortId = authUser?.id?.slice(0, 8).toUpperCase() || "XXXXXXXX";
  const reference   = `SUB-${userShortId}`;

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loadingâ€¦</div>
      </div>
    );
  }

  /* Success state */
  if (success) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
        <Header />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20 }}>ðŸŽ‰</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.dark, marginBottom: 8 }}>Upgraded to {plan.name}!</div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 28, maxWidth: 280 }}>
            Your account has been upgraded. You now have access to all {plan.name} features.
          </div>
          <button onClick={() => router.push("/dashboard")}
            style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go to Dashboard â†’
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <Header />

      <div style={{ background: C.white, padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark, marginBottom: 8 }}>â€¹ Back</button>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.dark }}>Upgrade to {plan.name}</div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Unlock more stores, products and lower commission</div>
      </div>

      <div style={{ padding: "16px" }}>

        {/* Current plan */}
        {current && (
          <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Your current plan</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: C.gray }}>Plan</span>
              <span style={{ fontWeight: 700, color: C.dark, textTransform: "capitalize" }}>{current.plan}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}>
              <span style={{ color: C.gray }}>Stores used</span>
              <span style={{ fontWeight: 600, color: C.dark }}>{current.usage.stores}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}>
              <span style={{ color: C.gray }}>Products listed</span>
              <span style={{ fontWeight: 600, color: C.dark }}>{current.usage.products}</span>
            </div>
          </div>
        )}

        {/* Plan summary */}
        <div style={{ background: planKey === "basic" ? "#EFF6FF" : "#FFF3EE", borderRadius: 16, padding: "16px", marginBottom: 14, border: `2px solid ${planKey === "basic" ? "#93C5FD" : "#FCA5A5"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: plan.color }}>{plan.name} Plan</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginTop: 2 }}>
                R{plan.price}<span style={{ fontSize: 13, color: C.gray, fontWeight: 500 }}>/month</span>
              </div>
            </div>
            <div style={{ background: plan.color, color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
              {planKey === "pro" ? "Best Value" : "Popular"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {plan.features.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: plan.color, fontSize: 12, fontWeight: 700 }}>âœ“</span>
                <span style={{ fontSize: 12, color: C.dark }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment via EFT */}
        <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>ðŸ¦ Pay via EFT Bank Transfer</div>

          {/* Step 1 - Bank details */}
          <div style={{ background: "#F0F9FF", borderRadius: 12, padding: "14px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0C447C", marginBottom: 10 }}>Step 1 â€” Transfer R{plan.price} to:</div>
            {[
              { label: "Bank",           value: BANK_DETAILS.bank },
              { label: "Account Name",   value: BANK_DETAILS.account_name },
              { label: "Account Number", value: BANK_DETAILS.account_number },
              { label: "Branch Code",    value: BANK_DETAILS.branch_code },
              { label: "Reference",      value: reference, highlight: true },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "1px solid #DBEAFE" }}>
                <span style={{ color: "#64748B" }}>{row.label}</span>
                <span style={{ color: row.highlight ? "#1D4ED8" : "#0C447C", fontWeight: 700, fontFamily: (row.label === "Account Number" || row.label === "Branch Code" || row.label === "Reference") ? "monospace" : "inherit" }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 8, background: "#FEF3C7", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#92400E" }}>
              âš ï¸ Use <strong>{reference}</strong> as your reference so we can match your payment.
            </div>
          </div>

          {/* Step 2 - Enter reference */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 8 }}>
              Step 2 â€” Enter your bank reference / proof of payment
            </div>
            <input
              value={paymentRef}
              onChange={e => setPaymentRef(e.target.value)}
              placeholder="e.g. FNB Ref: 12345678 or transaction ID"
              style={{ width: "100%", padding: "12px 13px", border: `1.5px solid ${error ? "#FCA5A5" : C.border}`, borderRadius: 11, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" }}
            />
            {error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>âš ï¸ {error}</div>}
          </div>

          {/* Upgrade button */}
          <button onClick={handleUpgrade} disabled={upgrading}
            style={{ width: "100%", background: upgrading ? C.grayLight : plan.color, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: upgrading ? "default" : "pointer" }}>
            {upgrading ? "Activatingâ€¦" : `ðŸš€ Activate ${plan.name} Plan â€” R${plan.price}/month`}
          </button>

          <div style={{ textAlign: "center", fontSize: 11, color: C.gray, marginTop: 8 }}>
            Your plan activates immediately after submitting. Cancel anytime.
          </div>
        </div>

        {/* WhatsApp shortcut */}
        <button
          onClick={() => {
            const msg = encodeURIComponent(`Hi Maizu! I've just made an EFT payment for the *${plan.name} Plan* (R${plan.price}/month).\n\nReference: ${reference}\nAccount: ${authUser?.email}\n\nPlease activate my subscription. Thank you! ðŸ™`);
            window.open(`https://wa.me/?text=${msg}`, "_blank");
          }}
          style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}
        >
          ðŸ’¬ Send Payment Proof via WhatsApp
        </button>

        {/* Cancel subscription */}
        {current && current.plan !== "free" && (
          <button onClick={handleCancel}
            style={{ width: "100%", background: "none", color: C.gray, border: `1px solid ${C.border}`, borderRadius: 14, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Cancel my subscription
          </button>
        )}

      </div>
      <BottomNav />
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 13, color: "#6B7280" }}>Loadingâ€¦</div></div>}>
      <SubscriptionContent />
    </Suspense>
  );
}


