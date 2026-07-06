"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/*
  DesktopSidebar - left navigation for tablet/desktop.
  Item/Section are declared at module scope (not inside the component)
  so React preserves their identity across renders - fixes the
  react-hooks/static-components errors and the state-reset behaviour.
*/

const I = {
  home:      <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  search:    <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  video:     <><rect x="2" y="6" width="13" height="12" rx="2" /><path d="m15 10 7-4v12l-7-4" /></>,
  store:     <><path d="M3 9 4.5 4h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  orders:    <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  heart:     <path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6 3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 3.7-3.5 6.9-8.5 10.9Z" />,
  bell:      <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  user:      <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></>,
  grid:      <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  plus:      <path d="M12 5v14M5 12h14" />,
  chart:     <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" />,
  card:      <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  out:       <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
};

function Icon({ d, size = 18 }: { d: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d}
    </svg>
  );
}

/* Module-scope nav components - stable identity across renders */
function SidebarItem({ path, icon, label, isActive, onNavigate }: {
  path:       string;
  icon:       React.ReactNode;
  label:      string;
  isActive:   boolean;
  onNavigate: (p: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(path)}
      className="msb-item"
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        padding: "10px 14px", border: "none", borderRadius: 10, cursor: "pointer",
        background: isActive ? "#FDEAE4" : "transparent",
        color: isActive ? "#E8401C" : "#3D4351",
        fontSize: 14, fontWeight: isActive ? 700 : 500, textAlign: "left",
      }}
    >
      <Icon d={icon} />
      {label}
    </button>
  );
}

function SidebarSection({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.6, color: "#9CA1AD", padding: "18px 14px 6px" }}>
      {title}
    </div>
  );
}

export default function DesktopSidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { authUser, profile, signOut } = useAuth();

  const role     = profile?.role || "buyer";
  const isVendor = role === "vendor" || role === "admin";
  const isAdmin  = role === "admin";

  const go = (p: string) => router.push(p);
  const active = (p: string) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/");

  return (
    <aside
      className="desktop-sidebar"
      style={{
        width: 240, minWidth: 240, height: "100vh", position: "sticky", top: 0,
        background: "#FFFFFF", borderRight: "1px solid #ECECEA",
        display: "flex", flexDirection: "column",
      }}
    >
      <style>{`.msb-item:hover{ background:#F6F6F4 !important; }`}</style>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
        <SidebarSection title="BROWSE" />
        <SidebarItem path="/"          icon={I.home}   label="Home"     isActive={active("/")}          onNavigate={go} />
        <SidebarItem path="/search"    icon={I.search} label="Search"   isActive={active("/search")}    onNavigate={go} />
        <SidebarItem path="/discovery" icon={I.video}  label="Discover" isActive={active("/discovery")} onNavigate={go} />
        <SidebarItem path="/stores"    icon={I.store}  label="Stores"   isActive={active("/stores")}    onNavigate={go} />

        {authUser && (
          <>
            <SidebarSection title="MY ACCOUNT" />
            <SidebarItem path="/orders"        icon={I.orders} label="My Orders"     isActive={active("/orders")}        onNavigate={go} />
            <SidebarItem path="/saved"         icon={I.heart}  label="Saved"         isActive={active("/saved")}         onNavigate={go} />
            <SidebarItem path="/notifications" icon={I.bell}   label="Notifications" isActive={active("/notifications")} onNavigate={go} />
            <SidebarItem path="/profile"       icon={I.user}   label="Profile"       isActive={active("/profile")}       onNavigate={go} />
          </>
        )}

        {isVendor && (
          <>
            <SidebarSection title="VENDOR" />
            <SidebarItem path="/dashboard"                icon={I.grid}   label="Dashboard"    isActive={active("/dashboard")}                onNavigate={go} />
            <SidebarItem path="/dashboard/create-product" icon={I.plus}   label="Add Product"  isActive={active("/dashboard/create-product")} onNavigate={go} />
            <SidebarItem path="/dashboard/orders"         icon={I.orders} label="Store Orders" isActive={active("/dashboard/orders")}         onNavigate={go} />
            <SidebarItem path="/dashboard/analytics"      icon={I.chart}  label="Analytics"    isActive={active("/dashboard/analytics")}      onNavigate={go} />
            <SidebarItem path="/dashboard/subscription"   icon={I.card}   label="Subscription" isActive={active("/dashboard/subscription")}   onNavigate={go} />
          </>
        )}

        {isAdmin && (
          <>
            <SidebarSection title="ADMIN" />
            <SidebarItem path="/admin" icon={I.grid} label="Admin Panel" isActive={active("/admin")} onNavigate={go} />
          </>
        )}
      </div>

      {/* Bottom: user chip + sign out / sign in */}
      <div style={{ padding: 12, borderTop: "1px solid #ECECEA" }}>
        {authUser ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 12px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "#E8401C", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15,
              }}>
                {(profile?.full_name || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#161B26", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile?.full_name || "Account"}
                </div>
                <div style={{ fontSize: 11.5, color: "#9CA1AD", textTransform: "capitalize" }}>{role}</div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer",
                background: "#FDEAE4", color: "#E8401C", fontSize: 13.5, fontWeight: 700,
              }}
            >
              <Icon d={I.out} size={16} /> Sign out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => go("/sell")}
              style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer", background: "#E8401C", color: "#fff", fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}
            >
              Open a free store
            </button>
            <button
              onClick={() => go("/login")}
              style={{ width: "100%", padding: "10px 0", borderRadius: 10, cursor: "pointer", background: "#fff", color: "#161B26", fontSize: 13.5, fontWeight: 700, border: "1px solid #E3E3E0" }}
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </aside>
  );
}



