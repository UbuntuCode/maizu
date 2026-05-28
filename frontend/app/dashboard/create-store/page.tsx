"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { storesApi } from "@/utils/api";
import Header from "@/components/layout/Header";

const CATEGORIES = [
  "Fashion", "Electronics", "Beauty", "Food",
  "Home", "Sports", "Services", "Art & Crafts",
  "Health", "Education", "Entertainment", "Other",
];

const FLOORS = [
  "Ground Floor - Fashion & Clothing",
  "Ground Floor - Electronics & Tech",
  "Ground Floor - Beauty & Wellness",
  "Ground Floor - Food & Dining",
  "Ground Floor - Home & Living",
  "Ground Floor - Sports & Fitness",
  "Ground Floor - Services",
  "Ground Floor - Art & Crafts",
];

export default function CreateStorePage() {
  const router = useRouter();
  const { isLoggedIn, loading, profile } = useAuth();

  const [form, setForm] = useState({
    name:           "",
    description:    "",
    category:       "",
    floor_location: "",
  });
  const [logoFile,   setLogoFile]   = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");
  const [step,  setStep]  = useState(1); // 1=details, 2=images, 3=review

  const logoRef   = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/login");
  }, [loading, isLoggedIn, router]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleFileChange = (type: "logo" | "banner") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (type === "logo")   { setLogoFile(file);   setLogoPreview(url); }
      if (type === "banner") { setBannerFile(file); setBannerPreview(url); }
    };

  const validateStep1 = () => {
    if (!form.name.trim())     return "Store name is required.";
    if (!form.category)        return "Please select a category.";
    if (!form.description.trim()) return "Please add a short description.";
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    setError("");
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name",           form.name.trim());
      fd.append("description",    form.description.trim());
      fd.append("category",       form.category);
      fd.append("floor_location", form.floor_location);
      if (logoFile)   fd.append("logo",   logoFile);
      if (bannerFile) fd.append("banner", bannerFile);

      const store = await storesApi.create(fd);
      router.push(`/dashboard/stores/${store.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create store.");
      setBusy(false);
    }
  };

  if (loading) return null;

  /* ── Progress bar ── */
  const Progress = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? C.primary : C.border, transition: "background 0.3s" }} />
      ))}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${C.border}`, borderRadius: 12,
    fontSize: 14, outline: "none", color: C.dark,
    boxSizing: "border-box", background: "#FAFAFA",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.dark,
    display: "block", marginBottom: 6,
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      <Header />

      {/* Page header */}
      <div style={{ background: C.white, padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark, padding: 0, marginBottom: 10 }}>
          ‹ Back
        </button>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>Create Your Store</div>
        <div style={{ fontSize: 13, color: C.gray, marginTop: 3 }}>
          Step {step} of 3 — {step === 1 ? "Store Details" : step === 2 ? "Add Images" : "Review & Launch"}
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <Progress />

        {/* Error */}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B" }}>
            {error}
          </div>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Store Name *</label>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Ankara Royale" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Category *</label>
              <select value={form.category} onChange={set("category")} style={inputStyle}>
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Floor Location</label>
              <select value={form.floor_location} onChange={set("floor_location")} style={inputStyle}>
                <option value="">Select floor location…</option>
                {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Description *</label>
              <textarea
                value={form.description}
                onChange={set("description") as React.ChangeEventHandler<HTMLTextAreaElement>}
                placeholder="Tell customers what your store is about…"
                rows={4}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Images ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Logo */}
            <div>
              <label style={labelStyle}>Store Logo</label>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 10 }}>Square image recommended (e.g. 400×400px)</div>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleFileChange("logo")} style={{ display: "none" }} />
              <div
                onClick={() => logoRef.current?.click()}
                style={{ width: 120, height: 120, borderRadius: 16, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: "#FAFAFA" }}
              >
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>📷</div><div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>Upload logo</div></div>
                }
              </div>
              {logoPreview && (
                <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} style={{ marginTop: 8, background: "none", border: "none", color: C.gray, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                  Remove
                </button>
              )}
            </div>

            {/* Banner */}
            <div>
              <label style={labelStyle}>Store Banner</label>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 10 }}>Wide image recommended (e.g. 1200×400px)</div>
              <input ref={bannerRef} type="file" accept="image/*" onChange={handleFileChange("banner")} style={{ display: "none" }} />
              <div
                onClick={() => bannerRef.current?.click()}
                style={{ width: "100%", height: 140, borderRadius: 16, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: "#FAFAFA" }}
              >
                {bannerPreview
                  ? <img src={bannerPreview} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>🖼️</div><div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>Upload banner image</div></div>
                }
              </div>
              {bannerPreview && (
                <button onClick={() => { setBannerFile(null); setBannerPreview(null); }} style={{ marginTop: 8, background: "none", border: "none", color: C.gray, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                  Remove
                </button>
              )}
            </div>

            <div style={{ background: C.softOrange, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: C.dark, lineHeight: 1.6 }}>
              💡 Images are optional — you can add them later from your store management page.
            </div>
          </div>
        )}

        {/* ── STEP 3: Review ── */}
        {step === 3 && (
          <div>
            {/* Preview card */}
            <div style={{ background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              {/* Banner */}
              <div style={{ height: 120, background: bannerPreview ? "transparent" : `linear-gradient(135deg, ${C.primary}22, ${C.primary}44)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                {bannerPreview ? <img src={bannerPreview} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
              </div>

              <div style={{ padding: "16px" }}>
                {/* Logo + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: logoPreview ? "transparent" : C.softOrange, overflow: "hidden", border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>{form.name}</div>
                    <div style={{ fontSize: 12, color: C.gray }}>{form.category}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.6, marginBottom: 10 }}>{form.description}</div>
                {form.floor_location && (
                  <div style={{ fontSize: 11, color: C.gray, display: "flex", alignItems: "center", gap: 4 }}>
                    📍 {form.floor_location}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
              {[
                ["Store Name",  form.name],
                ["Category",    form.category],
                ["Location",    form.floor_location || "Not specified"],
                ["Logo",        logoFile ? logoFile.name : "No logo (can add later)"],
                ["Banner",      bannerFile ? bannerFile.name : "No banner (can add later)"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.gray }}>{label}</span>
                  <span style={{ color: C.dark, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext} style={{ flex: 2, background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={busy} style={{ flex: 2, background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
              {busy ? "Creating store…" : "🚀 Launch My Store"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
