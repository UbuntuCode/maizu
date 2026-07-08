"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import AdminNav from "@/components/admin/AdminNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Boost {
  id:            string;
  store_id:      string;
  store_name:    string;
  logo_url?:     string;
  vendor_name:   string;
  vendor_email:  string;
  plan:          string;
  status:        string;
  amount_paid:   string;
  payment_ref?:  string;
  payment_method?: string;
  expires_at:    string;
  approved_at?:  string;
  rejected_reason?: string;
  created_at:    string;
}

const PLAN_LABEL: Record<string, string> = {
  starter: "🚀 Starter · R49 · 7 days",
  growth:  "📈 Growth · R99 · 14 days",
  premium: "⭐ Premium · R199 · 30 days",
};

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "#F59E0B", bg: "#2D1E00", label: "⏳ Pending" },
  active:    { color: "#10B981", bg: "#0A2A1A", label: "✅ Active" },
  rejected:  { color: "#EF4444", bg: "#2A0A0A", label: "✗ Rejected" },
  expired:   { color: "#888",    bg: "#222",    label: "Expired" },
  cancelled: { color: "#888",    bg: "#222",    label: "Cancelled" },
};

const FILTERS = ["pending", "active", "rejected", "all"];

export default function AdminBoostsPage() {
  const router = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();
  const [boosts,  setBoosts]  = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("pending");
  const [busy,    setBusy]    = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || profile?.role !== "admin")) router.push("/");
  }, [authLoading, isLoggedIn, profile, router]);

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const loadBoosts = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/boosts?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBoosts(data.boosts);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    if (isLoggedIn && profile?.role === "admin") loadBoosts();
  }, [loadBoosts, isLoggedIn, profile]);

  const approve = async (b: Boost) => {
    const sure = confirm(
      `APPROVE BOOST — READ CAREFULLY\n\n` +
      `Store: ${b.store_name}\nPlan: ${PLAN_LABEL[b.plan] || b.plan}\n` +
      `Reference: ${b.payment_ref || "(none)"}\n\n` +
      `Have you SEEN R${Number(b.amount_paid).toFixed(0)} arrive in the FNB account with this reference?\n\n` +
      `Only approve if the money is in the bank.`
    );
    if (!sure) return;
    setBusy(b.id);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/boosts/${b.id}/approve`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) loadBoosts();
      else alert(data.message || "Approval failed.");
    } catch { alert("Network error — boost not approved."); }
    finally { setBusy(null); }
  };

  const reject = async (b: Boost) => {
    const reason = prompt(
      `Reject boost for "${b.store_name}"?\n\nEnter the reason (the vendor will see this):`,
      "Payment not found — please check your reference and resubmit."
    );
    if (!reason || reason.trim().length < 3) return;
    setBusy(b.id);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/boosts/${b.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (data.success) loadBoosts();
      else alert(data.message || "Rejection failed.");
    } catch { alert("Network error — boost not rejected."); }
    finally { setBusy(null); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  const pendingCount = filter === "pending" ? boosts.length : null;

  if (authLoading) {
    return (
      <div style={{ background: "#111", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#aaa" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>🚀 Boost Payments</div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {pendingCount !== null ? `${pendingCount} awaiting verification` : "Payment verification queue"}
          </div>
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "#333", color: "#aaa", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
          ← Back to App
        </button>
      </div>

      <AdminNav active="/admin/boosts" />

      <div style={{ padding: "16px" }}>

        {/* Rule reminder */}
        <div style={{ background: "#2D1E00", border: "1px solid #F59E0B44", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#F59E0B" }}>
          ⚠️ Only approve a boost after the money is VISIBLE in the bank account. No exceptions — not for friends, not for &quot;it&apos;s coming tomorrow&quot;.
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flex: "none", background: filter === f ? C.primary : "#1D1D1D", color: filter === f ? "#fff" : "#888", border: "1px solid #333", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: filter === f ? 700 : 400, cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 13, color: "#888" }}>Loading boosts…</div>
        ) : boosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 13, color: "#888" }}>
            {filter === "pending" ? "Queue is clear — nothing to verify. 🎉" : "No boosts here."}
          </div>
        ) : (
          boosts.map(b => {
            const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
            return (
              <div key={b.id} style={{ background: "#1D1D1D", border: `1px solid ${b.status === "pending" ? "#F59E0B55" : "#333"}`, borderRadius: 14, padding: "14px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, overflow: "hidden", flexShrink: 0 }}>
                    {b.logo_url ? <img src={b.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{b.store_name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{b.vendor_name} · {b.vendor_email}</div>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{cfg.label}</span>
                </div>

                <div style={{ background: "#111", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>{PLAN_LABEL[b.plan] || b.plan}</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>
                    Reference: <span style={{ color: "#F59E0B", fontFamily: "monospace" }}>{b.payment_ref || "— none —"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                    Submitted {fmtDate(b.created_at)}
                    {b.status === "active"   && ` · expires ${fmtDate(b.expires_at)}`}
                    {b.status === "rejected" && b.rejected_reason && ` · reason: ${b.rejected_reason}`}
                  </div>
                </div>

                {b.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={busy === b.id} onClick={() => approve(b)}
                      style={{ flex: 1, background: "#0A2A1A", color: "#10B981", border: "1px solid #10B98155", borderRadius: 10, padding: "10px 0", fontSize: 12, fontWeight: 800, cursor: "pointer", opacity: busy === b.id ? 0.5 : 1 }}>
                      {busy === b.id ? "Working…" : `✓ Approve R${Number(b.amount_paid).toFixed(0)}`}
                    </button>
                    <button disabled={busy === b.id} onClick={() => reject(b)}
                      style={{ flex: 1, background: "#2A0A0A", color: "#EF4444", border: "1px solid #4A1515", borderRadius: 10, padding: "10px 0", fontSize: 12, fontWeight: 800, cursor: "pointer", opacity: busy === b.id ? 0.5 : 1 }}>
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}