"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { supabase } from "@/utils/supabase";

/* ══════════════════════════════════════════════════════════════
   RESET PASSWORD
   Why this reads the URL directly:
   The supabase client is configured with detectSessionInUrl: true,
   which CONSUMES the recovery token from the URL hash as soon as
   any page loads — firing PASSWORD_RECOVERY before a component can
   subscribe. So we can't rely on the event. Instead we look at the
   hash ourselves (window.location.hash contains type=recovery), and
   we also accept an existing session, since detectSessionInUrl will
   already have exchanged the token for one by the time we mount.
══════════════════════════════════════════════════════════════ */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready,    setReady]    = useState(false);
  const [checking, setChecking] = useState(true);
  const [pw1,      setPw1]      = useState("");
  const [pw2,      setPw2]      = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      /* 1. Is a recovery token sitting in the URL hash? */
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const isRecoveryHash = hash.includes("type=recovery") || hash.includes("access_token");

      /* 2. Did the client already exchange it for a session? */
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;

      /* 3. Explicit error in the hash (expired / already used link) */
      const hasError = hash.includes("error=") || hash.includes("error_code=");

      if (cancelled) return;

      if (hasError) {
        setReady(false);
      } else if (isRecoveryHash || hasSession) {
        /* Either the token is in the URL, or the client already
           consumed it — both mean: let them set a new password. */
        setReady(true);
      } else {
        setReady(false);
      }
      setChecking(false);
    };

    detect();

    /* Also catch the event if it happens to fire after we mount */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setChecking(false);
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async () => {
    if (pw1.length < 8) { setError("Password must be at least 8 characters. A few words strung together works well."); return; }
    if (pw1 !== pw2)   { setError("The two passwords don't match."); return; }
    setBusy(true); setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) {
        setError(error.message.includes("session")
          ? "This reset link has expired. Please request a new one from the login page."
          : error.message);
        setBusy(false);
        return;
      }
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      console.error("Password update failed:", err);
      setError("Something went wrong. Please request a new reset link.");
      setBusy(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "13px 15px",
    border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14,
    outline: "none", color: C.dark, background: "#FAFAFA",
  };

  const shell = (inner: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, background: C.white, borderRadius: 18, padding: "32px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.primary, marginBottom: 4 }}>maizu</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, letterSpacing: 1 }}>BUSINESS HUB</div>
        </div>
        {inner}
      </div>
    </div>
  );

  if (checking) {
    return shell(<div style={{ textAlign: "center", fontSize: 13, color: C.gray, padding: "20px 0" }}>Checking your reset link…</div>);
  }

  if (!ready) {
    return shell(
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 8 }}>Link expired or invalid</div>
        <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginBottom: 24 }}>
          This password reset link is no longer valid. Reset links expire after a while — please request a fresh one from the login page.
        </div>
        <button onClick={() => router.push("/login")}
          style={{ width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Back to login
        </button>
      </div>
    );
  }

  if (done) {
    return shell(
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 8 }}>Password updated</div>
        <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>
          You&apos;re all set. Taking you to the login page…
        </div>
      </div>
    );
  }

  return shell(
    <>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 6 }}>Set a new password</div>
      <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginBottom: 20 }}>
        Choose something strong — a few words strung together beats one tricky word.
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>{error}</div>
      )}

      <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>New password</label>
      <input value={pw1} onChange={e => setPw1(e.target.value)} type="password" placeholder="At least 8 characters" autoComplete="new-password"
        style={{ ...inp, marginBottom: 14 }} />

      <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Confirm new password</label>
      <input value={pw2} onChange={e => setPw2(e.target.value)} type="password" placeholder="Re-enter it" autoComplete="new-password"
        onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ ...inp, marginBottom: 18 }} />

      <button onClick={handleSubmit} disabled={busy}
        style={{ width: "100%", background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
        {busy ? "Updating…" : "Update password"}
      </button>
    </>
  );
}
