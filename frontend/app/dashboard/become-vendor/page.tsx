"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";

export default function BecomeVendorPage() {
  const router = useRouter();
  const { authUser, refreshProfile } = useAuth();
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    if (!authUser) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: "vendor" })
        .eq("id", authUser.id);

      if (error) throw new Error(error.message);

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/create-store"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upgrade account.");
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 8 }}>
            You&apos;re now a Vendor!
          </div>
          <div style={{ fontSize: 13, color: C.gray }}>
            Taking you to create your first store…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
      <div style={{ padding: "24px 16px" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark, marginBottom: 16 }}>
          ‹ Back
        </button>

        <div style={{ background: C.white, borderRadius: 20, padding: "28px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏪</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 8 }}>
            Become a Vendor
          </div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 24 }}>
            Upgrade your account to start selling on Maizu Mall. Open stores, add products, and reach thousands of shoppers.
          </div>

          {/* Benefits */}
          <div style={{ background: C.softOrange, borderRadius: 14, padding: "16px", marginBottom: 24, textAlign: "left" }}>
            {[
              "✓ Open unlimited stores",
              "✓ Add unlimited products",
              "✓ Only 5% commission per sale",
              "✓ Real-time order notifications",
              "✓ Access to analytics dashboard",
            ].map(b => (
              <div key={b} style={{ fontSize: 13, color: C.dark, marginBottom: 6, fontWeight: 500 }}>{b}</div>
            ))}
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={busy}
            style={{ width: "100%", background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer" }}
          >
            {busy ? "Upgrading…" : "Upgrade to Vendor — It's Free! 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}