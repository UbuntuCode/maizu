"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { C } from "@/utils/constants";
import { storesApi, productsApi, type Store, type Product } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import BottomNav from "@/components/navigation/BottomNav";
import ReviewSection, { StarDisplay } from "@/components/reviews/ReviewSection";
import ShareSheet, { WhatsAppButton } from "@/components/ui/ShareSheet";
import HeartButton from "@/components/ui/HeartButton";

const SITE = "https://maizu.vercel.app";

/* ── Toast ──────────────────────────────────────────────────── */
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#fff", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 500, zIndex: 500, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {message}
    </div>
  );
};

/* ── Product card ───────────────────────────────────────────── */
const ProductCard = ({
  product, store, onAddToCart, onShare,
}: {
  product:     Product;
  store:       Store;
  onAddToCart: (p: Product) => void;
  onShare:     (p: Product) => void;
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
          <div style={{ position: "absolute", top: 6, left: 6, background: "#FF6B35", color: "#fff", borderRadius: 8, padding: "2px 7px", fontSize: 8, fontWeight: 700 }}>🔥</div>
        )}
        {inCart && (
          <div style={{ position: "absolute", top: 6, right: 6, background: C.primary, color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 8, fontWeight: 700 }}>{qty} in cart</div>
        )}
        {product.stock_quantity === 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.6)", padding: "3px 10px", borderRadius: 20 }}>Out of Stock</span>
          </div>
        )}
        {/* Heart + Share buttons */}
        <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <HeartButton productId={product.id} size="sm" />
          <button
            onClick={e => { e.stopPropagation(); onShare(product); }}
            style={{ background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 20, padding: "3px 8px", color: "#fff", fontSize: 10, cursor: "pointer" }}
          >
            ↗
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 4, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, marginBottom: 6 }}>
          R{Number(product.price).toFixed(2)}
        </div>
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
          }}
        >
          {product.stock_quantity === 0 ? "Out of Stock" : inCart ? `✓ In Cart (${qty})` : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

/* ── Skeleton ───────────────────────────────────────────────── */
const Skel = ({ h = 12, w = "100%", r = 4 }: { h?: number; w?: string | number; r?: number }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: "#F0F0F0", animation: "pulse 1.5s ease-in-out infinite" }} />
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

  const [store,      setStore]      = useState<Store | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [following,  setFollowing]  = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [activeTab,  setActiveTab]  = useState<"products" | "reviews">("products");
  const [searchQ,    setSearchQ]    = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState("");
  const [shareOpen,  setShareOpen]  = useState(false);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
      product_id: product.id, name: product.name,
      price: Number(product.price), image_url: product.image_urls?.[0],
      store_id: storeId, store_name: store.name, stock_quantity: product.stock_quantity,
    });
    setToast(`${product.name} added! 🛒`);
  };

  const handleShareProduct = (product: Product) => {
    setShareProduct(product);
    setShareOpen(true);
  };

  const shareUrl     = `${SITE}/stores/${storeId}`;
  const shareTitle   = shareProduct ? `${shareProduct.name} — ${store?.name}` : store?.name || "";
  const shareMessage = shareProduct
    ? `🛍️ Check out *${shareProduct.name}* on Maizu Mall!\n💰 Only R${Number(shareProduct.price).toFixed(2)}\n🏪 From *${store?.name}*\n\nShop now 👇`
    : `🏪 Check out *${store?.name}* on Maizu!\n\n${store?.product_count} products available 👇`;

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered   = products.filter(p => {
    const matchCat = catFilter === "all" || p.category === catFilter;
    const matchQ   = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        <div style={{ height: 200, background: "#E5E7EB", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ padding: "0 16px", marginTop: -30 }}>
          <Skel h={72} w={72} r={16} />
          <div style={{ marginTop: 12 }}><Skel h={20} w="50%" /></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 16, padding: 20 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>{error || "Store not found"}</div>
        <button onClick={() => router.push("/stores")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Browse Stores</button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      {shareOpen && <ShareSheet url={shareUrl} title={shareTitle} message={shareMessage} onClose={() => setShareOpen(false)} />}

      {/* Banner */}
      <div style={{ height: 200, background: store.banner_url ? "transparent" : `linear-gradient(135deg,${C.primary}40,#FF8C6140)`, overflow: "hidden", position: "relative" }}>
        {store.banner_url ? <img src={store.banner_url} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>🏪</div>}
        <button onClick={() => router.back()} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "6px 14px", color: "#fff", fontSize: 13, cursor: "pointer" }}>‹ Back</button>
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
          <button onClick={() => { setShareProduct(null); setShareOpen(true); }} style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "6px 14px", color: "#fff", fontSize: 13, cursor: "pointer" }}>↗ Share</button>
          <button onClick={() => router.push("/cart")} style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "6px 14px", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            🛒 {totalItems > 0 && <span style={{ background: C.primary, borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{totalItems}</span>}
          </button>
        </div>
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
            <StarDisplay rating={Number(store.rating)} size={12} />
            <span style={{ fontSize: 12, color: C.gray }}>{Number(store.rating).toFixed(1)} ({store.total_reviews} reviews)</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ background: C.softOrange, color: C.primary, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{store.category}</span>
            {store.floor_location && <span style={{ background: "#F3F4F6", color: C.gray, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>📍 {store.floor_location}</span>}
          </div>
          {store.description && <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.65, marginBottom: 12 }}>{store.description}</div>}
        </div>

        {/* WhatsApp share bar */}
        <div style={{ background: C.softOrange, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 2 }}>Share this store</div>
            <div style={{ fontSize: 11, color: C.gray }}>Send to contacts on WhatsApp</div>
          </div>
          <WhatsAppButton url={`/stores/${storeId}`} message={shareMessage} style={{ flexShrink: 0, fontSize: 12 }} />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#F9FAFB", borderRadius: 14, overflow: "hidden" }}>
          {[["📦", store.product_count, "Products"], ["👥", store.follower_count, "Followers"], ["⭐", Number(store.rating).toFixed(1), "Rating"]].map(([e, v, l]) => (
            <div key={l as string} style={{ padding: "12px 0", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, marginBottom: 2 }}>{e}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{v}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 10, position: "sticky", top: 0, zIndex: 50 }}>
        {([{ id: "products", label: `📦 Products (${products.length})` }, { id: "reviews", label: `⭐ Reviews (${store.total_reviews})` }] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, background: "none", border: "none", padding: "13px 0", fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? C.primary : C.gray, cursor: "pointer", borderBottom: activeTab === tab.id ? `2.5px solid ${C.primary}` : "2.5px solid transparent" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {activeTab === "products" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.grayLight }}>🔍</div>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={`Search ${store.name} products…`}
              style={{ width: "100%", padding: "11px 12px 11px 36px", border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 13, outline: "none", background: C.white, color: C.dark, boxSizing: "border-box" }} />
          </div>
          {categories.length > 0 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {["all", ...categories].map(cat => (
               <button key={cat} onClick={() => setCatFilter(cat ?? "all")}
                  style={{ background: catFilter === cat ? C.primary : C.white, color: catFilter === cat ? "#fff" : C.dark, border: catFilter === cat ? "none" : `1.5px solid ${C.border}`, borderRadius: 22, padding: "6px 14px", fontSize: 12, fontWeight: catFilter === cat ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 12 }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</div>
          {filtered.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 16, padding: "36px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{searchQ ? "No products match" : "No products yet"}</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} store={store} onAddToCart={handleAddToCart} onShare={handleShareProduct} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews tab */}
      {activeTab === "reviews" && <ReviewSection storeId={storeId} storeName={store.name} />}

      <BottomNav />
    </div>
  );
}
