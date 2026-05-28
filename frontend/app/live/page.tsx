"use client";
import { C } from "@/utils/constants";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

export default function LivePage() {
  return (
    <div className="page-enter" style={{ background: "#000", minHeight: "100vh", color: "#fff", paddingBottom: 80 }}>
      <Header />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 60 }}>📡</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>Live Streams</div>
        <div style={{ fontSize: 13, color: C.grayLight, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
          Watch store owners go live, demo products, and connect with their community in real time.
        </div>
        <button style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 24, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
          Browse Live Streams
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
