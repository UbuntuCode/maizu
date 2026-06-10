"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";

const T = {
  primary: "#E8401C",
  dark:    "#0F0F0F",
  white:   "#FFFFFF",
  muted:   "#71717A",
  border:  "#E4E4E7",
};

/* ── Mock video data (real products will populate this) ─────── */
const MOCK_VIDEOS = [
  {
    id: "1",
    thumbnail:   "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80",
    vendor:      "StyleByZinhle",
    vendorAvatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    caption:     "New summer collection just dropped 🔥 Check my store for prices",
    likes:       1240,
    comments:    87,
    shares:      234,
    price:       "R350",
    product:     "Ankara Wrap Dress",
    verified:    true,
  },
  {
    id: "2",
    thumbnail:   "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
    vendor:      "GlowByNomsa",
    vendorAvatar:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80",
    caption:     "This skincare routine changed my life 💆‍♀️ Shop the full kit in my store",
    likes:       3801,
    comments:    215,
    shares:      890,
    price:       "R180",
    product:     "Glow Skincare Kit",
    verified:    false,
  },
  {
    id: "3",
    thumbnail:   "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    vendor:      "MamaZulu Kitchen",
    vendorAvatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    caption:     "Homemade chakalaka recipe + ordering link in bio 🌶️",
    likes:       7220,
    comments:    442,
    shares:      1100,
    price:       "R65",
    product:     "Homemade Chakalaka",
    verified:    true,
  },
  {
    id: "4",
    thumbnail:   "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
    vendor:      "ArtByKhanya",
    vendorAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    caption:     "Hand-painted canvas pieces made in Durban 🎨 Commission open",
    likes:       920,
    comments:    65,
    shares:      180,
    price:       "R750",
    product:     "Custom Canvas Art",
    verified:    false,
  },
];

/* ── Format count ───────────────────────────────────────────── */
const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);

/* ── Single video card ──────────────────────────────────────── */
const VideoCard = ({ video, onShop }: { video: typeof MOCK_VIDEOS[0]; onShop: () => void }) => {
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [saved, setSaved]       = useState(false);

  return (
    <div style={{ position:"relative", height:"calc(100vh - 130px)", background:T.dark, borderRadius:16, overflow:"hidden", flexShrink:0, width:"100%" }}>
      {/* Thumbnail */}
      <img src={video.thumbnail} alt={video.caption} style={{ width:"100%", height:"100%", objectFit:"cover" }} />

      {/* Gradient overlay */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0) 50%)" }} />

      {/* Bottom content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:12 }}>
          {/* Left — vendor info + caption */}
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <img src={video.vendorAvatar} alt={video.vendor} style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #fff", objectFit:"cover" }} />
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>@{video.vendor}</span>
                  {video.verified && (
                    <div style={{ width:14, height:14, borderRadius:"50%", background:"#3B82F6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.9)", lineHeight:1.45, marginBottom:10 }}>{video.caption}</div>

            {/* Product tag */}
            <button onClick={onShop} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:24, padding:"6px 12px", cursor:"pointer" }}>
              <div style={{ width:28, height:28, borderRadius:6, overflow:"hidden", background:"#333", flexShrink:0 }}>
                <img src={video.thumbnail} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)" }}>Tap to shop</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{video.product} · {video.price}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </button>
          </div>

          {/* Right — action buttons */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, paddingBottom:4 }}>
            <button onClick={() => { setLiked(l => !l); setLikeCount(c => liked?c-1:c+1); }} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer" }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={liked?"#EF4444":"none"} stroke={liked?"#EF4444":"#fff"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:"#fff" }}>{fmt(likeCount)}</span>
            </button>

            <button style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer" }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:"#fff" }}>{fmt(video.comments)}</span>
            </button>

            <button onClick={() => { const msg = encodeURIComponent(`Check this out on Maizu! ${video.product} by ${video.vendor}`); window.open(`https://wa.me/?text=${msg}`,"_blank"); }}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer" }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:"#fff" }}>{fmt(video.shares)}</span>
            </button>

            <button onClick={() => setSaved(s => !s)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer" }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={saved?"#FFF":"none"} stroke="#fff" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:"#fff" }}>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   DISCOVERY PAGE
══════════════════════════════════════════════════════════════ */
export default function DiscoveryPage() {
  const router  = useRouter();
  const [tab, setTab]         = useState<"foryou"|"following"|"live">("foryou");
  const [showUpload, setShowUpload] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);

  return (
    <div style={{ background:T.dark, minHeight:"100vh", paddingBottom:80, position:"relative", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, zIndex:100, padding:"12px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <button onClick={() => router.push("/")} style={{ background:"rgba(0,0,0,0.4)", border:"none", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", backdropFilter:"blur(8px)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(8px)", borderRadius:24, overflow:"hidden", border:"1px solid rgba(255,255,255,0.15)" }}>
            {([["foryou","For you"],["following","Following"],["live","LIVE"]] as const).map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ padding:"7px 14px", background:tab===id?"rgba(255,255,255,0.2)":"transparent", border:"none", cursor:"pointer", fontSize:12, fontWeight:tab===id?700:500, color:id==="live"?"#FF3B30":"#fff", display:"flex", alignItems:"center", gap:4 }}>
                {id==="live" && <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF3B30", display:"inline-block" }} />}
                {label}
              </button>
            ))}
          </div>

          <button onClick={() => setShowUpload(true)} style={{ background:"rgba(0,0,0,0.4)", border:"none", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", backdropFilter:"blur(8px)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* ── LIVE tab — Coming Soon ── */}
      {tab === "live" && (
        <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:30, textAlign:"center" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", background:"rgba(255,59,48,0.2)", border:"2px solid rgba(255,59,48,0.4)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, position:"relative" }}>
            <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:"2px solid rgba(255,59,48,0.15)", animation:"ping 2s ease-in-out infinite" }} />
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/></svg>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:"#FF3B30", letterSpacing:"0.1em", marginBottom:10 }}>MAIZU LIVE</div>
          <div style={{ fontSize:26, fontWeight:900, color:"#fff", marginBottom:10 }}>Live selling is coming</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, maxWidth:280, marginBottom:28 }}>
            Sell your products in real time with live video. Viewers buy directly as you stream. Be first to know when we launch.
          </div>
          <div style={{ display:"flex", gap:10, width:"100%", maxWidth:300 }}>
            <input placeholder="Your email" style={{ flex:1, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#fff", outline:"none" }} />
            <button style={{ background:"#FF3B30", color:"#fff", border:"none", borderRadius:10, padding:"0 16px", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Notify me</button>
          </div>
          <style>{`@keyframes ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.1)}}`}</style>
        </div>
      )}

      {/* ── For You / Following feed ── */}
      {tab !== "live" && (
        <div ref={containerRef} style={{ paddingTop:64, height:"100vh", overflowY:"scroll", scrollSnapType:"y mandatory" }}>
          {MOCK_VIDEOS.map((video, idx) => (
            <div key={video.id} style={{ height:"calc(100vh - 64px)", scrollSnapAlign:"start", padding:"0 12px 12px" }}>
              <VideoCard video={video} onShop={() => router.push(`/stores`)} />
            </div>
          ))}
        </div>
      )}

      {/* ── Upload options ── */}
      {showUpload && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:999, display:"flex", alignItems:"flex-end" }}>
          <div style={{ background:"#1A1A1A", borderRadius:"20px 20px 0 0", padding:"20px 16px 48px", width:"100%", border:"1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width:40, height:4, background:"rgba(255,255,255,0.2)", borderRadius:2, margin:"0 auto 20px" }} />
            <div style={{ fontSize:17, fontWeight:700, color:"#fff", marginBottom:16 }}>Add content</div>

            {[
              { icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/></svg>, label:"Record video", sub:"Create a short product video", color:"#FF3B30", action: () => { fileRef.current?.click(); setShowUpload(false); } },
              { icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, label:"Upload video", sub:"Share a product demo video", color:"#7C3AED", action: () => { fileRef.current?.click(); setShowUpload(false); } },
              { icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, label:"Edit existing", sub:"Trim, caption or filter your videos", color:"#059669", action: () => setShowUpload(false) },
            ].map(opt => (
              <button key={opt.label} onClick={opt.action} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.05)", border:"none", borderRadius:14, padding:"14px", cursor:"pointer", marginBottom:10, textAlign:"left" }}>
                <div style={{ width:48, height:48, borderRadius:12, background:opt.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {opt.icon}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:2 }}>{opt.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{opt.sub}</div>
                </div>
              </button>
            ))}

            <button onClick={() => setShowUpload(false)} style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"none", borderRadius:12, padding:"13px 0", fontSize:14, color:"rgba(255,255,255,0.7)", cursor:"pointer", fontWeight:500 }}>Cancel</button>
          </div>
          <input ref={fileRef} type="file" accept="video/*" capture="environment" style={{ display:"none" }} />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
