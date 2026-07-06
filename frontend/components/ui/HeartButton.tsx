"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

interface HeartButtonProps {
  productId:  string;
  size?:      "sm" | "md" | "lg";
  style?:     React.CSSProperties;
  showCount?: boolean;
  count?:     number;
}

const SIZES = {
  sm: { btn: 28, icon: 14, radius: 8 },
  md: { btn: 34, icon: 17, radius: 10 },
  lg: { btn: 42, icon: 22, radius: 12 },
};

export default function HeartButton({
  productId, size = "md", style, showCount = false, count,
}: HeartButtonProps) {
  const router              = useRouter();
  const { isLoggedIn }      = useAuth();
  const { isSaved, toggle } = useWishlist();
  const [busy, setBusy]     = useState(false);
  const [pop,  setPop]      = useState(false);

  const saved = isSaved(productId);
  const s     = SIZES[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isLoggedIn) { router.push("/login"); return; }
    if (busy) return;

    setBusy(true);
    setPop(true);
    setTimeout(() => setPop(false), 300);

    try { await toggle(productId); }
    finally { setBusy(false); }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width:           s.btn,
        height:          s.btn,
        borderRadius:    s.radius,
        background:      saved ? "#FEE2E2" : "rgba(255,255,255,0.9)",
        border:          `1.5px solid ${saved ? "#FCA5A5" : "rgba(0,0,0,0.1)"}`,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        cursor:          busy ? "default" : "pointer",
        backdropFilter:  "blur(4px)",
        transition:      "all 0.2s",
        transform:       pop ? "scale(1.25)" : "scale(1)",
        flexShrink:      0,
        ...style,
      }}
    >
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill={saved ? "#EF4444" : "none"}
        stroke={saved ? "#EF4444" : "#6B7280"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "all 0.2s" }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showCount && count !== undefined && count > 0 && (
        <span style={{ fontSize: 9, fontWeight: 700, color: saved ? "#EF4444" : "#6B7280", marginLeft: 2 }}>
          {count}
        </span>
      )}
    </button>
  );
}

