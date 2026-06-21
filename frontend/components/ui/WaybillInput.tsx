"use client";
import React, { useState } from "react";
import { C } from "@/utils/constants";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface WaybillInputProps {
  orderId:  string;
  orderRef: string;
  onSaved:  (waybill: string, trackingUrl: string) => void;
  onClose:  () => void;
}

const COURIERS = [
  { key: "tcg",     label: "The Courier Guy",  flag: "🟡" },
  { key: "fastway", label: "Fastway",           flag: "🔵" },
  { key: "dhl",     label: "DHL",               flag: "🔴" },
  { key: "aramex",  label: "Aramex",            flag: "🟠" },
  { key: "paxi",    label: "Paxi (Pick n Pay)", flag: "🔴" },
  { key: "pudo",    label: "PUDO Lockers",      flag: "🟢" },
  { key: "other",   label: "Other",             flag: "⚪" },
];

export default function WaybillInput({ orderId, orderRef, onSaved, onClose }: WaybillInputProps) {
  const [waybill,  setWaybill]  = useState("");
  const [courier,  setCourier]  = useState("tcg");
  const [estDate,  setEstDate]  = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [trackUrl, setTrackUrl] = useState("");

  const handleSave = async () => {
    if (!waybill.trim()) { setError("Please enter the waybill number."); return; }
    setBusy(true); setError("");

    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd.session?.access_token;

      const res  = await fetch(`${BASE}/api/delivery/orders/${orderId}/waybill`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          waybill_number:     waybill.trim().toUpperCase(),
          courier_name:       courier,
          estimated_delivery: estDate || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to save waybill.");
      setTrackUrl(data.tracking_url || "");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save waybill.");
    } finally {
      setBusy(false);
    }
  };

  const selectedCourier = COURIERS.find(c => c.key === courier);

  if (success) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", alignItems: "flex-end" }}>
        <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 16px 44px", width: "100%", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px" }}>🚚</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 6 }}>Waybill saved!</div>
          <div style={{ fontSize: 12, color: C.gray, marginBottom: 20 }}>
            Order #{orderRef} has been marked as shipped.<br />The buyer will be notified.
          </div>

          <div style={{ background: "#F0F9FF", borderRadius: 12, padding: "12px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>Waybill Number</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: C.dark, letterSpacing: 2 }}>{waybill.toUpperCase()}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { onSaved(waybill.toUpperCase(), trackUrl); onClose(); }}
              style={{ flex: 1, background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Done ✓
            </button>
            <button
              onClick={() => {
                const msg = encodeURIComponent(`📦 Your Maizu order has been shipped!\n\nWaybill: *${waybill.toUpperCase()}*\nCourier: *${selectedCourier?.label}*\n\nTrack here: ${trackUrl}`);
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
              style={{ flex: 1, background: "#25D366", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              💬 Send to Buyer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 16px 44px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>🚚 Add Waybill Number</div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>Order #{orderRef}</div>
          </div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>⚠️ {error}</div>
        )}

        {/* Courier selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 8 }}>Courier Service</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COURIERS.map(c => (
              <button key={c.key} onClick={() => setCourier(c.key)}
                style={{ background: courier === c.key ? C.primary : "#F9FAFB", color: courier === c.key ? "#fff" : C.dark, border: `1.5px solid ${courier === c.key ? C.primary : C.border}`, borderRadius: 22, padding: "6px 12px", fontSize: 11, fontWeight: courier === c.key ? 700 : 400, cursor: "pointer" }}>
                {c.flag} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Waybill input */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>
            Waybill / Tracking Number *
          </label>
          <input
            value={waybill}
            onChange={e => setWaybill(e.target.value.toUpperCase())}
            placeholder={courier === "tcg" ? "e.g. 123456789" : "Enter tracking number"}
            style={{ width: "100%", padding: "13px 14px", border: `2px solid ${C.primary}`, borderRadius: 12, fontSize: 15, fontFamily: "monospace", fontWeight: 700, letterSpacing: 2, outline: "none", color: C.dark, boxSizing: "border-box", textTransform: "uppercase" }}
          />
          <div style={{ fontSize: 11, color: C.gray, marginTop: 5 }}>
            Find this on the physical waybill sticker on the parcel.
          </div>
        </div>

        {/* Estimated delivery */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>
            Estimated Delivery Date <span style={{ color: C.gray, fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="date"
            value={estDate}
            onChange={e => setEstDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" }}
          />
        </div>

        {courier === "tcg" && (
          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "12px 13px", marginBottom: 16, fontSize: 12, color: "#1D4ED8", lineHeight: 1.6 }}>
            ℹ️ Buyers will be able to track their parcel at <strong>thecourierguy.co.za/track</strong> using this waybill number. It also shows on their order page in the Maizu app.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={busy || !waybill.trim()}
          style={{ width: "100%", background: busy || !waybill.trim() ? "#D1D5DB" : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy || !waybill.trim() ? "default" : "pointer" }}
        >
          {busy ? "Saving…" : "🚚 Save Waybill & Notify Buyer"}
        </button>
      </div>
    </div>
  );
}
