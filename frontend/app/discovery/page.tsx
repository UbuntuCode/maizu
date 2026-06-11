"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import BottomNav from "@/components/navigation/BottomNav";

const BASE  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P     = "#E8401C";
const DARK  = "#0F0F0F";
const MUTED = "#71717A";
const WHITE = "#FFFFFF";

/* ── Module-level store — persists between page navigations ── */
interface VideoItem {
  id:         string;
  url:        string;
  thumb?:     string;
  vendor:     string;
  vendorId?:  string;
  caption:    string;
  product?:   string;
  price?:     string;
  likes:      number;
  isLocal:    boolean;
  createdAt:  number;
}

/* Global store survives React re-mounts within the same session */
let globalVideos: VideoItem[] = [];
let globalLikes:  Record<string, boolean> = {};

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

/* ── Single video card ──────────────────────────────────────── */
function VideoCard({ video, active, onShop }: { video: VideoItem; active: boolean; onShop: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [liked,  setLiked]  = useState(globalLikes[video.id] || false);
  const [likes,  setLikes]  = useState(video.likes);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (active && video.isLocal) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current?.pause();
    }
  }, [active, video.isLocal]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPaused(false); }
    else                         { videoRef.current.pause(); setPaused(true); }
  };

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    globalLikes[video.id] = next;
    setLikes(c => next ? c + 1 : c - 1);
  };

  return (
    <div style={{ position:"relative", height:"100%", background:DARK, borderRadius:14, overflow:"hidden" }}>
      {video.isLocal ? (
        <video
          ref={videoRef}
          src={video.url}
          loop playsInline
          onClick={togglePlay}
          style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"pointer" }}
        />
      ) : (
        /* Thumbnail with play overlay */
        <div style={{ width:"100%", height:"100%", cursor:"pointer" }} onClick={togglePlay}>
          <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#1a1a1a,#2a2a2a)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill={WHITE} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", textAlign:"center", padding:"0 40px" }}>
              No videos yet — be the first to post
            </div>
          </div>
        </div>
      )}

      {/* Pause indicator */}
      {paused && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={WHITE} stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0) 50%)", pointerEvents:"none" }} />

      {/* Bottom content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 12px", display:"flex", alignItems:"flex-end", gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:WHITE, marginBottom:4 }}>@{video.vendor}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, marginBottom:video.product?10:0 }}>{video.caption}</div>
          {video.product && (
            <button onClick={onShop} style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:22, padding:"6px 12px", cursor:"pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.65)" }}>Tap to shop</div>
                <div style={{ fontSize:11, fontWeight:600, color:WHITE }}>{video.product} · {video.price}</div>
              </div>
            </button>
          )}
        </div>

        {/* Side actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            {
              icon: liked
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
              label: fmt(likes),
              action: handleLike,
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
              label: "Share",
              action: () => {
                const msg = encodeURIComponent(`Check this out on Maizu! @${video.vendor} — ${video.caption}\n\nhttps://maizu.vercel.app`);
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              },
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill={saved?WHITE:"none"} stroke={WHITE} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
              label: saved ? "Saved" : "Save",
              action: () => setSaved(s => !s),
            },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer" }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {btn.icon}
              </div>
              <span style={{ fontSize:10, fontWeight:600, color:WHITE }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DISCOVERY PAGE
══════════════════════════════════════════════════════════════ */
export default function DiscoveryPage() {
  const router = useRouter();
  const { isLoggedIn, authUser, profile } = useAuth();
  const fileRef      = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tab,        setTab]        = useState<"foryou" | "following" | "live">("foryou");
  const [videos,     setVideos]     = useState<VideoItem[]>(globalVideos);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAdd,    setShowAdd]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [caption,    setCaption]    = useState("");
  const [product,    setProduct]    = useState("");
  const [price,      setPrice]      = useState("");
  const [draftUrl,   setDraftUrl]   = useState<string | null>(null);
  const [showCaption,setShowCaption]= useState(false);

  /* Track scroll position */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setCurrentIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive:true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraftUrl(url);
    setShowAdd(false);
    setShowCaption(true);
  };

  const handlePublish = () => {
    if (!draftUrl) return;
    const vendorName = profile?.full_name || (authUser as any)?.user_metadata?.full_name || "You";
    const newVideo: VideoItem = {
      id:        `local-${Date.now()}`,
      url:       draftUrl,
      vendor:    vendorName.replace(/\s+/g, ""),
      vendorId:  authUser?.id,
      caption:   caption || "New video",
      product:   product || undefined,
      price:     price ? `R${price}` : undefined,
      likes:     0,
      isLocal:   true,
      createdAt: Date.now(),
    };

    /* Add to global store — persists between navigations */
    globalVideos = [newVideo, ...globalVideos];
    setVideos([...globalVideos]);
    setDraftUrl(null);
    setCaption("");
    setProduct("");
    setPrice("");
    setShowCaption(false);
    setCurrentIdx(0);
    containerRef.current?.scrollTo({ top:0, behavior:"smooth" });
  };

  return (
    <div style={{ background:DARK, height:"100vh", overflow:"hidden", position:"relative" }}>

      {/* Header */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:100, padding:"12px 14px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <button onClick={() => router.push("/")} style={{ width:36, height:36, borderRadius:"50%", background:"rgba(0,0,0,0.45)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div style={{ display:"flex", background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)", borderRadius:24, overflow:"hidden", border:"1px solid rgba(255,255,255,0.12)" }}>
            {(["foryou","following","live"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 14px", background:tab===t?"rgba(255,255,255,0.2)":"transparent", border:"none", cursor:"pointer", fontSize:12, fontWeight:tab===t?700:400, color:t==="live"?"#FF3B30":WHITE, display:"flex", alignItems:"center", gap:4 }}>
                {t==="live" && <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF3B30", display:"inline-block" }} />}
                {t==="foryou"?"For you":t==="following"?"Following":"LIVE"}
              </button>
            ))}
          </div>

          <button onClick={() => isLoggedIn ? setShowAdd(true) : router.push("/login")} style={{ width:36, height:36, borderRadius:"50%", background:"rgba(0,0,0,0.45)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* LIVE tab */}
      {tab === "live" && (
        <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28, textAlign:"center" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", background:"rgba(255,59,48,0.15)", border:"2px solid rgba(255,59,48,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/></svg>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:"#FF3B30", letterSpacing:"0.1em", marginBottom:10 }}>MAIZU LIVE</div>
          <div style={{ fontSize:26, fontWeight:900, color:WHITE, marginBottom:10 }}>Live selling is coming</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, maxWidth:280, marginBottom:28 }}>
            Sell your products in real time. Viewers buy directly while you stream.
          </div>
          <div style={{ display:"flex", gap:8, width:"100%", maxWidth:300 }}>
            <input placeholder="Your email" style={{ flex:1, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"12px 14px", fontSize:13, color:WHITE, outline:"none" }} />
            <button style={{ background:"#FF3B30", color:WHITE, border:"none", borderRadius:10, padding:"0 16px", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Notify me</button>
          </div>
        </div>
      )}

      {/* Video feed */}
      {tab !== "live" && (
        <div ref={containerRef} style={{ height:"100vh", overflowY:"scroll", scrollSnapType:"y mandatory" }}>
          {videos.length === 0 ? (
            <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28, textAlign:"center" }}>
              <div style={{ width:80, height:80, borderRadius:20, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              </div>
              <div style={{ fontSize:20, fontWeight:700, color:WHITE, marginBottom:10 }}>No videos yet</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", maxWidth:260, lineHeight:1.6, marginBottom:24 }}>
                Be the first to share your products. Upload a short video to showcase what you sell.
              </div>
              {isLoggedIn ? (
                <button onClick={() => setShowAdd(true)} style={{ background:P, color:WHITE, border:"none", borderRadius:22, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  Upload your first video
                </button>
              ) : (
                <button onClick={() => router.push("/login")} style={{ background:P, color:WHITE, border:"none", borderRadius:22, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  Sign in to post
                </button>
              )}
            </div>
          ) : (
            videos.map((video, idx) => (
              <div key={video.id} style={{ height:"100vh", scrollSnapAlign:"start", padding:"64px 12px 80px", boxSizing:"border-box" }}>
                <VideoCard video={video} active={currentIdx === idx} onShop={() => router.push("/stores")} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Caption form after file selected */}
      {showCaption && draftUrl && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:999, display:"flex", flexDirection:"column" }}>
          <div style={{ background:DARK, flex:1, display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={() => { setShowCaption(false); setDraftUrl(null); }} style={{ background:"none", border:"none", cursor:"pointer", color:WHITE }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize:16, fontWeight:700, color:WHITE }}>Add details</span>
            </div>

            {/* Preview */}
            <div style={{ height:220, background:"#111", overflow:"hidden" }}>
              <video src={draftUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} muted autoPlay loop playsInline />
            </div>

            <div style={{ padding:"16px", flex:1, display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:6 }}>Caption</label>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Describe your product or video…" rows={3}
                  style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"10px 12px", fontSize:13, color:WHITE, outline:"none", resize:"none", boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:6 }}>Product name</label>
                  <input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Ankara Dress"
                    style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"10px 12px", fontSize:13, color:WHITE, outline:"none", boxSizing:"border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:6 }}>Price (ZAR)</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 350" type="number"
                    style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"10px 12px", fontSize:13, color:WHITE, outline:"none", boxSizing:"border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ padding:"0 16px 32px" }}>
              <button onClick={handlePublish} disabled={!caption.trim()}
                style={{ width:"100%", background:caption.trim()?P:"#333", color:WHITE, border:"none", borderRadius:14, padding:"14px 0", fontSize:15, fontWeight:700, cursor:caption.trim()?"pointer":"default" }}>
                Post video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add options sheet */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:998, display:"flex", alignItems:"flex-end" }}>
          <div style={{ background:"#1A1A1A", borderRadius:"20px 20px 0 0", padding:"20px 16px 48px", width:"100%", border:"1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width:40, height:4, background:"rgba(255,255,255,0.2)", borderRadius:2, margin:"0 auto 18px" }} />
            <div style={{ fontSize:16, fontWeight:700, color:WHITE, marginBottom:16 }}>Share a video</div>

            {[
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/></svg>, label:"Record video", sub:"Film a product demo now", color:"#FF3B30" },
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, label:"Upload from gallery", sub:"Choose an existing video", color:"#7C3AED" },
            ].map(opt => (
              <button key={opt.label} onClick={() => { setShowAdd(false); fileRef.current?.click(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.05)", border:"none", borderRadius:12, padding:"14px", cursor:"pointer", marginBottom:10, textAlign:"left" }}>
                <div style={{ width:46, height:46, borderRadius:12, background:opt.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{opt.icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:WHITE, marginBottom:2 }}>{opt.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>{opt.sub}</div>
                </div>
              </button>
            ))}

            <button onClick={() => setShowAdd(false)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"none", borderRadius:12, padding:"13px 0", fontSize:14, color:"rgba(255,255,255,0.6)", cursor:"pointer", fontWeight:500, marginTop:4 }}>
              Cancel
            </button>
          </div>
          <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={handleFileSelect} />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
