"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

/*
  Store Orders — working vendor order management.
  Loads every order that contains items from any of the vendor's stores,
  shows the buyer, items and total, and lets the vendor move the order
  through: pending → confirmed → shipped → delivered (or cancel).
*/

const T = {
  primary: "#E8401C", primarySoft: "#FDEAE4",
  ink: "#161B26", sub: "#6B7080", faint: "#9CA1AD",
  bg: "#F7F7F5", card: "#FFFFFF", border: "#ECECEA",
};

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  pending:   { label: "Pending",   bg: "#FEF3E2", fg: "#B45309" },
  confirmed: { label: "Confirmed", bg: "#E8EFFD", fg: "#1D4ED8" },
  shipped:   { label: "Shipped",   bg: "#F1EAFD", fg: "#6D28D9" },
  delivered: { label: "Delivered", bg: "#E6F4EC", fg: "#0F7A43" },
  cancelled: { label: "Cancelled", bg: "#FDECEC", fg: "#B42318" },
};
const NEXT: Record<string, string | null> = {
  pending: "confirmed", confirmed: "shipped", shipped: "delivered", delivered: null, cancelled: null,
};
const NEXT_LABEL: Record<string, string> = {
  pending: "Confirm order", confirmed: "Mark as shipped", shipped: "Mark as delivered",
};

export default function StoreOrdersPage() {
  const router = useRouter();
  const { authUser } = useAuth() as any;

  const [orders, setOrders]   = useState<any[]>([]);
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState("");
  const [error, setError]     = useState("");

  const load = async () => {
    if (!authUser) return;
    setLoading(true);
    setError("");
    try {
      const { data: st, error: e1 } = await supabase
        .from("stores").select("id,name").eq("owner_id", authUser.id);
      if (e1) throw e1;
      const ids = (st || []).map((s) => s.id);
      if (!ids.length) { setOrders([]); return; }

      const { data: items, error: e2 } = await supabase
        .from("order_items")
        .select("*, orders(*)")
        .in("store_id", ids);
      if (e2) throw e2;

      // Group items by order
      const map = new Map<string, any>();
      (items || []).forEach((it: any) => {
        const o = it.orders;
        if (!o) return;
        if (!map.has(o.id)) map.set(o.id, { ...o, items: [] });
        map.get(o.id).items.push(it);
      });
      const list = Array.from(map.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(list);
    } catch (e: any) {
      setError(e.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [authUser]);

  const setStatus = async (orderId: string, status: string) => {
    setBusyId(orderId);
    setError("");
    try {
      const { error: e } = await supabase
        .from("orders").update({ status }).eq("id", orderId);
      if (e) throw e;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (e: any) {
      setError(e.message || "Could not update the order.");
    } finally {
      setBusyId("");
    }
  };

  const fmtR = (n: number) => "R " + Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 });
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts: Record<string, number> = { all: orders.length };
  Object.keys(STATUS).forEach((s) => (counts[s] = orders.filter((o) => o.status === s).length));

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 60px" }}>

        <button onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: T.sub, fontSize: 13.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6 6-6-6 6-6" /></svg>
          Dashboard
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: "10px 0 4px", letterSpacing: -0.4 }}>Store orders</h1>
        <p style={{ fontSize: 14, color: T.sub, margin: "0 0 18px" }}>
          Every order placed for your products. Keep buyers happy by updating each order's status as it moves.
        </p>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["all", ...Object.keys(STATUS)].map((f) => {
            const on = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                border: on ? "none" : `1px solid #E0E0DD`,
                background: on ? T.ink : "#fff", color: on ? "#fff" : T.sub,
                borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              }}>
                {f === "all" ? "All" : STATUS[f].label} ({counts[f] || 0})
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: T.sub, fontSize: 14, padding: 30, textAlign: "center" }}>Loading your orders…</div>
        ) : shown.length === 0 ? (
          <div style={{ background: T.card, border: `1px dashed #D8D8D4`, borderRadius: 18, padding: "48px 20px", textAlign: "center" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C9C9C5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", display: "block" }}>
              <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginTop: 12 }}>
              {filter === "all" ? "No orders yet" : `No ${STATUS[filter]?.label.toLowerCase()} orders`}
            </div>
            <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6 }}>
              When customers buy from your store, their orders will appear here.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {shown.map((o) => {
              const st = STATUS[o.status] || STATUS.pending;
              const next = NEXT[o.status];
              return (
                <div key={o.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>
                        Order #{String(o.id).slice(0, 8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>{fmtDate(o.created_at)}</div>
                    </div>
                    <span style={{ background: st.bg, color: st.fg, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 800 }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ borderTop: `1px solid ${T.border}`, margin: "12px 0", paddingTop: 12, display: "grid", gap: 6 }}>
                    {o.items.map((it: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                        <span style={{ color: T.ink, fontWeight: 600 }}>
                          {it.product_name} <span style={{ color: T.faint, fontWeight: 500 }}>× {it.quantity}</span>
                        </span>
                        <span style={{ color: T.sub }}>{fmtR(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>
                      Total {fmtR(o.total ?? o.items.reduce((s: number, i: any) => s + Number(i.subtotal || 0), 0))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(o.status === "pending" || o.status === "confirmed") && (
                        <button disabled={busyId === o.id} onClick={() => setStatus(o.id, "cancelled")}
                          style={{ background: "#fff", color: "#B42318", border: "1px solid #F3C6C0", borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                          Cancel
                        </button>
                      )}
                      {next && (
                        <button disabled={busyId === o.id} onClick={() => setStatus(o.id, next)}
                          style={{ background: busyId === o.id ? "#F0A18E" : T.primary, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                          {busyId === o.id ? "Saving…" : NEXT_LABEL[o.status]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
