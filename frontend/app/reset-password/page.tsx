"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { supabase } from "@/utils/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready,    setReady]    = useState(false);   // recovery session established?
  const [checking, setChecking] = useState(true);
  const [pw1,      setPw1]      = useState("");
  const [pw2,      setPw2]      = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    /* When the user arrives from the recovery email, Supabase fires a
       PASSWORD_RECOVERY event and establishes a temporary session. */
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { settled = true; setReady(true); setChecking(false); }
    });

    /* Fallback: some flows already have the session by the time we mount */
    supabase.auth.getSession().then(({ data }) => {
      if (!settled) {
        if (data.session) { setReady(true); }
        setChecking(false);
      }
    });

    /* Safety timeout — never hang on the checking screen */
    const t = setTimeout(() => setChecking(false), 4000);

    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const handleSubmit = async () => {
    if (pw1.length < 8) { setError("Password must be at least 8 characters. A short phrase works well."); return; }
    if (pw1 !== pw2)   { setError("The two passwords don't match."); return; }
    setBusy(true); setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) { setError(error.message); setBusy(false); return; }
      setDone(true);
      /* Sign out the temporary recovery session so they log in fresh */
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      console.error(err);
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
          This password reset link is no longer valid. Reset links expire after a while — please request a fresh one.
        </div>
        <button onClick={() => router.push("/login")}
          style={{ width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Request a new link
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
          You&apos;re all set. Redirecting you to login…
        </div>
      </div>
    );
  }

  return shell(
    <>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 6 }}>Set a new password</div>
      <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginBottom: 20 }}>
        Choose a strong password — a few words strung together works better than one tricky word.
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>{error}</div>
      )}

      <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>New password</label>
      <input value={pw1} onChange={e => setPw1(e.target.value)} type="password" placeholder="At least 8 characters"
        style={{ ...inp, marginBottom: 14 }} />

      <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Confirm new password</label>
      <input value={pw2} onChange={e => setPw2(e.target.value)} type="password" placeholder="Re-enter it"
        onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ ...inp, marginBottom: 18 }} />

      <button onClick={handleSubmit} disabled={busy}
        style={{ width: "100%", background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
        {busy ? "Updating…" : "Update password"}
      </button>
    </>
  );
}
