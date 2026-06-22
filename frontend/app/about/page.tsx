"use client";
import React from "react";
import { useRouter } from "next/navigation";

const P    = "#E8401C";
const DARK = "#0F0F0F";
const MUTED= "#71717A";
const BG   = "#F7F7F5";
const WHITE= "#FFFFFF";
const BORDER = "#E4E4E7";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <div style={{ background: WHITE, padding: "16px 20px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>About Maizu</div>
      </div>

      <div style={{ padding: "32px 20px 60px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900 }}><span style={{ color: P }}>mai</span><span style={{ color: DARK }}>zu</span></div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Business Hub</div>
        </div>

        <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, marginBottom: 24, textAlign: "center" }}>
          Maizu Business Hub is South Africa's marketplace for local entrepreneurs. We connect everyday vendors — from Durban market traders to small registered businesses — with buyers across the country.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {[
            { emoji: "🎯", title: "Our Mission", text: "To give every South African entrepreneur a free, professional online store — no technical skills, no monthly fees to start." },
            { emoji: "🇿🇦", title: "Built for South Africa", text: "ZAR payments, local courier integration, and WhatsApp sharing built in from day one." },
            { emoji: "🤝", title: "Fair for vendors", text: "Commission starts at just 5% and drops as low as 1% — far below typical marketplace fees." },
          ].map(b => (
            <div key={b.title} style={{ background: WHITE, borderRadius: 16, padding: "18px", display: "flex", gap: 14 }}>
              <div style={{ fontSize: 28 }}>{b.emoji}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{b.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: DARK, borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: WHITE, marginBottom: 8 }}>Ready to sell?</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>Open your free store in under 10 minutes</div>
          <button onClick={() => router.push("/sell")} style={{ background: P, color: WHITE, border: "none", borderRadius: 22, padding: "11px 26px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Start Selling
          </button>
        </div>

        <div style={{ fontSize: 11, color: MUTED, marginTop: 30, textAlign: "center" }}>
          Maizu Business Hub (Pty) Ltd · Durban, KwaZulu-Natal, South Africa
        </div>
      </div>
    </div>
  );
}
