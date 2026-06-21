"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart }   from "@/context/CartContext";
import { useAuth }   from "@/context/AuthContext";

const P      = "#E8401C";
/* Darker shade for SMALL TEXT use — passes 4.5:1 contrast on white.
   Keep #E8401C only for large/bold accents (banners, big CTAs). */
const P_TEXT = "#C7350F";
const DARK   = "#0F0F0F";
const MUTED  = "#71717A";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E4E7";
const BG     = "#F4F4F2";

const ImageSearchModal = ({ onClose }: { onClose: () => void }) => {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSearching(true);
    setTimeout(() => { router.push("/search?q=fashion"); onClose(); }, 1800);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Search by image"
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:WHITE, borderRadius:16, padding:"24px 20px", width:"100%", maxWidth:380 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:16, fontWeight:700, color:DARK }}>Search by image</div>
          <button aria-label="Close image search" onClick={onClose}
            style={{ background:BG, border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ fontSize:13, color:MUTED, marginBottom:18 }}>Upload a photo to find similar products</div>

        {preview ? (
          <div style={{ textAlign:"center" }}>
            <img src={preview} alt="Selected product photo preview" style={{ width:"100%", maxHeight:200, objectFit:"contain", borderRadius:10, marginBottom:12 }} />
            {searching && <div style={{ fontSize:13, color:P_TEXT, fontWeight:600 }} role="status">Finding similar products…</div>}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button aria-label="Upload photo from your device" onClick={() => fileRef.current?.click()}
              style={{ background:"#FFF3EF", border:"1.5px solid #E8401C22", borderRadius:12, padding:"20px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style={{ fontSize:12, fontWeight:600, color:P_TEXT }}>Upload photo</span>
            </button>
            <button aria-label="Take a photo using your camera" onClick={() => fileRef.current?.click()}
              style={{ background:"#EFF6FF", border:"1.5px solid #3B82F622", borderRadius:12, padding:"20px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span style={{ fontSize:12, fontWeight:600, color:"#2563EB" }}>Take photo</span>
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleFile} aria-label="Choose image file" />
      </div>
    </div>
  );
};

export default function Header() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { isLoggedIn, profile, authUser } = useAuth();

  const [query,        setQuery]        = useState("");
  const [showImgSrch,  setShowImgSrch]  = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const firstName = profile?.full_name?.split(" ")[0]
    || (authUser as any)?.user_metadata?.full_name?.split(" ")[0]
    || null;

  return (
    <>
      {showImgSrch && <ImageSearchModal onClose={() => setShowImgSrch(false)} />}

      <header className="maizu-header" style={{
        background:   WHITE,
        borderBottom: `0.5px solid ${BORDER}`,
        height:       56,
        display:      "flex",
        alignItems:   "center",
        padding:      "0 12px",
        gap:          8,
        overflow:     "hidden",
      }}>

        {/* Logo */}
        <a href="/" aria-label="Maizu home page" style={{ cursor:"pointer", flexShrink:0, textDecoration:"none" }}>
          <div style={{ fontSize:18, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1 }}>
            <span style={{ color:P }}>mai</span><span style={{ color:DARK }}>zu</span>
          </div>
          <div style={{ fontSize:7, fontWeight:700, color:MUTED, letterSpacing:"0.1em" }}>BUSINESS HUB</div>
        </a>

        {/* Search bar */}
        <form onSubmit={handleSearch} role="search" aria-label="Search products and stores"
          style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", background:BG, borderRadius:9, padding:"0 10px", height:36 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{ flexShrink:0 }} aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <label htmlFor="header-search-input" style={{ position:"absolute", width:1, height:1, overflow:"hidden", clip:"rect(0 0 0 0)" }}>
            Search products, stores or brands
          </label>
          <input
            id="header-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, stores…"
            style={{ flex:1, background:"none", border:"none", outline:"none", padding:"0 8px", fontSize:13, color:DARK, minWidth:0 }}
          />
          {/* Touch target enlarged to 24x24 minimum via padding */}
          <button type="button" aria-label="Search by image" onClick={() => setShowImgSrch(true)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:8, display:"flex", flexShrink:0, minWidth:24, minHeight:24, alignItems:"center", justifyContent:"center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          {/* Hidden submit so Enter key still works for screen reader / keyboard users */}
          <button type="submit" aria-label="Submit search" style={{ position:"absolute", width:1, height:1, overflow:"hidden", clip:"rect(0 0 0 0)" }} />
        </form>

        {/* Right icons */}
        <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>

          <button aria-label="Notifications" onClick={() => router.push("/notifications")}
            style={{ background:"none", border:"none", cursor:"pointer", padding:8, borderRadius:8, display:"flex", minWidth:24, minHeight:24, alignItems:"center", justifyContent:"center" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          <button aria-label={`Shopping cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`} onClick={() => router.push("/cart")}
            style={{ background:"none", border:"none", cursor:"pointer", padding:8, borderRadius:8, display:"flex", position:"relative", minWidth:24, minHeight:24, alignItems:"center", justifyContent:"center" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && (
              <span aria-hidden="true" style={{ position:"absolute", top:4, right:4, background:P, color:WHITE, borderRadius:"50%", width:14, height:14, fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          <button aria-label={isLoggedIn ? `Account menu, signed in as ${firstName || "user"}` : "Sign in"} onClick={() => router.push(isLoggedIn ? "/profile" : "/login")}
            style={{ background:"none", border:`0.5px solid ${BORDER}`, cursor:"pointer", padding:"5px 8px", borderRadius:8, display:"flex", alignItems:"center", gap:5, minHeight:24 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="header-name" style={{ fontSize:12, fontWeight:500, color:DARK, display:"none" }}>
              {isLoggedIn ? (firstName || "Account") : "Sign in"}
            </span>
          </button>
        </div>

        <style>{`
          @media (min-width: 480px) { .header-name { display: inline !important; } }
        `}</style>
      </header>
    </>
  );
}
