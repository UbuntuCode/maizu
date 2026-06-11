"use client";
import React from "react";
import { useRouter } from "next/navigation";

/*
  Maizu brand logo — the official marketplace wordmark.
  Shows the app icon (from /icons/icon-192x192.png) next to the
  "maizu BUSINESS HUB" wordmark. If the icon file is missing the
  wordmark still renders perfectly on its own.

  Usage:
    <Logo />                 → full logo, navigates home on click
    <Logo size="sm" />       → compact version for tight headers
    <Logo withIcon={false} />→ wordmark only
*/

export default function Logo({
  size = "md",
  withIcon = true,
}: {
  size?: "sm" | "md" | "lg";
  withIcon?: boolean;
}) {
  const router = useRouter();
  const [iconOk, setIconOk] = React.useState(true);

  const dims = {
    sm: { icon: 26, word: 18, sub: 7.5, gap: 8 },
    md: { icon: 34, word: 24, sub: 9, gap: 10 },
    lg: { icon: 44, word: 32, sub: 11, gap: 12 },
  }[size];

  return (
    <div
      onClick={() => router.push("/")}
      style={{ display: "inline-flex", alignItems: "center", gap: dims.gap, cursor: "pointer", userSelect: "none" }}
      aria-label="Maizu Business Hub — home"
    >
      {withIcon && iconOk && (
        <img
          src="/icons/icon-192x192.png"
          alt=""
          width={dims.icon}
          height={dims.icon}
          style={{ borderRadius: 8, display: "block" }}
          onError={() => setIconOk(false)}
        />
      )}
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: dims.word, fontWeight: 900, letterSpacing: -0.5, color: "#161B26" }}>
          mai<span style={{ color: "#E8401C" }}>zu</span>
        </div>
        <div style={{ fontSize: dims.sub, fontWeight: 700, letterSpacing: 3.2, color: "#8A8F9C", marginTop: 3 }}>
          BUSINESS HUB
        </div>
      </div>
    </div>
  );
}
