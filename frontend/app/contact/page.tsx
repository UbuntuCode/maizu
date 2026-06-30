"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";

const CHANNELS = [
  { emoji: "📧", title: "Email", value: "support@maizu.co.za", desc: "Our team responds within 3 business days.", href: "mailto:support@maizu.co.za" },
  { emoji: "💬", title: "WhatsApp", value: "Chat with us", desc: "Fastest way to reach us for order or payment questions.", href: "https://wa.me/+27717631381" },
];

export default function ContactPage() {
  const router = useRouter();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ height: 60, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", fontSize: 20, color: C.dark, cursor: "pointer", marginRight: 12 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Contact Us</div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, lineHeight: 1.6 }}>
          Have a question about an order, a store, or your account? Reach out using any of the channels below and our team will get back to you.
        </div>

        {CHANNELS.map(ch => (
          <a key={ch.title} href={ch.href} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", gap: 14, alignItems: "center", background: C.white, borderRadius: 14, padding: "16px", marginBottom: 12, border: `1px solid ${C.border}`, textDecoration: "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.softOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{ch.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{ch.title}</div>
              <div style={{ fontSize: 12.5, color: C.primary, fontWeight: 600 }}>{ch.value}</div>
              <div style={{ fontSize: 11.5, color: C.gray, marginTop: 2 }}>{ch.desc}</div>
            </div>
          </a>
        ))}

        <div style={{ background: C.white, borderRadius: 14, padding: "16px", marginTop: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Registered business</div>
          <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.8 }}>
            Maizu Business Hub (Pty) Ltd<br />
            Durban, KwaZulu-Natal, South Africa
          </div>
        </div>

        <button onClick={() => router.push("/support")}
          style={{ width: "100%", marginTop: 18, background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "13px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          Looking for FAQs? Visit Support →
        </button>
      </div>
    </div>
  );
}