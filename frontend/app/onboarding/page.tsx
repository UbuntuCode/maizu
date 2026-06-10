"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const PRIMARY = "#E8401C";
const DARK    = "#0F0F0F";
const MUTED   = "#71717A";
const WHITE   = "#FFFFFF";

const SLIDES = [
  {
    bg:       "linear-gradient(160deg,#1A0A00 0%,#3D1500 100%)",
    accent:   PRIMARY,
    icon:     (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
        <circle cx="17" cy="5" r="3" fill={PRIMARY} stroke="none"/>
        <line x1="17" y1="3" x2="17" y2="5" stroke={WHITE} strokeWidth="1.5"/>
      </svg>
    ),
    title:    "Welcome to Maizu",
    sub:      "South Africa's marketplace for local entrepreneurs. Buy and sell anything — fashion, food, electronics, crafts and more.",
    label:    "Maizu Business Hub",
  },
  {
    bg:       "linear-gradient(160deg,#001A0D 0%,#003D1F 100%)",
    accent:   "#10B981",
    icon:     (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
        <circle cx="19" cy="19" r="3" fill="#10B981" stroke="none"/>
        <path d="M17.5 19h3M19 17.5v3" stroke={WHITE} strokeWidth="1.5"/>
      </svg>
    ),
    title:    "Open your store free",
    sub:      "Any South African can sell on Maizu. List your products, accept card payments and reach buyers across the country — all from your phone.",
    label:    "Sell on Maizu",
  },
  {
    bg:       "linear-gradient(160deg,#000D1A 0%,#002240 100%)",
    accent:   "#3B82F6",
    icon:     (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.2">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <circle cx="19" cy="7" r="3" fill="#3B82F6" stroke="none"/>
        <polyline points="17.5 7 18.5 8 20.5 6" stroke={WHITE} strokeWidth="1.5"/>
      </svg>
    ),
    title:    "Shop with confidence",
    sub:      "Pay by card, EFT or cash on delivery. Every order is tracked. Read real reviews from real buyers before you purchase.",
    label:    "Trusted shopping",
  },
  {
    bg:       "linear-gradient(160deg,#1A001A 0%,#3D003D 100%)",
    accent:   "#8B5CF6",
    icon:     (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2"/>
        <circle cx="18" cy="19" r="3" fill="#8B5CF6" stroke="none"/>
        <path d="M16.5 19h3M18 17.5v3" stroke={WHITE} strokeWidth="1.5"/>
      </svg>
    ),
    title:    "Discover & share",
    sub:      "Watch short product videos from vendors, share to WhatsApp and discover trending finds from your local community.",
    label:    "Discover",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [idx,  setIdx]  = useState(0);
  const [going, setGoing] = useState(false);

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem("maizu_onboarded", "1");
      router.push("/register");
    } else {
      setGoing(true);
      setTimeout(() => { setIdx(i => i + 1); setGoing(false); }, 220);
    }
  };

  const skip = () => {
    localStorage.setItem("maizu_onboarded", "1");
    router.push("/login");
  };

  return (
    <div style={{ minHeight:"100vh", background:slide.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:"48px 28px 48px", transition:"background 0.4s", overflow:"hidden" }}>

      {/* Skip */}
      <div style={{ width:"100%", display:"flex", justifyContent:"flex-end" }}>
        <button onClick={skip} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:20, padding:"7px 16px", fontSize:13, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", opacity:going?0:1, transition:"opacity 0.2s" }}>
        {/* Icon circle */}
        <div style={{ width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:`1px solid rgba(255,255,255,0.12)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:36 }}>
          {slide.icon}
        </div>

        {/* Label */}
        <div style={{ fontSize:11, fontWeight:700, color:slide.accent, letterSpacing:"0.1em", marginBottom:12 }}>
          {slide.label.toUpperCase()}
        </div>

        {/* Title */}
        <h1 style={{ fontSize:28, fontWeight:900, color:WHITE, lineHeight:1.2, marginBottom:16, maxWidth:320 }}>
          {slide.title}
        </h1>

        {/* Sub */}
        <p style={{ fontSize:15, color:"rgba(255,255,255,0.65)", lineHeight:1.7, maxWidth:300 }}>
          {slide.sub}
        </p>
      </div>

      {/* Bottom */}
      <div style={{ width:"100%", maxWidth:340 }}>
        {/* Dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:24 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ width:i===idx?24:7, height:7, borderRadius:4, background:i===idx?WHITE:"rgba(255,255,255,0.25)", border:"none", cursor:"pointer", padding:0, transition:"all 0.3s" }} />
          ))}
        </div>

        {/* CTA */}
        <button onClick={next} style={{ width:"100%", background:slide.accent, color:WHITE, border:"none", borderRadius:16, padding:"16px 0", fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:`0 8px 24px ${slide.accent}55` }}>
          {isLast ? "Get started →" : "Next →"}
        </button>

        {/* Login link */}
        {idx === 0 && (
          <button onClick={skip} style={{ width:"100%", background:"none", border:"none", marginTop:14, fontSize:13, color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
}
