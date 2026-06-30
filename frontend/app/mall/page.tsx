"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";

const HIGHLIGHTS = [
  { emoji: "🛍️", title: "Browse every store", desc: "Discover hundreds of independent South African vendors, from handmade crafts to electronics, all in one place." },
  { emoji: "🔎", title: "Search by category", desc: "Jump straight to fashion, beauty, home, food and more using the category shortcuts on the homepage." },
  { emoji: "📹", title: "Shop the video feed", desc: "See products in action on the Discover tab before you buy — vendors post short videos showing off what they sell." },
  { emoji: "⭐", title: "Trending & featured stores", desc: "Stores that are boosted or trending appear first, so you always see what's popular right now." },
];

export default function MallPage() {
  const router = useRouter();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ height: 60, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", fontSize: 20, color: C.dark, cursor: "pointer", marginRight: 12 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Explore Mall</div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <div style={{ background: C.dark, borderRadius: 18, padding: "26px 22px", marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>The Maizu Mall</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            One marketplace, hundreds of local vendors. Explore Mall is your starting point for discovering every store, product and trend on Maizu Business Hub.
          </div>
        </div>

        {HIGHLIGHTS.map(h => (
          <div key={h.title} style={{ background: C.white, borderRadius: 14, padding: "16px", marginBottom: 12, display: "flex", gap: 14, alignItems: "flex-start", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>{h.emoji}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 4 }}>{h.title}</div>
              <div style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.6 }}>{h.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={() => router.push("/stores")}
            style={{ flex: 1, background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Browse Stores
          </button>
          <button onClick={() => router.push("/discovery")}
            style={{ flex: 1, background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Watch Discover
          </button>
        </div>
      </div>
    </div>
  );
}