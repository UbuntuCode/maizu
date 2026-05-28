"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useCart } from "@/context/CartContext";

export default function CartIcon() {
  const router = useRouter();
  const { totalItems } = useCart();

  return (
    <button
      onClick={() => router.push("/cart")}
      style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4 }}
    >
      {/* Cart bag SVG */}
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={C.dark} strokeWidth={2} />
        <line x1="3" y1="6" x2="21" y2="6" stroke={C.dark} strokeWidth={2} />
        <path d="M16 10a4 4 0 01-8 0" stroke={C.dark} strokeWidth={2} />
      </svg>

      {/* Badge */}
      {totalItems > 0 && (
        <span style={{
          position: "absolute",
          top: -4, right: -4,
          background: C.primary,
          color: "#fff",
          borderRadius: "50%",
          width: 17, height: 17,
          fontSize: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          border: "2px solid #fff",
        }}>
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
