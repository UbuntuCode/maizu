/* Global footer — rendered on every page via app/layout.tsx.
   Uses next/link for client-side navigation. All targets are
   real routes. Refund & Cancellation link to /terms, where those
   policies live (Sections 6 & 7). */
import React from "react";
import Link from "next/link";

const DARK   = "#0F0F0F";
const MUTED  = "#71717A";
const BORDER = "#E4E4E7";
const P      = "#E8401C";

const col: React.CSSProperties  = { display: "flex", flexDirection: "column", gap: 10, minWidth: 150 };
const head: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 4 };
const link: React.CSSProperties = { fontSize: 13, color: MUTED, textDecoration: "none" };

export default function Footer() {
  return (
    <footer style={{ background: "#FFFFFF", borderTop: `0.5px solid ${BORDER}`, marginTop: 40, paddingBottom: 96 /* clears mobile bottom nav */ }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 0" }}>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "32px 48px", justifyContent: "space-between" }}>

          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
              <span style={{ color: P }}>MAI</span><span style={{ color: DARK }}>ZU</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 1, marginBottom: 12 }}>BUSINESS HUB</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
              South Africa&apos;s premier business hub empowering entrepreneurs across the nation.
            </div>
          </div>

          {/* Platform */}
          <div style={col}>
            <div style={head}>Platform</div>
            <Link href="/mall"      style={link}>Explore Mall</Link>
            <Link href="/stores"    style={link}>Browse Stores</Link>
            <Link href="/search"    style={link}>Search Products</Link>
            <Link href="/live-feed" style={link}>Live Feed</Link>
            <Link href="/sell"      style={link}>Start Selling</Link>
          </div>

          {/* Legal */}
          <div style={col}>
            <div style={head}>Legal</div>
            <Link href="/terms"   style={link}>Terms &amp; Conditions</Link>
            <Link href="/privacy" style={link}>Privacy Policy</Link>
            <Link href="/terms"   style={link}>Refund Policy</Link>
            <Link href="/terms"   style={link}>Cancellation Policy</Link>
          </div>

          {/* Connect */}
          <div style={col}>
            <div style={head}>Connect</div>
            <Link href="/contact" style={link}>Contact Us</Link>
            <Link href="/support" style={link}>Support</Link>
            <Link href="/help"    style={link}>Help &amp; FAQ</Link>
          </div>
        </div>

        <div style={{ borderTop: `0.5px solid ${BORDER}`, marginTop: 28, padding: "18px 0", textAlign: "center", fontSize: 12, color: MUTED }}>
          © {new Date().getFullYear()} Maizu Business Hub (Pty) Ltd. Empowering South African entrepreneurs, one store at a time. 🇿🇦
        </div>
      </div>
    </footer>
  );
}
