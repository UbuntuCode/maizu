"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface AnalyticsData {
  summary: {
    total_revenue:     number;
    total_orders:      number;
    total_products:    number;
    total_followers:   number;
    this_week_revenue: number;
    last_week_revenue: number;
    revenue_growth:    string;
    orders_this_week:  number;
    orders_last_week:  number;
  };
  charts: {
    daily_revenue:    { date: string; label: string; revenue: number; orders: number }[];
    weekly_revenue:   { label: string; revenue: number; orders: number }[];
    orders_by_status: { status: string; count: number }[];
    top_products:     { product_name: string; revenue: number; units_sold: number }[];
    revenue_by_store: { store_name: string; revenue: number; orders: number }[];
  };
  stores: { id: string; name: string; product_count: number; follower_count: number; rating: number; logo_url?: string }[];
}

/* â”€â”€ Colors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STATUS_COLORS: Record<string, string> = {
  pending:   "#F59E0B",
  confirmed: "#3B82F6",
  shipped:   "#8B5CF6",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

const CHART_COLORS = ["#E8401C", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

/* â”€â”€ Stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const StatCard = ({
  emoji, label, value, sub, subColor = C.gray, trend,
}: {
  emoji: string; label: string; value: string; sub?: string; subColor?: string; trend?: number;
}) => (
  <div style={{ background: C.white, borderRadius: 16, padding: "14px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: C.softOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        {emoji}
      </div>
      {trend !== undefined && (
        <div style={{ fontSize: 11, fontWeight: 700, color: trend >= 0 ? "#10B981" : "#EF4444", background: trend >= 0 ? "#D1FAE5" : "#FEE2E2", borderRadius: 20, padding: "2px 7px" }}>
          {trend >= 0 ? "â–²" : "â–¼"} {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: C.dark, lineHeight: 1.1, marginBottom: 3 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.gray }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: subColor, marginTop: 3, fontWeight: 500 }}>{sub}</div>}
  </div>
);

/* â”€â”€ Section header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SectionHead = ({ title, sub }: { title: string; sub?: string }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{sub}</div>}
  </div>
);

/* â”€â”€ Custom tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey?: string; name?: string; value?: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.dark, borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
          {p.name === "revenue" ? `R${Number(p.value).toFixed(2)}` : `${p.value} orders`}
        </div>
      ))}
    </div>
  );
};

/* â”€â”€ Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Skel = ({ h = 12, w = "100%", r = 6 }: { h?: number; w?: string | number; r?: number }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: "#F0F0F0", animation: "pulse 1.5s ease-in-out infinite" }} />
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ANALYTICS PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function AnalyticsPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [data,       setData]       = useState<AnalyticsData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [chartView,  setChartView]  = useState<"daily" | "weekly">("daily");
  const [chartType,  setChartType]  = useState<"revenue" | "orders">("revenue");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch(`${BASE}/api/analytics/vendor`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoggedIn]);

  if (authLoading || loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        <Header />
        <div style={{ padding: "20px 16px" }}>
          <Skel h={28} w="60%" r={6} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ background: C.white, borderRadius: 16, padding: 14 }}><Skel h={40} w={40} r={10} /><div style={{ marginTop: 10 }}><Skel h={22} w="60%" /><Skel h={11} w="40%" /></div></div>)}
          </div>
          <div style={{ background: C.white, borderRadius: 16, padding: 16, marginTop: 16 }}><Skel h={200} /></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 16 }}>
        <div style={{ fontSize: 40 }}>âš ï¸</div>
        <div style={{ fontSize: 14, color: C.dark, textAlign: "center" }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Retry</button>
        <BottomNav />
      </div>
    );
  }

  const s       = data?.summary;
  const charts  = data?.charts;
  const growth  = parseFloat(s?.revenue_growth || "0");

  /* Chart data to display */
  const chartData = chartView === "daily"
    ? (charts?.daily_revenue || []).slice(-14) // last 14 days
    : charts?.weekly_revenue || [];

  /* No stores yet */
  if (data?.stores.length === 0) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
        <Header />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>ðŸ“Š</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 8 }}>No stores yet</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 24, maxWidth: 280 }}>Create your first store to start seeing analytics and revenue data here.</div>
          <button onClick={() => router.push("/dashboard/create-store")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Create First Store
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <Header />

      {/* Page header */}
      <div style={{ background: C.white, padding: "18px 16px 16px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark, padding: 0, marginBottom: 8 }}>â€¹ Dashboard</button>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.dark }}>Analytics</div>
        <div style={{ fontSize: 12, color: C.gray }}>Your business performance at a glance</div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* â”€â”€ Summary stats 2x2 â”€â”€ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatCard
            emoji="ðŸ’°" label="Total Revenue"
            value={`R${Number(s?.total_revenue || 0).toFixed(2)}`}
            sub={`This week: R${Number(s?.this_week_revenue || 0).toFixed(2)}`}
            trend={Number(growth)}
          />
          <StatCard
            emoji="ðŸ“¦" label="Total Orders"
            value={String(s?.total_orders || 0)}
            sub={`This week: ${s?.orders_this_week || 0} orders`}
            subColor={C.primary}
          />
          <StatCard
            emoji="ðŸ·ï¸" label="Products Listed"
            value={String(s?.total_products || 0)}
            sub="Across all stores"
          />
          <StatCard
            emoji="ðŸ‘¥" label="Store Followers"
            value={String(s?.total_followers || 0)}
            sub="Total across all stores"
            subColor="#8B5CF6"
          />
        </div>

        {/* â”€â”€ This week vs last week â”€â”€ */}
        <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>ðŸ“… This Week vs Last Week</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Revenue this week",  val: `R${Number(s?.this_week_revenue || 0).toFixed(2)}`,  color: C.primary },
              { label: "Revenue last week",  val: `R${Number(s?.last_week_revenue || 0).toFixed(2)}`,  color: C.gray },
              { label: "Orders this week",   val: String(s?.orders_this_week || 0),  color: "#3B82F6" },
              { label: "Orders last week",   val: String(s?.orders_last_week || 0),  color: C.gray },
            ].map(item => (
              <div key={item.label} style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Growth indicator */}
          <div style={{ marginTop: 12, background: growth >= 0 ? "#D1FAE5" : "#FEE2E2", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{growth >= 0 ? "ðŸ“ˆ" : "ðŸ“‰"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: growth >= 0 ? "#065F46" : "#7F1D1D" }}>
                {growth >= 0 ? "+" : ""}{growth}% revenue {growth >= 0 ? "growth" : "decline"} this week
              </div>
              <div style={{ fontSize: 11, color: growth >= 0 ? "#059669" : "#DC2626" }}>
                {growth >= 0 ? "Great work! Keep it up ðŸš€" : "Try promoting your products to boost sales"}
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Revenue chart â”€â”€ */}
        <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>
              {chartType === "revenue" ? "ðŸ’° Revenue" : "ðŸ“¦ Orders"} Over Time
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {/* Revenue / Orders toggle */}
              <button onClick={() => setChartType(chartType === "revenue" ? "orders" : "revenue")}
                style={{ background: C.softOrange, color: C.primary, border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                Show {chartType === "revenue" ? "Orders" : "Revenue"}
              </button>
            </div>
          </div>

          {/* Daily / Weekly toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {(["daily", "weekly"] as const).map(v => (
              <button key={v} onClick={() => setChartView(v)}
                style={{ background: chartView === v ? C.primary : "#F3F4F6", color: chartView === v ? "#fff" : C.gray, border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: chartView === v ? 700 : 500, cursor: "pointer" }}>
                {v === "daily" ? "Last 14 Days" : "Last 12 Weeks"}
              </button>
            ))}
          </div>

          {chartData.length === 0 ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray, fontSize: 13 }}>
              No data yet â€” orders will appear here
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: C.gray }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: C.gray }} tickLine={false} axisLine={false}
                  tickFormatter={v => chartType === "revenue" ? `R${v}` : String(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartType}
                  name={chartType}
                  stroke={C.primary}
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  dot={false}
                  activeDot={{ r: 4, fill: C.primary }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* â”€â”€ Orders by status â”€â”€ */}
        {charts?.orders_by_status && charts.orders_by_status.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 20 }}>
            <SectionHead title="ðŸ“‹ Orders by Status" />
            <div style={{ display: "flex", gap: 10 }}>
              {/* Pie chart */}
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={charts.orders_by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {charts.orders_by_status.map((entry, index) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} orders`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                {charts.orders_by_status.map(item => (
                  <div key={item.status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[item.status] || C.primary, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.dark, textTransform: "capitalize" }}>{item.status}</div>
                      <div style={{ fontSize: 10, color: C.gray }}>{item.count} order{item.count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Top products â”€â”€ */}
        {charts?.top_products && charts.top_products.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 20 }}>
            <SectionHead title="ðŸ† Top Products by Revenue" sub="Your best selling products" />
            <div style={{ marginBottom: 14 }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={charts.top_products} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: C.gray }} tickLine={false} axisLine={false}
                    tickFormatter={v => `R${v}`} />
                  <YAxis type="category" dataKey="product_name" tick={{ fontSize: 9, fill: C.gray }} tickLine={false} axisLine={false} width={80}
                    tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "â€¦" : v} />
                  <Tooltip formatter={val => [`R${Number(val).toFixed(2)}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill={C.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            {charts.top_products.map((p, i) => (
              <div key={p.product_name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < charts.top_products.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: CHART_COLORS[i] + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: CHART_COLORS[i], flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.product_name}</div>
                  <div style={{ fontSize: 10, color: C.gray }}>{p.units_sold} units sold</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>R{p.revenue.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* â”€â”€ Revenue by store â”€â”€ */}
        {charts?.revenue_by_store && charts.revenue_by_store.length > 1 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 20 }}>
            <SectionHead title="ðŸª Revenue by Store" />
            {charts.revenue_by_store.map((store, i) => {
              const maxRevenue = Math.max(...charts.revenue_by_store.map(s => s.revenue));
              const pct = maxRevenue > 0 ? (store.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={store.store_name} style={{ marginBottom: i < charts.revenue_by_store.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{store.store_name}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>R{store.revenue.toFixed(2)}</div>
                  </div>
                  <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 3 }}>{store.orders} order{store.orders !== 1 ? "s" : ""}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* â”€â”€ My Stores overview â”€â”€ */}
        {data?.stores && data.stores.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 20 }}>
            <SectionHead title="ðŸª My Stores Overview" />
            {data.stores.map(store => (
              <div key={store.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.softOrange, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                 {(store as any).logo_url ? <img src={(store as any).logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "ðŸª"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{store.name}</div>
                  <div style={{ fontSize: 11, color: C.gray }}>
                    {store.product_count} products Â· {store.follower_count} followers Â· â­ {Number(store.rating).toFixed(1)}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/stores/${store.id}`)}
                  style={{ background: C.softOrange, color: C.primary, border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Manage â†’
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}


