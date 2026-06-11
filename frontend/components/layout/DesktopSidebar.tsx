"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const P      = "#E8401C";
const DARK   = "#0F0F0F";
const MUTED  = "#71717A";
const BORDER = "#E4E4E7";
const SOFT   = "#FFF3EF";
const WHITE  = "#FFFFFF";
const BG     = "#F7F7F5";

/* ── SVG icon helper ────────────────────────────────────────── */
function Icon({ d, size=16, color=MUTED }: { d:string; size?:number; color?:string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((path, i) => <path key={i} d={i===0?path:"M"+path} />)}
    </svg>
  );
}

const PATHS = {
  home:      "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  search:    "M11 11m-8 0a8 8 0 1 0 16 0 8 8 0 0 0-16 0 M21 21l-4.35-4.35",
  discover:  "M23 7L16 12 23 17 23 7 M1 5h15v14H1z",
  stores:    "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18",
  wishlist:  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  orders:    "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  profile:   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  bell:      "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  analytics: "M18 20V10 M12 20V4 M6 20v-6",
  products:  "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  promo:     "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  admin:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  signout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  add:       "M12 5v14 M5 12h14",
};

function NavLink({ href, label, iconPath, badge }: { href:string; label:string; iconPath:string; badge?:number }) {
  const pathname = usePathname();
  const router   = useRouter();
  const active   = href==="/" ? pathname==="/" : pathname===href || pathname.startsWith(href+"/");

  return (
    <button onClick={() => router.push(href)}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 16px", background:active?SOFT:"transparent", border:"none", cursor:"pointer", borderLeft:`3px solid ${active?P:"transparent"}`, transition:"background 0.15s", position:"relative" }}>
      <Icon d={iconPath} color={active?P:MUTED} size={16} />
      <span style={{ fontSize:13, fontWeight:active?600:400, color:active?P:DARK, flex:1, textAlign:"left" }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{ background:P, color:WHITE, borderRadius:"50%", width:18, height:18, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{badge>9?"9+":badge}</span>
      )}
    </button>
  );
}

const Divider = () => <div style={{ height:"0.5px", background:BORDER, margin:"6px 16px" }} />;
const Label   = ({ text }: { text:string }) => <div style={{ padding:"8px 16px 3px", fontSize:9, fontWeight:700, color:MUTED, letterSpacing:"0.1em" }}>{text}</div>;

export default function DesktopSidebar() {
  const router = useRouter();
  const { isLoggedIn, profile, authUser } = useAuth();
  const p        = profile as any;
  const isVendor = p?.role === "vendor" || p?.role === "admin";
  const isAdmin  = p?.role === "admin";
  const name     = p?.full_name || (authUser as any)?.user_metadata?.full_name || "Account";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="desktop-sidebar" style={{ display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div style={{ flex:1, overflowY:"auto" }}>

        {/* Logo */}
        <div onClick={() => router.push("/")} style={{ padding:"16px 16px 12px", cursor:"pointer" }}>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:"-0.03em" }}>
            <span style={{ color:P }}>mai</span><span style={{ color:DARK }}>zu</span>
          </div>
          <div style={{ fontSize:8, fontWeight:700, color:MUTED, letterSpacing:"0.12em" }}>BUSINESS HUB</div>
        </div>

        <Divider />

        {/* Browse */}
        <Label text="BROWSE" />
        <NavLink href="/"          label="Home"          iconPath={PATHS.home}     />
        <NavLink href="/search"    label="Search"        iconPath={PATHS.search}   />
        <NavLink href="/discovery" label="Discover"      iconPath={PATHS.discover} />
        <NavLink href="/stores"    label="Stores"        iconPath={PATHS.stores}   />

        {isLoggedIn && (
          <>
            <Divider />
            <Label text="MY ACCOUNT" />
            <NavLink href="/orders"        label="My Orders"    iconPath={PATHS.orders}   />
            <NavLink href="/wishlist"      label="Saved"        iconPath={PATHS.wishlist} />
            <NavLink href="/notifications" label="Notifications"iconPath={PATHS.bell}     />
            <NavLink href="/profile"       label="Profile"      iconPath={PATHS.profile}  />
          </>
        )}

        {isVendor && (
          <>
            <Divider />
            <Label text="VENDOR" />
            <NavLink href="/dashboard"              label="Dashboard"    iconPath={PATHS.dashboard} />
            <NavLink href="/dashboard/analytics"    label="Analytics"    iconPath={PATHS.analytics} />
            <NavLink href="/dashboard/products"     label="My Products"  iconPath={PATHS.products}  />
            <NavLink href="/dashboard/orders"       label="Orders"       iconPath={PATHS.orders}    />
            <NavLink href="/dashboard/promos"       label="Promo Codes"  iconPath={PATHS.promo}     />
            <NavLink href="/dashboard/subscription" label="Plan & Billing"iconPath={PATHS.settings} />

            {/* Add product shortcut */}
            <div style={{ padding:"8px 16px" }}>
              <button onClick={() => router.push("/dashboard/products/new")} style={{ width:"100%", background:P, color:WHITE, border:"none", borderRadius:9, padding:"9px 0", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Icon d={PATHS.add} color={WHITE} size={14} /> Add product
              </button>
            </div>
          </>
        )}

        {isAdmin && (
          <>
            <Divider />
            <Label text="ADMIN" />
            <NavLink href="/admin"        label="Overview"   iconPath={PATHS.admin}    />
            <NavLink href="/admin/users"  label="Users"      iconPath={PATHS.profile}  />
            <NavLink href="/admin/stores" label="Stores"     iconPath={PATHS.stores}   />
            <NavLink href="/admin/orders" label="Orders"     iconPath={PATHS.orders}   />
          </>
        )}

        <Divider />
        <Label text="CATEGORIES" />
        {["Fashion","Electronics","Beauty","Food","Home","Sports","Art & Crafts","Services"].map(cat => (
          <button key={cat} onClick={() => router.push(`/search?q=${encodeURIComponent(cat.toLowerCase())}`)}
            style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 16px", background:"none", border:"none", cursor:"pointer", fontSize:12, color:DARK, fontWeight:400 }}>
            {cat}
          </button>
        ))}

        {!isLoggedIn && (
          <>
            <Divider />
            <div style={{ padding:"10px 16px" }}>
              <button onClick={() => router.push("/sell")} style={{ width:"100%", background:P, color:WHITE, border:"none", borderRadius:9, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8 }}>Open a free store</button>
              <button onClick={() => router.push("/login")} style={{ width:"100%", background:WHITE, color:DARK, border:`1px solid ${BORDER}`, borderRadius:9, padding:"9px 0", fontSize:13, cursor:"pointer" }}>Sign in</button>
            </div>
          </>
        )}
      </div>

      {/* Bottom: user info + sign out */}
      {isLoggedIn && (
        <div style={{ borderTop:`0.5px solid ${BORDER}`, padding:"12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${P},#FF8C61)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:700, color:WHITE }}>{name.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:DARK, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
              <div style={{ fontSize:10, color:MUTED, textTransform:"capitalize" }}>{p?.role||"buyer"}</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, background:"#FEE2E2", border:"none", borderRadius:9, padding:"9px 12px", fontSize:12, color:"#EF4444", fontWeight:600, cursor:"pointer" }}>
            <Icon d={PATHS.signout} color="#EF4444" size={14} /> Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
