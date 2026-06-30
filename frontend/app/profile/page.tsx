"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import BottomNav from "@/components/navigation/BottomNav";
import Header from "@/components/layout/Header";

const BASE   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P      = "#E8401C";
const DARK   = "#0F0F0F";
const MUTED  = "#71717A";
const BG     = "#F7F7F5";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E4E7";

type ActiveTab = "following" | "liked" | "subscriptions" | "activity";

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, background: WHITE, borderRadius: 12,
        padding: "14px 10px", textAlign: "center",
        border: `0.5px solid ${BORDER}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color: DARK }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{label}</div>
    </button>
  );
}

/* ── Tab button ─────────────────────────────────────────────── */
function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "11px 14px", background: "none", border: "none",
        cursor: "pointer", fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? P : MUTED,
        borderBottom: `2px solid ${active ? P : "transparent"}`,
        whiteSpace: "nowrap", flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { authUser, profile, isLoggedIn, loading: authLoading } = useAuth();

  const [activeTab,   setActiveTab]   = useState<ActiveTab>("following");
  const [stores,      setStores]      = useState<any[]>([]);
  const [orders,      setOrders]      = useState<any[]>([]);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  /* Redirect if not logged in */
  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  /* Load stores + orders */
  useEffect(() => {
    if (!authUser) return;
    const load = async () => {
      try {
        const { data: sd } = await supabase.auth.getSession();
        const token = sd.session?.access_token;
        const [sr, or] = await Promise.all([
          fetch(`${BASE}/api/vendors/my/stores`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BASE}/api/orders/my-orders`,  { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const storeData = await sr.json();
        const orderData = await or.json();
        if (storeData.success) setStores(storeData.stores || []);
        if (orderData.success) setOrders(orderData.orders || []);
        setAvatarUrl((authUser as any).user_metadata?.avatar_url || null);
      } catch { /* silent */ }
      finally { setPageLoading(false); }
    };
    load();
  }, [authUser]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUrl(URL.createObjectURL(file));
    try {
      const ext  = file.name.split(".").pop();
      const path = `avatars/${authUser?.id}.${ext}`;
      const { error } = await supabase.storage.from("maizu").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("maizu").getPublicUrl(path);
        await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
        setAvatarUrl(data.publicUrl);
      }
    } catch { /* silent */ }
  };

  /* Derived values */
  const p            = profile as any;
  const displayName  = p?.full_name || (authUser as any)?.user_metadata?.full_name || authUser?.email?.split("@")[0] || "User";
  const initials     = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const userRole     = p?.role || "buyer";
  const isVendor     = userRole === "vendor" || userRole === "admin";
  const currentPlan  = p?.plan || "free";

  const planLabel: Record<string, string> = {
    free:  "1 store · 10 products · 5% commission",
    basic: "3 stores · 50 products · 3% commission",
    pro:   "Unlimited stores · 1% commission",
  };

  /* Loading spinner */
  if (authLoading || pageLoading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${P}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 80 }}>
      <Header />

      {/* ── Profile header ── */}
      <div style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}`, padding: "24px 16px 20px" }}>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>

          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: avatarUrl ? "transparent" : `linear-gradient(135deg,${P},#FF8C61)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 24, fontWeight: 800, color: WHITE }}>{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: P, border: `2px solid ${WHITE}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </div>

          {/* Name + role */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: DARK, marginBottom: 3 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, textTransform: "capitalize" }}>
              {userRole === "vendor" ? "Vendor · Maizu Business Hub" : userRole === "admin" ? "Admin" : "Shopper"}
            </div>
            {authUser?.email && (
              <div style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {authUser.email}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ background: "#F4F4F4", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 500, color: DARK, cursor: "pointer" }}
            >
              Edit
            </button>
            <button
              onClick={handleSignOut}
              style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 500, color: "#EF4444", cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard label="Stores"    value={stores.length}  onClick={() => router.push("/dashboard")} />
          <StatCard label="Following" value={0} />
          <StatCard label="Followers" value={0} />
          <StatCard label="Orders"    value={orders.length}  onClick={() => router.push("/orders")} />
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ padding: "14px 16px", display: "flex", gap: 8 }}>
        {isVendor ? (
          <button
            onClick={() => router.push("/dashboard")}
            style={{ flex: 1, background: P, color: WHITE, border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Vendor dashboard
          </button>
        ) : (
          <button
            onClick={() => router.push("/sell")}
            style={{ flex: 1, background: P, color: WHITE, border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Open a store
          </button>
        )}
        <button
          onClick={() => router.push("/orders")}
          style={{ flex: 1, background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 500, color: DARK, cursor: "pointer" }}
        >
          My orders
        </button>
        <button
          onClick={() => router.push("/wishlist")}
          style={{ flex: 1, background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 500, color: DARK, cursor: "pointer" }}
        >
          Saved
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: WHITE, borderBottom: `0.5px solid ${BORDER}`, display: "flex", overflowX: "auto", marginTop: 6 }}>
        <TabBtn active={activeTab === "following"}     label="Following"       onClick={() => setActiveTab("following")}     />
        <TabBtn active={activeTab === "liked"}         label="Liked stores"    onClick={() => setActiveTab("liked")}         />
        <TabBtn active={activeTab === "subscriptions"} label="Subscription"    onClick={() => setActiveTab("subscriptions")} />
        <TabBtn active={activeTab === "activity"}      label="Recent activity" onClick={() => setActiveTab("activity")}      />
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: "20px 16px" }}>

        {(activeTab === "following" || activeTab === "liked") && (
          <div style={{ background: WHITE, borderRadius: 16, padding: "36px 20px", textAlign: "center", border: `0.5px solid ${BORDER}` }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#F4F4F4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 6 }}>Nothing here yet</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 18 }}>
              {activeTab === "following" ? "Follow stores to see their updates here." : "Like a store to save it here."}
            </div>
            <button
              onClick={() => router.push("/stores")}
              style={{ background: P, color: WHITE, border: "none", borderRadius: 22, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Browse stores
            </button>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div style={{ background: WHITE, borderRadius: 16, padding: "20px", border: `0.5px solid ${BORDER}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 14 }}>Current plan</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#F9FAFB", borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: DARK, textTransform: "capitalize" }}>
                  {currentPlan}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                  {planLabel[currentPlan] || planLabel.free}
                </div>
              </div>
              <button
                onClick={() => router.push("/pricing")}
                style={{ background: P, color: WHITE, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Upgrade
              </button>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orders.length === 0 ? (
              <div style={{ background: WHITE, borderRadius: 16, padding: "32px 20px", textAlign: "center", border: `0.5px solid ${BORDER}` }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 6 }}>No activity yet</div>
                <div style={{ fontSize: 13, color: MUTED }}>Your orders will appear here.</div>
              </div>
            ) : (
              orders.slice(0, 5).map((o: any) => (
                <div
                  key={o.id}
                  onClick={() => router.push(`/orders/${o.id}`)}
                  style={{ background: WHITE, borderRadius: 12, padding: "14px 16px", border: `0.5px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                > 
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: DARK }}>Order #{o.id.slice(0, 8).toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString("en-ZA")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>R{Number(o.total_amount).toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: MUTED, textTransform: "capitalize", marginTop: 2 }}>{o.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ── Footer links ── */}
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ background: WHITE, borderRadius: 14, overflow: "hidden", border: `0.5px solid ${BORDER}` }}>
          {[
            { label: "Privacy Policy",   path: "/privacy" },
            { label: "Terms of Service", path: "/terms" },
            { label: "Help & Support",   path: "/support" },
            { label: "About Maizu",      path: "/about" },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: i < arr.length - 1 ? `0.5px solid ${BORDER}` : "none" }}
            >
              <span style={{ fontSize: 13, color: DARK }}>{item.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
