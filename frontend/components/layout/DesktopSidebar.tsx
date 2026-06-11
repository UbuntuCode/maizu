"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const P      = "#E8401C";
const DARK   = "#0F0F0F";
const MUTED  = "#71717A";
const BORDER = "#E4E4E7";
const SOFT   = "#FFF3EF";
const WHITE  = "#FFFFFF";

const ICON = {
  Home:      "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  Search:    "M11 11m-8 0a8 8 0 1 0 16 0 8 8 0 0 0-16 0 M21 21l-4.35-4.35",
  Video:     "M23 7L16 12 23 17 23 7 M1 5h15v14H1z",
  Stores:    "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18",
  Wishlist:  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  Orders:    "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  Dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0h6",
  Analytics: "M18 20V10 M12 20V4 M6 20v-6",
  Products:  "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  Promos:    "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
  Settings:  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8v4M12 16h.01",
  Sell:      "M12 5v14 M5 12h14",
  Profile:   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  Admin:     "M12 1l3 6 6 1-4.5 4.5 1 6-5.5-3-5.5 3 1-6L3 8l6-1z",
};

const CATEGORIES = ["Fashion","Electronics","Beauty","Food","Home","Sports","Art & Crafts","Services"];

function NavLink({ path, label, iconPath }: { path: string; label: string; iconPath: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const active   = path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <button
      onClick={() => router.push(path)}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 18px", background:active?SOFT:"transparent", border:"none", cursor:"pointer", borderLeft:`3px solid ${active?P:"transparent"}`, transition:"all 0.15s" }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active?P:MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {iconPath.split(" M").map((d, i) => <path key={i} d={i===0?d:"M"+d} />)}
      </svg>
      <span style={{ fontSize:13, fontWeight:active?600:400, color:active?P:DARK }}>{label}</span>
    </button>
  );
}

const Divider = () => <div style={{ height:"0.5px", background:BORDER, margin:"8px 18px" }} />;

const SectionLabel = ({ label }: { label: string }) => (
  <div style={{ padding:"8px 18px 4px", fontSize:10, fontWeight:700, color:MUTED, letterSpacing:"0.08em" }}>{label}</div>
);

export default function DesktopSidebar() {
  const router = useRouter();
  const { isLoggedIn, profile } = useAuth();
  const p      = profile as any;
  const isVendor = p?.role === "vendor" || p?.role === "admin";
  const isAdmin  = p?.role === "admin";

  return (
    <aside className="desktop-sidebar">

      {/* Browse */}
      <SectionLabel label="BROWSE" />
      <NavLink path="/"          label="Home"      iconPath={ICON.Home}     />
      <NavLink path="/search"    label="Search"    iconPath={ICON.Search}   />
      <NavLink path="/discovery" label="Discover"  iconPath={ICON.Video}    />
      <NavLink path="/stores"    label="Stores"    iconPath={ICON.Stores}   />

      {isLoggedIn && (
        <>
          <Divider />
          <SectionLabel label="MY ACCOUNT" />
          <NavLink path="/orders"       label="My Orders"  iconPath={ICON.Orders}  />
          <NavLink path="/wishlist"     label="Saved"      iconPath={ICON.Wishlist}/>
          <NavLink path="/profile"      label="Profile"    iconPath={ICON.Profile} />
          <NavLink path="/notifications"label="Alerts"     iconPath={ICON.Settings}/>
        </>
      )}

      {isVendor && (
        <>
          <Divider />
          <SectionLabel label="VENDOR" />
          <NavLink path="/dashboard"              label="Dashboard"  iconPath={ICON.Dashboard} />
          <NavLink path="/dashboard/analytics"    label="Analytics"  iconPath={ICON.Analytics} />
          <NavLink path="/dashboard/products"     label="Products"   iconPath={ICON.Products}  />
          <NavLink path="/dashboard/orders"       label="Orders"     iconPath={ICON.Orders}    />
          <NavLink path="/dashboard/promos"       label="Promos"     iconPath={ICON.Promos}    />
          <NavLink path="/dashboard/subscription" label="Plan"       iconPath={ICON.Settings}  />
        </>
      )}

      {isAdmin && (
        <>
          <Divider />
          <SectionLabel label="ADMIN" />
          <NavLink path="/admin"         label="Overview"  iconPath={ICON.Admin}    />
          <NavLink path="/admin/users"   label="Users"     iconPath={ICON.Profile}  />
          <NavLink path="/admin/stores"  label="Stores"    iconPath={ICON.Stores}   />
          <NavLink path="/admin/orders"  label="Orders"    iconPath={ICON.Orders}   />
        </>
      )}

      <Divider />
      <SectionLabel label="CATEGORIES" />
      {CATEGORIES.map(cat => (
        <button key={cat} onClick={() => router.push(`/search?q=${cat.toLowerCase()}`)}
          style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 18px", background:"none", border:"none", cursor:"pointer", fontSize:12, color:DARK }}>
          {cat}
        </button>
      ))}

      {!isLoggedIn && (
        <>
          <Divider />
          <div style={{ padding:"12px 18px" }}>
            <button onClick={() => router.push("/sell")} style={{ width:"100%", background:P, color:WHITE, border:"none", borderRadius:10, padding:"11px 0", fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8 }}>
              Open a free store
            </button>
            <button onClick={() => router.push("/login")} style={{ width:"100%", background:WHITE, color:DARK, border:`1px solid ${BORDER}`, borderRadius:10, padding:"10px 0", fontSize:13, cursor:"pointer" }}>
              Sign in
            </button>
          </div>
        </>
      )}

    </aside>
  );
}
