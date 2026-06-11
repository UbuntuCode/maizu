"use client";
import React from "react";
import { useRouter } from "next/navigation";

/*
  Maizu brand logo — the original wordmark you like:
  "mai" in Maizu red, "zu" in black, with the letterspaced
  BUSINESS HUB caption underneath. No icon, no emoji.

  Usage:
    <Logo />            → standard size (sidebar)
    <Logo size="sm" />  → compact (header)
    <Logo size="lg" />  → large (landing pages)
*/

export default function Logo({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();

  const dims = {
    sm: { word: 19, sub: 7.5 },
    md: { word: 25, sub: 9 },
    lg: { word: 34, sub: 11 },
  }[size];

  return (
    <div
      onClick={() => router.push("/")}
      style={{ display: "inline-block", cursor: "pointer", userSelect: "none", lineHeight: 1 }}
      aria-label="Maizu Business Hub — home"
    >
      <div style={{ fontSize: dims.word, fontWeight: 900, letterSpacing: -0.5 }}>
        <span style={{ color: "#E8401C" }}>mai</span>
        <span style={{ color: "#161B26" }}>zu</span>
      </div>
      <div style={{ fontSize: dims.sub, fontWeight: 700, letterSpacing: 3.2, color: "#8A8F9C", marginTop: 3 }}>
        BUSINESS HUB
      </div>
    </div>
  );
}
