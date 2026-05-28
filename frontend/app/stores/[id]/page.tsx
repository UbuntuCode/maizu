"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { C } from "@/utils/constants";
import { storesApi, productsApi, type Store, type Product } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import BottomNav from "@/components/navigation/BottomNav";

/* ── Star rating ────────────────────────────────────────────── */
const Stars = ({ rating }: { rating: number }) => {
  const r = Number(rating) || 0;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= Math.round(r) ? "#F59E0B" : "#D1D5DB" }}>★</span>
      ))}
    </div>
  );
};

/* ── Toast notification ─────────────────────────────────────── */
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#fff", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 500, zIndex: 1000, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {message}
    </div>
  );
};

/* ── Product card ───────────────────────────────────────────── */
const ProductCard = ({
  product, storeName, storeId, onAddToCart,
}: {
  product:    Product;
  storeName:  string;
  storeId:    string;
  onAddToCart: (product: Product) => void;
}) => {
  const { isInCart, getQty } = useCart();
  const inCart = isInCart(product.id);
  const qty    = getQty(product.id);

  return (
    <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      {/* Image */}
      <div style={{ height: 130, background: "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, position: "relative" }}>
        {product.image_urls?.[0]
          ? <img src={product.image_urls[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "📦"
        }
        {product.is_trending && (
          <div style={{ position: "absolute", top: 6, left: 6, background: C.trendOrng, color: "#fff", borderRadius: 8, padding: "2px 7px", fontSize: 8, fontWeight: 700 }}>🔥 Trending</div>
        )}
        {inCart && (
          <div style={{ position: "absolute", top: 6, right: 6, background: C.primary, color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>
            {qty} in cart
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.6)", padding: "3px 10px", borderRadius: 20 }}>Out of Stock</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "10px 10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 4, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, marginBottom: 6 }}>R{Number(product.price).toFixed(2)}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: C.gray }}>Stock: {product.stock_quantity}</span>
          <span style={{ fontSize: 9, color: C.gray }}>👁 {product.view_count}</span>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock_quantity === 0}
          style={{
            width: "100%",
            background: product.stock_quantity === 0 ? "#F3F4F6" : inCart ? "#E1F5EE" : C.primary,
            color: product.stock_quantity === 0 ? C.gray : inCart ? "#085041" : "#fff",
            border: "none", borderRadius: 10, padding: "8px 0",
            fontSize: 11, fontWeight: 700,
            cursor: product.stock_quantity === 0 ? "default" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {product.stock_quantity === 0 ? "Out of Stock" : inCart ? `✓ In Cart (${qty})` : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

/* ── Skeleton ───────────────────────────────────────────────── */
const SkeletonProduct = () => (
  <div style={{ background: C.white, borderRadius: 14, overflow: "hidden" }}>
    <div style={{ height: 130, background: "#F0F0F0", animation: "pulse 1.5s ease-in-out infinite" }} />
    <div style={{ padding: "10px" }}>
      <div style={{ height: 12, background: "#F0F0F0", borderRadius: 4, marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 16, background: "#F0F0F0", borderRadius: 4, width: "50%", animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   STORE PAGE
══════════════════════════════════════════════════════════════ */
export default function StoreDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const storeId = params.id as string;

  const { authUser }            = useAuth();
  const { addItem, totalItems } = useCart();

  const [store,     setStore]     = useState<Store | null>(null);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [following, setFollowing] = useState(false);
  const [followBusy,setFollowBusy]= useState(false);
  const [activeTab, setActiveTab] = useState<"all" | string>("all");
  const [searchQ,   setSearchQ]   = useState("");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [toast,     setToast]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [storeData, productsData] = await Promise.all([
        storesApi.getOne(storeId),
        productsApi.getAll({ store_id: storeId }),
      ]);
      setStore(storeData);
      setProducts(productsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load store.");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { if (storeId) load(); }, [load, storeId]);

  const handleFollow = async () => {
    if (!authUser) { router.push("/login"); return; }
    setFollowBusy(true);
    try {
      const isNowFollowing = await storesApi.follow(storeId);
      setFollowing(isNowFollowing);
      setStore(prev => prev ? { ...prev, follower_count: isNowFollowing ? prev.follower_count + 1 : prev.follower_count - 1 } : prev);
    } catch { /* silent */ }
    finally { setFollowBusy(false); }
  };

  const handleAddToCart = (product: Product) => {
    if (!store) return;
    addItem({
      product_id:     product.id,
      name:           product.name,
      price:          Number(product.price),
      image_url:      product.image_urls?.[0],
      store_id:       storeId,
      store_name:     store.name,
      stock_quantity: product.stock_quantity,
    });
    setToast(`${product.name} added to cart!`);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered   = products.filter(p => {
    const matchCat = activeTab === "all" || p.category === activeTab;
    const matchQ   = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  /* Loading */
  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        <div style={{ height: 200, background: "#E5E7EB", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ padding: "0 16px", marginTop: -30 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "#D1D5DB", border: `4px solid ${C.white}`, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
            {[1, 2, 3, 4].map(i => <SkeletonProduct key={i} />)}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* Error */
  if (error || !store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20, gap: 16 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>{error || "Store not found"}</div>
        <button onClick={() => router.push("/stores")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Browse Stores</button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      {/* Banner */}
      <div style={{ height: 200, background: store.banner_url ? "transparent" : `linear-gradient(135deg, ${C.primary}40, #FF8C6140)`, overflow: "hidden", position: "relative" }}>
        {store.banner_url
          ? <img src={store.banner_url} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>🏪</div>
        }
        <button onClick={() => router.back()} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "6px 14px", color: "#fff", fontSize: 13, cursor: "pointer", backdropFilter: "blur(6px)" }}>‹ Back</button>

        {/* Cart button floating */}
        <button onClick={() => router.push("/cart")} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "6px 14px", color: "#fff", fontSize: 13, cursor: "pointer", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", gap: 5 }}>
          🛒 {totalItems > 0 && <span style={{ background: C.primary, borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{totalItems}</span>}
        </button>
      </div>

      {/* Store info */}
      <div style={{ background: C.white, padding: "0 16px 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: store.logo_url ? "transparent" : C.softOrange, border: `4px solid ${C.white}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>
            {store.logo_url ? <img src={store.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
          </div>
          <button onClick={handleFollow} disabled={followBusy} style={{ background: following ? C.white : C.primary, color: following ? C.primary : "#fff", border: `2px solid ${C.primary}`, borderRadius: 22, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: followBusy ? "default" : "pointer" }}>
            {followBusy ? "…" : following ? "✓ Following" : "+ Follow"}
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 3 }}>{store.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Stars rating={Number(store.rating)} />
            <span style={{ fontSize: 12, color: C.gray }}>{Number(store.rating).toFixed(1)} ({store.total_reviews} reviews)</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ background: C.softOrange, color: C.primary, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{store.category}</span>
            {store.floor_location && <span style={{ background: "#F3F4F6", color: C.gray, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>📍 {store.floor_location}</span>}
          </div>
          {store.description && <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.65 }}>{store.description}</div>}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 14, background: "#F9FAFB", borderRadius: 14, overflow: "hidden" }}>
          {[["📦", store.product_count, "Products"], ["👥", store.follower_count, "Followers"], ["⭐", Number(store.rating).toFixed(1), "Rating"]].map(([e, v, l]) => (
            <div key={l as string} style={{ padding: "12px 0", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, marginBottom: 2 }}>{e}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{v}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div style={{ padding: "0 16px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.grayLight }}>🔍</div>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={`Search ${store.name} products…`} style={{ width: "100%", padding: "11px 12px 11px 36px", border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 13, outline: "none", background: C.white, color: C.dark, boxSizing: "border-box" }} />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
            {["all", ...categories].map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} style={{ background: activeTab === cat ? C.primary : C.white, color: activeTab === cat ? "#fff" : C.dark, border: activeTab === cat ? "none" : `1.5px solid ${C.border}`, borderRadius: 22, padding: "6px 14px", fontSize: 12, fontWeight: activeTab === cat ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>Products <span style={{ fontSize: 12, color: C.gray, fontWeight: 400 }}>({filtered.length})</span></div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 16, padding: "36px 20px", textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{searchQ ? "No products match" : "No products yet"}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} storeName={store.name} storeId={storeId} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
