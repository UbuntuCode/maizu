"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { storesApi, ordersApi, type Store } from "@/utils/api";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const StatCard = ({ emoji, label, value, color = C.primary }: { emoji: string; label: string; value: string; color?: string }) => (
  <div style={{ background: C.white, borderRadius: 16, padding: "16px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{emoji}</div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const QuickAction = ({ emoji, label, desc, onClick, color = C.primary }: { emoji: string; label: string; desc: string; onClick: () => void; color?: string }) => (
  <button onClick={onClick} style={{ background: C.white, borderRadius: 16, padding: "16px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12, border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{emoji}</div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{label}</div>
      <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{desc}</div>
    </div>
    <div style={{ marginLeft: "auto", fontSize: 18, color: C.grayLight }}>›</div>
  </button>
);

const StoreRow = ({ store, onClick }: { store: Store; onClick: () => void }) => (
  <button onClick={onClick} style={{ background: C.white, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${C.border}`, cursor: "pointer", width: "100%", textAlign: "left", marginBottom: 8 }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: store.logo_url ? "transparent" : C.softOrange, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>
      {store.logo_url ? <img src={store.logo_url} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{store.name}</div>
      <div style={{ fontSize: 11, color: C.gray }}>{store.category} · {store.product_count} products</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div style={{ background: store.is_active ? "#E1F5EE" : "#F3F4F6", color: store.is_active ? "#085041" : C.gray, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
        {store.is_active ? "Active" : "Inactive"}
      </div>
      <div style={{ fontSize: 11, color: C.gray }}>{store.follower_count} followers</div>
    </div>
  </button>
);

export default function DashboardPage() {
  const router = useRouter();
  const { profile, authUser, loading, isLoggedIn } = useAuth();

  const [stores,        setStores]        = useState<Store[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders,   setTotalOrders]   = useState(0);
  const [pageLoading,   setPageLoading]   = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!authUser) return;
    const load = async () => {
      try {
        const [myStores, myOrders] = await Promise.all([
          storesApi.getMyStores(),
          ordersApi.getMyOrders(),
        ]);
        setStores(myStores);
        setTotalOrders(myOrders.length);
        setTotalProducts(myStores.reduce((s, st) => s + (st.product_count || 0), 0));
      } catch { /* silent */ }
      finally { setPageLoading(false); }
    };
    load();
  }, [authUser]);

  const isVendor   = profile?.role === "vendor" || profile?.role === "admin";
  const displayName = profile?.full_name || authUser?.user_metadata?.full_name || "User";

  if (loading || pageLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <Header />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${C.primary},#FF8C61)`, padding: "24px 16px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Welcome back 👋</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{displayName}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", textTransform: "capitalize" }}>
            {profile?.role || "buyer"} · Maizu Business Hub
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px", marginTop: -16, position: "relative", zIndex: 10 }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatCard emoji="🏪" label="My Stores"   value={stores.length.toString()}   color={C.primary} />
          <StatCard emoji="🏷️" label="Products"    value={totalProducts.toString()}    color="#3B82F6" />
          <StatCard emoji="📦" label="Orders"       value={totalOrders.toString()}      color="#10B981" />
          <StatCard emoji="👥" label="Followers"    value={stores.reduce((s, st) => s + (st.follower_count || 0), 0).toString()} color="#8B5CF6" />
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {isVendor && (
              <>
                <QuickAction emoji="📊" label="View Analytics" color="#8B5CF6"
                  desc="Sales charts, revenue trends and top products"
                  onClick={() => router.push("/dashboard/analytics")}
                />
                <QuickAction emoji="🏪" label="Open New Store" color={C.primary}
                  desc="Create a new storefront on Maizu Mall"
                  onClick={() => router.push("/dashboard/create-store")}
                />
                <QuickAction emoji="📦" label="Add Product" color="#3B82F6"
                  desc="Add a product to one of your stores"
                  onClick={() => stores.length > 0 ? router.push(`/dashboard/stores/${stores[0].id}`) : router.push("/dashboard/create-store")}
                />
              </>
            )}
            <QuickAction emoji="🛍" label="Browse Stores" color="#10B981"
              desc="Discover products from South African vendors"
              onClick={() => router.push("/stores")}
            />
            <QuickAction emoji="📋" label="My Orders" color="#F59E0B"
              desc="Track your orders and delivery status"
              onClick={() => router.push("/orders")}
            />
            {!isVendor && (
              <QuickAction emoji="🚀" label="Become a Vendor" color="#8B5CF6"
                desc="Open your own store and start selling"
                onClick={() => router.push("/dashboard/become-vendor")}
              />
            )}
          </div>
        </div>

        {/* My Stores */}
        {isVendor && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>My Stores</div>
              <button onClick={() => router.push("/dashboard/create-store")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                + New Store
              </button>
            </div>

            {stores.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 16, padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏪</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 6 }}>No stores yet</div>
                <button onClick={() => router.push("/dashboard/create-store")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Create First Store
                </button>
              </div>
            ) : (
              stores.map(store => (
                <StoreRow key={store.id} store={store} onClick={() => router.push(`/dashboard/stores/${store.id}`)} />
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
