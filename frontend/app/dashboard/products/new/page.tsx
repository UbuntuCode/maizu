"use client";
import React, { useState, useRef, useEffect } from "react";
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

const CATEGORIES = ["Fashion","Electronics","Beauty","Food & Drinks","Home & Garden","Sports","Art & Crafts","Services","Books","Health","Toys","Automotive","Other"];

const inp: React.CSSProperties = {
  width:"100%", padding:"13px 14px", background:WHITE, border:`1.5px solid ${BORDER}`, borderRadius:12, fontSize:14, color:DARK, outline:"none", boxSizing:"border-box" as const, transition:"border-color 0.15s",
};

export default function CreateProductPage() {
  const router = useRouter();
  const { authUser, isLoggedIn, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form,    setForm]    = useState({ name:"", description:"", price:"", stock:"", category:"Fashion", sku:"" });
  const [images,  setImages]  = useState<{ file:File; preview:string }[]>([]);
  const [stores,  setStores]  = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!authUser) return;
    const load = async () => {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd.session?.access_token;
      const res  = await fetch(`${BASE}/api/vendors/my/stores`, { headers:{ Authorization:`Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.stores?.length > 0) {
        setStores(data.stores);
        setStoreId(data.stores[0].id);
      }
    };
    load();
  }, [authUser]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImgs = files.slice(0, 5 - images.length).map(file => ({ file, preview: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.name.trim())  { setError("Product name is required."); return; }
    if (!form.price)         { setError("Price is required."); return; }
    if (!storeId)            { setError("Please select a store."); return; }

    setBusy(true); setError("");
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd.session?.access_token;

      /* Upload images to Cloudinary via backend */
      const imageUrls: string[] = [];
      for (const img of images) {
        const fd = new FormData();
        fd.append("image", img.file);
        const uploadRes  = await fetch(`${BASE}/api/products/upload-image`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body:fd });
        const uploadData = await uploadRes.json();
        if (uploadData.url) imageUrls.push(uploadData.url);
      }

      const res  = await fetch(`${BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ store_id:storeId, name:form.name.trim(), description:form.description.trim(), price:Number(form.price), stock_quantity:Number(form.stock)||0, category:form.category, sku:form.sku.trim()||undefined, image_urls:imageUrls }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to create product.");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create product.");
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"#D1FAE5", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:DARK, marginBottom:8 }}>Product listed!</div>
        <div style={{ fontSize:13, color:MUTED, textAlign:"center", marginBottom:28 }}>Your product is now live on your store.</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => { setSuccess(false); setForm({name:"",description:"",price:"",stock:"",category:"Fashion",sku:""}); setImages([]); }}
            style={{ background:WHITE, color:DARK, border:`1.5px solid ${BORDER}`, borderRadius:14, padding:"12px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Add another
          </button>
          <button onClick={() => router.push("/dashboard/products")}
            style={{ background:P, color:WHITE, border:"none", borderRadius:14, padding:"12px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            View all products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:BG, minHeight:"100vh", paddingBottom:80 }}>
      <Header />

      {/* Page header with back button */}
      <div style={{ background:WHITE, borderBottom:`0.5px solid ${BORDER}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:56, zIndex:100 }}>
        <button onClick={() => router.back()} style={{ background:"#F4F4F4", border:"none", borderRadius:"50%", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:DARK }}>Add Product</div>
          <div style={{ fontSize:11, color:MUTED }}>List a new item in your store</div>
        </div>
        <button onClick={handleSubmit} disabled={busy} style={{ marginLeft:"auto", background:busy?"#D1D5DB":P, color:WHITE, border:"none", borderRadius:22, padding:"8px 18px", fontSize:13, fontWeight:700, cursor:busy?"default":"pointer" }}>
          {busy ? "Publishing…" : "Publish"}
        </button>
      </div>

      <div style={{ padding:"16px" }}>

        {error && <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#991B1B" }}>{error}</div>}

        {/* Image upload */}
        <div style={{ background:WHITE, borderRadius:16, padding:"16px", marginBottom:14, border:`0.5px solid ${BORDER}` }}>
          <div style={{ fontSize:14, fontWeight:600, color:DARK, marginBottom:12 }}>Product photos</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {images.map((img, i) => (
              <div key={i} style={{ width:80, height:80, borderRadius:10, overflow:"hidden", position:"relative" }}>
                <img src={img.preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <button onClick={() => removeImage(i)} style={{ position:"absolute", top:4, right:4, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,0.55)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                {i === 0 && <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,0.55)", fontSize:9, color:WHITE, textAlign:"center", padding:"2px 0", fontWeight:600 }}>MAIN</div>}
              </div>
            ))}
            {images.length < 5 && (
              <button onClick={() => fileRef.current?.click()} style={{ width:80, height:80, borderRadius:10, border:`2px dashed ${BORDER}`, background:"#FAFAFA", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span style={{ fontSize:9, color:MUTED }}>Add photo</span>
              </button>
            )}
          </div>
          <div style={{ fontSize:11, color:MUTED, marginTop:8 }}>Add up to 5 photos. First photo is the main image.</div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handleImages} />
        </div>

        {/* Store selector */}
        {stores.length > 1 && (
          <div style={{ background:WHITE, borderRadius:16, padding:"16px", marginBottom:14, border:`0.5px solid ${BORDER}` }}>
            <div style={{ fontSize:14, fontWeight:600, color:DARK, marginBottom:10 }}>Store</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)} style={{ ...inp, background:WHITE }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Product details */}
        <div style={{ background:WHITE, borderRadius:16, padding:"16px", marginBottom:14, border:`0.5px solid ${BORDER}` }}>
          <div style={{ fontSize:14, fontWeight:600, color:DARK, marginBottom:14 }}>Product details</div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Product name *</label>
              <input value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} placeholder="e.g. Ankara Wrap Dress" style={inp} />
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} placeholder="Describe your product — material, size, colours, what's included…" rows={4}
                style={{ ...inp, resize:"none" as const }} />
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({...p, category:e.target.value}))} style={{ ...inp, background:WHITE }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & stock */}
        <div style={{ background:WHITE, borderRadius:16, padding:"16px", marginBottom:14, border:`0.5px solid ${BORDER}` }}>
          <div style={{ fontSize:14, fontWeight:600, color:DARK, marginBottom:14 }}>Pricing & stock</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Price (ZAR) *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:14, color:MUTED, fontWeight:600 }}>R</span>
                <input value={form.price} onChange={e => setForm(p => ({...p, price:e.target.value}))} placeholder="0.00" type="number" min="0" style={{ ...inp, paddingLeft:28 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>Stock quantity</label>
              <input value={form.stock} onChange={e => setForm(p => ({...p, stock:e.target.value}))} placeholder="0" type="number" min="0" style={inp} />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:12, fontWeight:600, color:DARK, display:"block", marginBottom:6 }}>SKU / Product code <span style={{ fontWeight:400, color:MUTED }}>(optional)</span></label>
              <input value={form.sku} onChange={e => setForm(p => ({...p, sku:e.target.value}))} placeholder="e.g. DRS-001-RED" style={inp} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={busy || !form.name || !form.price || !storeId}
          style={{ width:"100%", background:busy||!form.name||!form.price||!storeId?"#D1D5DB":P, color:WHITE, border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:700, cursor:busy?"default":"pointer" }}>
          {busy ? "Publishing product…" : "Publish product"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
