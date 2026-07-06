"use client";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import BottomNav from "@/components/navigation/BottomNav";
import Header from "@/components/layout/Header";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P = "#E8401C", DARK="#0F0F0F", MUTED="#71717A", BORDER="#E4E4E7", BG="#F7F7F5", WHITE="#FFFFFF";

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

const POPULAR = ["Ankara dress","Medical scrubs","Phone accessories","Jewellery","Sneakers","Candles","Home decor","Leather bags","Natural hair","Organic food"];

const SORT_OPTIONS = [
  { value:"newest",     label:"Newest"          },
  { value:"price_asc",  label:"Price: Low-High"  },
  { value:"price_desc", label:"Price: High-Low"  },
  { value:"popular",    label:"Most popular"     },
];

interface SearchProduct {
  id:             string;
  name:           string;
  price:          number;
  image_urls?:    string[];
  store_id:       string;
  store_name?:    string;
  stock_quantity: number;
  like_count:     number;
  view_count:     number;
}

function SearchContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { addItem, isInCart } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query,       setQuery]       = useState(searchParams.get("q") || "");
  const [inputVal,    setInputVal]    = useState(searchParams.get("q") || "");
  const [products,    setProducts]    = useState<SearchProduct[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [sortBy,      setSortBy]      = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [toast,       setToast]       = useState("");

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const res  = await fetch(`${BASE}/api/products?search=${encodeURIComponent(q)}&limit=40`);
      const data = await res.json();
      let results: SearchProduct[] = (data.products || []) as SearchProduct[];
      if (inStockOnly) results = results.filter((p: SearchProduct) => p.stock_quantity > 0);
      results = [...results].sort((a: SearchProduct, b: SearchProduct) => {
        if (sortBy === "price_asc")  return Number(a.price) - Number(b.price);
        if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
        if (sortBy === "popular")    return (b.like_count + b.view_count) - (a.like_count + a.view_count);
        return 0;
      });
      setProducts(results);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [sortBy, inStockOnly]);

  useEffect(() => {
    if (!query.trim()) { setProducts([]); setSearched(false); return; }
    const t = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const handleAdd = (p: SearchProduct) => {
    addItem({ product_id:p.id, name:p.name, price:Number(p.price), image_url:p.image_urls?.[0], store_id:p.store_id, store_name:p.store_name||"Store", stock_quantity:p.stock_quantity });
    setToast(`${p.name} added`);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div style={{ background:BG, minHeight:"100vh", paddingBottom:80 }}>
      {toast && <div style={{ position:"fixed", bottom:85, left:"50%", transform:"translateX(-50%)", background:DARK, color:"#fff", borderRadius:22, padding:"10px 18px", fontSize:13, fontWeight:500, zIndex:999, whiteSpace:"nowrap" }}>{toast}</div>}

      <Header />

      {/* Search input */}
      <div style={{ background:WHITE, padding:"10px 14px 12px", borderBottom:`0.5px solid ${BORDER}`, position:"sticky", top:64, zIndex:100 }}>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => router.back()} style={{ background:"#F4F4F4", border:"none", borderRadius:10, width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex:1, display:"flex", alignItems:"center", background:"#F4F4F4", borderRadius:10, padding:"0 12px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{ flexShrink:0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input ref={inputRef} value={inputVal}
              onChange={e => { setInputVal(e.target.value); setQuery(e.target.value); }}
              placeholder="Search products, storesâ€¦"
              style={{ flex:1, background:"none", border:"none", outline:"none", padding:"10px 9px", fontSize:14, color:DARK }}
            />
            {inputVal && (
              <button onClick={() => { setInputVal(""); setQuery(""); }} style={{ background:"none", border:"none", cursor:"pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Sort + filter row */}
        {searched && (
          <div style={{ display:"flex", gap:8, marginTop:10, alignItems:"center", overflowX:"auto", paddingBottom:2 }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding:"6px 10px", background:"#F4F4F4", border:"none", borderRadius:8, fontSize:12, color:DARK, cursor:"pointer", outline:"none", flexShrink:0 }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setInStockOnly(s => !s)}
              style={{ background:inStockOnly?P:"#F4F4F4", color:inStockOnly?"#fff":DARK, border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:inStockOnly?600:400, cursor:"pointer", flexShrink:0 }}>
              In stock only
            </button>
          </div>
        )}
      </div>

      <div style={{ padding:"14px" }}>

        {/* Empty â€” show categories */}
        {!query.trim() && !searched && (
          <>
            <div style={{ fontSize:15, fontWeight:700, color:DARK, marginBottom:12 }}>Browse categories</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:24 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.label} onClick={() => { setInputVal(cat.label); setQuery(cat.label); }}
                  style={{ display:"flex", alignItems:"center", gap:10, background:WHITE, border:`0.5px solid ${BORDER}`, borderRadius:12, padding:"10px 12px", cursor:"pointer", overflow:"hidden" }}>
                  <div style={{ width:44, height:44, borderRadius:8, overflow:"hidden", flexShrink:0 }}>
                    <img src={cat.img} alt={cat.label} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:DARK }}>{cat.label}</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize:15, fontWeight:700, color:DARK, marginBottom:12 }}>Popular searches</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {POPULAR.map(term => (
                <button key={term} onClick={() => { setInputVal(term); setQuery(term); }}
                  style={{ background:WHITE, border:`0.5px solid ${BORDER}`, borderRadius:20, padding:"7px 14px", fontSize:12, color:DARK, cursor:"pointer" }}>
                  {term}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background:WHITE, borderRadius:12, overflow:"hidden" }}>
                <div style={{ height:150, background:"#F0F0F0", animation:"pulse 1.5s ease-in-out infinite" }} />
                <div style={{ padding:10 }}>
                  <div style={{ height:11, background:"#F0F0F0", borderRadius:4, marginBottom:6, animation:"pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height:14, background:"#F0F0F0", borderRadius:4, width:"50%", animation:"pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            <div style={{ fontSize:13, color:MUTED, marginBottom:12 }}>
              {products.length > 0 ? `${products.length} result${products.length !== 1?"s":""} for "${query}"` : `No results for "${query}"`}
            </div>

            {products.length === 0 ? (
              <div style={{ background:WHITE, borderRadius:16, padding:"40px 20px", textAlign:"center" }}>
                <div style={{ width:56, height:56, borderRadius:14, background:"#F4F4F4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:DARK, marginBottom:6 }}>No results found</div>
                <div style={{ fontSize:13, color:MUTED, marginBottom:18 }}>Try different keywords or browse categories</div>
                <button onClick={() => { setInputVal(""); setQuery(""); setSearched(false); }} style={{ background:P, color:"#fff", border:"none", borderRadius:22, padding:"10px 22px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Browse all</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                {products.map((p) => (
                  <div key={p.id} style={{ background:WHITE, borderRadius:12, overflow:"hidden", border:`0.5px solid ${BORDER}` }}>
                    <div style={{ height:150, background:"#F4F4F4", overflow:"hidden", position:"relative" }}>
                      {p.image_urls?.[0]
                        ? <img src={p.image_urls[0]} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#F4F4F4,#E8E8E8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CACACA" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                      }
                      {p.stock_quantity === 0 && (
                        <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:11, fontWeight:600, color:MUTED }}>Sold out</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"10px 10px 12px" }}>
                      <div style={{ fontSize:12, fontWeight:500, color:DARK, lineHeight:1.35, marginBottom:3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.name}</div>
                      <div style={{ fontSize:10, color:MUTED, marginBottom:7 }}>{p.store_name}</div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:14, fontWeight:700, color:DARK }}>R{Number(p.price).toFixed(2)}</span>
                        <button onClick={() => handleAdd(p)} disabled={p.stock_quantity===0}
                          style={{ background:p.stock_quantity===0?"#F4F4F4":isInCart(p.id)?"#D1FAE5":P, color:p.stock_quantity===0?MUTED:isInCart(p.id)?"#065F46":"#fff", border:"none", borderRadius:6, padding:"5px 10px", fontSize:11, fontWeight:600, cursor:p.stock_quantity===0?"default":"pointer" }}>
                          {p.stock_quantity===0?"Sold":isInCart(p.id)?"Added":"Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#F7F7F5" }} />}>
      <SearchContent />
    </Suspense>
  );
}



