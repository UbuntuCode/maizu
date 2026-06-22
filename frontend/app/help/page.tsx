"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const P    = "#E8401C";
const DARK = "#0F0F0F";
const MUTED= "#71717A";
const BG   = "#F7F7F5";
const WHITE= "#FFFFFF";
const BORDER = "#E4E4E7";

const FAQS = [
  { q: "How do I become a vendor and open a store?", a: "Go to your Profile and tap 'Open a Store' or 'Become a Vendor'. This upgrades your account instantly — free of charge — and takes you straight to the store creation form. You can keep shopping as a buyer at the same time." },
  { q: "How long does delivery take?", a: "Most vendors dispatch within 1–3 business days. The Courier Guy then delivers within 1–5 business days depending on your location." },
  { q: "How do I track my order?", a: "Go to My Orders, tap your order, and once the vendor enters a waybill number you'll see a live tracking link." },
  { q: "What payment methods are accepted?", a: "Card (Visa, Mastercard), EFT bank transfer, PayFast, and Cash on Delivery where the vendor offers it." },
  { q: "How do I request a refund?", a: "Go to My Orders → select the order → 'Report a Problem' → choose your reason and upload photos. See our full Refund Policy in Terms & Conditions." },
  { q: "Can I cancel my order?", a: "Yes, free of charge within 1 hour of placing it, as long as the vendor hasn't confirmed it yet. After confirmation, cancellation is at the vendor's discretion." },
  { q: "How much commission does Maizu take?", a: "5% on the Free plan, 3% on Basic (R99/month), 1% on Pro (R299/month)." },
  { q: "When do vendors get paid?", a: "Payouts are processed 2–3 business days after the order is marked delivered, via EFT to your registered bank account." },
  { q: "I forgot my password, what do I do?", a: "On the login page, tap 'Forgot password?' and follow the email instructions to reset it." },
  { q: "How do I contact a vendor directly?", a: "Open the product or store page and use the in-app messaging or WhatsApp share button to reach out." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `0.5px solid ${BORDER}` }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: DARK, paddingRight: 12 }}>{q}</span>
        <span style={{ fontSize: 18, color: P, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>+</span>
      </button>
      {open && <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, paddingBottom: 14 }}>{a}</div>}
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <div style={{ background: WHITE, padding: "16px 20px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>Help & Support</div>
      </div>

      <div style={{ padding: "20px 20px 60px", maxWidth: 680, margin: "0 auto" }}>

        {/* Contact card */}
        <div style={{ background: DARK, borderRadius: 16, padding: "20px", marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: WHITE, marginBottom: 6 }}>Need help fast?</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>Our team responds within 3 business days</div>
          <a href="mailto:support@maizu.co.za" style={{ display: "inline-block", background: P, color: WHITE, borderRadius: 22, padding: "10px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Email support@maizu.co.za
          </a>
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 6 }}>Frequently asked questions</div>
        <div style={{ background: WHITE, borderRadius: 16, padding: "4px 16px", marginBottom: 24 }}>
          {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>

        {/* Quick links */}
        <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 10 }}>More resources</div>
        <div style={{ background: WHITE, borderRadius: 16, overflow: "hidden" }}>
          {[
            { label: "Terms & Conditions",  path: "/terms"   },
            { label: "Privacy Policy",      path: "/privacy" },
            { label: "About Maizu",         path: "/about"   },
            { label: "Sell on Maizu",       path: "/sell"    },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={() => router.push(item.path)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: i < arr.length - 1 ? `0.5px solid ${BORDER}` : "none" }}>
              <span style={{ fontSize: 13, color: DARK }}>{item.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
