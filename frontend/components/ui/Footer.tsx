"use client";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import Logo from "@/components/ui/Logo";

const PLATFORM_LINKS = [
  { label: "Explore Mall", path: "/mall" },
  { label: "Browse Stores", path: "/stores" },
  { label: "Live Feed", path: "/live-feed" },
];

const CONNECT_LINKS = [
  { label: "Contact Us", path: "/contact" },
  { label: "Support", path: "/support" },
  { label: "Privacy Policy", path: "/privacy" },
];

export default function Footer() {
  const router = useRouter();

  return (
    <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "28px 20px 18px" }}>
      <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginBottom: 22 }}>
        <div style={{ flex: "1 1 140px", minWidth: 130 }}>
          <Logo small />
          <p style={{ fontSize: 12, color: C.gray, marginTop: 10, lineHeight: 1.65 }}>
           South Africa&apos;s premier business hub empowering entrepreneurs across the nation. 
          </p>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Platform</div>
          {PLATFORM_LINKS.map(l => (
            <div key={l.label} onClick={() => router.push(l.path)} role="link" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(l.path); }}
              style={{ fontSize: 12, color: C.gray, marginBottom: 7, cursor: "pointer" }}>
              {l.label}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Connect</div>
          {CONNECT_LINKS.map(l => (
            <div key={l.label} onClick={() => router.push(l.path)} role="link" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(l.path); }}
              style={{ fontSize: 12, color: C.gray, marginBottom: 7, cursor: "pointer" }}>
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
        © 2026 Maizu Mall. Empowering South African entrepreneurs, one store at a time.
      </div>
    </footer>
  );
}