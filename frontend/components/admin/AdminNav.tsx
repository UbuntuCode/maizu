"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";

export default function AdminNav({ active }: { active: string }) {
  const router = useRouter();
  const tabs = [
    { path: "/admin",        icon: "📊", label: "Overview" },
    { path: "/admin/users",  icon: "👥", label: "Users"    },
    { path: "/admin/stores", icon: "🏪", label: "Stores"   },
    { path: "/admin/orders", icon: "📦", label: "Orders"   },
  ];
  return (
    <div style={{ background: C.dark, display: "flex", overflowX: "auto" }}>
      {tabs.map(t => (
        <button key={t.path} onClick={() => router.push(t.path)}
          style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: active === t.path ? `2.5px solid ${C.primary}` : "2.5px solid transparent" }}>
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: active === t.path ? 700 : 400, color: active === t.path ? "#fff" : "rgba(255,255,255,0.6)" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}