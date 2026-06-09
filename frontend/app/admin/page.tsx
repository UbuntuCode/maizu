"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Stats {
  total_users:   number;
  total_stores:  number;
  total_orders:  number;
  total_revenue: number;
  new_users_7d:  number;
  new_orders_7d: number;
}
interface Charts {
  signups:      { day: string; count: number }[];
  order_status: { status: string; count: number }[];
  top_stores:   { id: string; name: string; revenue: number; orders: number; logo_url?: string }[];
  revenue:      { day: string; revenue: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  pending:   "#F59E0B",
  confirmed: "#3B82F6",
  shipped:   "#8B5CF6",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

/* ── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ emoji, label, value, sub, subGreen = false }: { emoji: string; label: string; value: string; sub?: string; subGreen?: boolean }) => (
  <div style={{ background: C.white, borderRadius: 16, padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: C.softOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 10 }}>
      {emoji}
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: C.dark, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, fontWeight: 600, color: subGreen ? "#059669" : C.primary, marginTop: 3 }}>{sub}</div>}
  </div>
);

/* ── Mini bar chart ─────────────────────────────────────────── */
const MiniBar = ({ data, valueKey, color = C.primary }: { data: any[]; valueKey: string; color?: string }) => {
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, background: color, borderRadius: "3px 3px 0 0", opacity: 0.7 + (i / data.length) * 0.3, height: `${Math.max(4, (Number(d[valueKey]) / max) * 100)}%`, transition: "height 0.5s" }} />
      ))}
    </div>
  );
};

/* ── Admin nav ──────────────────────────────────────────────── */
const AdminNav = ({ active }: { active: string }) => {
  const router = useRouter();
  const tabs = [
    { path: "/admin",         icon: "📊", label: "Overview" },
    { path: "/admin/users",   icon: "👥", label: "Users"    },
    { path: "/admin/stores",  icon: "🏪", label: "Stores"   },
    { path: "/admin/orders",  icon: "📦", label: "Orders"   },
  ];
  return (
    <div style={{ background: C.dark, display: "flex", overflowX: "auto" }}>
      {tabs.map(t => (
        <button key={t.path} onClick={() => router.push(t.path)}
          style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: active === t.path ? `2.5px solid ${C.primary}` : "2.5px solid transparent" }}>
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: active === t.path ? 700 : 400, color: active === t.path ? "#fff" : "rgba(255,255,255,0.6)" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

export { AdminNav };

/* ══════════════════════════════════════════════════════════════
   ADMIN OVERVIEW PAGE
══════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [charts,  setCharts]  = useState<Charts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || profile?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isLoggedIn, profile, router]);

  useEffect(() => {
    if (!isLoggedIn || profile?.role !== "admin") return;
    const load = async () => {
      try {
        const { data: sd } = await supabase.auth.getSession();
        const token = sd.session?.access_token;
        const res   = await fetch(`${BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        if (data.success) { setStats(data.stats); setCharts(data.charts); }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [isLoggedIn, profile]);

  if (authLoading || loading) {
    return (
      <div style={{ background: "#111", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#aaa" }}>Loading admin panel…</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      {/* Admin header */}
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>⚡ Maizu Admin</div>
          <div style={{ fontSize: 11, color: "#888" }}>Platform management</div>
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "#333", color: "#aaa", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
          ← Back to App
        </button>
      </div>

      <AdminNav active="/admin" />

      <div style={{ padding: "16px" }}>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatCard emoji="👥" label="Total Users"   value={stats?.total_users?.toString() || "0"}   sub={`+${stats?.new_users_7d || 0} this week`}  subGreen />
          <StatCard emoji="🏪" label="Active Stores" value={stats?.total_stores?.toString() || "0"}  />
          <StatCard emoji="📦" label="Total Orders"  value={stats?.total_orders?.toString() || "0"}  sub={`+${stats?.new_orders_7d || 0} this week`} subGreen />
          <StatCard emoji="💰" label="Total Revenue" value={`R${Number(stats?.total_revenue || 0).toFixed(0)}`} />
        </div>

        {/* Signups chart */}
        {charts?.signups && charts.signups.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>📈 User Signups — Last 14 Days</div>
            <MiniBar data={charts.signups} valueKey="count" color={C.primary} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.gray, marginTop: 4 }}>
              <span>{new Date(charts.signups[0]?.day).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
              <span>Today</span>
            </div>
          </div>
        )}

        {/* Revenue chart */}
        {charts?.revenue && charts.revenue.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>💰 Revenue — Last 14 Days</div>
            <MiniBar data={charts.revenue} valueKey="revenue" color="#10B981" />
          </div>
        )}

        {/* Orders by status */}
        {charts?.order_status && charts.order_status.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>📋 Orders by Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {charts.order_status.map(s => {
                const total = charts.order_status.reduce((sum, x) => sum + Number(x.count), 0);
                const pct   = total > 0 ? (Number(s.count) / total) * 100 : 0;
                return (
                  <div key={s.status}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: C.dark, fontWeight: 500, textTransform: "capitalize" }}>{s.status}</span>
                      <span style={{ color: C.gray }}>{s.count}</span>
                    </div>
                    <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: STATUS_COLOR[s.status] || C.primary, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top stores */}
        {charts?.top_stores && charts.top_stores.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>🏆 Top Stores by Revenue</div>
              <button onClick={() => router.push("/admin/stores")} style={{ fontSize: 11, color: C.primary, background: "none", border: "none", cursor: "pointer" }}>See all →</button>
            </div>
            {charts.top_stores.map((store, i) => (
              <div key={store.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.softOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: C.primary, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {store.logo_url ? <img src={store.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{store.name}</div>
                  <div style={{ fontSize: 10, color: C.gray }}>{store.orders} orders</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#10B981" }}>R{Number(store.revenue).toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Manage Users",  emoji: "👥", path: "/admin/users"  },
            { label: "Manage Stores", emoji: "🏪", path: "/admin/stores" },
            { label: "All Orders",    emoji: "📦", path: "/admin/orders" },
            { label: "Back to App",   emoji: "🏠", path: "/dashboard"   },
          ].map(btn => (
            <button key={btn.path} onClick={() => router.push(btn.path)}
              style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 10px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>{btn.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{btn.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
