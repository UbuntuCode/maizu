"use client";
import React from "react";
import { useRouter } from "next/navigation";

const FEATURES = [
  { emoji: "🎥", title: "Shop the video feed", desc: "Scroll a TikTok-style feed of vendor videos showing products in real use — tap to shop instantly." },
  { emoji: "❤️", title: "Like & follow stores", desc: "Like videos and follow your favourite vendors to see their new posts first." },
  { emoji: "📢", title: "Post as a vendor", desc: "Vendors can upload short videos to showcase products directly from their phone." },
  { emoji: "🔴", title: "Live selling, coming soon", desc: "Real-time live selling sessions are in development — vendors will be able to sell while streaming." },
];

export default function LiveFeedPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 18, color: "#fff", cursor: "pointer", marginRight: 12 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Live Feed</div>
      </div>

      <div style={{ padding: "10px 16px 20px" }}>
        <div style={{ background: "linear-gradient(135deg,#FF3B30,#E8401C)", borderRadius: 18, padding: "26px 22px", marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Maizu Live Feed</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
            Discover products through short videos from real South African vendors — swipe, like, and shop in one tap.
          </div>
        </div>

        {FEATURES.map(f => (
          <div key={f.title} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px", marginBottom: 12, display: "flex", gap: 14, alignItems: "flex-start", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>{f.emoji}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          </div>
        ))}

        <button onClick={() => router.push("/discovery")}
          style={{ width: "100%", marginTop: 10, background: "#fff", color: "#000", border: "none", borderRadius: 22, padding: "14px 0", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          Open the Feed
        </button>
      </div>
    </div>
  );
}