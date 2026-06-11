"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

const BASE   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P      = "#E8401C";
const DARK   = "#0F0F0F";
const MUTED  = "#71717A";
const BG     = "#F7F7F5";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E4E7";

const CATEGORIES = [
  "Fashion", "Electronics", "Beauty", "Food",
  "Home", "Sports", "Art & Crafts", "Services", "Education", "Other",
];

const inp: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "#FAFAFA",
  border: `1.5px solid ${BORDER}`,
  borderRadius: 11, fontSize: 14,
  color: DARK, outline: "none",
  boxSizing: "border-box",
};

export default function CreateStorePage() {
  const router  = useRouter();
  const { isLoggedIn, loading, refreshProfile } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name:        "",
    category:    "",
    description: "",
    location:    "",
    whatsapp:    "",
  });
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);
  const [storeId,     setStoreId]     = useState("");

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const isValid = form.name.trim().length >= 2 && form.category !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setBusy(true); setError("");

    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd.session?.access_token;

      /* Build multipart form data */
      const fd = new FormData();
      fd.append("name",        form.name.trim());
      fd.append("category",    form.category);
      fd.append("description", form.description.trim());
      fd.append("location",    form.location.trim());
      fd.append("whatsapp",    form.whatsapp.trim());
      if (logoFile) fd.append("logo", logoFile);

      const res  = await fetch(`${BASE}/api/vendors/stores`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to create store.");

      await refreshProfile();
      setStoreId(data.store?.id || "");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!loading && !isLoggedIn) {
    router.push("/login");
    return null;
  }

  if (success) {
    return (
      <div style={{ background: BG, minHeight: "100vh", paddingBottom: 80 }}>
        <Header />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DARK, marginBottom: 8 }}>Store created!</h2>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 28, maxWidth: 280, lineHeight: 1.6 }}>
            Your store is live on Maizu. Add products and start selling.
          </p>
          <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 340 }}>
            <button
              onClick={() => router.push(`/stores/${storeId}`)}
              style={{ flex: 1, background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 600, color: DARK, cursor: "pointer" }}
            >
              View store
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ flex: 1, background: P, color: WHITE, border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Add products
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 80 }}>
      <Header />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: DARK, marginBottom: 6 }}>Open your store</h1>
          <p style={{ fontSize: 14, color: MUTED }}>Set up your Maizu store in under 5 minutes.</p>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Logo */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 8 }}>Store logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                onClick={() => logoRef.current?.click()}
                style={{ width: 72, height: 72, borderRadius: 16, background: logoPreview ? "transparent" : "#F4F4F4", border: `2px dashed ${BORDER}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                }
              </div>
              <div>
                <button type="button" onClick={() => logoRef.current?.click()} style={{ background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: DARK, cursor: "pointer", display: "block", marginBottom: 4 }}>
                  {logoPreview ? "Change logo" : "Upload logo"}
                </button>
                <div style={{ fontSize: 11, color: MUTED }}>JPG, PNG — recommended 200×200px</div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Store name *</label>
            <input value={form.name} onChange={set("name")} placeholder="e.g. Nomsa's Boutique" style={inp} />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Category *</label>
            <select value={form.category} onChange={set("category")} style={inp}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>About your store</label>
            <textarea
              value={form.description}
              onChange={set("description") as React.ChangeEventHandler<HTMLTextAreaElement>}
              placeholder="Tell shoppers what you sell and what makes your store unique…"
              rows={3}
              style={{ ...inp, resize: "none" }}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>Location</label>
            <input value={form.location} onChange={set("location")} placeholder="e.g. Durban, KwaZulu-Natal" style={inp} />
          </div>

          {/* WhatsApp */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 }}>WhatsApp number <span style={{ fontWeight: 400, color: MUTED }}>(optional)</span></label>
            <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+27 71 234 5678" type="tel" style={inp} />
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Buyers will be able to message you directly.</div>
          </div>

          <button
            type="submit"
            disabled={!isValid || busy}
            style={{ background: !isValid || busy ? "#D1D5DB" : P, color: WHITE, border: "none", borderRadius: 14, padding: "15px 0", fontSize: 15, fontWeight: 700, cursor: !isValid || busy ? "default" : "pointer", marginTop: 8 }}
          >
            {busy ? "Creating store…" : "Create my store"}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
