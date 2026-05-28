"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { PlayIc, HeartIc, ChatIc, BookIc, TrendIc, ChevDIc, VolIc } from "@/components/ui/icons";
import Logo from "@/components/ui/Logo";
import Bell from "@/components/ui/Bell";

const videos = [
  { store: "Ankara Royale",   creator: "Amara Johnson", title: "New Ankara Collection 2026 ✨", desc: "Handcrafted African prints made with love. Limited stock available!", views: "45.2K", trending: "#1", likes: 3420, comments: 234, cat: "Fashion", bgA: "#9E9E9E", bgB: "#BDBDBD" },
  { store: "Glow Beauty",     creator: "Nomsa Dlamini", title: "Summer Skincare Routine 🌿",   desc: "All-natural African botanicals for glowing skin. Shop the full range!", views: "28.7K", trending: "#3", likes: 2180, comments: 156, cat: "Beauty",  bgA: "#C8A0A8", bgB: "#D4B0B8" },
  { store: "Taste of Africa", creator: "Chef Kwame",    title: "Traditional Jollof Rice 🍛",  desc: "The secret spice blend passed down for generations. Now in our store!",  views: "61.3K", trending: "#2", likes: 4750, comments: 389, cat: "Food",    bgA: "#787878", bgB: "#989898" },
];

const navTabs = [
  { id: "home",     label: "Home",     path: "/" },
  { id: "stores",   label: "Stores",   path: "/stores" },
  { id: "discover", label: "Discover", path: "/discover", fab: true },
  { id: "live",     label: "Live",     path: "/live" },
  { id: "profile",  label: "Profile",  path: "/profile" },
];

export default function DiscoverPage() {
  const router               = useRouter();
  const [liked,  setLiked]  = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [muted,  setMuted]  = useState(false);
  const [follow, setFollow] = useState(false);
  const [idx,    setIdx]    = useState(0);
  const v = videos[idx];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* White top bar */}
      <div style={{ height: 60, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
        <Logo /><Bell />
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: "relative", background: `linear-gradient(135deg,${v.bgA} 0%,${v.bgB} 40%,${v.bgA} 70%,#A0A0A0 100%)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%,rgba(255,255,255,0.18) 0%,transparent 60%)", pointerEvents: "none" }} />

        {/* Store info row */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", padding: "14px 14px 0", gap: 10, zIndex: 5 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#4a7c40,#2d5c25)", border: "2px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", lineHeight: 1.1, padding: "0 4px" }}>Ankar</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>{v.store}</span>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#2196F3" }} />
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{v.creator}</div>
          </div>
          <button onClick={() => setFollow(!follow)} style={{ background: follow ? "rgba(255,255,255,0.25)" : C.primary, color: "#fff", border: follow ? "1px solid rgba(255,255,255,0.6)" : "none", borderRadius: 24, padding: "7px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            {follow ? "Following" : "Follow"}
          </button>
          <button onClick={() => setMuted(!muted)} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(30,30,30,0.75)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <VolIc muted={muted} />
          </button>
        </div>

        {/* Right actions */}
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-40%)", display: "flex", flexDirection: "column", gap: 22, alignItems: "center", zIndex: 5 }}>
          <button onClick={() => setLiked(!liked)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <HeartIc filled={liked} col={liked ? C.primary : "#EF4444"} sz={27} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.95)", fontWeight: 500 }}>{liked ? v.likes + 1 : v.likes}</span>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <ChatIc sz={26} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.95)", fontWeight: 500 }}>{v.comments}</span>
          </button>
          <button onClick={() => setSaved(!saved)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <BookIc filled={saved} sz={26} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.95)", fontWeight: 500 }}>Save</span>
          </button>
        </div>

        {/* Center: play + chevron */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <PlayIc sz={28} />
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(40,40,40,0.55)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: 52 }}>
            <ChevDIc />
          </div>
        </div>

        {/* Bottom info */}
        <div style={{ position: "absolute", bottom: 14, left: 14, right: 52 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 5, lineHeight: 1.2 }}>{v.title}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.88)", marginBottom: 9 }}>{v.desc}</div>
          <div style={{ display: "flex", gap: 18, marginBottom: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 5 }}><PlayIc sz={12} /> {v.views} views</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 5 }}><TrendIc sz={12} /> Trending {v.trending}</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(30,30,30,0.58)", borderRadius: 22, padding: "5px 13px", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth={2} />
              <path d="M12 8v4l3 3" stroke="#fff" strokeWidth={2} />
            </svg>
            <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{v.cat}</span>
          </div>
        </div>

        {/* Slide dots */}
        <div style={{ position: "absolute", right: 14, bottom: 16, display: "flex", flexDirection: "column", gap: 5 }}>
          {videos.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: 5, height: i === idx ? 20 : 5, borderRadius: 3, background: i === idx ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.25s" }} />
          ))}
        </div>
      </div>

      {/* Inline bottom nav */}
      <div style={{ height: 70, background: C.white, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "flex-end", flexShrink: 0, paddingBottom: 6 }}>
        {navTabs.map(t => (
          <button key={t.id} onClick={() => router.push(t.path)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 3, height: "100%", paddingBottom: 0 }}>
            {t.fab ? (
              <>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(145deg,#FF6B3D,${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${C.primary}60`, transform: "translateY(-10px)" }}>
                  <PlayIc sz={22} />
                </div>
                <span style={{ fontSize: 10, color: C.primary, fontWeight: 700, marginTop: -12 }}>{t.label}</span>
              </>
            ) : (
              <>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {t.id === "home"    && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={C.gray} strokeWidth={2}/><polyline points="9,22 9,12 15,12 15,22" stroke={C.gray} strokeWidth={2}/></>}
                  {t.id === "stores"  && <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={C.gray} strokeWidth={2}/><line x1="3" y1="6" x2="21" y2="6" stroke={C.gray} strokeWidth={2}/><path d="M16 10a4 4 0 01-8 0" stroke={C.gray} strokeWidth={2}/></>}
                  {t.id === "live"    && <><circle cx="12" cy="12" r="2" fill={C.gray}/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14" stroke={C.gray} strokeWidth={2}/></>}
                  {t.id === "profile" && <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={C.gray} strokeWidth={2}/><circle cx="12" cy="7" r="4" stroke={C.gray} strokeWidth={2}/></>}
                </svg>
                <span style={{ fontSize: 10, color: C.gray }}>{t.label}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
