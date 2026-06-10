"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const primary = "#E8401C";
const dark    = "#0F0F0F";
const muted   = "#71717A";
const border  = "#E4E4E7";
const soft    = "#FFF3EF";

const MAIN_LINKS = [
  { path:"/",           label:"Home",      icon:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" },
  { path:"/search",     label:"Search",    icon:"M11 11m-8 0a8 8 0 1 0 16 0 8 8 0 0 0-16 0 M21 21l-4.35-4.35" },
  { path:"/discovery",  label:"Discover",  icon:"M23 7L16 12 23 17 23 7 M1 5h15v14H1z" },
  { path:"/stores",     label:"Stores",    icon:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" },
  { path:"/wishlist",   label:"Saved",     icon:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
  { path:"/orders",     label:"Orders",    icon:"M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" },
];

const VENDOR_LINKS = [
  { path:"/dashboard",             label:"Dashboard",  icon:"M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
  { path:"/dashboard/analytics",   label:"Analytics",  icon:"M18 20V10 M12 20V4 M6 20v-6" },
  { path:"/dashboard/promos",      label:"Promos",     icon:"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01" },
  { path:"/sell",                  label:"Open Store", icon:"M12 5v14 M5 12h14" },
];

const CATEGORIES = ["Fashion","Electronics","Beauty","Food","Home","Sports","Art & Crafts","Services"];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { profile, isLoggedIn } = useAuth();

  const isActive = (p: string) => p === "/" ? pathname === "/" : pathname.startsWith(p);
  const isVendor = profile?.role === "vendor" || profile?.role === "admin";

  const SideLink = ({ path, label, icon }: { path: string; label: string; icon: string }) => {
    const active = isActive(path);
    return (
      <button onClick={() => router.push(path)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 20px", background:active?soft:"transparent", border:"none", cursor:"pointer", borderLeft:active?`3px solid ${primary}`:"3px solid transparent", transition:"all 0.15s" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active?primary:muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon}/>
        </svg>
        <span style={{ fontSize:13, fontWeight:active?600:400, color:active?primary:dark }}>{label}</span>
      </button>
    );
  };

  return (
    <aside className="desktop-sidebar">
      {/* Main nav */}
      <div style={{ marginBottom:20 }}>
        {MAIN_LINKS.map(l => <SideLink key={l.path} {...l} />)}
      </div>

      <div style={{ height:"0.5px", background:border, margin:"0 20px 20px" }} />

      {/* Categories */}
      <div style={{ padding:"0 20px", marginBottom:6 }}>
        <div style={{ fontSize:10, fontWeight:700, color:muted, letterSpacing:"0.08em", marginBottom:10 }}>CATEGORIES</div>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => router.push(`/search?q=${cat.toLowerCase()}`)}
            style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 0", background:"none", border:"none", cursor:"pointer", fontSize:12, color:dark, fontWeight:400 }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Vendor links */}
      {isLoggedIn && (
        <>
          <div style={{ height:"0.5px", background:border, margin:"16px 20px" }} />
          <div style={{ padding:"0 20px", marginBottom:6 }}>
            <div style={{ fontSize:10, fontWeight:700, color:muted, letterSpacing:"0.08em", marginBottom:10 }}>
              {isVendor ? "VENDOR" : "SELL ON MAIZU"}
            </div>
          </div>
          {isVendor
            ? VENDOR_LINKS.map(l => <SideLink key={l.path} {...l} />)
            : <button onClick={() => router.push("/sell")} style={{ margin:"0 20px", display:"block", background:primary, color:"#fff", border:"none", borderRadius:8, padding:"10px 16px", fontSize:13, fontWeight:600, cursor:"pointer", width:"calc(100% - 40px)" }}>Open a free store</button>
          }
        </>
      )}
    </aside>
  );
}
