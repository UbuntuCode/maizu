"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { PinIc, PeopleIc, EditIc, GearIc, ImgIc } from "@/components/ui/icons";
import Header from "@/components/layout/Header";
import Footer from "@/components/ui/Footer";
import BottomNav from "@/components/navigation/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { storesApi, type Store } from "@/utils/api";

const tabs = [
  { id: "following",    label: "Following",      icon: "👤" },
  { id: "liked_stores", label: "Liked Stores",   icon: "❤️" },
  { id: "subscriptions",label: "Subscriptions",  icon: "🔔" },
  { id: "activity",     label: "Recent Activity",icon: "🕐" },
];

export default function ProfilePage() {
  const router                              = useRouter();
  const { authUser, profile, loading, isLoggedIn, signOut } = useAuth();
  const [activeTab,    setActiveTab]    = useState("following");
  const [myStores,     setMyStores]     = useState<Store[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (profile?.role === "vendor" || profile?.role === "admin") {
      setStoreLoading(true);
      storesApi.getMyStores()
        .then(s => setMyStores(s))
        .catch(() => {})
        .finally(() => setStoreLoading(false));
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading || !authUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loading…</div>
      </div>
    );
  }

  const displayName = profile?.full_name || authUser.user_metadata?.full_name || "User";
  const displayRole = profile?.role      || authUser.user_metadata?.role      || "buyer";
  const displayEmail= profile?.email     || authUser.email || "";

  const stats = [
    { emoji: "🏪", val: myStores.length.toString(), label: "My Stores" },
    { emoji: "👥", val: "0",  label: "Following" },
    { emoji: "👤", val: "0",  label: "Followers" },
    { emoji: "❤️", val: "0",  label: "Liked Items" },
  ];

  return (
    <div className="page-enter" style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <Header />

      {/* Profile card */}
      <div style={{ background: C.white, padding: "22px 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          {/* Avatar */}
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg,#E8401C,#FF8C61)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", flexShrink: 0, border: `3px solid ${C.border}`, overflow: "hidden" }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : displayName.charAt(0).toUpperCase()
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 3, gap: 6, flexWrap: "wrap" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>{displayName}</div>
              <div style={{ display: "flex", gap: 7 }}>
                <button style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", fontSize: 11, color: C.dark, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                  <EditIc /> Edit
                </button>
                <button style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <GearIc />
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 4, textTransform: "capitalize" }}>
              {displayRole === "vendor" ? "Entrepreneur & Store Owner" : "Shopper"}
            </div>
            <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.6 }}>
              {profile?.bio || "No bio yet."}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <div style={{ fontSize: 11, color: C.gray, background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 20, padding: "3px 10px" }}>
                ✉️ {displayEmail}
              </div>
              <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: C.gray, cursor: "pointer" }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: C.softOrange, borderRadius: 12, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Stores (vendors only) */}
      {(displayRole === "vendor" || displayRole === "admin") && (
        <div style={{ background: C.white, marginTop: 10, padding: "18px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>My Stores</div>
            <button onClick={() => router.push("/dashboard/create-store")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              🏪 Open New Store
            </button>
          </div>

          {storeLoading ? (
            <div style={{ textAlign: "center", padding: 20, color: C.gray, fontSize: 13 }}>Loading stores…</div>
          ) : myStores.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: C.gray }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
              <div style={{ fontSize: 13 }}>You haven&apos;t opened a store yet.</div>
              <button onClick={() => router.push("/dashboard/create-store")} style={{ marginTop: 12, background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Create First Store
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {myStores.map(st => (
                <div key={st.id} style={{ background: C.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ height: 100, background: "#F5F5F5", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {st.logo_url ? <img src={st.logo_url} alt={st.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImgIc />}
                    {st.is_active && <div style={{ position: "absolute", top: 8, right: 8, background: C.green, color: "#fff", borderRadius: 12, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>Active</div>}
                  </div>
                  <div style={{ padding: "10px 12px 12px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 4 }}>{st.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.gray, marginBottom: 8 }}>
                      <PinIc /> {st.floor_location || st.category}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginBottom: 10 }}>
                      <span>🏷️ {st.product_count} products</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><PeopleIc />{st.follower_count}</span>
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <button style={{ flex: 1, background: C.primary, color: "#fff", border: "none", borderRadius: 24, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Store</button>
                      <button style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: "7px 14px", fontSize: 12, color: C.dark, cursor: "pointer" }}>Manage</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity tabs */}
      <div style={{ background: C.white, marginTop: 10 }}>
        <div style={{ padding: "18px 16px 0", fontSize: 18, fontWeight: 800, color: C.dark }}>My Activity & Interests</div>
        <div style={{ display: "flex", overflowX: "auto", padding: "10px 16px 0", borderBottom: `1px solid ${C.border}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", padding: "7px 10px", fontSize: 11, color: activeTab === t.id ? C.primary : C.gray, fontWeight: activeTab === t.id ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", borderBottom: activeTab === t.id ? `2.5px solid ${C.primary}` : "2.5px solid transparent", marginBottom: -1 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "28px 16px", textAlign: "center", color: C.gray }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 13 }}>Nothing here yet</div>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
