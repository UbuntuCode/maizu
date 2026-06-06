"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useWishlist } from "@/context/WishlistContext";

export default function BottomNav() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { totalItems: wishlistCount } = useWishlist();

  const tabs = [
    { path: "/",         icon: "🏠", label: "Home"    },
    { path: "/stores",   icon: "🏪", label: "Stores"  },
    { path: "/search",   icon: "🔍", label: "Search"  },
    { path: "/wishlist", icon: "❤️", label: "Saved",  badge: wishlistCount },
    { path: "/profile",  icon: "👤", label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav style={{
      position:       "fixed",
      bottom:         0,
      left:           "50%",
      transform:      "translateX(-50%)",
      width:          "100%",
      maxWidth:       430,
      height:         64,
      background:     "#fff",
      borderTop:      `1px solid ${C.border}`,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-around",
      zIndex:         300,
      paddingBottom:  "env(safe-area-inset-bottom)",
    }}>
      {tabs.map(tab => (
        <button
          key={tab.path}
          onClick={() => router.push(tab.path)}
          style={{
            flex:           1,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            3,
            background:     "none",
            border:         "none",
            cursor:         "pointer",
            padding:        "6px 0",
            position:       "relative",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
          <span style={{
            fontSize:   9,
            fontWeight: isActive(tab.path) ? 700 : 500,
            color:      isActive(tab.path) ? C.primary : C.gray,
          }}>
            {tab.label}
          </span>
          {/* Active dot */}
          {isActive(tab.path) && (
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.primary }} />
          )}
          {/* Wishlist count badge */}
          {tab.badge !== undefined && tab.badge > 0 && !isActive(tab.path) && (
            <div style={{
              position:       "absolute",
              top:            2,
              right:          "50%",
              transform:      "translateX(8px)",
              background:     "#EF4444",
              color:          "#fff",
              borderRadius:   "50%",
              width:          16,
              height:         16,
              fontSize:       9,
              fontWeight:     800,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              border:         "2px solid #fff",
            }}>
              {tab.badge > 9 ? "9+" : tab.badge}
            </div>
          )}
        </button>
      ))}
    </nav>
  );
}
