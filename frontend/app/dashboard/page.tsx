"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

/*
  Vendor Dashboard — full redesign.
  Light, professional layout: greeting band, live stat cards,
  quick actions and the vendor's stores. No emojis, SVG icons only.
*/

const T = {
  primary: "#E8401C",
  primarySoft: "#FDEAE4",
  ink: "#161B26",
  sub: "#6B7080",
  faint: "#9CA1AD",
  bg: "#F7F7F5",
  card: "#FFFFFF",
  border: "#ECECEA",
  green: "#0F9D58",
  greenSoft: "#E6F4EC",
};

function Ic({ d, size = 20, color = "currentColor" }: { d: React.ReactNode; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  );
}
const P = {
  store:  <><path d="M3 9 4.5 4h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  box:    <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  orders: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  cash:   <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></>,
  plus:   <path d="M12 5v14M5 12h14" />,
  chart:  <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" />,
  arrow:  <path d="M5 12h14m-6-6 6 6-6 6" />,
};

export default function VendorDashboard() {
  const router = useRouter();
  const { authUser, profile } = useAuth() as any;

  const [stores, setStores]     = useState<any[]>([]);
  const [stats, setStats]       = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      try {
        const { data: st } = await supabase
          .from("stores").select("*").eq("owner_id", authUser.id)
          .order("created_at", { ascending: false });
        const myStores = st || [];
        setStores(myStores);

        if (myStores.length) {
          const ids = myStores.map((s: any) => s.id);

          const { count: pCount } = await supabase
            .from("products").select("id", { count: "exact", head: true })
            .in("store_id", ids);

          const { data: items } = await supabase
            .from("order_items").select("order_id, subtotal").in("store_id", ids);

          const orderIds = new Set((items || []).map((i: any) => i.order_id));
          const revenue  = (items || []).reduce((s: number, i: any) => s + Number(i.subtotal || 0), 0);

          setStats({ products: pCount || 0, orders: orderIds.size, revenue });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser]);

  const fmtR = (n: number) =>
    "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const firstName = (profile?.full_name || "Vendor").split(" ")[0];

  const StatCard = ({ icon, label, value, tint, tintBg }: any) => (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
      padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, minWidth: 0,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: tintBg,
        display: "flex", alignItems: "center", justifyContent: "center", color: tint, flexShrink: 0,
      }}>
        <Ic d={icon} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.faint }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: -0.4 }}>
          {loading ? "—" : value}
        </div>
      </div>
    </div>
  );

  const Action = ({ icon, title, desc, onClick, primary }: any) => (
    <button onClick={onClick} className="mzd-action" style={{
      display: "flex", alignItems: "center", gap: 14, textAlign: "left", width: "100%",
      background: primary ? T.primary : T.card,
      border: primary ? "none" : `1px solid ${T.border}`,
      borderRadius: 16, padding: "16px 18px", cursor: "pointer",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: primary ? "rgba(255,255,255,.18)" : T.primarySoft,
        color: primary ? "#fff" : T.primary,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Ic d={icon} size={19} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: primary ? "#fff" : T.ink }}>{title}</div>
        <div style={{ fontSize: 12.5, color: primary ? "rgba(255,255,255,.85)" : T.sub, marginTop: 2 }}>{desc}</div>
      </div>
      <Ic d={P.arrow} size={17} color={primary ? "#fff" : T.faint} />
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <style>{`
        .mzd-action{ transition: transform .12s ease, box-shadow .12s ease; }
        .mzd-action:hover{ transform: translateY(-1px); box-shadow: 0 6px 18px rgba(22,27,38,.07); }
        .mzd-grid4{ display:grid; grid-template-columns: repeat(4,1fr); gap:14px; }
        .mzd-grid3{ display:grid; grid-template-columns: repeat(3,1fr); gap:14px; }
        @media (max-width: 980px){ .mzd-grid4{ grid-template-columns: repeat(2,1fr);} .mzd-grid3{ grid-template-columns: 1fr;} }
        @media (max-width: 520px){ .mzd-grid4{ grid-template-columns: 1fr 1fr;} }
      `}</style>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* Greeting band */}
        <div style={{
          background: T.ink, borderRadius: 20, padding: "26px 26px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          backgroundImage: "radial-gradient(circle at 88% 0%, rgba(232,64,28,.35), transparent 46%)",
        }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,.55)" }}>
              VENDOR DASHBOARD
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginTop: 6, letterSpacing: -0.4 }}>
              Welcome back, {firstName}
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", marginTop: 4 }}>
              Here is how your business is doing on Maizu today.
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/create-product")}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: T.primary, color: "#fff",
              border: "none", borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <Ic d={P.plus} size={17} /> Add product
          </button>
        </div>

        {/* Stats */}
        <div className="mzd-grid4" style={{ marginTop: 18 }}>
          <StatCard icon={P.store}  label="Stores"        value={stores.length}  tint={T.primary} tintBg={T.primarySoft} />
          <StatCard icon={P.box}    label="Products"      value={stats.products} tint="#2563EB"   tintBg="#E8EFFD" />
          <StatCard icon={P.orders} label="Orders"        value={stats.orders}   tint="#7C3AED"   tintBg="#F1EAFD" />
          <StatCard icon={P.cash}   label="Total sales"   value={fmtR(stats.revenue)} tint={T.green} tintBg={T.greenSoft} />
        </div>

        {/* Quick actions */}
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: "26px 0 12px" }}>Quick actions</div>
        <div className="mzd-grid3">
          <Action primary icon={P.plus} title="Add a product" desc="List something new in one of your stores"
            onClick={() => router.push("/dashboard/create-product")} />
          <Action icon={P.orders} title="Manage orders" desc="Confirm, ship and track customer orders"
            onClick={() => router.push("/dashboard/orders")} />
          <Action icon={P.chart} title="View analytics" desc="Sales, views and performance over time"
            onClick={() => router.push("/dashboard/analytics")} />
        </div>

        {/* Stores */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "26px 0 12px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Your stores</div>
          <button
            onClick={() => router.push("/dashboard/create-store")}
            style={{ background: "none", border: "none", color: T.primary, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
          >
            + Open new store
          </button>
        </div>

        {loading ? (
          <div style={{ color: T.sub, fontSize: 14, padding: 20 }}>Loading your stores…</div>
        ) : stores.length === 0 ? (
          <div style={{
            background: T.card, border: `1px dashed #D8D8D4`, borderRadius: 18,
            padding: "44px 20px", textAlign: "center",
          }}>
            <div style={{ display: "inline-flex", width: 56, height: 56, borderRadius: 16, background: T.primarySoft, color: T.primary, alignItems: "center", justifyContent: "center" }}>
              <Ic d={P.store} size={26} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, marginTop: 14 }}>You have no store yet</div>
            <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6 }}>
              Open your first store and start selling across South Africa in minutes.
            </div>
            <button
              onClick={() => router.push("/dashboard/create-store")}
              style={{ marginTop: 18, background: T.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Open your store
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {stores.map((s) => (
              <div key={s.id} className="mzd-action"
                onClick={() => router.push(`/dashboard/stores/${s.id}`)}
                style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
                  padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                }}
              >
                {s.logo_url ? (
                  <img src={s.logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: T.primarySoft, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {(s.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>
                    {s.category || "General"} · Manage products & details
                  </div>
                </div>
                <Ic d={P.arrow} size={17} color={T.faint} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
