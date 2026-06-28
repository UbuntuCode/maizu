"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";

const P = "#E8401C";
const DARK = "#0F0F0F";
const MUTED = "#71717A";
const BORDER = "#E4E4E7";
const BG = "#F7F7F5";

interface StrengthResult {
  score:    0 | 1 | 2 | 3 | 4;
  label:    string;
  color:    string;
  checks: {
    length:    boolean;
    upper:     boolean;
    lower:     boolean;
    number:    boolean;
    special:   boolean;
  };
}

const checkStrength = (pw: string): StrengthResult => {
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const passed = Math.min(Object.values(checks).filter(Boolean).length, 4) as 0|1|2|3|4;
  const scores: [string, string][] = [
    ["Too short",  "#EF4444"],
    ["Weak",       "#EF4444"],
    ["Fair",       "#F59E0B"],
    ["Good",       "#3B82F6"],
    ["Strong",     "#10B981"],
  ];
  return { score: passed, label: scores[passed][0], color: scores[passed][1], checks };
};

const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:ok?"#10B981":MUTED }}>
    <div style={{ width:14, height:14, borderRadius:"50%", background:ok?"#D1FAE5":"#F3F4F6", border:`1px solid ${ok?"#10B981":BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {ok && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
    </div>
    {text}
  </div>
);

const Eye = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
  <button type="button" onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:MUTED, display:"flex" }}>
    {show
      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    }
  </button>
);

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { isLoggedIn } = useAuth();

  const [form, setForm] = useState({ full_name:"", email:"", password:"", confirm:"" });
  const [showPw,  setShowPw]  = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");
  const [step,    setStep]    = useState<"form"|"verify">("form");
  const [agreed,  setAgreed]  = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.push(nextPath);
    if (!localStorage.getItem("maizu_onboarded")) router.push("/onboarding");
  }, [isLoggedIn, router, nextPath]);

  const strength = checkStrength(form.password);
  const isValid  = strength.score >= 3 && form.password === form.confirm && form.full_name.trim().length >= 2 && form.email.includes("@") && agreed;

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 14px", background:"#FAFAFA",
    border:`1.5px solid ${BORDER}`, borderRadius:12,
    fontSize:14, color:DARK, outline:"none", boxSizing:"border-box",
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (strength.score < 3) { setError("Please choose a stronger password."); return; }
    if (form.password !== form.confirm) { setError("Passwords don't match."); return; }

    setBusy(true); setError("");
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { full_name: form.full_name.trim() },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (signUpError) throw signUpError;
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (step === "verify") {
    return (
      <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28 }}>
        <div style={{ maxWidth:340, width:"100%", textAlign:"center" }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"#D1FAE5", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 style={{ fontSize:22, fontWeight:800, color:DARK, marginBottom:10 }}>Check your email</h2>
          <p style={{ fontSize:14, color:MUTED, lineHeight:1.7, marginBottom:28 }}>
            We sent a verification link to <strong style={{ color:DARK }}>{form.email}</strong>. Click the link to activate your account.
          </p>
          <button onClick={() => router.push(`/login?next=${encodeURIComponent(nextPath)}`)} style={{ width:"100%", background:P, color:"#fff", border:"none", borderRadius:14, padding:"14px 0", fontSize:15, fontWeight:700, cursor:"pointer" }}>
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column" }}>
      <div style={{ background:"#fff", padding:"16px 20px", borderBottom:`0.5px solid ${BORDER}`, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={() => router.back()} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize:16, fontWeight:700, color:DARK }}>Create account</div>
      </div>

      <div style={{ flex:1, padding:"24px 20px 40px", maxWidth:440, width:"100%", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:28, fontWeight:900 }}><span style={{ color:P }}>mai</span><span style={{ color:DARK }}>zu</span></div>
          <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Join South Africa&apos;s marketplace</div>
        </div>

        {error && (
          <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#991B1B" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Full name</label>
            <input value={form.full_name} onChange={e => setForm(p => ({...p, full_name:e.target.value}))}
              placeholder="Sipho Dlamini" autoComplete="name" style={inp} />
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Email address</label>
            <input value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))}
              type="email" placeholder="sipho@email.com" autoComplete="email" style={inp} />
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Password</label>
            <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
              <input value={form.password} onChange={e => setForm(p => ({...p, password:e.target.value}))}
                type={showPw?"text":"password"} placeholder="Create a strong password" autoComplete="new-password"
                style={{ ...inp, paddingRight:44 }} />
              <div style={{ position:"absolute", right:10 }}><Eye show={showPw} toggle={() => setShowPw(s=>!s)} /></div>
            </div>

            {form.password.length > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ height:3, background:"#F3F4F6", borderRadius:2, overflow:"hidden", marginBottom:6 }}>
                  <div style={{ height:"100%", width:`${(strength.score/4)*100}%`, background:strength.color, borderRadius:2, transition:"all 0.3s" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:11, color:strength.color, fontWeight:600 }}>{strength.label}</span>
                  <span style={{ fontSize:10, color:MUTED }}>{4 - strength.score} requirement{4 - strength.score !== 1 ? "s" : ""} remaining</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 16px" }}>
                  <Rule ok={strength.checks.length}  text="At least 8 characters" />
                  <Rule ok={strength.checks.upper}   text="One uppercase letter" />
                  <Rule ok={strength.checks.lower}   text="One lowercase letter" />
                  <Rule ok={strength.checks.number}  text="One number" />
                  <Rule ok={strength.checks.special} text="One special character" />
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Confirm password</label>
            <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
              <input value={form.confirm} onChange={e => setForm(p => ({...p, confirm:e.target.value}))}
                type={showCfm?"text":"password"} placeholder="Re-enter your password" autoComplete="new-password"
                style={{ ...inp, paddingRight:44, borderColor: form.confirm && form.confirm !== form.password ? "#EF4444" : BORDER }} />
              <div style={{ position:"absolute", right:10 }}><Eye show={showCfm} toggle={() => setShowCfm(s=>!s)} /></div>
            </div>
            {form.confirm && form.confirm !== form.password && (
              <div style={{ fontSize:11, color:"#EF4444", marginTop:4 }}>Passwords don&apos;t match</div>
            )}
          </div>

          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <div onClick={() => setAgreed(a => !a)} style={{ width:20, height:20, borderRadius:5, border:`2px solid ${agreed?P:BORDER}`, background:agreed?P:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginTop:1 }}>
              {agreed && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <span style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>
              I agree to Maizu&apos;s <span style={{ color:P, cursor:"pointer" }}>Terms of Service</span> and <span style={{ color:P, cursor:"pointer" }}>Privacy Policy</span>
            </span>
          </div>

          <button type="submit" disabled={!isValid || busy}
            style={{ background:!isValid||busy?"#D1D5DB":P, color:"#fff", border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:700, cursor:!isValid||busy?"default":"pointer", marginTop:4 }}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:MUTED }}>
          Already have an account?{" "}
          <button onClick={() => router.push(`/login?next=${encodeURIComponent(nextPath)}`)} style={{ background:"none", border:"none", color:P, fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: BG }} />}>
      <RegisterPageContent />
    </Suspense>
  );
}
