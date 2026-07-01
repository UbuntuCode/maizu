"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P    = "#E8401C";
const DARK = "#0F0F0F";
const MUTED= "#71717A";
const BG   = "#F7F7F5";
const WHITE= "#FFFFFF";

/* ══════════════════════════════════════════════════════════════
   BECOME A VENDOR
   This is the missing link: buyers had no working way to
   become a vendor. This page upgrades their role server-side,
   then sends them straight to the store creation form.
══════════════════════════════════════════════════════════════ */
export default function BecomeVendorPage() {
  const router = useRouter();
  const { authUser, profile, isLoggedIn, loading: authLoading, refreshProfile } = useAuth();

  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  const p = profile as any;
  const alreadyVendor = p?.role === "vendor" || p?.role === "admin";

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login?next=/become-vendor");
  }, [authLoading, isLoggedIn, router]);

  /* If already a vendor, skip straight to creating a store */
  useEffect(() => {
    if (alreadyVendor) router.push("/dashboard/create-store");
  }, [alreadyVendor, router]);

  const handleBecomeVendor = async () => {
    setBusy(true); setError("");
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd.session?.access_token;

      const res = await fetch(`${BASE}/api/vendors/become-vendor`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Could not update your account.");

      await refreshProfile();
      router.push("/dashboard/create-store");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || alreadyVendor) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: MUTED }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>
      <div style={{ background: WHITE, padding: "16px 20px", borderBottom: "0.5px solid #E4E4E7", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>Become a Vendor</div>
      </div>

      <div style={{ flex: 1, padding: "32px 24px", maxWidth: 440, margin: "0 auto", display: "flex", flexDirection: "column" }}>

        <div style={{ width: 72, height: 72, borderRadius: 18, background: "#FFF3EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>
          🏪
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, textAlign: "center", marginBottom: 10 }}>
          Open your store on Maizu
        </h1>
       <p style={{ fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 1.6, marginBottom: 28 }}>
          You&apos;re currently registered as a buyer. To list products and sell on Maizu, we&apos;ll upgrade your account to a vendor account — this takes one tap and you keep all your existing buyer history.
        </p>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B" }}>
            {error}
          </div>
        )}

        <div style={{ background: WHITE, borderRadius: 16, padding: "18px", marginBottom: 24, border: "1px solid #E4E4E7" }}>
          {[
            "Free to start — no setup fee",
            "Accept card, EFT and cash on delivery payments",
            "5% commission on Free plan, upgrade anytime for less",
            "You can still shop as a buyer at the same time",
          ].map(line => (
            <div key={line} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ color: "#10B981", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 13, color: DARK, lineHeight: 1.5 }}>{line}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleBecomeVendor}
          disabled={busy}
          style={{ background: busy ? "#D1D5DB" : P, color: WHITE, border: "none", borderRadius: 14, padding: "15px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer" }}
        >
          {busy ? "Setting up your vendor account…" : "Become a Vendor & Open My Store"}
        </button>

        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: MUTED, fontSize: 13, marginTop: 14, cursor: "pointer" }}>
          Not right now
        </button>
      </div>
    </div>
  );
}
