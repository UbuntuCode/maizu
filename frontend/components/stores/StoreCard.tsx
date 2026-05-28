"use client";
import React from "react";
import { C } from "@/utils/constants";
import { StarIc, PeopleIc, TrendIc, ImgIc } from "@/components/ui/icons";

interface StoreCardProps {
  name: string;
  cat: string;
  r: number;
  rv: number;
  fols: number;
  trending: boolean;
  bg: string;
  hasImg: boolean;
  emoji?: string;
}

export default function StoreCard({ name, cat, r, rv, fols, trending, bg, hasImg, emoji }: StoreCardProps) {
  return (
    <div style={{
      background: C.white,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      cursor: "pointer",
      position: "relative",
    }}>
      {/* Image area */}
      <div style={{
        height: 84,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        {!hasImg ? <ImgIc /> : <div style={{ fontSize: 32 }}>{emoji}</div>}
        {trending && (
          <div style={{
            position: "absolute",
            top: 5,
            left: 5,
            background: C.trendOrng,
            color: "#fff",
            borderRadius: 8,
            padding: "2px 7px",
            fontSize: 8,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}>
            <TrendIc sz={9} /> Trending
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "9px 10px 11px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 10, color: C.gray, marginBottom: 6 }}>{cat}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 5 }}>
          <StarIc />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.dark }}>{r}</span>
          <span style={{ fontSize: 9, color: C.gray }}>({rv})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: C.gray }}>
          <PeopleIc sz={11} />{fols.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
