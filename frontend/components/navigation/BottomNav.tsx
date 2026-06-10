"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";

const primary = "#E8401C";
const muted   = "#71717A";
const white   = "#FFFFFF";
const border  = "#E4E4E7";

const NavIcon = {
  Home: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active?primary:"none"} stroke={active?primary:muted} strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Discover: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active?primary:"none"} stroke={active?primary:muted} strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  Search: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?primary:muted} strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Saved: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active?primary:"none"} stroke={active?primary:muted} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Profile: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active?primary:"none"} stroke={active?primary:muted} strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const TABS = [
  { path: "/",          label: "Home",     icon: NavIcon.Home     },
  { path: "/discovery", label: "Discover", icon: NavIcon.Discover },
  { path: "/search",    label: "Search",   icon: NavIcon.Search   },
  { path: "/wishlist",  label: "Saved",    icon: NavIcon.Saved, badge: true },
  { path: "/profile",   label: "Profile",  icon: NavIcon.Profile  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { totalItems: wishlistCount } = useWishlist();

  const isActive = (p: string) => p === "/" ? pathname === "/" : pathname.startsWith(p);

  return (
    <div className="bottom-nav-wrapper">
      <nav style={{
        position:       "fixed",
        bottom:         0,
        left:           0,
        right:          0,
        height:         64,
        background:     white,
        borderTop:      `0.5px solid ${border}`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-around",
        zIndex:         300,
        paddingBottom:  "env(safe-area-inset-bottom)",
      }}>
        {TABS.map(tab => {
          const active = isActive(tab.path);
          const badgeCount = tab.badge ? wishlistCount : 0;
          return (
            <button key={tab.path} onClick={() => router.push(tab.path)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer", padding:"6px 0", position:"relative", WebkitTapHighlightColor:"transparent" }}>
              {tab.icon(active)}
              <span style={{ fontSize:9, fontWeight:active?600:400, color:active?primary:muted }}>
                {tab.label}
              </span>
              {active && <div style={{ position:"absolute", bottom:3, width:4, height:4, borderRadius:"50%", background:primary }} />}
              {badgeCount > 0 && !active && (
                <div style={{ position:"absolute", top:4, right:"50%", transform:"translateX(10px)", background:"#EF4444", color:white, borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, border:`1.5px solid ${white}` }}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
