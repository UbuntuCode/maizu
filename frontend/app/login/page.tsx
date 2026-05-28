"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router                    = useRouter();
  const { signIn, isLoggedIn, loading } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isLoggedIn) router.replace("/");
  }, [isLoggedIn, loading, router]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.push("/");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message.includes("Invalid login")
            ? "Wrong email or password. Please try again."
            : err.message
          : "Login failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null; // wait for session check

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ height: 60, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Logo />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px 80px" }}>
        <div style={{ width: "100%", maxWidth: 380, background: C.white, borderRadius: 20, padding: "32px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          {/* Icon + title */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, background: C.softOrange, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px" }}>🏪</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 5 }}>Welcome Back</div>
            <div style={{ fontSize: 13, color: C.gray }}>Sign in to your Maizu account</div>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B" }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="you@example.com"
              autoComplete="email"
              style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ width: "100%", padding: "12px 44px 12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.gray }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <span style={{ fontSize: 12, color: C.primary, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={busy}
            style={{ width: "100%", background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer", marginBottom: 16, transition: "background 0.2s" }}
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.grayLight }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: C.gray }}>Don&apos;t have an account? </span>
            <span onClick={() => router.push("/register")} style={{ fontSize: 13, color: C.primary, fontWeight: 700, cursor: "pointer" }}>
              Sign Up Free
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
