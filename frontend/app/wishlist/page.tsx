"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useWishlist, type WishlistItem } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import HeartButton from "@/components/ui/HeartButton";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

/* ── Toast ──────────────────────────────────────────────────── */
const Toast = ({ msg, onClose }: { msg: string; onClose: () => void }) => {
  React.useEffect(() => { const t = setTimeout(onClose, 2200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#fff", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 500, zIndex: 1000, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
      {msg}
    </div>
  );
};

/* ── Wishlist item card ─────────────────────────────────────── */
const WishlistCard = ({
  item, onAddToCart, onViewStore,
}: {
  item:        WishlistItem;
  onAddToCart: (item: WishlistItem) => void;
  onViewStore: (storeId: string) => void;
}) => {
  const { isInCart, getQty } = useCart();
  const inCart = isInCart(item.product_id);
  const qty    = getQty(item.product_id);

  const savedDate = new Date(item.saved_at).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short",
  });

  return (
    <div style={{ background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 12, display: "flex" }}>
      {/* Image */}
      <div style={{ width: 100, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, position: "relative", overflow: "hidden" }}>
        {item.image_urls?.[0]
          ? <img src={item.image_urls[0]} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "📦"
        }
        {item.stock_quantity === 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 20 }}>Out of Stock</span>
          </div>
        )}
        {item.is_trending && (
          <div style={{ position: "absolute", top: 5, left: 5, background: "#FF6B35", color: "#fff", borderRadius: 6, padding: "1px 5px", fontSize: 7, fontWeight: 700 }}>🔥</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: "12px 12px 12px 14px", minWidth: 0 }}>
        {/* Store */}
        <button onClick={() => onViewStore(item.store_id)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 10, color: C.primary, fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
          {item.store_logo
            ? <img src={item.store_logo} alt="" style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }} />
            : "🏪"
          }
          {item.store_name}
        </button>

        {/* Name */}
        <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 4, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.name}
        </div>

        {/* Price */}
        <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, marginBottom: 6 }}>
          R{Number(item.price).toFixed(2)}
        </div>

        {/* Saved date + stock */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: C.gray }}>Saved {savedDate}</span>
          {item.stock_quantity > 0 && item.stock_quantity <= 5 && (
            <span style={{ fontSize: 9, color: "#D97706", fontWeight: 600, background: "#FEF3C7", borderRadius: 20, padding: "1px 6px" }}>
              Only {item.stock_quantity} left!
            </span>
          )}
        </div>

        {/* Action row */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => onAddToCart(item)}
            disabled={item.stock_quantity === 0}
            style={{
              flex: 1,
              background: item.stock_quantity === 0 ? "#F3F4F6" : inCart ? "#E1F5EE" : C.primary,
              color: item.stock_quantity === 0 ? C.gray : inCart ? "#065F46" : "#fff",
              border: "none", borderRadius: 9, padding: "8px 0",
              fontSize: 11, fontWeight: 700,
              cursor: item.stock_quantity === 0 ? "default" : "pointer",
            }}
          >
            {item.stock_quantity === 0 ? "Out of Stock" : inCart ? `✓ In Cart (${qty})` : "Add to Cart"}
          </button>

          {/* Heart / unsave */}
          <HeartButton productId={item.product_id} size="md" />
        </div>
      </div>
    </div>
  );
};

/* ── Empty state ────────────────────────────────────────────── */
const EmptyWishlist = ({ onBrowse }: { onBrowse: () => void }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
    <div style={{ fontSize: 64, marginBottom: 16 }}>🤍</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 8 }}>Your wishlist is empty</div>
    <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 28, maxWidth: 280 }}>
      Tap the ♡ heart on any product to save it here for later. Never lose track of something you love!
    </div>
    <button
      onClick={onBrowse}
      style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 24, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
    >
      Browse Products
    </button>
  </div>
);

/* ── Sort / filter ──────────────────────────────────────────── */
type SortKey = "newest" | "oldest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",     label: "Newest saved" },
  { value: "oldest",     label: "Oldest saved" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

/* ══════════════════════════════════════════════════════════════
   WISHLIST PAGE
══════════════════════════════════════════════════════════════ */
export default function WishlistPage() {
  const router                   = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { items, loading }       = useWishlist();
  const { addItem }              = useCart();

  const [sortBy,  setSortBy]  = useState<SortKey>("newest");
  const [filterIn, setFilterIn] = useState(false);
  const [toast,   setToast]   = useState("");

  /* Redirect if not logged in */
  React.useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      product_id:     item.product_id,
      name:           item.name,
      price:          Number(item.price),
      image_url:      item.image_urls?.[0],
      store_id:       item.store_id,
      store_name:     item.store_name,
      stock_quantity: item.stock_quantity,
    });
    setToast(`${item.name} added to cart! 🛒`);
  };

  /* Sort + filter */
  const sorted = [...items]
    .filter(i => !filterIn || i.stock_quantity > 0)
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":     return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime();
        case "price_asc":  return Number(a.price) - Number(b.price);
        case "price_desc": return Number(b.price) - Number(a.price);
        default:           return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
      }
    });

  const outOfStockCount = items.filter(i => i.stock_quantity === 0).length;
  const totalValue      = items.reduce((s, i) => s + Number(i.price), 0);

  if (authLoading || loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
        <Header />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 13, color: C.gray }}>Loading wishlist…</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <Header />
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      {/* Page header */}
      <div style={{ background: C.white, padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.dark }}>
          My Wishlist ❤️
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
          {items.length === 0
            ? "No saved products yet"
            : `${items.length} saved product${items.length !== 1 ? "s" : ""} · Total value R${totalValue.toFixed(2)}`
          }
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyWishlist onBrowse={() => router.push("/stores")} />
      ) : (
        <div style={{ padding: "16px" }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { emoji: "❤️",  val: items.length,         label: "Saved" },
              { emoji: "✅",  val: items.length - outOfStockCount, label: "Available" },
              { emoji: "💰",  val: `R${totalValue.toFixed(0)}`, label: "Total Value" },
            ].map(s => (
              <div key={s.label} style={{ background: C.white, borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>{s.val}</div>
                <div style={{ fontSize: 10, color: C.gray }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters + sort row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              style={{ flex: 1, padding: "8px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.dark, outline: "none", background: C.white, cursor: "pointer" }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* In stock toggle */}
            <button
              onClick={() => setFilterIn(prev => !prev)}
              style={{ background: filterIn ? C.primary : C.white, color: filterIn ? "#fff" : C.dark, border: `1.5px solid ${filterIn ? C.primary : C.border}`, borderRadius: 22, padding: "7px 12px", fontSize: 11, fontWeight: filterIn ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              ✓ In stock only
            </button>
          </div>

          {/* Out of stock alert */}
          {outOfStockCount > 0 && !filterIn && (
            <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <div>
                <strong>{outOfStockCount} item{outOfStockCount !== 1 ? "s" : ""}</strong> in your wishlist {outOfStockCount !== 1 ? "are" : "is"} out of stock.
                <button onClick={() => setFilterIn(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", fontWeight: 700, textDecoration: "underline", fontSize: 12, padding: "0 0 0 4px" }}>
                  Hide them
                </button>
              </div>
            </div>
          )}

          {/* Add all in stock to cart */}
          {items.some(i => i.stock_quantity > 0) && (
            <button
              onClick={() => {
                items.filter(i => i.stock_quantity > 0).forEach(i => handleAddToCart(i));
                setToast(`${items.filter(i => i.stock_quantity > 0).length} items added to cart! 🛒`);
              }}
              style={{ width: "100%", background: C.white, color: C.primary, border: `2px solid ${C.primary}`, borderRadius: 14, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}
            >
              🛒 Add All Available to Cart ({items.filter(i => i.stock_quantity > 0).length} items)
            </button>
          )}

          {/* No results after filter */}
          {sorted.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, color: C.gray }}>No available products match your filter</div>
              <button onClick={() => setFilterIn(false)} style={{ marginTop: 12, background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Show all
              </button>
            </div>
          ) : (
            sorted.map(item => (
              <WishlistCard
                key={item.product_id}
                item={item}
                onAddToCart={handleAddToCart}
                onViewStore={storeId => router.push(`/stores/${storeId}`)}
              />
            ))
          )}

        </div>
      )}

      <BottomNav />
    </div>
  );
}
