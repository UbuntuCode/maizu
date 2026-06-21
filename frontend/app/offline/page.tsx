"use client";
import React, { useEffect, useState } from "react";

const P    = "#E8401C";
const DARK = "#0F0F0F";
const MUTED= "#71717A";
const BG   = "#F7F7F5";
const WHITE= "#FFFFFF";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    /* Auto-reload once connection comes back */
    const handleOnline = () => window.location.href = "/";
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => window.location.href = "/", 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
      <div style={{ width: 88, height: 88, borderRadius: 22, background: "#FFF3EF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.5">
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color: DARK, marginBottom: 10 }}>
        You're offline
      </div>
      <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 300, marginBottom: 28 }}>
        It looks like you've lost your internet connection. Some pages you've already visited may still work — check your connection and try again.
      </div>

      <button
        onClick={handleRetry}
        disabled={retrying}
        style={{ background: retrying ? "#D1D5DB" : P, color: WHITE, border: "none", borderRadius: 24, padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: retrying ? "default" : "pointer" }}
      >
        {retrying ? "Retrying…" : "Try Again"}
      </button>

      <div style={{ fontSize: 12, color: MUTED, marginTop: 24 }}>
        We'll reconnect automatically once you're back online.
      </div>
    </div>
  );
}
