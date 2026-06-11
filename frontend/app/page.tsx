"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Header from "@/components/layout/Header";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import BottomNav from "@/components/navigation/BottomNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const T = {
  primary: "#E8401C",
  dark:    "#0F0F0F",
  white:   "#FFFFFF",
  muted:   "#71717A",
  border:  "#E4E4E7",
  bg:      "#F7F7F5",
  soft:    "#FFF3EF",
};

const AD_BANNERS = [
  {
    tag: "SUMMER DEALS", headline: "Up to 40% off fashion",
    sub: "New arrivals from South African designers", cta: "Shop now",
    bg: "#1A1A2E", accent: "#E8401C",
    img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&q=80",
    link: "/search?q=fashion",
  },
  {
    tag: "FRESH IN", headline: "New arrivals every day",
    sub: "Discover products from local SA vendors", cta: "Browse stores",
    bg: "#0D1B2A", accent: "#F59E0B",
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=80",
    link: "/stores",
  },
  {
    tag: "HANDMADE IN SA", headline: "Support local crafters",
    sub: "Unique handmade goods from Mzansi artisans", cta: "Explore crafts",
    bg: "#1B1F1B", accent: "#10B981",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80",
    link: "/search?q=crafts",
  },
];

const CATEGORIES = [
  { label:"Fashion",     img:"https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&q=75", q:"fashion"     },
  { label:"Electronics", img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=75", q:"electronics" },
  { label:"Beauty",      img:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&q=75", q:"beauty"      },
  { label:"Food",        img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=75", q:"food"        },
  { label:"Home",        img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=75",   q:"home"        },
  { label:"Sports",      img:"https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&q=75", q:"sports"      },
  { label:"Art & Crafts",img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75", q:"crafts"      },
  { label:"Services",    img:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&q=75", q:"services"    },
];

/* ── Tiny components ──────────────────────────────────────── */
const SHead = ({ title, action, onAction }: { title:string; action?:string; onAction?:()=>void }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
    <h2 style={{ fontSize:17, fontWeight:700, color:T.dark, margin:0 }}>{title}</h2>
    {action && (
      <button onClick={onAction} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:T.primary, fontWeight:600, padding:0 }}>
        {action} →
      </button>
    )}
  </div>
);

const ImgPlaceholder = () => (
  <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#F4F4F4,#E8E8E8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CACACA" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   HOME PAGE
   — Renders immediately, no auth guard, no loading block
══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const { addItem } = useCart();

  const [products,  setProducts]  = useState<any[]>([]);
  const [stores,    setStores]    = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [toast,     setToast]     = useState("");

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % AD_BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [pr, sr] = await Promise.all([
          fetch(`${BASE}/api/products?limit=20`),
          fetch(`${BASE}/api/vendors?limit=10`),
        ]);
        if (pr.ok) { const d = await pr.json(); if (d.success) setProducts(d.products || []); }
        if (sr.ok) { const d = await sr.json(); if (d.success) setStores(d.stores || []); }
      } catch { /* never crash the home page */ }
    };
    load();
  }, []);

  const handleAdd = (p: any) => {
    addItem({ product_id:p.id, name:p.name, price:Number(p.price), image_url:p.image_urls?.[0], store_id:p.store_id, store_name:p.store_name||"Store", stock_quantity:p.stock_quantity });
    setToast(`${p.name} added to cart`);
    setTimeout(() => setToast(""), 2000);
  };

  const banner = AD_BANNERS[bannerIdx];

  return (
    <div className="maizu-shell">
      <Header />
      <DesktopSidebar />

      {toast && (
        <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:T.dark, color:"#fff", borderRadius:24, padding:"10px 20px", fontSize:13, fontWeight:500, zIndex:999, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,0.25)", pointerEvents:"none" }}>
          {toast}
        </div>
      )}

      <main className="page-content">

        {/* AD BANNER */}
        <div style={{ padding:"14px 14px 0" }}>
          <div
            className="banner-height"
            onClick={() => router.push(banner.link)}
            style={{ borderRadius:16, overflow:"hidden", position:"relative", height:170, cursor:"pointer", background:banner.bg }}
          >
            <img src={banner.img} alt={banner.headline} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.55 }} />
            <div style={{ position:"absolute", inset:0, background:`linear-gradient(90deg,${banner.bg}F0 35%,${banner.bg}50)` }} />
            <div style={{ position:"absolute", inset:0, padding:"20px 22px", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
              <div style={{ fontSize:10, fontWeight:800, color:banner.accent, letterSpacing:"0.1em", marginBottom:5 }}>{banner.tag}</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#fff", lineHeight:1.15, marginBottom:6 }}>{banner.headline}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:12 }}>{banner.sub}</div>
              <div style={{ background:banner.accent, color:"#fff", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, display:"inline-block", alignSelf:"flex-start" }}>{banner.cta}</div>
            </div>
            <div style={{ position:"absolute", bottom:12, right:14, display:"flex", gap:5 }}>
              {AD_BANNERS.map((_,i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setBannerIdx(i); }}
                  style={{ width:i===bannerIdx?18:6, height:6, borderRadius:3, background:i===bannerIdx?"#fff":"rgba(255,255,255,0.35)", border:"none", cursor:"pointer", padding:0, transition:"all 0.3s" }} />
              ))}
            </div>
          </div>
        </div>

        {/* CATEGORIES */}
        <div style={{ padding:"20px 14px 0" }}>
          <SHead title="Shop by category" action="See all" onAction={() => router.push("/stores")} />
          <div className="category-grid">
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => router.push(`/search?q=${cat.q}`)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexDirection:"column", alignItems:"center", gap:7 }}>
                <div style={{ width:"100%", aspectRatio:"1", borderRadius:12, overflow:"hidden" }}>
                  <img src={cat.img} alt={cat.label} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />
                </div>
                <span style={{ fontSize:11, fontWeight:500, color:T.dark, textAlign:"center" }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCTS */}
        {products.length > 0 && (
          <div style={{ padding:"22px 14px 0" }}>
            <SHead title="Trending now" action="See all" onAction={() => router.push("/search")} />
            <div className="product-grid">
              {products.slice(0, 8).map((p: any) => (
                <div key={p.id} onClick={() => router.push(`/products/${p.id}`)} style={{ background:T.white, borderRadius:12, overflow:"hidden", border:`0.5px solid ${T.border}`, cursor:"pointer" }}>
                  <div style={{ aspectRatio:"1", background:"#F4F4F4", overflow:"hidden", position:"relative" }}>
                    {p.image_urls?.[0] ? <img src={p.image_urls[0]} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" /> : <ImgPlaceholder />}
                    {p.stock_quantity === 0 && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:11, fontWeight:600, color:T.muted }}>Sold out</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding:"10px 10px 12px" }}>
                    <div style={{ fontSize:12, fontWeight:500, color:T.dark, lineHeight:1.35, marginBottom:3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const, overflow:"hidden" }}>{p.name}</div>
                    <div style={{ fontSize:10, color:T.muted, marginBottom:7 }}>{p.store_name || "Store"}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:T.dark }}>R{Number(p.price).toFixed(2)}</span>
                      <button onClick={e => { e.stopPropagation(); handleAdd(p); }} disabled={p.stock_quantity===0}
                        style={{ background:p.stock_quantity===0?"#F4F4F4":T.primary, color:p.stock_quantity===0?T.muted:"#fff", border:"none", borderRadius:6, padding:"5px 10px", fontSize:11, fontWeight:600, cursor:p.stock_quantity===0?"default":"pointer", flexShrink:0 }}>
                        {p.stock_quantity===0?"Sold":"Add"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SELL BANNER */}
        <div style={{ margin:"22px 14px 0", background:T.dark, borderRadius:16, padding:"20px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>Start selling on Maizu</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Free store · Accept card payments</div>
          </div>
          <button onClick={() => router.push("/sell")} style={{ background:T.primary, color:"#fff", border:"none", borderRadius:9, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
            Open store
          </button>
        </div>

        {/* STORES */}
        {stores.length > 0 && (
          <div style={{ padding:"22px 14px 0" }}>
            <SHead title="Featured stores" action="All stores" onAction={() => router.push("/stores")} />
            <div className="store-grid">
              {stores.slice(0, 8).map((s: any) => (
                <div key={s.id} onClick={() => router.push(`/stores/${s.id}`)} style={{ background:T.white, borderRadius:12, overflow:"hidden", border:`0.5px solid ${T.border}`, cursor:"pointer" }}>
                  <div style={{ height:80, background:`linear-gradient(135deg,${T.primary}22,${T.primary}44)`, overflow:"hidden", position:"relative" }}>
                    {s.banner_url && <img src={s.banner_url} alt={s.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                    <div style={{ position:"absolute", bottom:-16, left:12 }}>
                      <div style={{ width:34, height:34, borderRadius:8, background:s.logo_url?"transparent":T.white, border:`2.5px solid ${T.white}`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:T.primary }}>
                        {s.logo_url ? <img src={s.logo_url} alt={s.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : s.name?.charAt(0)}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"22px 12px 12px" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.dark, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                    <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{s.category}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span style={{ fontSize:10, color:T.muted }}>{Number(s.rating||0).toFixed(1)} · {s.product_count||0} items</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {products.length === 0 && stores.length === 0 && (
          <div style={{ padding:"48px 20px", textAlign:"center" }}>
            <div style={{ width:72, height:72, borderRadius:18, background:T.soft, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:T.dark, marginBottom:8 }}>Marketplace launching soon</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:24, maxWidth:280, margin:"0 auto 24px" }}>
              Be the first vendor. Open your store and start selling across South Africa.
            </div>
            <button onClick={() => router.push("/sell")} style={{ background:T.primary, color:"#fff", border:"none", borderRadius:24, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Open a free store
            </button>
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
