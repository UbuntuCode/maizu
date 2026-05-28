"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ordersApi } from "@/utils/api";

const SA_PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Free State",
];

export default function CheckoutPage() {
  const router              = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { authUser, isLoggedIn, loading } = useAuth();

  const [step,  setStep]  = useState<1 | 2 | 3>(1);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    full_name:    "",
    phone:        "",
    street:       "",
    suburb:       "",
    city:         "",
    province:     "",
    postal_code:  "",
    notes:        "",
  });

  /* Redirect if not logged in or cart empty */
  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) { router.push("/login"); return; }
      if (items.length === 0) { router.push("/stores"); return; }
    }
  }, [loading, isLoggedIn, items.length, router]);

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

  const handlePlaceOrder = async () => {
    setBusy(true);
    setError("");
    try {
      const delivery_address = [
        address.full_name,
        address.phone,
        address.street,
        address.suburb,
        address.city,
        address.province,
        address.postal_code,
      ].filter(Boolean).join(", ");

      const orderItems = items.map(i => ({
        product_id: i.product_id,
        quantity:   i.quantity,
      }));

      const order = await ordersApi.place(orderItems, delivery_address, address.notes);
      clearCart();
      router.push(`/orders/${order.id}?success=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 13px",
    border: `1.5px solid ${C.border}`, borderRadius: 11,
    fontSize: 14, outline: "none", color: C.dark,
    boxSizing: "border-box", background: "#FAFAFA",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.dark,
    display: "block", marginBottom: 5,
  };

  const serviceFee  = totalPrice * 0.05;
  const grandTotal  = totalPrice + serviceFee;

  /* ── Progress ── */
  const Progress = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
      {[
        { n: 1, label: "Delivery" },
        { n: 2, label: "Review" },
        { n: 3, label: "Payment" },
      ].map((s, idx) => (
        <React.Fragment key={s.n}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= s.n ? C.primary : C.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, transition: "background 0.3s" }}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span style={{ fontSize: 10, color: step >= s.n ? C.primary : C.gray, fontWeight: step >= s.n ? 600 : 400 }}>{s.label}</span>
          </div>
          {idx < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? C.primary : C.border, marginBottom: 14, transition: "background 0.3s" }} />}
        </React.Fragment>
      ))}
    </div>
  );

  if (loading || items.length === 0) return null;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
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

        {/* ── STEP 1: Delivery Address ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 4 }}>📍 Delivery Address</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Full Name *</label>
                <input value={address.full_name} onChange={setAddr("full_name")} placeholder="Kofi Mensah" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Phone Number *</label>
                <input value={address.phone} onChange={setAddr("phone")} placeholder="071 234 5678" type="tel" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Street Address *</label>
                <input value={address.street} onChange={setAddr("street")} placeholder="12 Main Street" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Suburb</label>
                <input value={address.suburb} onChange={setAddr("suburb")} placeholder="Sandton" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>City *</label>
                <input value={address.city} onChange={setAddr("city")} placeholder="Johannesburg" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Province *</label>
                <select value={address.province} onChange={setAddr("province")} style={inputStyle}>
                  <option value="">Select…</option>
                  {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Postal Code *</label>
                <input value={address.postal_code} onChange={setAddr("postal_code")} placeholder="2196" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Delivery Notes</label>
                <textarea value={address.notes} onChange={setAddr("notes") as React.ChangeEventHandler<HTMLTextAreaElement>} placeholder="Gate code, landmark, etc." rows={2} style={{ ...inputStyle, resize: "none" }} />
              </div>
            </div>

            <button onClick={() => {
              const err = validateAddress();
              if (err) { setError(err); return; }
              setError("");
              setStep(2);
            }} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
              Continue to Review →
            </button>
          </div>
        )}

        {/* ── STEP 2: Review Order ── */}
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

            {/* Delivery address */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>📍 Delivering to</div>
              <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.7 }}>
                {address.full_name}<br />
                {address.street}{address.suburb ? `, ${address.suburb}` : ""}<br />
                {address.city}, {address.province} {address.postal_code}<br />
                📞 {address.phone}
              </div>
              <button onClick={() => setStep(1)} style={{ marginTop: 8, background: "none", border: "none", color: C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                Change address
              </button>
            </div>

            {/* Price breakdown */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Price Breakdown</div>
              {[
                ["Subtotal",     `R${totalPrice.toFixed(2)}`],
                ["Delivery",     "Free"],
                ["Service fee",  `R${serviceFee.toFixed(2)}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.gray }}>{l}</span>
                  <span style={{ color: C.dark }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 800, fontSize: 15 }}>
                <span style={{ color: C.dark }}>Total</span>
                <span style={{ color: C.primary }}>R{grandTotal.toFixed(2)}</span>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 16 }}>💳 Payment</div>

            {/* Payment method */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Select Payment Method</div>
              {[
                { id: "cod",   icon: "💵", label: "Cash on Delivery",      desc: "Pay when your order arrives" },
                { id: "eft",   icon: "🏦", label: "EFT / Bank Transfer",    desc: "Transfer to our bank account" },
                { id: "card",  icon: "💳", label: "Credit / Debit Card",    desc: "Visa, Mastercard accepted" },
              ].map(method => (
                <div key={method.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: C.softOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {method.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{method.label}</div>
                    <div style={{ fontSize: 11, color: C.gray }}>{method.desc}</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${C.primary}`, background: method.id === "cod" ? C.primary : "transparent" }} />
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ background: C.softOrange, borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: C.gray }}>Total to pay</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.primary }}>R{grandTotal.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 11, color: C.gray, textAlign: "right" }}>
                {items.length} item{items.length !== 1 ? "s" : ""}<br />
                Free delivery
              </div>
            </div>

            {/* Place order */}
            <button
              onClick={handlePlaceOrder}
              disabled={busy}
              style={{ width: "100%", background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 16, padding: "16px 0", fontSize: 16, fontWeight: 700, cursor: busy ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {busy ? "Placing order…" : `🎉 Place Order · R${grandTotal.toFixed(2)}`}
            </button>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: C.gray }}>
              By placing your order you agree to our Terms & Conditions
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
