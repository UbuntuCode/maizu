"use client";
import React, { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const CLOUD_NAME    = "ddjf6z9dv";
const UPLOAD_PRESET = "maizu_unsigned";

const P     = "#E8401C";
const DARK  = "#0F0F0F";
const MUTED = "#71717A";
const BG    = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER= "#E4E4E7";
const SOFT  = "#FFF3EF";

const CATEGORIES = [
  "Fashion", "Electronics", "Beauty", "Food", "Home", "Sports", "Art & Crafts", "Services",
];

const CONDITIONS = [
  { key: "new",          label: "Brand New",      desc: "Unused, original packaging" },
  { key: "like_new",     label: "Like New",       desc: "Used once or twice, no flaws" },
  { key: "good",         label: "Good",           desc: "Used with light signs of wear" },
  { key: "fair",         label: "Fair",           desc: "Visible wear, fully functional" },
];

const PHOTO_SLOTS = ["Front", "Back", "Top", "Bottom", "Tag/Label", "Box/Packaging", "Defects (if any)", "Detail shot"];

/* ── Section wrapper ───────────────────────────────────────── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: WHITE, borderRadius: 16, padding: "18px", marginBottom: 14, border: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>{subtitle}</div>}
      {!subtitle && <div style={{ marginBottom: 12 }} />}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 11,
  fontSize: 14, outline: "none", color: DARK, boxSizing: "border-box", background: "#FAFAFA",
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 };

interface PhotoItem { url: string; slot?: string; uploading?: boolean; }

export default function CreateListingPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const storeId       = searchParams.get("store");
  const { isLoggedIn, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photos,      setPhotos]      = useState<PhotoItem[]>([]);
  const [title,        setTitle]        = useState("");
  const [category,     setCategory]     = useState("");
  const [brand,        setBrand]        = useState("");
  const [size,         setSize]         = useState("");
  const [color,        setColor]        = useState("");
  const [condition,    setCondition]    = useState("new");
  const [description,  setDescription]  = useState("");
  const [priceFormat,  setPriceFormat]  = useState<"fixed" | "negotiable">("fixed");
  const [price,        setPrice]        = useState("");
  const [quantity,     setQuantity]     = useState("1");
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [handlingDays, setHandlingDays] = useState("3");
  const [returns,      setReturns]      = useState(false);

  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");
  const [step,  setStep]  = useState<1 | 2 | 3>(1);

  /* ── Photo upload to Cloudinary ──────────────────────────── */
  const handleFiles = useCallback(async (files: FileList) => {
    const slotsAvailable = PHOTO_SLOTS.filter(s => !photos.some(p => p.slot === s));
    const newPhotos: PhotoItem[] = Array.from(files).slice(0, 24 - photos.length).map((_, i) => ({
      url: "", uploading: true, slot: slotsAvailable[i] || undefined,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);

    const startIdx = photos.length;
    for (let i = 0; i < files.length && i < newPhotos.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
        const data = await res.json();
        setPhotos(prev => prev.map((p, idx) => idx === startIdx + i ? { ...p, url: data.secure_url, uploading: false } : p));
      } catch {
        setPhotos(prev => prev.filter((_, idx) => idx !== startIdx + i));
      }
    }
  }, [photos]);

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const titleChars = title.length;
  const descChars  = description.length;

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const canPublish = photos.filter(p => p.url).length >= 1 && title.trim().length >= 5 && category && price && Number(price) > 0;

  const handlePublish = async () => {
    if (!canPublish) { setError("Please complete all required fields before listing."); return; }
    setBusy(true); setError("");
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/products`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          store_id:     storeId,
          name:         title.trim(),
          description:  description.trim(),
          price:        Number(price),
          stock_quantity: Number(quantity) || 1,
          category,
          image_urls:   photos.filter(p => p.url).map(p => p.url),
          attributes:   { brand, size, color, condition, free_delivery: freeDelivery, handling_days: Number(handlingDays), returns_accepted: returns, price_format: priceFormat },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to create listing.");
      router.push(`/dashboard/products?store=${storeId}&created=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create listing.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return null;
  if (!isLoggedIn) { router.push("/login"); return null; }

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: WHITE, padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: DARK }}>Create Listing</div>
          <div style={{ fontSize: 11, color: MUTED }}>List a product on Maizu</div>
        </div>
        <button onClick={() => router.push("/dashboard/products")} style={{ background: "#F3F4F6", color: DARK, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Save draft
        </button>
      </div>

      <div style={{ padding: "16px" }}>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── PHOTOS & VIDEO ── */}
        <Section title="📷 Photos & Video" subtitle="Add at least 1 photo. Up to 24 photos and a 1-minute video. Buyers want to see all angles and details.">
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 10 }}>
            {photos.filter(p => p.url).length} of 24 photos uploaded
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
            onDragOver={e => e.preventDefault()}
            style={{ border: `2px dashed ${BORDER}`, borderRadius: 14, padding: "24px", textAlign: "center", cursor: "pointer", marginBottom: 14, background: "#FAFAFA" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5" style={{ margin: "0 auto 8px" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>Drag and drop files</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>or tap to upload from your device</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={e => e.target.files && handleFiles(e.target.files)} />

          {/* Photo grid with named slots */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {photos.map((photo, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: "#F0F0F0", border: i === 0 ? `2px solid ${P}` : `1px solid ${BORDER}` }}>
                {photo.uploading ? (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${P}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                  </div>
                ) : (
                  <img src={photo.url} alt={photo.slot || "Product photo"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {i === 0 && !photo.uploading && (
                  <div style={{ position: "absolute", top: 2, left: 2, background: P, color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: 4, padding: "1px 5px" }}>COVER</div>
                )}
                {photo.slot && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 8, padding: "2px 4px", textAlign: "center" }}>{photo.slot}</div>
                )}
                <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            ))}
            {photos.length < 24 && (
              <button onClick={() => fileRef.current?.click()} style={{ aspectRatio: "1", borderRadius: 10, border: `1.5px dashed ${BORDER}`, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: MUTED }}>+</button>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Section>

        {/* ── TITLE & CATEGORY ── */}
        <Section title="📝 Title & Category">
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Listing Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value.slice(0, 80))} placeholder="e.g. Nike Air Max 90 — Black, Size 8, Brand New" style={inputStyle} />
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4, textAlign: "right" }}>{titleChars}/80 characters</div>
          </div>

          <div>
            <label style={labelStyle}>Category *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ background: category === c ? P : "#F9FAFB", color: category === c ? "#fff" : DARK, border: `1.5px solid ${category === c ? P : BORDER}`, borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: category === c ? 700 : 400, cursor: "pointer" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── ITEM SPECIFICS ── */}
        <Section title="🏷️ Item Specifics" subtitle="Buyers need these details to find your item.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Brand</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Nike, Samsung" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Size</label>
              <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. M, 8, 256GB" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Colour</label>
              <input value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Black" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Quantity Available</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </Section>

        {/* ── CONDITION ── */}
        <Section title="✨ Condition">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CONDITIONS.map(c => (
              <button key={c.key} onClick={() => setCondition(c.key)}
                style={{ textAlign: "left", background: condition === c.key ? SOFT : "#F9FAFB", border: `1.5px solid ${condition === c.key ? P : BORDER}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: condition === c.key ? P : DARK }}>{c.label}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* ── DESCRIPTION ── */}
        <Section title="📄 Description" subtitle="Disclose all flaws to prevent returns and earn better reviews.">
          <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 2000))} placeholder="Describe your product — material, fit, what's included, any flaws..." rows={6}
            style={{ ...inputStyle, resize: "none" }} />
          <div style={{ fontSize: 10, color: MUTED, marginTop: 4, textAlign: "right" }}>{descChars}/2000 characters</div>
        </Section>

        {/* ── PRICING ── */}
        <Section title="💰 Pricing">
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { key: "fixed",      label: "Fixed Price", desc: "Set price, instant buy" },
              { key: "negotiable", label: "Negotiable",   desc: "Buyers can message an offer" },
            ].map(opt => (
              <button key={opt.key} onClick={() => setPriceFormat(opt.key as any)}
                style={{ flex: 1, textAlign: "left", background: priceFormat === opt.key ? SOFT : "#F9FAFB", border: `1.5px solid ${priceFormat === opt.key ? P : BORDER}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: priceFormat === opt.key ? P : DARK }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{opt.desc}</div>
              </button>
            ))}
          </div>

          <label style={labelStyle}>Price (ZAR) *</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: MUTED }}>R</span>
            <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 30 }} />
          </div>
        </Section>

        {/* ── DELIVERY ── */}
        <Section title="🚚 Delivery & Returns">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>Offer free delivery</div>
              <div style={{ fontSize: 11, color: MUTED }}>Listings with free delivery sell faster</div>
            </div>
            <button onClick={() => setFreeDelivery(f => !f)} style={{ width: 44, height: 26, borderRadius: 13, background: freeDelivery ? P : BORDER, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: freeDelivery ? 21 : 3, transition: "left 0.2s" }} />
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Handling Time</label>
            <select value={handlingDays} onChange={e => setHandlingDays(e.target.value)} style={inputStyle}>
              <option value="1">1 business day</option>
              <option value="2">2 business days</option>
              <option value="3">3 business days</option>
              <option value="5">5 business days</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>Accept returns</div>
              <div style={{ fontSize: 11, color: MUTED }}>Within 48 hours, as per Maizu's Refund Policy</div>
            </div>
            <button onClick={() => setReturns(r => !r)} style={{ width: 44, height: 26, borderRadius: 13, background: returns ? P : BORDER, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: returns ? 21 : 3, transition: "left 0.2s" }} />
            </button>
          </div>
        </Section>

        {/* ── PROMOTE ── */}
        <Section title="🔥 Promote Your Listing" subtitle="Get up to 90% more visibility across Maizu.">
          <div style={{ background: SOFT, borderRadius: 12, padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Feature this store</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>From R49 for 7 days — only pay if it boosts sales</div>
            </div>
            <button onClick={() => router.push("/dashboard/boost")} style={{ background: P, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
              Learn more
            </button>
          </div>
        </Section>

        {/* ── TERMS ── */}
        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, marginBottom: 16, padding: "0 4px" }}>
          By listing, you agree to Maizu's <a href="/terms" style={{ color: P }}>Terms & Conditions</a> and confirm your item complies with our <a href="/help" style={{ color: P }}>Content Moderation Policy</a>. You assume full responsibility for the accuracy of this listing.
        </div>

        {/* ── PUBLISH ── */}
        <button onClick={handlePublish} disabled={busy || !canPublish}
          style={{ width: "100%", background: (!canPublish || busy) ? "#D1D5DB" : P, color: "#fff", border: "none", borderRadius: 14, padding: "16px 0", fontSize: 15, fontWeight: 700, cursor: (!canPublish || busy) ? "default" : "pointer" }}>
          {busy ? "Publishing…" : "List it on Maizu"}
        </button>
        <div style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 8 }}>Free to list. Commission applies only when it sells.</div>
      </div>
    </div>
  );
}
