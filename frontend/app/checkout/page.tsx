"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import BottomNav from "@/components/navigation/BottomNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── UPDATE THESE WITH YOUR REAL BANK DETAILS ── */
const BANK_DETAILS = {
  bank:           "First National Bank (FNB)",
  account_name:   "Maizu Business Hub (Pty) Ltd",
  account_number: "62812345678",
  branch_code:    "250655",
  account_type:   "Cheque / Current",
};

const SA_PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Free State",
];

/* ── Promo result type ──────────────────────────────────────── */
interface PromoResult {
  id:              string;
  code:            string;
  description?:    string;
  discount_type:   "percent" | "fixed";
  discount_value:  number;
  discount_amount: number;
  final_total:     number;
}

export default function CheckoutPage() {
  const router  = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { authUser, isLoggedIn, loading } = useAuth();

  const [step,  setStep]  = useState<1 | 2 | 3>(1);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");
  const formRef           = useRef<HTMLFormElement>(null);

  /* Promo state */
  const [promoInput,   setPromoInput]   = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult,  setPromoResult]  = useState<PromoResult | null>(null);
  const [promoError,   setPromoError]   = useState("");

  const [address, setAddress] = useState({
    full_name:   "", phone:        "",
    street:      "", suburb:       "",
    city:        "", province:     "",
    postal_code: "", notes:        "",
  });

  const [pfData, setPfData] = useState<Record<string, string> | null>(null);
  const [pfUrl,  setPfUrl]  = useState("");

  /* Show bank details inline when EFT selected */
  const [showBankDetails, setShowBankDetails] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn)        { router.push("/login");  return; }
      if (items.length === 0) { router.push("/stores"); return; }
    }
  }, [loading, isLoggedIn, items.length, router]);

  /* Auto-submit PayFast form */
  useEffect(() => {
    if (pfData && pfUrl && formRef.current) formRef.current.submit();
  }, [pfData, pfUrl]);

  /* ── Pricing calculations ── */
  const subtotal      = totalPrice;
  const discount      = promoResult?.discount_amount || 0;
  const discountedSub = Math.max(0, subtotal - discount);
  const serviceFee    = discountedSub * 0.05;
  const grandTotal    = discountedSub + serviceFee;

  const setAddr = (k: keyof typeof address) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setAddress(prev => ({ ...prev, [k]: e.target.value }));

  const validateAddress = (): string | null => {
    if (!address.full_name.trim())   return "Full name is required.";
    if (!address.phone.trim())       return "Phone number is required.";
    if (!address.street.trim())      return "Street address is required.";
    if (!address.city.trim())        return "City is required.";
    if (!address.province)           return "Province is required.";
    if (!address.postal_code.trim()) return "Postal code is required.";
    return null;
  };

  const getDeliveryAddress = () => [
    address.full_name, address.phone, address.street,
    address.suburb, address.city, address.province, address.postal_code,
  ].filter(Boolean).join(", ");

  /* ── Apply promo code ── */
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) { setPromoError("Enter a promo code."); return; }
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res   = await fetch(`${BASE}/api/promos/validate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code: promoInput.trim(), order_total: subtotal }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPromoResult(data.promo);
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : "Invalid promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoResult(null);
    setPromoInput("");
    setPromoError("");
  };

  /* ── Pay with PayFast ── */
  const handlePayWithPayFast = async () => {
    setBusy(true); setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res   = await fetch(`${BASE}/api/payment/create`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          items:            items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          delivery_address: getDeliveryAddress(),
          notes:            address.notes,
          promo_id:         promoResult?.id,
          discount_amount:  discount,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Payment setup failed.");
      clearCart();
      setPfUrl(data.payfast_url);
      setPfData(data.payfast_data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setBusy(false);
    }
  };

  /* ── Place order (COD / EFT) ── */
  const handlePlaceOrder = async (paymentMethod: "cod" | "eft") => {
    setBusy(true); setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res   = await fetch(`${BASE}/api/orders`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          items:            items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          delivery_address: getDeliveryAddress(),
          notes:            address.notes,
          promo_id:         promoResult?.id,
          discount_amount:  discount,
          payment_method:   paymentMethod,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to place order.");
      clearCart();

      if (paymentMethod === "eft") {
        /* Redirect to EFT success page with bank details */
        router.push(`/payment/eft-success?order_id=${data.order.id}&total=${grandTotal.toFixed(2)}`);
      } else {
        router.push(`/orders/${data.order.id}?success=true`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
      setBusy(false);
    }
  };

  /* ── Progress bar ── */
  const Progress = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
      {[{ n: 1, label: "Delivery" }, { n: 2, label: "Review" }, { n: 3, label: "Payment" }].map((s, idx) => (
        <React.Fragment key={s.n}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= s.n ? C.primary : C.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span style={{ fontSize: 10, color: step >= s.n ? C.primary : C.gray, fontWeight: step >= s.n ? 600 : 400 }}>{s.label}</span>
          </div>
          {idx < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? C.primary : C.border, marginBottom: 14 }} />}
        </React.Fragment>
      ))}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 13px",
    border: `1.5px solid ${C.border}`, borderRadius: 11,
    fontSize: 14, outline: "none", color: C.dark,
    boxSizing: "border-box", background: "#FAFAFA",
  };

  if (loading || items.length === 0) return null;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      {/* Hidden PayFast form */}
      {pfData && pfUrl && (
        <form ref={formRef} action={pfUrl} method="POST" style={{ display: "none" }}>
          {Object.entries(pfData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      {/* Header */}
      <div style={{ height: 60, background: "#fff", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", position: "sticky", top: 0, zIndex: 200 }}>
        <button onClick={() => step > 1 ? setStep(s => (s - 1) as 1 | 2 | 3) : router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>Checkout</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: "20px 16px" }}>
        <Progress />

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B" }}>
            {error}
          </div>
        )}

        {/* ── STEP 1: Delivery ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>📍 Delivery Address</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Full Name *</label>
                <input value={address.full_name} onChange={setAddr("full_name")} placeholder="Kofi Mensah" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Phone Number *</label>
                <input value={address.phone} onChange={setAddr("phone")} placeholder="071 234 5678" type="tel" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Street Address *</label>
                <input value={address.street} onChange={setAddr("street")} placeholder="12 Main Street" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Suburb</label>
                <input value={address.suburb} onChange={setAddr("suburb")} placeholder="Sandton" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>City *</label>
                <input value={address.city} onChange={setAddr("city")} placeholder="Johannesburg" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Province *</label>
                <select value={address.province} onChange={setAddr("province")} style={inputStyle}>
                  <option value="">Select…</option>
                  {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Postal Code *</label>
                <input value={address.postal_code} onChange={setAddr("postal_code")} placeholder="2196" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Delivery Notes</label>
                <textarea value={address.notes} onChange={setAddr("notes") as React.ChangeEventHandler<HTMLTextAreaElement>} placeholder="Gate code, landmark…" rows={2} style={{ ...inputStyle, resize: "none" }} />
              </div>
            </div>
            <button onClick={() => {
              const err = validateAddress();
              if (err) { setError(err); return; }
              setError(""); setStep(2);
            }} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
              Continue to Review →
            </button>
          </div>
        )}

        {/* ── STEP 2: Review + Promo ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 14 }}>🛒 Review Your Order</div>

            {/* Items */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px", marginBottom: 14 }}>
              {items.map(item => (
                <div key={item.product_id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "#F3F4F6", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📦"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: C.gray }}>{item.store_name} · qty {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>R{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                🏷️ Promo Code
                {promoResult && <span style={{ background: "#E1F5EE", color: "#085041", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>Applied ✓</span>}
              </div>
              {promoResult ? (
                <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#065F46", fontFamily: "monospace" }}>{promoResult.code}</div>
                      <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                        {promoResult.discount_type === "percent" ? `${promoResult.discount_value}% off` : `R${promoResult.discount_value} off`}
                        {promoResult.description && ` · ${promoResult.description}`}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46", marginTop: 4 }}>You save R{promoResult.discount_amount.toFixed(2)} 🎉</div>
                    </div>
                    <button onClick={removePromo} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6B7280", padding: 4 }}>✕</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={promoInput} onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Enter promo code e.g. SAVE20"
                      style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontWeight: 600, letterSpacing: 1 }} />
                    <button onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()}
                      style={{ background: promoLoading || !promoInput.trim() ? "#F3F4F6" : C.primary, color: promoLoading || !promoInput.trim() ? C.gray : "#fff", border: "none", borderRadius: 11, padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: promoLoading || !promoInput.trim() ? "default" : "pointer", whiteSpace: "nowrap" }}>
                      {promoLoading ? "…" : "Apply"}
                    </button>
                  </div>
                  {promoError && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>❌ {promoError}</div>}
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Price Breakdown</div>
              {[
                { label: "Subtotal",    value: `R${subtotal.toFixed(2)}`,   show: true,          color: undefined },
                { label: `Discount (${promoResult?.code})`, value: `-R${discount.toFixed(2)}`, show: !!promoResult, color: "#059669" },
                { label: "Delivery",   value: "Free",                       show: true,          color: undefined },
                { label: "Service fee",value: `R${serviceFee.toFixed(2)}`,  show: true,          color: undefined },
              ].filter(r => r.show).map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.gray }}>{row.label}</span>
                  <span style={{ color: row.color || C.dark, fontWeight: row.color ? 700 : 400 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 800, fontSize: 15 }}>
                <span style={{ color: C.dark }}>Total</span>
                <div style={{ textAlign: "right" }}>
                  {promoResult && <div style={{ fontSize: 11, color: C.gray, textDecoration: "line-through" }}>R{(subtotal + subtotal * 0.05).toFixed(2)}</div>}
                  <span style={{ color: C.primary }}>R{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(3)} style={{ width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Continue to Payment →
            </button>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 16 }}>💳 Choose Payment Method</div>

            {/* Total */}
            <div style={{ background: promoResult ? "#F0FDF4" : C.softOrange, border: promoResult ? "1.5px solid #86EFAC" : "none", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray }}>Total to pay</div>
                {promoResult && <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>🏷️ {promoResult.code} applied — you save R{discount.toFixed(2)}</div>}
                <div style={{ fontSize: 24, fontWeight: 900, color: promoResult ? "#065F46" : C.primary }}>R{grandTotal.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 11, color: C.gray, textAlign: "right" }}>
                {items.length} item{items.length !== 1 ? "s" : ""}<br />Free delivery
              </div>
            </div>

            {/* PayFast */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Pay securely with PayFast</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { icon: "💳", label: "Credit Card", desc: "Visa & Mastercard" },
                  { icon: "🏦", label: "Instant EFT",  desc: "All SA banks" },
                  { icon: "📱", label: "Masterpass",   desc: "Mobile payment" },
                  { icon: "💵", label: "MoreTyme",     desc: "Buy now pay later" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.dark }}>{m.label}</div>
                      <div style={{ fontSize: 9, color: C.gray }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handlePayWithPayFast} disabled={busy}
                style={{ width: "100%", background: busy ? C.grayLight : "#00A651", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
                {busy ? "Preparing…" : `🔒 Pay R${grandTotal.toFixed(2)} with PayFast`}
              </button>
            </div>

            {/* EFT Bank Transfer */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px", marginBottom: 12 }}>
              <button
                onClick={() => setShowBankDetails(prev => !prev)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showBankDetails ? 14 : 0 }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏦</div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>EFT / Bank Transfer</div>
                  <div style={{ fontSize: 11, color: C.gray }}>Transfer directly to our bank account</div>
                </div>
                <span style={{ fontSize: 18, color: C.gray }}>{showBankDetails ? "▲" : "▾"}</span>
              </button>

              {/* Bank details — shown when expanded */}
              {showBankDetails && (
                <div>
                  <div style={{ background: "#F0F9FF", borderRadius: 12, padding: "14px", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0C447C", marginBottom: 10 }}>📋 Bank Account Details</div>
                    {[
                      { label: "Bank",           value: BANK_DETAILS.bank },
                      { label: "Account Name",   value: BANK_DETAILS.account_name },
                      { label: "Account Number", value: BANK_DETAILS.account_number },
                      { label: "Branch Code",    value: BANK_DETAILS.branch_code },
                      { label: "Account Type",   value: BANK_DETAILS.account_type },
                      { label: "Reference",      value: "Your Order ID (shown after placing)" },
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "1px solid #DBEAFE" }}>
                        <span style={{ color: "#64748B" }}>{row.label}</span>
                        <span style={{ color: "#0C447C", fontWeight: 700, fontFamily: (row.label === "Account Number" || row.label === "Branch Code") ? "monospace" : "inherit" }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, background: "#FEF3C7", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#92400E" }}>
                      ⚠️ Use your Order ID as the payment reference — shown after placing your order.
                    </div>
                  </div>
                  <button onClick={() => handlePlaceOrder("eft")} disabled={busy}
                    style={{ width: "100%", background: busy ? C.grayLight : "#1D4ED8", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
                    {busy ? "Placing order…" : "🏦 Place Order · Pay via EFT"}
                  </button>
                </div>
              )}
            </div>

            {/* Cash on Delivery */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💵</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Cash on Delivery</div>
                  <div style={{ fontSize: 11, color: C.gray }}>Pay when your order is delivered</div>
                </div>
              </div>
              <button onClick={() => handlePlaceOrder("cod")} disabled={busy}
                style={{ width: "100%", background: busy ? C.grayLight : "#059669", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
                {busy ? "Placing order…" : "💵 Place Order · Cash on Delivery"}
              </button>
            </div>

            <div style={{ textAlign: "center", fontSize: 11, color: C.gray }}>
              🔒 Secure checkout · By paying you agree to our Terms
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
