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

export default function TermsPage() {
  const router = useRouter();

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <div style={{ background: WHITE, padding: "16px 20px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>Terms & Conditions</div>
      </div>

      <div style={{ padding: "24px 20px 60px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>Last updated: June 2026</div>

        <Section title="1. Acceptance of Terms">
          These Terms and Conditions govern your access to and use of the Maizu Business Hub platform ("Platform"), operated by Maizu Business Hub (Pty) Ltd ("Maizu", "we", "us"). By creating an account or using the Platform, you agree to be bound by these Terms.
        </Section>

        <Section title="2. Eligibility">
          <Bullet>You must be 18 years or older to use the Platform</Bullet>
          <Bullet>You must be a resident of South Africa or operate a South African business to sell on the Platform</Bullet>
          <Bullet>You must provide accurate and truthful registration information</Bullet>
        </Section>

        <Section title="3. Buyer & Vendor Accounts">
          Every Maizu account can act as a buyer. Any user can choose to become a vendor at any time by upgrading their account through the "Become a Vendor" option — this is free and instant. Vendors can open one or more stores depending on their subscription plan and list products for sale.
        </Section>

        <Section title="4. Vendor Responsibilities">
          <Bullet>Listings must accurately describe the product including condition, size, colour and material</Bullet>
          <Bullet>Prices must be in South African Rand (ZAR), inclusive of VAT where applicable</Bullet>
          <Bullet>Stock quantities must be kept accurate at all times</Bullet>
          <Bullet>Orders must be confirmed within 24 hours and dispatched within 3 business days</Bullet>
          <Bullet>Prohibited items include counterfeit goods, illegal substances, weapons, explicit content and stolen goods</Bullet>
        </Section>

        <Section title="5. Payments & Commission">
          Maizu deducts a commission from each completed transaction: 5% on the Free plan, 3% on Basic, 1% on Pro. A 5% platform service fee is added to the buyer's total at checkout. Payments are processed via Flutterwave, PayFast, EFT, or Cash on Delivery, depending on what the vendor enables.
        </Section>

        {/* ── REFUND POLICY ── */}
        <Section title="6. Refund Policy">
          <p style={{ marginBottom: 8 }}>You may request a refund if:</p>
          <Bullet>The item received is significantly different from the listing description or photos</Bullet>
          <Bullet>The item is damaged, broken or defective on arrival</Bullet>
          <Bullet>The wrong item was sent (incorrect size, colour or product)</Bullet>
          <Bullet>The item never arrived within 10 business days of dispatch</Bullet>
          <p style={{ marginTop: 10, marginBottom: 8 }}><strong>How to request:</strong> Go to My Orders → select the order → "Report a Problem" → choose your reason and upload photos. The vendor has 48 hours to respond. If unresolved, escalate to support@maizu.co.za.</p>
          <p style={{ marginBottom: 8 }}><strong>Refund timelines:</strong></p>
          <Bullet>Card payments: 5–10 business days back to your original card</Bullet>
          <Bullet>EFT payments: 5 business days to your bank account</Bullet>
          <Bullet>Cash on Delivery: arranged directly with the vendor, with Maizu mediation if needed</Bullet>
          <p style={{ marginTop: 10 }}><strong>Non-returnable items:</strong> Perishable food (unless spoiled), opened hygiene products, custom or personalised items, and digital products are not eligible for return.</p>
        </Section>

        {/* ── CANCELLATION POLICY ── */}
        <Section title="7. Cancellation Policy">
          <p style={{ marginBottom: 8 }}><strong>Buyer cancellations:</strong></p>
          <Bullet>You may cancel your order free of charge within 1 hour of placing it, provided the vendor has not yet confirmed it</Bullet>
          <Bullet>Once an order is confirmed by the vendor, cancellation is at the vendor's discretion</Bullet>
          <Bullet>Once an order has shipped, it cannot be cancelled — you may instead request a return once delivered</Bullet>
          <p style={{ marginTop: 10, marginBottom: 8 }}><strong>Vendor cancellations:</strong></p>
          <Bullet>Vendors must confirm or cancel orders within 24 hours of payment</Bullet>
          <Bullet>If a vendor cancels an order, the buyer receives a full refund automatically</Bullet>
          <Bullet>Vendors who cancel orders repeatedly without valid reason may have their account suspended</Bullet>
          <p style={{ marginTop: 10, marginBottom: 8 }}><strong>Subscription cancellations:</strong></p>
          <Bullet>Vendor subscription plans (Basic, Pro) can be downgraded or cancelled at any time from the dashboard</Bullet>
          <Bullet>Subscription fees already paid for the current billing period are non-refundable</Bullet>
          <Bullet>Featured store boost purchases are non-refundable once the placement period has started</Bullet>
        </Section>

        <Section title="8. Dispute Resolution">
          1. Contact the vendor directly through the Platform.<br/>
          2. If unresolved within 5 business days, escalate to support@maizu.co.za.<br/>
          3. Maizu will investigate and may request evidence from both parties.<br/>
          4. Maizu's decision is final for the purposes of Platform operations.
        </Section>

        <Section title="9. Limitation of Liability">
          Maizu operates as a marketplace platform and is not a party to transactions between buyers and vendors. Maizu is not liable for indirect or consequential damages arising from Platform use. Vendors are solely responsible for the quality, safety and legality of their products.
        </Section>

        <Section title="10. Governing Law">
          These Terms are governed by the laws of the Republic of South Africa. Disputes shall be subject to the jurisdiction of the courts of KwaZulu-Natal.
        </Section>

        <Section title="11. Contact Us">
          Legal queries: legal@maizu.co.za<br/>
          Support: support@maizu.co.za<br/>
          Platform: maizu.co.za
        </Section>
      </div>
    </div>
  );
}
