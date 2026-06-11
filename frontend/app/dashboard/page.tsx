"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const BASE   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P      = "#E8401C";
const DARK   = "#0F0F0F";
const MUTED  = "#71717A";
const BG     = "#F7F7F5";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E4E7";
const GREEN  = "#10B981";

/* ── Icon paths ─────────────────────────────────────────────── */
const Icons = {
  revenue:   "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  orders:    "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  products:  "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  followers: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 1-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  stores:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  analytics: "M18 20V10 M12 20V4 M6 20v-6",
  add:       "M12 5v14 M5 12h14",
  promo:     "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
  settings:  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4M12 16h.01",
  arrow:     "M5 12h14 M12 5l7 7-7 7",
  back:      "M15 18l-6-6 6-6",
};

function SvgIcon({ d, size=18, color=MUTED }: { d:string; size?:number; color?:string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((path, i) => <path key={i} d={i===0?path:"M"+path} />)}
    </svg>
  );
}

function StatCard({ label, value, icon, color, sub, onClick }: { label:string; value:string; icon:string; color:string; sub?:string; onClick?:()=>void }) {
  return (
    <div onClick={onClick} style={{ background:WHITE, borderRadius:14, padding:"16px", border:`0.5px solid ${BORDER}`, cursor:onClick?"pointer":"default", transition:"box-shadow 0.15s" }}
      onMouseEnter={e => { if(onClick)(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow="none"; }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <SvgIcon d={icon} color={color} size={17} />
        </div>
        {sub && <span style={{ fontSize:10, color:GREEN, fontWeight:600 }}>{sub}</span>}
      </div>
      <div style={{ fontSize:24, fontWeight:800, color:DARK, marginBottom:3 }}>{value}</div>
      <div style={{ fontSize:11, color:MUTED }}>{label}</div>
    </div>
  );
}

function QuickAction({ label, desc, icon, color, onClick }: { label:string; desc:string; icon:string; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, background:WHITE, border:`0.5px solid ${BORDER}`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor=color; (e.currentTarget as HTMLButtonElement).style.boxShadow=`0 4px 16px ${color}18`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor=BORDER; (e.currentTarget as HTMLButtonElement).style.boxShadow="none"; }}>
      <div style={{ width:44, height:44, borderRadius:12, background:color+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <SvgIcon d={icon} color={color} size={20} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:DARK, marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:12, color:MUTED }}>{desc}</div>
      </div>
      <SvgIcon d={Icons.arrow} color={MUTED} size={16} />
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { authUser, profile, isLoggedIn, loading: authLoading } = useAuth();
  const p = profile as any;

  const [stats,       setStats]       = useState({ revenue:0, orders:0, products:0, followers:0, stores:0 });
  const [stores,      setStores]      = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!authUser) return;
    const load = async () => {
      try {
        const { data: sd } = await supabase.auth.getSession();
        const token = sd.session?.access_token;
        const [sr, ar] = await Promise.all([
          fetch(`${BASE}/api/vendors/my/stores`, { headers:{ Authorization:`Bearer ${token}` } }),
          fetch(`${BASE}/api/analytics/summary`, { headers:{ Authorization:`Bearer ${token}` } }),
        ]);
        const storeData = await sr.json();
        const anaData   = await ar.json();
        if (storeData.success) setStores(storeData.stores || []);
        if (anaData.success)   setStats({ revenue: anaData.summary?.total_revenue||0, orders: anaData.summary?.total_orders||0, products: anaData.summary?.total_products||0, followers: anaData.summary?.total_followers||0, stores: storeData.stores?.length||0 });
      } catch { /* silent */ }
      finally { setPageLoading(false); }
    };
    load();
  }, [authUser]);

  const displayName = p?.full_name || (authUser as any)?.user_metadata?.full_name || "Vendor";
  const firstName   = displayName.split(" ")[0];

  if (authLoading || pageLoading) {
    return (
      <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${P}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background:BG, minHeight:"100vh", paddingBottom:80 }}>
      <Header />

      <div className="page-content">
        {/* Welcome banner */}
        <div style={{ background:`linear-gradient(135deg,${P} 0%,#C0320F 100%)`, borderRadius:16, padding:"20px", margin:"14px 14px 0", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
          <div style={{ position:"absolute", bottom:-40, left:-10, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <div style={{ position:"relative" }}>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:4 }}>Welcome back</div>
            <div style={{ fontSize:22, fontWeight:800, color:WHITE, marginBottom:3 }}>{firstName}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>
              {p?.role === "admin" ? "Platform Administrator" : "Vendor · Maizu Business Hub"}
            </div>
            {p?.plan && p.plan !== "free" && (
              <div style={{ marginTop:8, background:"rgba(255,255,255,0.18)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color:WHITE, display:"inline-block" }}>
                {p.plan.toUpperCase()} PLAN
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding:"14px 14px 0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <StatCard label="Total Revenue"    value={`R${Number(stats.revenue).toFixed(2)}`}  icon={Icons.revenue}   color={GREEN}    sub="+0% this week" onClick={() => router.push("/dashboard/analytics")} />
          <StatCard label="Total Orders"     value={String(stats.orders)}                     icon={Icons.orders}    color="#3B82F6"  onClick={() => router.push("/dashboard/orders")} />
          <StatCard label="Products Listed"  value={String(stats.products)}                   icon={Icons.products}  color="#7C3AED"  onClick={() => router.push("/dashboard/products")} />
          <StatCard label="Store Followers"  value={String(stats.followers)}                  icon={Icons.followers} color="#F59E0B"  />
        </div>

        {/* My stores */}
        {stores.length > 0 && (
          <div style={{ padding:"20px 14px 0" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ fontSize:15, fontWeight:700, color:DARK }}>My Stores</div>
              <button onClick={() => router.push("/dashboard/stores/new")} style={{ background:P, color:WHITE, border:"none", borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                <SvgIcon d={Icons.add} color={WHITE} size={12} /> New store
              </button>
            </div>
            {stores.map(store => (
              <div key={store.id} onClick={() => router.push(`/dashboard/stores/${store.id}`)}
                style={{ background:WHITE, borderRadius:14, padding:"14px", border:`0.5px solid ${BORDER}`, marginBottom:10, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:store.logo_url?"transparent":`linear-gradient(135deg,${P},#FF8C61)`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18, fontWeight:800, color:WHITE }}>
                  {store.logo_url ? <img src={store.logo_url} alt={store.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : store.name?.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:DARK }}>{store.name}</div>
                  <div style={{ fontSize:11, color:MUTED }}>{store.category} · {store.product_count||0} products</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:store.is_active?GREEN:"#EF4444" }} />
                  <span style={{ fontSize:10, color:store.is_active?GREEN:"#EF4444", fontWeight:600 }}>{store.is_active?"Active":"Inactive"}</span>
                  <SvgIcon d="M9 18l6-6-6-6" color={MUTED} size={14} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ padding:"20px 14px 0" }}>
          <div style={{ fontSize:15, fontWeight:700, color:DARK, marginBottom:12 }}>Quick actions</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <QuickAction label="Add a product"     desc="List a new product in your store"         icon={Icons.add}       color={P}        onClick={() => router.push("/dashboard/products/new")} />
            <QuickAction label="View analytics"    desc="Track revenue, orders and top products"   icon={Icons.analytics} color="#3B82F6"  onClick={() => router.push("/dashboard/analytics")} />
            <QuickAction label="Manage orders"     desc="See and update your incoming orders"      icon={Icons.orders}    color="#10B981"  onClick={() => router.push("/dashboard/orders")} />
            <QuickAction label="Create promo code" desc="Give discounts to your buyers"            icon={Icons.promo}     color="#7C3AED"  onClick={() => router.push("/dashboard/promos")} />
            <QuickAction label="Subscription plan" desc="Upgrade to reduce commission"             icon={Icons.settings}  color="#F59E0B"  onClick={() => router.push("/dashboard/subscription")} />
            {stores.length === 0 && (
              <QuickAction label="Open your store" desc="Create your first store on Maizu"         icon={Icons.stores}    color={P}        onClick={() => router.push("/dashboard/stores/new")} />
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
