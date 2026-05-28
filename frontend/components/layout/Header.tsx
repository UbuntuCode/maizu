"use client";
import React from "react";
import { C } from "@/utils/constants";
import Logo from "@/components/ui/Logo";
import Bell from "@/components/ui/Bell";
import CartIcon from "@/components/ui/CartIcon";

export default function Header() {
  return (
    <div style={{
      height: 60,
      background: C.white,
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      <Logo />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <CartIcon />
        <Bell />
      </div>
    </div>
  );
}
