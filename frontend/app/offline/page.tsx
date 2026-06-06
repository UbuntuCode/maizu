"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";

export default function OfflinePage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      textAlign: "center",
    }}>
      {/* Icon */}
      <div style={{
        width: 100, height: 100, borderRadius: "50%",
        background: C.softOrange,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 52, marginBottom: 24,
      }}>
        📡
      </div>

      <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 10 }}>
        You&apos;re Offline
      </div>

      <div style={{ fontSize: 14, color: C.gray, lineHeight: 1.7, marginBottom: 28, maxWidth: 280 }}>
        No internet connection found. Check your connection and try again.
      </div>

      {/* What you can still do */}
      <div style={{
        background: C.white, borderRadius: 16, padding: "16px 20px",
        width: "100%", maxWidth: 340, marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>
          While offline you can still:
        </div>
        {[
          { emoji: "🏪", text: "Browse stores you visited before" },
          { emoji: "🛒", text: "View items in your cart" },
          { emoji: "📦", text: "Check your recent orders" },
        ].map(item => (
          <div key={item.text} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0", borderBottom: `1px solid ${C.border}`,
            fontSize: 13, color: C.dark,
          }}>
            <span style={{ fontSize: 18 }}>{item.emoji}</span>
            {item.text}
          </div>
        ))}
      </div>

      {/* Retry button */}
      <button
        onClick={() => window.location.reload()}
        style={{
          background: C.primary, color: "#fff", border: "none",
          borderRadius: 14, padding: "14px 32px",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          marginBottom: 12, width: "100%", maxWidth: 340,
        }}
      >
        🔄 Try Again
      </button>

      <button
        onClick={() => router.push("/")}
        style={{
          background: C.white, color: C.dark,
          border: `1.5px solid ${C.border}`,
          borderRadius: 14, padding: "13px 32px",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          width: "100%", maxWidth: 340,
        }}
      >
        Go to Home
      </button>
    </div>
  );
}
