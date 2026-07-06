"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

/*
  Create Product â€” full redesign.
  Two-column layout: form on the left, live product-card preview on the right.
  Uploads the photo to your Cloudinary account, then saves the product to Supabase.

  IMPORTANT â€” one-time Cloudinary setup (2 minutes):
  1. Go to cloudinary.com â†’ Settings â†’ Upload â†’ Upload presets
  2. Click "Add upload preset"
  3. Set Signing mode to "Unsigned", name it exactly:  maizu_unsigned
  4. Save. That's it â€” uploads will work from the browser.
  (If you already have an unsigned preset, just change the name below.)
*/

const CLOUD_NAME    = "ddjf6z9dv";
const UPLOAD_PRESET = "maizu_unsigned";

const T = {
  primary: "#E8401C", primarySoft: "#FDEAE4",
  ink: "#161B26", sub: "#6B7080", faint: "#9CA1AD",
  bg: "#F7F7F5", card: "#FFFFFF", border: "#ECECEA",
};

const CATEGORIES = [
  "Fashion & Clothing", "Food & Drinks", "Beauty & Health", "Electronics",
  "Home & Decor", "Art & Crafts", "Services", "Other",
];

export default function CreateProductPage() {
  const router = useRouter();
  const { authUser } = useAuth();

  const [stores, setStores]   = useState<{ id: string; name: string }[]>([]);
  const [storeId, setStoreId] = useState("");
  const [name, setName]       = useState("");
  const [desc, setDesc]       = useState("");
  const [price, setPrice]     = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (!authUser) return;
    supabase.from("stores").select("id,name").eq("owner_id", authUser.id)
      .then(({ data }) => {
        setStores(data || []);
        if (data?.length) setStoreId(data[0].id);
      });
  }, [authUser]);

  const onPickFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const r = new FileReader();
      r.onload = () => setPreview(r.result as string);
      r.readAsDataURL(f);
    } else setPreview("");
  };

  const uploadImage = async (): Promise<string> => {
    if (!file) return "";
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Image upload failed. Check your Cloudinary upload preset.");
    return data.secure_url;
  };

  const handlePublish = async () => {
    setError("");
    if (!storeId)            return setError("Choose which store this product belongs to.");
    if (!name.trim())        return setError("Give your product a name.");
    if (!price || Number(price) <= 0) return setError("Enter a price in Rand.");
    setBusy(true);
    try {
      const image_url = await uploadImage();
      const { error: dbErr } = await supabase.from("products").insert({
        store_id:    storeId,
        name:        name.trim(),
        description: desc.trim(),
        price:       Number(price),
        category,
        image_url:   image_url || null,
      });
      if (dbErr) throw new Error(dbErr.message);
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 6, display: "block" };
  const input: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid #E0E0DD`,
    fontSize: 14, color: T.ink, background: "#FBFBFA", outline: "none",
  };

  const fmtR = (n: number) => "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2 });

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "44px 40px", textAlign: "center", maxWidth: 380 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#E6F4EC", color: "#0F9D58", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, marginTop: 16 }}>Product published</div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6 }}>It is now live in your store. Taking you back to the dashboardâ€¦</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <style>{`
        .mzc-grid{ display:grid; grid-template-columns: 1.4fr 1fr; gap:20px; align-items:start; }
        @media (max-width: 900px){ .mzc-grid{ grid-template-columns:1fr; } }
        .mzc-input:focus{ border-color:${T.primary} !important; background:#fff !important; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* Back + heading */}
        <button onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: T.sub, fontSize: 13.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6 6-6-6 6-6" /></svg>
          Back
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: "10px 0 4px", letterSpacing: -0.4 }}>Create a product</h1>
        <p style={{ fontSize: 14, color: T.sub, margin: "0 0 22px" }}>
          Add the details below â€” buyers across South Africa will see it in your store right away.
        </p>

        {stores.length === 0 ? (
          <div style={{ background: T.card, border: `1px dashed #D8D8D4`, borderRadius: 18, padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>You need a store first</div>
            <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6 }}>Open a free store, then come back to add your products.</div>
            <button onClick={() => router.push("/dashboard/create-store")}
              style={{ marginTop: 16, background: T.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Open a store
            </button>
          </div>
        ) : (
          <div className="mzc-grid">

            {/* â”€â”€ Form card â”€â”€ */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: 22 }}>

              <label style={label}>Store</label>
              <select className="mzc-input" value={storeId} onChange={(e) => setStoreId(e.target.value)} style={{ ...input, marginBottom: 16 }}>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <label style={label}>Product name</label>
              <input className="mzc-input" style={{ ...input, marginBottom: 16 }} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="e.g. Handmade beaded necklace" maxLength={80} />

              <label style={label}>Description</label>
              <textarea className="mzc-input" style={{ ...input, marginBottom: 16, minHeight: 96, resize: "vertical", fontFamily: "inherit" }}
                value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="Tell buyers what makes it special â€” size, materials, delivery timeâ€¦" maxLength={600} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={label}>Price (ZAR)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: T.faint }}>R</span>
                    <input className="mzc-input" type="number" min="0" step="0.01" value={price}
                      onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
                      style={{ ...input, paddingLeft: 30 }} />
                  </div>
                </div>
                <div>
                  <label style={label}>Category</label>
                  <select className="mzc-input" value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <label style={label}>Product photo</label>
              <label htmlFor="mzc-file" style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, border: `1.5px dashed #D8D8D4`, borderRadius: 14, padding: "26px 16px",
                cursor: "pointer", background: "#FBFBFA", textAlign: "center",
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.5-4.5L7 20" />
                </svg>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>
                  {file ? file.name : "Tap to choose a photo"}
                </div>
                <div style={{ fontSize: 12, color: T.faint }}>Clear, bright photos sell up to 3Ã— better</div>
              </label>
              <input id="mzc-file" type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => onPickFile(e.target.files?.[0] || null)} />

              {error && (
                <div style={{ marginTop: 14, background: "#FDECEC", color: "#B42318", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button onClick={handlePublish} disabled={busy} style={{
                marginTop: 18, width: "100%", background: busy ? "#F0A18E" : T.primary, color: "#fff",
                border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: busy ? "default" : "pointer",
              }}>
                {busy ? "Publishingâ€¦" : "Publish product"}
              </button>
            </div>

            {/* â”€â”€ Live preview â”€â”€ */}
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: T.faint, marginBottom: 10 }}>
                LIVE PREVIEW
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", maxWidth: 320 }}>
                <div style={{ height: 210, background: "#F1F1EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {preview ? (
                    <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#C9C9C5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.5-4.5L7 20" />
                    </svg>
                  )}
                </div>
                <div style={{ padding: "14px 16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, letterSpacing: 0.5 }}>{category}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: T.ink, marginTop: 4 }}>
                    {name || "Your product name"}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.sub, marginTop: 4, minHeight: 18, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {desc || "Your description will appear here."}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 10 }}>
                    {price ? fmtR(Number(price)) : "R 0.00"}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: T.faint, marginTop: 12, maxWidth: 320 }}>
                This is exactly how buyers will see your product in the marketplace.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

