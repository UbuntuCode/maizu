"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import Logo    from "@/components/ui/Logo";
import Bell    from "@/components/ui/Bell";
import CartIcon from "@/components/ui/CartIcon";

export default function Header() {
  const router = useRouter();

  return (
    <div style={{
      height:          60,
      background:      C.white,
      borderBottom:    `1px solid ${C.border}`,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "space-between",
      padding:         "0 16px",
      position:        "sticky",
      top:             0,
      zIndex:          200,
    }}>
      <Logo />

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Search icon */}
        <button
          onClick={() => router.push("/search")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 20 }}
          aria-label="Search"
        >
          🔍
        </button>

        <CartIcon />
        <Bell />
      </div>
    </div>
  );
}
