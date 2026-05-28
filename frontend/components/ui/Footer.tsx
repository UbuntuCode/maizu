"use client";
import { C } from "@/utils/constants";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "28px 20px 18px" }}>
      <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginBottom: 22 }}>
        <div style={{ flex: "1 1 140px", minWidth: 130 }}>
          <Logo small />
          <p style={{ fontSize: 12, color: C.gray, marginTop: 10, lineHeight: 1.65 }}>
            South Africa's premier business hub empowering entrepreneurs across the nation.
          </p>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Platform</div>
          {["Explore Mall", "Browse Stores", "Live Feed"].map(l => (
            <div key={l} style={{ fontSize: 12, color: C.gray, marginBottom: 7, cursor: "pointer" }}>{l}</div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Connect</div>
          {["Contact Us", "Support", "Privacy Policy"].map(l => (
            <div key={l} style={{ fontSize: 12, color: C.gray, marginBottom: 7, cursor: "pointer" }}>{l}</div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
        © 2026 Maizu Mall. Empowering South African entrepreneurs, one store at a time.
      </div>
    </footer>
  );
}
