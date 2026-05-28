"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { storesApi, productsApi, type Store, type Product } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

/* ── Skeleton ───────────────────────────────────────────────── */
const Skel = ({ w = "100%", h = 12, r = 6, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "#F0F0F0", marginBottom: mb, animation: "pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
);

/* ── Toast ──────────────────────────────────────────────────── */
const Toast = ({ msg, onClose }: { msg: string; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 2200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#fff", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 500, zIndex: 1000, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
      {msg}
    </div>
  );
};

/* ── Store card ─────────────────────────────────────────────── */
const StoreCard = ({ store, onClick }: { store: Store; onClick: () => void }) => (
  <div onClick={onClick} style={{ width: 130, flexShrink: 0, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", cursor: "pointer" }}>
    <div style={{ height: 80, background: store.banner_url ? "transparent" : `linear-gradient(135deg,${C.primary}30,${C.primary}50)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {store.banner_url ? <img src={store.banner_url} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 34 }}>🏪</span>}
      {store.is_trending && <div style={{ position: "absolute", top: 4, left: 4, background: "#FF6B35", color: "#fff", borderRadius: 6, padding: "1px 5px", fontSize: 7, fontWeight: 700 }}>🔥 HOT</div>}
    </div>
    <div style={{ padding: "8px 9px 10px" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: store.logo_url ? "transparent" : C.softOrange, border: `2px solid ${C.white}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginTop: -20, marginBottom: 4 }}>
        {store.logo_url ? <img src={store.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</div>
      <div style={{ fontSize: 9, color: C.gray, marginTop: 2 }}>{store.category}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "#F59E0B" }}>★</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: C.dark }}>{Number(store.rating).toFixed(1)}</span>
        <span style={{ fontSize: 8, color: C.grayLight }}>· {store.follower_count} followers</span>
      </div>
    </div>
  </div>
);

/* ── Product card ───────────────────────────────────────────── */
const ProductCard = ({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) => {
  const { isInCart, getQty } = useCart();
  const inCart = isInCart(product.id);
  const qty    = getQty(product.id);
  return (
    <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      <div style={{ height: 120, background: "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
        {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📦"}
        {product.is_trending && <div style={{ position: "absolute", top: 5, left: 5, background: "#FF6B35", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 7, fontWeight: 700 }}>🔥 Trending</div>}
        {inCart && <div style={{ position: "absolute", top: 5, right: 5, background: C.primary, color: "#fff", borderRadius: 20, padding: "2px 7px", fontSize: 8, fontWeight: 700 }}>{qty} in cart</div>}
      </div>
      <div style={{ padding: "9px 10px 11px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.dark, marginBottom: 3, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
        <div style={{ fontSize: 9, color: C.gray, marginBottom: 5 }}>{product.store_name}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.primary, marginBottom: 7 }}>R{Number(product.price).toFixed(2)}</div>
        <button onClick={() => onAdd(product)} disabled={product.stock_quantity === 0}
          style={{ width: "100%", background: product.stock_quantity === 0 ? "#F3F4F6" : inCart ? "#E1F5EE" : C.primary, color: product.stock_quantity === 0 ? C.gray : inCart ? "#085041" : "#fff", border: "none", borderRadius: 9, padding: "7px 0", fontSize: 10, fontWeight: 700, cursor: product.stock_quantity === 0 ? "default" : "pointer" }}>
          {product.stock_quantity === 0 ? "Out of Stock" : inCart ? `✓ In Cart (${qty})` : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

/* ── Categories ─────────────────────────────────────────────── */
const CATS = [
  { label: "Fashion", emoji: "👗" }, { label: "Electronics", emoji: "📱" },
  { label: "Beauty", emoji: "💄" },  { label: "Food", emoji: "🍱" },
  { label: "Home", emoji: "🛋️" },   { label: "Sports", emoji: "⚽" },
  { label: "Services", emoji: "🛠️" }, { label: "Art & Crafts", emoji: "🎨" },
];

/* ══════════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const { profile, authUser } = useAuth();
  const { addItem } = useCart();

  const [featuredStores,   setFeaturedStores]   = useState<Store[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [allProducts,      setAllProducts]      = useState<Product[]>([]);
  const [allStores,        setAllStores]        = useState<Store[]>([]);
  const [storesLoading,    setStoresLoading]    = useState(true);
  const [productsLoading,  setProductsLoading]  = useState(true);
  const [toast,            setToast]            = useState("");
  const [search,           setSearch]           = useState("");

  useEffect(() => {
    storesApi.getAll({ limit: 20 })
      .then(stores => {
        setAllStores(stores);
        const trending = stores.filter(s => s.is_trending);
        setFeaturedStores(trending.length > 0 ? trending.slice(0, 8) : stores.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setStoresLoading(false));

    productsApi.getAll({ trending: true })
      .then(p => setTrendingProducts(p.slice(0, 6)))
      .catch(() => {});

    productsApi.getAll({})
      .then(p => setAllProducts(p.slice(0, 6)))
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id:     product.id,
      name:           product.name,
      price:          Number(product.price),
      image_url:      product.image_urls?.[0],
      store_id:       product.store_id,
      store_name:     product.store_name || "Store",
      stock_quantity: product.stock_quantity,
    });
    setToast(`${product.name} added! 🛒`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/stores?search=${encodeURIComponent(search.trim())}`);
  };

  const displayName = profile?.full_name || authUser?.user_metadata?.full_name;
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* Which products to show — prefer trending, fall back to all */
  const showProducts    = trendingProducts.length > 0 ? trendingProducts : allProducts;
  const productHeading  = trendingProducts.length > 0 ? "🔥 Trending Products" : "✨ New Arrivals";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      <Header />

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(135deg,${C.primary},#FF8C61)`, padding: "22px 16px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "relative" }}>
          {displayName && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>{greeting}, {displayName.split(" ")[0]} 👋</div>}
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>African Digital Mall</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>
            {allStores.length > 0 ? `${allStores.length}+ stores · Fresh deals daily` : "Discover South African entrepreneurs"}
          </div>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores and products…"
              style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "none", fontSize: 13, color: C.dark, outline: "none", background: "rgba(255,255,255,0.95)" }} />
            <button type="submit" style={{ background: C.dark, color: "#fff", border: "none", borderRadius: 12, padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Go</button>
          </form>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { e: "🏪", v: allStores.length > 0 ? `${allStores.length}+` : "—", l: "Stores" },
            { e: "🏷️", v: allProducts.length > 0 ? `${allProducts.length}+` : "—", l: "Products" },
            { e: "🚚", v: "Free", l: "Delivery" },
          ].map(s => (
            <div key={s.l} style={{ padding: "12px 0", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{s.e}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>{s.v}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      <div style={{ padding: "18px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>Shop by Category</div>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 4px", scrollbarWidth: "none" }}>
          {CATS.map(cat => (
            <button key={cat.label} onClick={() => router.push(`/stores?category=${encodeURIComponent(cat.label)}`)}
              style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 14px", cursor: "pointer", minWidth: 68 }}>
              <span style={{ fontSize: 22 }}>{cat.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.dark, whiteSpace: "nowrap" }}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Stores ── */}
      <div style={{ padding: "22px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>
            {featuredStores.some(s => s.is_trending) ? "🔥 Trending Stores" : "✨ Featured Stores"}
          </div>
          <button onClick={() => router.push("/stores")} style={{ background: "none", border: "none", fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer" }}>See all →</button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 4px", scrollbarWidth: "none" }}>
          {storesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ width: 130, flexShrink: 0, background: C.white, borderRadius: 16, overflow: "hidden" }}>
                  <Skel w={130} h={80} r={0} /><div style={{ padding: 9 }}><Skel w="80%" h={10} mb={5} /><Skel w="50%" h={8} /></div>
                </div>
              ))
            : featuredStores.length === 0
              ? <div style={{ padding: "20px 0", color: C.gray, fontSize: 13 }}>No stores yet — <span onClick={() => router.push("/dashboard/create-store")} style={{ color: C.primary, cursor: "pointer", fontWeight: 600 }}>Create the first one</span></div>
              : featuredStores.map(s => <StoreCard key={s.id} store={s} onClick={() => router.push(`/stores/${s.id}`)} />)
          }
        </div>
      </div>

      {/* ── Promo banner ── */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ background: "linear-gradient(135deg,#1A1A2E,#16213E)", borderRadius: 18, padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(232,64,28,0.15)" }} />
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>LIMITED OFFER</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>Open your store<br />today — it&apos;s free!</div>
            <button onClick={() => router.push("/dashboard/create-store")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Get Started →</button>
          </div>
          <div style={{ fontSize: 56, opacity: 0.9 }}>🏪</div>
        </div>
      </div>

      {/* ── Products ── */}
      <div style={{ padding: "22px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{productHeading}</div>
          <button onClick={() => router.push("/stores")} style={{ background: "none", border: "none", fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer" }}>Browse all →</button>
        </div>
        {productsLoading
          ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: C.white, borderRadius: 14, overflow: "hidden" }}>
                  <Skel w="100%" h={120} r={0} /><div style={{ padding: 10 }}><Skel w="80%" h={10} mb={6} /><Skel w="40%" h={14} mb={8} /><Skel w="100%" h={28} r={9} /></div>
                </div>
              ))}
            </div>
          : showProducts.length === 0
            ? <div style={{ background: C.white, borderRadius: 16, padding: "28px 20px", textAlign: "center", margin: "0 16px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                <div style={{ fontSize: 13, color: C.gray }}>No products yet</div>
                <button onClick={() => router.push("/stores")} style={{ marginTop: 12, background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Explore Stores</button>
              </div>
            : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px" }}>
                {showProducts.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddToCart} />)}
              </div>
        }
      </div>

      {/* ── All Stores grid ── */}
      {allStores.length > 0 && (
        <div style={{ padding: "22px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>🏪 All Stores</div>
            <button onClick={() => router.push("/stores")} style={{ background: "none", border: "none", fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer" }}>View directory →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 16px" }}>
            {allStores.slice(0, 6).map(store => (
              <div key={store.id} onClick={() => router.push(`/stores/${store.id}`)} style={{ background: C.white, borderRadius: 12, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.07)" }}>
                <div style={{ height: 64, background: store.logo_url ? "transparent" : C.softOrange, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  {store.logo_url ? <img src={store.logo_url} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
                </div>
                <div style={{ padding: "7px 8px 9px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</div>
                  <div style={{ fontSize: 8, color: C.gray, marginTop: 1 }}>{store.category}</div>
                </div>
              </div>
            ))}
          </div>
          {allStores.length > 6 && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => router.push("/stores")} style={{ background: C.white, color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 22, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                See all {allStores.length} stores →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom CTA ── */}
      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ background: C.white, borderRadius: 18, padding: "20px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 6 }}>Ready to start selling?</div>
          <div style={{ fontSize: 12, color: C.gray, marginBottom: 16, lineHeight: 1.6 }}>
            Join 1,247+ South African entrepreneurs. Open your store free and reach thousands of shoppers daily.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.push("/dashboard/create-store")} style={{ flex: 1, background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Open a Store</button>
            <button onClick={() => router.push("/stores")} style={{ flex: 1, background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Browse Stores</button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
