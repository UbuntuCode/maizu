"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const PLANS = [
  {
    key:       "free",
    name:      "Free",
    price:     0,
    period:    "",
    badge:     null,
    color:     C.gray,
    bg:        "#F9FAFB",
    border:    C.border,
    desc:      "Perfect for getting started",
    features: [
      { text: "1 store",                      ok: true  },
      { text: "Up to 10 products",            ok: true  },
      { text: "5% commission per sale",        ok: true  },
      { text: "Basic analytics",               ok: true  },
      { text: "WhatsApp sharing",              ok: true  },
      { text: "Promo codes",                   ok: false },
      { text: "Full analytics dashboard",      ok: false },
      { text: "Featured store placement",      ok: false },
      { text: "Priority support",              ok: false },
    ],
  },
  {
    key:       "basic",
    name:      "Basic",
    price:     99,
    period:    "/month",
    badge:     "Most Popular",
    color:     "#2563EB",
    bg:        "#EFF6FF",
    border:    "#93C5FD",
    desc:      "For growing entrepreneurs",
    features: [
      { text: "Up to 3 stores",               ok: true  },
      { text: "Up to 50 products",             ok: true  },
      { text: "3% commission per sale",        ok: true  },
      { text: "Full analytics dashboard",      ok: true  },
      { text: "WhatsApp sharing",              ok: true  },
      { text: "Promo codes",                   ok: true  },
      { text: "Priority support",              ok: true  },
      { text: "Featured store placement",      ok: false },
      { text: "Unlimited everything",          ok: false },
    ],
  },
  {
    key:       "pro",
    name:      "Pro",
    price:     299,
    period:    "/month",
    badge:     "Best Value",
    color:     C.primary,
    bg:        "#FFF3EE",
    border:    "#FCA5A5",
    desc:      "For serious sellers",
    features: [
      { text: "Unlimited stores",              ok: true  },
      { text: "Unlimited products",            ok: true  },
      { text: "Only 1% commission",            ok: true  },
      { text: "Advanced analytics",            ok: true  },
      { text: "WhatsApp sharing",              ok: true  },
      { text: "Promo codes",                   ok: true  },
      { text: "Featured store placement",      ok: true  },
      { text: "Priority support",              ok: true  },
      { text: "Custom store branding",         ok: true  },
    ],
  },
];

/* ── Savings calculator ─────────────────────────────────────── */
const SavingsCalc = () => {
  const [revenue, setRevenue] = useState(5000);

  const freeFee   = revenue * 0.05;
  const basicFee  = revenue * 0.03 + 99;
  const proFee    = revenue * 0.01 + 299;
  const basicSave = freeFee - basicFee;
  const proSave   = freeFee - proFee;

  return (
    <div style={{ background: C.white, borderRadius: 18, padding: "20px 16px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 4 }}>💡 Savings Calculator</div>
      <div style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}>See how much you save on commission</div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>Monthly Revenue</label>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>R{revenue.toLocaleString()}</span>
        </div>
        <input type="range" min={1000} max={50000} step={500} value={revenue}
          onChange={e => setRevenue(Number(e.target.value))}
          style={{ width: "100%", accentColor: C.primary }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.gray, marginTop: 2 }}>
          <span>R1,000</span><span>R50,000</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { plan: "Free",  cost: freeFee,  save: 0,        color: C.gray },
          { plan: "Basic", cost: basicFee, save: basicSave, color: "#2563EB" },
          { plan: "Pro",   cost: proFee,   save: proSave,   color: C.primary },
        ].map(row => (
          <div key={row.plan} style={{ background: "#F9FAFB", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.gray, marginBottom: 4 }}>{row.plan}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: row.color }}>R{row.cost.toFixed(0)}</div>
            <div style={{ fontSize: 9, color: C.gray }}>monthly cost</div>
            {row.save > 0 && (
              <div style={{ fontSize: 9, fontWeight: 700, color: "#059669", marginTop: 3 }}>
                Save R{row.save.toFixed(0)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PricingPage() {
  const router   = useRouter();
  const { isLoggedIn } = useAuth();
  const [annual, setAnnual] = useState(false);

  const getPrice = (price: number) => {
    if (price === 0) return "Free";
    const p = annual ? Math.floor(price * 10) : price;
    return `R${p}`;
  };

  const getPeriod = (key: string) => {
    if (key === "free") return "";
    return annual ? "/year" : "/month";
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <Header />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${C.primary},#FF8C61)`, padding: "28px 16px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 6 }}>Simple, Transparent Pricing</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 20 }}>
            Start free. Upgrade when you&apos;re ready. Cancel anytime.
          </div>
          {/* Annual toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Monthly</span>
            <div onClick={() => setAnnual(prev => !prev)}
              style={{ width: 44, height: 24, borderRadius: 12, background: annual ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: annual ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: annual ? C.primary : "#fff", transition: "left 0.2s" }} />
            </div>
            <span style={{ fontSize: 12, color: "#fff", fontWeight: annual ? 700 : 400 }}>
              Annual <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "1px 7px", fontSize: 10 }}>Save 17%</span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>

        {/* Plan cards */}
        {PLANS.map(plan => (
          <div key={plan.key} style={{ background: plan.key === "basic" ? "#EFF6FF" : C.white, borderRadius: 20, padding: "20px 16px", marginBottom: 14, border: `2px solid ${plan.key === "basic" ? "#93C5FD" : C.border}`, position: "relative", overflow: "hidden" }}>

            {/* Popular badge */}
            {plan.badge && (
              <div style={{ position: "absolute", top: 16, right: 16, background: plan.key === "basic" ? "#2563EB" : C.primary, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                {plan.badge}
              </div>
            )}

            {/* Plan header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: plan.color, marginBottom: 2 }}>{plan.name}</div>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 10 }}>{plan.desc}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: C.dark }}>{getPrice(plan.price)}</span>
                <span style={{ fontSize: 13, color: C.gray }}>{getPeriod(plan.key)}</span>
              </div>
              {annual && plan.price > 0 && (
                <div style={{ fontSize: 11, color: "#059669", fontWeight: 600, marginTop: 2 }}>
                  Billed R{Math.floor(plan.price * 10)}/year · Save R{plan.price * 2}/year
                </div>
              )}
            </div>

            {/* Features */}
            <div style={{ marginBottom: 16 }}>
              {plan.features.map(f => (
                <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: f.ok ? (plan.key === "basic" ? "#DBEAFE" : plan.key === "pro" ? "#FFF3EE" : "#F3F4F6") : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10 }}>
                    {f.ok ? <span style={{ color: plan.key === "basic" ? "#2563EB" : plan.key === "pro" ? C.primary : "#059669" }}>✓</span> : <span style={{ color: "#D1D5DB" }}>✕</span>}
                  </div>
                  <span style={{ fontSize: 12, color: f.ok ? C.dark : "#D1D5DB", fontWeight: f.ok ? 500 : 400 }}>{f.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                if (plan.key === "free") { router.push(isLoggedIn ? "/dashboard" : "/register"); }
                else { router.push(`/dashboard/subscription?plan=${plan.key}`); }
              }}
              style={{
                width:        "100%",
                background:   plan.key === "free" ? C.white : plan.key === "basic" ? "#2563EB" : C.primary,
                color:        plan.key === "free" ? C.dark : "#fff",
                border:       plan.key === "free" ? `1.5px solid ${C.border}` : "none",
                borderRadius: 14,
                padding:      "13px 0",
                fontSize:     14,
                fontWeight:   700,
                cursor:       "pointer",
              }}
            >
              {plan.key === "free" ? "Get Started Free" : `Upgrade to ${plan.name} — ${getPrice(plan.price)}${getPeriod(plan.key)}`}
            </button>
          </div>
        ))}

        {/* Savings calculator */}
        <SavingsCalc />

        {/* FAQ */}
        <div style={{ background: C.white, borderRadius: 18, padding: "20px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 14 }}>Frequently Asked Questions</div>
          {[
            { q: "Can I cancel anytime?", a: "Yes — cancel at any time. You keep your plan until the end of the billing period, then move to Free." },
            { q: "What happens to my stores if I downgrade?", a: "Your stores stay active but you won't be able to create new ones beyond the Free plan limit. Existing products remain." },
            { q: "How do I pay?", a: "Currently via EFT bank transfer. Once PayFast is activated you can pay by card or Instant EFT." },
            { q: "What is the commission?", a: "We take a small % of each sale: Free = 5%, Basic = 3%, Pro = 1%. This is deducted when you receive payment." },
          ].map(faq => (
            <div key={faq.q} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Q: {faq.q}</div>
              <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
