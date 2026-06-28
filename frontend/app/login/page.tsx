"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";

const P     = "#E8401C";
const DARK  = "#0F0F0F";
const MUTED = "#71717A";
const BORDER= "#E4E4E7";
const BG    = "#F7F7F5";

const Eye = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
  <button type="button" onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:MUTED, display:"flex" }}>
    {show
      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    }
  </button>
);

/* ══════════════════════════════════════════════════════════════
   PAGE CONTENT — uses useSearchParams, must live inside Suspense
══════════════════════════════════════════════════════════════ */
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { isLoggedIn } = useAuth();

  const [email,  setEmail]  = useState("");
  const [pw,     setPw]     = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState("");
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.push(nextPath);
  }, [isLoggedIn, router, nextPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pw) return;
    setBusy(true); setError("");
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pw,
      });
      if (authError) {
        if (authError.message.includes("Invalid login")) throw new Error("Incorrect email or password.");
        if (authError.message.includes("Email not confirmed")) throw new Error("Please verify your email first. Check your inbox.");
        throw authError;
      }
      /* Session persists automatically — Supabase stores it in localStorage */
      router.push(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email first."); return; }
    setBusy(true); setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setBusy(false);
    }
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 14px", background:"#FAFAFA",
    border:`1.5px solid ${BORDER}`, borderRadius:12,
    fontSize:14, color:DARK, outline:"none", boxSizing:"border-box",
  };

  if (resetSent) {
    return (
      <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28 }}>
        <div style={{ maxWidth:340, width:"100%", textAlign:"center" }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"#D1FAE5", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 style={{ fontSize:22, fontWeight:800, color:DARK, marginBottom:10 }}>Check your email</h2>
          <p style={{ fontSize:14, color:MUTED, lineHeight:1.7, marginBottom:28 }}>
            A password reset link has been sent to <strong style={{ color:DARK }}>{email}</strong>.
          </p>
          <button onClick={() => { setForgot(false); setResetSent(false); }} style={{ width:"100%", background:P, color:"#fff", border:"none", borderRadius:14, padding:"14px 0", fontSize:15, fontWeight:700, cursor:"pointer" }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"#fff", padding:"16px 20px", borderBottom:`0.5px solid ${BORDER}`, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={() => router.back()} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize:16, fontWeight:700, color:DARK }}>{forgot ? "Reset password" : "Sign in"}</div>
      </div>

      <div style={{ flex:1, padding:"32px 20px 40px", maxWidth:440, width:"100%", margin:"0 auto", display:"flex", flexDirection:"column", justifyContent:"center" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:30, fontWeight:900 }}><span style={{ color:P }}>mai</span><span style={{ color:DARK }}>zu</span></div>
          <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>
            {forgot ? "We'll send you a reset link" : "Welcome back"}
          </div>
        </div>

        {error && (
          <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#991B1B" }}>
            {error}
          </div>
        )}

        <form onSubmit={forgot ? handleForgot : handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Email address</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="your@email.com" autoComplete="email" style={inp} />
          </div>

          {/* Password (sign in only) */}
          {!forgot && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:12, fontWeight:600, color:DARK }}>Password</label>
                <button type="button" onClick={() => setForgot(true)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:P, fontWeight:500 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <input value={pw} onChange={e => setPw(e.target.value)}
                  type={showPw?"text":"password"} placeholder="Your password" autoComplete="current-password"
                  style={{ ...inp, paddingRight:44 }} />
                <div style={{ position:"absolute", right:10 }}><Eye show={showPw} toggle={() => setShowPw(s=>!s)} /></div>
              </div>
            </div>
          )}

          <button type="submit" disabled={busy || !email.trim() || (!forgot && !pw)}
            style={{ background:busy||!email.trim()||(!forgot&&!pw)?"#D1D5DB":P, color:"#fff", border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:4 }}>
            {busy ? (forgot ? "Sending…" : "Signing in…") : (forgot ? "Send reset link" : "Sign in")}
          </button>
        </form>

        {forgot && (
          <button onClick={() => { setForgot(false); setError(""); }} style={{ background:"none", border:"none", color:MUTED, fontSize:13, cursor:"pointer", marginTop:14, textAlign:"center" }}>
            Back to sign in
          </button>
        )}

        {!forgot && (
          <div style={{ textAlign:"center", marginTop:24, fontSize:13, color:MUTED }}>
            Don&apos;t have an account?{" "}
            <button onClick={() => router.push(`/register?next=${encodeURIComponent(nextPath)}`)} style={{ background:"none", border:"none", color:P, fontWeight:700, cursor:"pointer", fontSize:13 }}>
              Create one free
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DEFAULT EXPORT — wraps content in Suspense
══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: BG }} />}>
      <LoginPageContent />
    </Suspense>
  );
}
