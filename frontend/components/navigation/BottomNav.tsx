"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

const P      = "#E8401C";
const MUTED  = "#71717A";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E4E7";

const TABS = [
  { path:"/",          label:"Home",
    icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?P:"none"} stroke={a?P:MUTED} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { path:"/discovery", label:"Discover",
    icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?P:"none"} stroke={a?P:MUTED} strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  { path:"/search",    label:"Search",
    icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?P:MUTED} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
  { path:"/wishlist",  label:"Saved",
    icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?P:"none"} stroke={a?P:MUTED} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { path:"/profile",   label:"Profile",
    icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?P:"none"} stroke={a?P:MUTED} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  const hideOn = ["/onboarding","/login","/register","/reset-password"];
  if (hideOn.some(p => pathname.startsWith(p))) return null;

  const isActive = (p:string) => p==="/" ? pathname==="/" : pathname.startsWith(p);

  return (
    <div className="bottom-nav-wrapper">
      <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:60, background:WHITE, borderTop:`0.5px solid ${BORDER}`, display:"flex", alignItems:"center", zIndex:300 }}>
        {TABS.map(tab => {
          const active = isActive(tab.path);
          return (
            <button key={tab.path} onClick={() => router.push(tab.path)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer", padding:"6px 0", position:"relative", WebkitTapHighlightColor:"transparent" }}>
              {tab.icon(active)}
              <span style={{ fontSize:9, fontWeight:active?600:400, color:active?P:MUTED }}>{tab.label}</span>
              {active && <div style={{ position:"absolute", bottom:2, width:4, height:4, borderRadius:"50%", background:P }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
