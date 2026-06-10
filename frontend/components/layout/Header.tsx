"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart }   from "@/context/CartContext";
import { useAuth }   from "@/context/AuthContext";

const primary = "#E8401C";
const dark    = "#0F0F0F";
const muted   = "#71717A";
const white   = "#FFFFFF";
const border  = "#E4E4E7";
const bg      = "#F4F4F2";

/* ── Image search modal ─────────────────────────────────────── */
const ImageSearchModal = ({ onClose }: { onClose: () => void }) => {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview,   setPreview]   = useState<string|null>(null);
  const [searching, setSearching] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSearching(true);
    setTimeout(() => { setSearching(false); router.push("/search?q=fashion"); onClose(); }, 2000);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:white, borderRadius:16, padding:"24px 20px", width:"100%", maxWidth:420 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:700, color:dark }}>Search by image</div>
          <button onClick={onClose} style={{ background:bg, border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dark} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ fontSize:13, color:muted, marginBottom:20 }}>Upload or take a photo to find similar products on Maizu</div>

        {preview ? (
          <div style={{ textAlign:"center" }}>
            <img src={preview} alt="search" style={{ width:"100%", maxHeight:220, objectFit:"contain", borderRadius:10, marginBottom:14 }} />
            {searching && <div style={{ fontSize:13, color:primary, fontWeight:600 }}>Finding similar products…</div>}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, label:"Upload photo", color:"#FFF3EF", border:"#E8401C33" },
              { icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, label:"Take photo", color:"#EFF6FF", border:"#93C5FD33" },
            ].map(opt => (
              <button key={opt.label} onClick={() => fileRef.current?.click()} style={{ background:opt.color, border:`1.5px solid ${opt.border}`, borderRadius:12, padding:"20px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer" }}>
                {opt.icon}
                <span style={{ fontSize:12, fontWeight:600, color:dark }}>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleFile} />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════════════════ */
export default function Header() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { isLoggedIn, profile } = useAuth();

  const [query,       setQuery]       = useState("");
  const [showImgSrch, setShowImgSrch] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      {showImgSrch && <ImageSearchModal onClose={() => setShowImgSrch(false)} />}

      <header className="maizu-header" style={{
        background:   white,
        borderBottom: `0.5px solid ${border}`,
        position:     "sticky",
        top:          0,
        zIndex:       200,
        height:       64,
        display:      "flex",
        alignItems:   "center",
        padding:      "0 16px",
        gap:          12,
      }}>

        {/* Logo */}
        <div onClick={() => router.push("/")} style={{ cursor:"pointer", flexShrink:0 }}>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1 }}>
            <span style={{ color:primary }}>mai</span><span style={{ color:dark }}>zu</span>
          </div>
          <div style={{ fontSize:7, fontWeight:700, color:muted, letterSpacing:"0.12em", marginTop:1 }}>BUSINESS HUB</div>
        </div>

        {/* Search bar — grows to fill space */}
        <form onSubmit={handleSearch} style={{ flex:1, display:"flex", alignItems:"center", background:bg, borderRadius:10, padding:"0 12px", height:40, maxWidth:640 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2" style={{ flexShrink:0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, stores, brands…"
            style={{ flex:1, background:"none", border:"none", outline:"none", padding:"0 10px", fontSize:14, color:dark }}
          />
          {/* Image search icon */}
          <button type="button" onClick={() => setShowImgSrch(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:"4px", display:"flex", alignItems:"center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          {query && (
            <button type="button" onClick={() => setQuery("")} style={{ background:"none", border:"none", cursor:"pointer", padding:"4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </form>

        {/* Search button — visible on tablet+ */}
        <button type="submit" form="search-form" onClick={handleSearch} style={{ background:primary, color:white, border:"none", borderRadius:10, padding:"9px 18px", fontSize:14, fontWeight:600, cursor:"pointer", flexShrink:0, display:"none" }}>
          Search
        </button>

        {/* Right icons */}
        <div style={{ display:"flex", alignItems:"center", gap:4, marginLeft:"auto", flexShrink:0 }}>

          {/* Notifications */}
          <button onClick={() => router.push("/notifications")} style={{ background:"none", border:"none", cursor:"pointer", padding:8, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dark} strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {/* Cart */}
          <button onClick={() => router.push("/cart")} style={{ background:"none", border:"none", cursor:"pointer", padding:8, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dark} strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && (
              <span style={{ position:"absolute", top:4, right:4, background:primary, color:white, borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          {/* Account */}
          <button onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")} style={{ background:"none", border:`0.5px solid ${border}`, cursor:"pointer", padding:"6px 12px", borderRadius:8, display:"flex", alignItems:"center", gap:6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dark} strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span style={{ fontSize:12, fontWeight:500, color:dark, maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {isLoggedIn ? (profile?.full_name?.split(" ")[0] || "Account") : "Sign in"}
            </span>
          </button>
        </div>
      </header>
    </>
  );
}
