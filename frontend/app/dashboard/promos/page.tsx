"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Promo {
  id:               string;
  code:             string;
  description?:     string;
  discount_type:    "percent" | "fixed";
  discount_value:   number;
  min_order_amount: number;
  max_uses?:        number;
  uses_count:       number;
  is_active:        boolean;
  expires_at?:      string;
  store_name?:      string;
  created_at:       string;
}

/* ── Promo card ─────────────────────────────────────────────── */
const PromoCard = ({
  promo, onToggle, onDelete,
}: {
  promo:    Promo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
  const isExhausted = promo.max_uses && promo.uses_count >= promo.max_uses;
  const status = isExpired ? "expired" : isExhausted ? "exhausted" : promo.is_active ? "active" : "paused";

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active:    { color: "#065F46", bg: "#D1FAE5", label: "Active" },
    paused:    { color: "#92400E", bg: "#FEF3C7", label: "Paused" },
    expired:   { color: "#6B7280", bg: "#F3F4F6", label: "Expired" },
    exhausted: { color: "#6B7280", bg: "#F3F4F6", label: "Used up" },
  };

  const cfg = statusConfig[status];

  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: status === "expired" || status === "exhausted" ? 0.7 : 1 }}>
      {/* Code + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, fontFamily: "monospace", letterSpacing: 1 }}>
          {promo.code}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
            {cfg.label}
          </div>
        </div>
      </div>

      {/* Discount info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ background: C.softOrange, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 800, color: C.primary }}>
          {promo.discount_type === "percent" ? `${promo.discount_value}% OFF` : `R${promo.discount_value} OFF`}
        </div>
        {promo.min_order_amount > 0 && (
          <span style={{ fontSize: 11, color: C.gray }}>Min order R{promo.min_order_amount}</span>
        )}
      </div>

      {/* Description */}
      {promo.description && (
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{promo.description}</div>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{promo.uses_count}</div>
          <div style={{ fontSize: 9, color: C.gray }}>Uses</div>
        </div>
        {promo.max_uses && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{promo.max_uses}</div>
            <div style={{ fontSize: 9, color: C.gray }}>Max uses</div>
          </div>
        )}
        {promo.expires_at && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: isExpired ? "#EF4444" : C.dark }}>
              {new Date(promo.expires_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <div style={{ fontSize: 9, color: C.gray }}>Expires</div>
          </div>
        )}
        {promo.store_name && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.dark }}>🏪 {promo.store_name}</div>
            <div style={{ fontSize: 9, color: C.gray }}>Store</div>
          </div>
        )}
      </div>

      {/* Usage progress bar */}
      {promo.max_uses && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${Math.min((promo.uses_count / promo.max_uses) * 100, 100)}%`, height: "100%", background: promo.uses_count >= promo.max_uses ? "#EF4444" : C.primary, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 9, color: C.gray, marginTop: 3 }}>
            {promo.uses_count} / {promo.max_uses} uses
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        {status !== "expired" && status !== "exhausted" && (
          <button onClick={() => onToggle(promo.id)}
            style={{ flex: 1, background: promo.is_active ? "#FEF3C7" : "#D1FAE5", color: promo.is_active ? "#92400E" : "#065F46", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {promo.is_active ? "⏸ Pause" : "▶ Activate"}
          </button>
        )}
        <button onClick={() => {
          if (confirm(`Delete promo code "${promo.code}"?`)) onDelete(promo.id);
        }} style={{ flex: 1, background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          🗑 Delete
        </button>
      </div>
    </div>
  );
};

/* ── Create promo modal ─────────────────────────────────────── */
const CreatePromoModal = ({
  onClose, onCreated,
}: {
  onClose:   () => void;
  onCreated: (promo: Promo) => void;
}) => {
  const [form, setForm] = useState({
    code:             "",
    description:      "",
    discount_type:    "percent" as "percent" | "fixed",
    discount_value:   "",
    min_order_amount: "",
    max_uses:         "",
    expires_at:       "",
  });
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  /* Generate random code */
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(prev => ({ ...prev, code }));
  };

  const handleCreate = async () => {
    if (!form.code.trim() || !form.discount_value) { setError("Code and discount value are required."); return; }
    setBusy(true); setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${BASE}/api/promos`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          code:             form.code.trim().toUpperCase(),
          description:      form.description.trim() || undefined,
          discount_type:    form.discount_type,
          discount_value:   Number(form.discount_value),
          min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
          max_uses:         form.max_uses ? Number(form.max_uses) : undefined,
          expires_at:       form.expires_at || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onCreated(data.promo);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create promo.");
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 13px",
    border: `1.5px solid ${C.border}`, borderRadius: 11,
    fontSize: 13, outline: "none", color: C.dark,
    boxSizing: "border-box", background: "#FAFAFA",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", width: "100%", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>Create Promo Code</div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        {error && <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Code */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Promo Code *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={form.code} onChange={set("code")} placeholder="e.g. SAVE20" maxLength={20}
                style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}
                onInput={(e) => (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase()}
              />
              <button onClick={generateCode} style={{ background: C.softOrange, color: C.primary, border: "none", borderRadius: 10, padding: "0 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                🎲 Random
              </button>
            </div>
          </div>

          {/* Discount type + value */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Discount Type *</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {([["percent", "% Percentage"], ["fixed", "R Fixed Amount"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setForm(prev => ({ ...prev, discount_type: val }))}
                  style={{ flex: 1, background: form.discount_type === val ? C.primary : C.white, color: form.discount_type === val ? "#fff" : C.dark, border: `1.5px solid ${form.discount_type === val ? C.primary : C.border}`, borderRadius: 10, padding: "10px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray, fontWeight: 600 }}>
                {form.discount_type === "percent" ? "%" : "R"}
              </span>
              <input value={form.discount_value} onChange={set("discount_value")} type="number" min="1" max={form.discount_type === "percent" ? "100" : undefined}
                placeholder={form.discount_type === "percent" ? "20" : "50.00"}
                style={{ ...inputStyle, paddingLeft: 30 }} />
            </div>
            {form.discount_type === "percent" && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {["5", "10", "15", "20", "25", "50"].map(v => (
                  <button key={v} onClick={() => setForm(prev => ({ ...prev, discount_value: v }))}
                    style={{ background: form.discount_value === v ? C.primary : "#F3F4F6", color: form.discount_value === v ? "#fff" : C.dark, border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>
                    {v}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Description <span style={{ color: C.gray, fontWeight: 400 }}>(optional)</span></label>
            <input value={form.description} onChange={set("description")} placeholder="e.g. Welcome discount for new customers"
              style={inputStyle} />
          </div>

          {/* Min order + max uses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Min Order (R)</label>
              <input value={form.min_order_amount} onChange={set("min_order_amount")} type="number" min="0" placeholder="0 = no minimum"
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Max Uses</label>
              <input value={form.max_uses} onChange={set("max_uses")} type="number" min="1" placeholder="Unlimited"
                style={inputStyle} />
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Expiry Date <span style={{ color: C.gray, fontWeight: 400 }}>(optional)</span></label>
            <input value={form.expires_at} onChange={set("expires_at")} type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              style={inputStyle} />
          </div>

          {/* Preview */}
          {form.code && form.discount_value && (
            <div style={{ background: C.softOrange, borderRadius: 12, padding: "12px 14px", border: `1.5px solid ${C.primary}22` }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>Preview</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.primary, fontFamily: "monospace" }}>{form.code.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: C.dark, marginTop: 2 }}>
                {form.discount_type === "percent" ? `${form.discount_value}% off` : `R${form.discount_value} off`}
                {form.min_order_amount ? ` · Min order R${form.min_order_amount}` : " · No minimum order"}
                {form.max_uses ? ` · Max ${form.max_uses} uses` : " · Unlimited uses"}
              </div>
            </div>
          )}

          <button onClick={handleCreate} disabled={busy}
            style={{ background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer", marginTop: 4 }}>
            {busy ? "Creating…" : "Create Promo Code 🏷️"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PROMOS PAGE
══════════════════════════════════════════════════════════════ */
export default function PromosPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [promos,     setPromos]     = useState<Promo[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res   = await fetch(`${BASE}/api/promos/my`, { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        if (data.success) setPromos(data.promos);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [isLoggedIn]);

  const handleToggle = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res   = await fetch(`${BASE}/api/promos/${id}/toggle`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) {
        setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: data.promo.is_active } : p));
      }
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await fetch(`${BASE}/api/promos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch { /* silent */ }
  };

  /* Stats */
  const activeCount = promos.filter(p => p.is_active && !(p.expires_at && new Date(p.expires_at) < new Date())).length;
  const totalUses   = promos.reduce((s, p) => s + p.uses_count, 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <Header />

      {/* Page header */}
      <div style={{ background: C.white, padding: "18px 16px 16px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark, padding: 0, marginBottom: 8 }}>‹ Dashboard</button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.dark }}>Promo Codes</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Create discounts for your customers</div>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + Create
          </button>
        </div>
      </div>

      <div style={{ padding: "16px" }}>

        {/* Stats */}
        {promos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { emoji: "🏷️", val: String(promos.length),  label: "Total Codes" },
              { emoji: "✅", val: String(activeCount),     label: "Active" },
              { emoji: "👥", val: String(totalUses),       label: "Total Uses" },
            ].map(s => (
              <div key={s.label} style={{ background: C.white, borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{s.val}</div>
                <div style={{ fontSize: 10, color: C.gray }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        <div style={{ background: C.softOrange, borderRadius: 14, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: C.dark, lineHeight: 1.6 }}>
          💡 <strong>Tip:</strong> Share promo codes on WhatsApp to drive first orders. Try <strong>WELCOME20</strong> for 20% off for new customers!
        </div>

        {/* Promo list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: 13 }}>Loading promo codes…</div>
        ) : promos.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🏷️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>No promo codes yet</div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, maxWidth: 260, margin: "0 auto 20px" }}>
              Create a discount code to share with your customers and boost sales.
            </div>
            <button onClick={() => setShowCreate(true)}
              style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Create First Promo Code
            </button>
          </div>
        ) : (
          promos.map(promo => (
            <PromoCard key={promo.id} promo={promo} onToggle={handleToggle} onDelete={handleDelete} />
          ))
        )}
      </div>

      {showCreate && (
        <CreatePromoModal
          onClose={() => setShowCreate(false)}
          onCreated={promo => setPromos(prev => [promo, ...prev])}
        />
      )}

      <BottomNav />
    </div>
  );
}
