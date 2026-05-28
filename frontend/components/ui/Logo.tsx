"use client";
import { C } from "@/utils/constants";
import { Svg } from "@/components/ui/icons";

export default function Logo({ small = false }: { small?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: small ? 32 : 38, height: small ? 32 : 38,
        background: C.primary, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <Svg w={small ? 18 : 22} h={small ? 18 : 22} ch={
          <>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth={2.5} />
            <polyline points="9,22 9,12 15,12 15,22" stroke="#fff" strokeWidth={2.5} />
          </>
        } />
      </div>
      <div>
        <div style={{ fontSize: small ? 15 : 17, fontWeight: 900, color: C.primary, letterSpacing: 1.2, lineHeight: 1 }}>MAIZU</div>
        <div style={{ fontSize: 7, color: C.gray, letterSpacing: 2, textTransform: "uppercase", lineHeight: 1.6 }}>BUSINESS HUB</div>
      </div>
    </div>
  );
}
