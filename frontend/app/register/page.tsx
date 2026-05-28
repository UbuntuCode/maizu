"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router                      = useRouter();
  const { signUp, isLoggedIn, loading } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email:     "",
    password:  "",
    confirm:   "",
    role:      "buyer" as "buyer" | "vendor",
  });
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");
  const [done,  setDone]  = useState(false); // email confirmation state

  useEffect(() => {
    if (!loading && isLoggedIn) router.replace("/");
  }, [isLoggedIn, loading, router]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const validate = (): string | null => {
    if (!form.full_name.trim())   return "Please enter your full name.";
    if (!form.email.trim())       return "Please enter your email.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setBusy(true);
    try {
      await signUp(form.email.trim().toLowerCase(), form.password, form.full_name.trim(), form.role);
      // Supabase sends a confirmation email by default.
      // If email confirmation is disabled in Supabase dashboard, user is logged in immediately.
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  // Show success screen after register
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 380, width: "100%", background: C.white, borderRadius: 20, padding: "40px 28px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 10 }}>You&apos;re in!</div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 24 }}>
            Account created successfully. Check your email for a confirmation link, then come back to sign in.
          </div>
          <button onClick={() => router.push("/login")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 60, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Logo />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px 80px" }}>
        <div style={{ width: "100%", maxWidth: 380, background: C.white, borderRadius: 20, padding: "32px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, background: C.softOrange, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px" }}>🚀</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 5 }}>Create Account</div>
            <div style={{ fontSize: 13, color: C.gray }}>Join 1,247+ South African entrepreneurs</div>
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B" }}>
              {error}
            </div>
          )}

          {/* Role picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 7 }}>I want to</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["buyer", "vendor"] as const).map(r => (
                <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))}
                  style={{ padding: "10px 0", border: `2px solid ${form.role === r ? C.primary : C.border}`, borderRadius: 12, fontSize: 13, fontWeight: form.role === r ? 700 : 500, color: form.role === r ? C.primary : C.gray, background: form.role === r ? C.softOrange : C.white, cursor: "pointer" }}>
                  {r === "buyer" ? "🛍 Shop" : "🏪 Sell"}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          {[
            { label: "Full Name",        key: "full_name", type: "text",     ph: "Kofi Mensah" },
            { label: "Email Address",    key: "email",     type: "email",    ph: "you@example.com" },
            { label: "Password",         key: "password",  type: "password", ph: "Min. 8 characters" },
            { label: "Confirm Password", key: "confirm",   type: "password", ph: "Repeat password" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key as keyof typeof form]} onChange={set(f.key as keyof typeof form)} placeholder={f.ph}
                style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" }} />
            </div>
          ))}

          {/* Benefits */}
          <div style={{ background: C.softOrange, borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
            {["Only 5% commission", "Free store setup", "Reach 50K+ daily shoppers"].map(b => (
              <div key={b} style={{ fontSize: 11, color: C.dark, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.green, fontWeight: 700 }}>✓</span> {b}
              </div>
            ))}
          </div>

          <button onClick={handleRegister} disabled={busy}
            style={{ width: "100%", background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer", marginBottom: 16 }}>
            {busy ? "Creating account…" : "Create My Account 🎉"}
          </button>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: C.gray }}>Already have an account? </span>
            <span onClick={() => router.push("/login")} style={{ fontSize: 13, color: C.primary, fontWeight: 700, cursor: "pointer" }}>Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );
}
