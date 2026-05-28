"use client";
import { C } from "@/utils/constants";
import { BellIc } from "@/components/ui/icons";

export default function Bell({ n = 2 }: { n?: number }) {
  return (
    <div style={{ position: "relative", cursor: "pointer" }}>
      <BellIc />
      {n > 0 && (
        <span style={{
          position: "absolute", top: -5, right: -5,
          background: C.primary, color: "#fff",
          borderRadius: "50%", width: 17, height: 17,
          fontSize: 9, display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 800, border: "2px solid #fff"
        }}>{n}</span>
      )}
    </div>
  );
}
