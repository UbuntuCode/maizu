"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/navigation/BottomNav";

const P = "#E8401C", DARK="#0F0F0F", MUTED="#71717A", WHITE="#FFFFFF";

interface VideoItem {
  id:       string;
  url:      string;
  thumb?:   string;
  vendor:   string;
  caption:  string;
  product?: string;
  price?:   string;
  likes:    number;
  isLocal:  boolean;
}

const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);

/* ── Video player card ──────────────────────────────────────── */
const VideoCard = ({ video, active, onShop }: { video:VideoItem; active:boolean; onShop:()=>void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked,  setLiked]  = useState(false);
  const [likes,  setLikes]  = useState(video.likes);
  const [paused, setPaused] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (active) videoRef.current.play().catch(() => {});
    else        videoRef.current.pause();
  }, [active]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPaused(false); }
    else                         { videoRef.current.pause(); setPaused(true); }
  };

  return (
    <div style={{ position:"relative", height:"100%", background:"#000", borderRadius:14, overflow:"hidden" }}>
      {/* Video element */}
      {video.isLocal ? (
        <video ref={videoRef} src={video.url} loop playsInline muted={false}
          onClick={togglePlay}
          style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"pointer" }} />
      ) : (
        <div style={{ width:"100%", height:"100%", overflow:"hidden", position:"relative", cursor:"pointer" }} onClick={togglePlay}>
          <img src={video.thumb || video.url} alt={video.caption} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,0.25)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={WHITE} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* Pause indicator */}
      {paused && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill={WHITE} stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </div>
        </div>
      )}

      {/* Dark gradient */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0) 50%)", pointerEvents:"none" }} />

      {/* Bottom info */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px", display:"flex", alignItems:"flex-end", gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:WHITE, marginBottom:4 }}>@{video.vendor}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, marginBottom:video.product?10:0 }}>{video.caption}</div>
          {video.product && (
            <button onClick={onShop} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:22, padding:"7px 12px", cursor:"pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)" }}>Tap to shop</div>
                <div style={{ fontSize:12, fontWeight:600, color:WHITE }}>{video.product} · {video.price}</div>
              </div>
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { icon: liked
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
              label: fmt(likes),
              action: () => { setLiked(l=>!l); setLikes(c=>liked?c-1:c+1); }
            },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label:"Reply", action:()=>{} },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>, label:"Share",
              action:() => { const m=encodeURIComponent(`Check this out on Maizu! ${video.caption}`); window.open(`https://wa.me/?text=${m}`,"_blank"); }
            },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill={saved?WHITE:"none"} stroke={WHITE} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>, label:"Save",
              action:()=>setSaved(s=>!s)
            },
          ].map((btn,i) => (
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
};

/* ══════════════════════════════════════════════════════════════
   DISCOVERY PAGE
══════════════════════════════════════════════════════════════ */
export default function DiscoveryPage() {
  const router  = useRouter();
  const { isLoggedIn } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tab,       setTab]       = useState<"foryou"|"following"|"live">("foryou");
  const [currentIdx,setCurrentIdx]= useState(0);
  const [showAdd,   setShowAdd]   = useState(false);
  const [videos,    setVideos]    = useState<VideoItem[]>([
    { id:"1", url:"", thumb:"https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80", vendor:"StyleByZinhle",   caption:"New summer collection just dropped — check my store for prices!", product:"Ankara Wrap Dress", price:"R350", likes:1240, isLocal:false },
    { id:"2", url:"", thumb:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80", vendor:"GlowByNomsa",  caption:"This skincare routine changed my life. Shop the full kit.", product:"Glow Skincare Kit", price:"R180", likes:3801, isLocal:false },
    { id:"3", url:"", thumb:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80", vendor:"MamaZuluKitchen", caption:"Homemade chakalaka, ordering link in bio!", product:"Homemade Chakalaka", price:"R65", likes:7220, isLocal:false },
    { id:"4", url:"", thumb:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80", vendor:"ArtByKhanya",  caption:"Hand-painted canvas pieces made in Durban. Commissions open.", product:"Custom Canvas Art", price:"R750", likes:920, isLocal:false },
  ]);

  /* Track current video as user scrolls */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.round(container.scrollTop / container.clientHeight);
      setCurrentIdx(idx);
    };
    container.addEventListener("scroll", onScroll, { passive:true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url     = URL.createObjectURL(file);
    const newVid: VideoItem = {
      id:       Date.now().toString(),
      url,
      vendor:   "You",
      caption:  "My new video",
      likes:    0,
      isLocal:  true,
    };
    setVideos(prev => [newVid, ...prev]);
    setCurrentIdx(0);
    containerRef.current?.scrollTo({ top:0, behavior:"smooth" });
    setShowAdd(false);
  };

  return (
    <div style={{ background:DARK, height:"100vh", overflow:"hidden", position:"relative" }}>

      {/* Header */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:100, padding:"12px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <button onClick={() => router.push("/")} style={{ width:36, height:36, borderRadius:"50%", background:"rgba(0,0,0,0.4)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div style={{ display:"flex", background:"rgba(0,0,0,0.4)", backdropFilter:"blur(8px)", borderRadius:24, overflow:"hidden", border:"1px solid rgba(255,255,255,0.15)" }}>
            {(["foryou","following","live"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 14px", background:tab===t?"rgba(255,255,255,0.2)":"transparent", border:"none", cursor:"pointer", fontSize:12, fontWeight:tab===t?700:400, color:t==="live"?"#FF3B30":WHITE, display:"flex", alignItems:"center", gap:4 }}>
                {t==="live" && <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF3B30", display:"inline-block", animation:"blink 1s ease-in-out infinite" }} />}
                {t==="foryou"?"For you":t==="following"?"Following":"LIVE"}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAdd(true)} style={{ width:36, height:36, borderRadius:"50%", background:"rgba(0,0,0,0.4)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* LIVE tab */}
      {tab === "live" && (
        <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28, textAlign:"center" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", background:"rgba(255,59,48,0.15)", border:"2px solid rgba(255,59,48,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, position:"relative" }}>
            <div style={{ position:"absolute", inset:-8, borderRadius:"50%", border:"2px solid rgba(255,59,48,0.1)", animation:"ping 2s ease-in-out infinite" }} />
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/></svg>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:"#FF3B30", letterSpacing:"0.1em", marginBottom:10 }}>MAIZU LIVE</div>
          <div style={{ fontSize:26, fontWeight:900, color:WHITE, marginBottom:10 }}>Live selling is coming</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, maxWidth:280, marginBottom:28 }}>
            Sell your products in real time. Viewers buy directly while you stream. Be first to know when we launch.
          </div>
          <div style={{ display:"flex", gap:8, width:"100%", maxWidth:300 }}>
            <input placeholder="Your email" style={{ flex:1, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"12px 14px", fontSize:13, color:WHITE, outline:"none" }} />
            <button style={{ background:"#FF3B30", color:WHITE, border:"none", borderRadius:10, padding:"0 16px", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Notify me</button>
          </div>
          <style>{`@keyframes ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.12)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      )}

      {/* Video feed */}
      {tab !== "live" && (
        <div ref={containerRef} style={{ height:"100vh", overflowY:"scroll", scrollSnapType:"y mandatory" }}>
          {videos.map((video, idx) => (
            <div key={video.id} style={{ height:"100vh", scrollSnapAlign:"start", padding:"64px 12px 80px", boxSizing:"border-box" }}>
              <VideoCard video={video} active={currentIdx === idx && tab !== "live"} onShop={() => router.push("/stores")} />
            </div>
          ))}
        </div>
      )}

      {/* Add video sheet */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:999, display:"flex", alignItems:"flex-end" }}>
          <div style={{ background:"#1A1A1A", borderRadius:"20px 20px 0 0", padding:"20px 16px 48px", width:"100%", border:"1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width:40, height:4, background:"rgba(255,255,255,0.2)", borderRadius:2, margin:"0 auto 18px" }} />
            <div style={{ fontSize:16, fontWeight:700, color:WHITE, marginBottom:16 }}>Add a video</div>

            {!isLoggedIn && (
              <div style={{ background:"rgba(232,64,28,0.15)", border:"1px solid rgba(232,64,28,0.3)", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#FF8A73" }}>
                Sign in to upload videos and reach Maizu shoppers.
              </div>
            )}

            {[
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/></svg>, label:"Record video", sub:"Use your camera now", color:"#FF3B30", capture:"environment" as const },
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, label:"Upload from gallery", sub:"Choose an existing video", color:"#7C3AED", capture:undefined },
            ].map(opt => (
              <button key={opt.label} onClick={() => { if(!isLoggedIn){router.push("/login");return;} fileRef.current?.click(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.05)", border:"none", borderRadius:12, padding:"14px", cursor:"pointer", marginBottom:10, textAlign:"left" }}>
                <div style={{ width:46, height:46, borderRadius:12, background:opt.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{opt.icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:WHITE, marginBottom:2 }}>{opt.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{opt.sub}</div>
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
