"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";

const TOPICS = [
  {
    title: "Getting Started",
    items: [
      "Create an account and verify your email to start buying or selling on Maizu.",
      "Browse stores from the homepage or use Search to find specific products.",
      "Tap the heart icon to save items to your Wishlist for later.",
    ],
  },
  {
    title: "Orders & Payments",
    items: [
      "Pay securely with card, EFT or PayFast at checkout.",
      "Track your order status from My Orders — pending, confirmed, shipped, delivered.",
      "Once a vendor adds a waybill number, you'll see a live courier tracking link on your order.",
    ],
  },
  {
    title: "Vendor Support",
    items: [
      "Become a Vendor from your profile to open your first store for free.",
      "Manage products, orders and promos from your Dashboard.",
      "Upgrade your subscription plan anytime to unlock more stores and lower commission.",
    ],
  },
  {
    title: "Account & Security",
    items: [
      "Reset your password anytime from the Login screen using 'Forgot password'.",
      "Verify your account as an individual or registered business for faster payouts.",
      "Your data is protected under our Privacy Policy — we never sell your information.",
    ],
  },
];

function TopicCard({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.white, borderRadius: 14, marginBottom: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{title}</span>
        <span style={{ fontSize: 16, color: C.gray, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {items.map((it, i) => (
            <div key={i} style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.7, marginBottom: 6, paddingLeft: 14, position: "relative" }}>
              <span style={{ position: "absolute", left: 0 }}>•</span>{it}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ height: 60, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", fontSize: 20, color: C.dark, cursor: "pointer", marginRight: 12 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Support</div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, lineHeight: 1.6 }}>
          Browse common topics below. Can't find what you need? Our team is one message away.
        </div>

        {TOPICS.map(t => <TopicCard key={t.title} title={t.title} items={t.items} />)}

        <button onClick={() => router.push("/contact")}
          style={{ width: "100%", marginTop: 16, background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Contact Us Directly
        </button>
        <button onClick={() => router.push("/help")}
          style={{ width: "100%", marginTop: 10, background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "13px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          View Full FAQ →
        </button>
      </div>
    </div>
  );
}