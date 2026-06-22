"use client";
import React from "react";
import { useRouter } from "next/navigation";

const P    = "#E8401C";
const DARK = "#0F0F0F";
const MUTED= "#71717A";
const BG   = "#F7F7F5";
const WHITE= "#FFFFFF";
const BORDER = "#E4E4E7";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 26 }}>
    <h2 style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>{title}</h2>
    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{children}</div>
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
    <span style={{ color: P, flexShrink: 0 }}>•</span>
    <span>{children}</span>
  </div>
);

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <div style={{ background: WHITE, padding: "16px 20px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>Privacy Policy</div>
      </div>

      <div style={{ padding: "24px 20px 60px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ background: "#FFF3EF", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#9A3412" }}>
          POPIA Compliant — Protection of Personal Information Act 4 of 2013
        </div>

        <Section title="1. Introduction">
          Maizu Business Hub (Pty) Ltd is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store and protect your data when you use the Maizu marketplace at maizu.co.za.
        </Section>

        <Section title="2. Information We Collect">
          <Bullet>Full name, email address and phone number</Bullet>
          <Bullet>Delivery address (street, suburb, city, province, postal code)</Bullet>
          <Bullet>Store name, logo and product listings (vendors)</Bullet>
          <Bullet>Bank account details for vendor payouts</Bullet>
          <Bullet>Device type, browser, IP address and approximate location</Bullet>
          <Bullet>Order history and transaction amounts</Bullet>
        </Section>

        <Section title="3. How We Use Your Information">
          <Bullet>To create and manage your account</Bullet>
          <Bullet>To facilitate transactions between buyers and vendors</Bullet>
          <Bullet>To process payments and arrange delivery</Bullet>
          <Bullet>To send order confirmations and shipping updates</Bullet>
          <Bullet>To detect and prevent fraud</Bullet>
          <Bullet>To comply with South African legal obligations</Bullet>
          <p style={{ marginTop: 10, fontWeight: 700 }}>We never sell your personal information to third parties.</p>
        </Section>

        <Section title="4. Who We Share Information With">
          <Bullet>Supabase — database and authentication</Bullet>
          <Bullet>Cloudinary — image storage</Bullet>
          <Bullet>Flutterwave & PayFast — payment processing</Bullet>
          <Bullet>The Courier Guy — delivery logistics</Bullet>
          <Bullet>Vercel & Railway — hosting infrastructure</Bullet>
        </Section>

        <Section title="5. Data Security">
          All data is encrypted in transit (HTTPS/TLS 1.2+). Row Level Security is enforced at the database level so users can only access their own data. Card data is never stored by Maizu — all card processing is handled by PCI-DSS compliant payment providers.
        </Section>

        <Section title="6. Your Rights Under POPIA">
          <Bullet><strong>Right to Access</strong> — request a copy of your data</Bullet>
          <Bullet><strong>Right to Correction</strong> — request correction of inaccurate data</Bullet>
          <Bullet><strong>Right to Deletion</strong> — request deletion (subject to legal retention requirements)</Bullet>
          <Bullet><strong>Right to Object</strong> — object to certain processing</Bullet>
          <Bullet><strong>Right to Complain</strong> — lodge a complaint with the Information Regulator of South Africa (inforeg.org.za)</Bullet>
          <p style={{ marginTop: 10 }}>To exercise any right, email privacy@maizu.co.za. We respond within 30 days.</p>
        </Section>

        <Section title="7. Data Retention">
          <Bullet>Account data: account lifetime plus 5 years</Bullet>
          <Bullet>Order and transaction records: 7 years (SA tax law)</Bullet>
          <Bullet>Session logs: 90 days</Bullet>
        </Section>

        <Section title="8. Children's Privacy">
          Maizu is not intended for users under 18. If you believe a minor has registered, contact privacy@maizu.co.za immediately.
        </Section>

        <Section title="9. Contact Us">
          privacy@maizu.co.za<br/>
          Durban, KwaZulu-Natal, South Africa
        </Section>

        <div style={{ fontSize: 11, color: MUTED, marginTop: 30 }}>Last updated: June 2026</div>
      </div>
    </div>
  );
}
