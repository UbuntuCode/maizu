"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?:    string;
  href?:     string;
  dark?:     boolean;
}

export default function BackButton({ label, href, dark = false }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      /* Go back in history, fall back to home if no history */
      if (window.history.length > 1) router.back();
      else router.push("/");
    }
  };

  return (
    <button
      onClick={handleBack}
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         6,
        background:  "none",
        border:      "none",
        cursor:      "pointer",
        padding:     "4px 0",
        color:       dark ? "#fff" : "#0F0F0F",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      {label && <span style={{ fontSize:14, fontWeight:500 }}>{label}</span>}
    </button>
  );
}
