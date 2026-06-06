"use client";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C } from "@/utils/constants";
import { productsApi, storesApi, type Product, type Store } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import BottomNav from "@/components/navigation/BottomNav";
import Header from "@/components/layout/Header";

/* ── Constants ──────────────────────────────────────────────── */
const CATEGORIES = [
  "All", "Fashion", "Electronics", "Beauty", "Food",
  "Home", "Sports", "Services", "Art & Crafts", "Health", "Other",
];

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc",label: "Price: High to Low" },
  { value: "popular",   label: "Most Popular" },
];

/* ── Toast ──────────────────────────────────────────────────── */
const Toast = ({ msg, onClose }: { msg: string; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 2200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#fff", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 500, zIndex: 1000, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
      {msg}
    </div>
  );
};

/* ── Skeleton ───────────────────────────────────────────────── */
const Skel = ({ h = 12, w = "100%", r = 6, mb = 0 }: { h?: number; w?: string | number; r?: number; mb?: number }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: "#F0F0F0", marginBottom: mb, animation: "pulse 1.5s ease-in-out infinite" }} />
);

const ProductSkeleton = () => (
  <div style={{ background: C.white, borderRadius: 14, overflow: "hidden" }}>
    <Skel h={130} r={0} mb={0} />
    <div style={{ padding: 10 }}>
      <Skel h={11} w="80%" mb={6} />
      <Skel h={14} w="40%" mb={8} />
      <Skel h={30} r={9} />
    </div>
  </div>
);

/* ── Product card ───────────────────────────────────────────── */
const ProductCard = ({
  product, onAdd, onStoreClick,
}: {
  product:      Product;
  onAdd:        (p: Product) => void;
  onStoreClick: (storeId: string) => void;
}) => {
  const { isInCart, getQty } = useCart();
  const inCart = isInCart(product.id);
  const qty    = getQty(product.id);

  return (
    <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      {/* Image */}
      <div style={{ height: 130, background: "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
        {product.image_urls?.[0]
          ? <img src={product.image_urls[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "📦"
        }
        {product.is_trending && (
          <div style={{ position: "absolute", top: 5, left: 5, background: "#FF6B35", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 7, fontWeight: 700 }}>🔥 Trending</div>
        )}
        {product.stock_quantity === 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 700, background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 20 }}>Out of Stock</span>
          </div>
        )}
        {inCart && (
          <div style={{ position: "absolute", top: 5, right: 5, background: C.primary, color: "#fff", borderRadius: 20, padding: "2px 7px", fontSize: 8, fontWeight: 700 }}>{qty} in cart</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "10px 10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 3, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.name}
        </div>
        {product.store_name && (
          <button
            onClick={() => onStoreClick(product.store_id)}
            style={{ fontSize: 9, color: C.primary, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 4, fontWeight: 600 }}
          >
            🏪 {product.store_name}
          </button>
        )}
        <div style={{ fontSize: 14, fontWeight: 800, color: C.primary, marginBottom: 6 }}>
          R{Number(product.price).toFixed(2)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.gray, marginBottom: 7 }}>
          <span>Stock: {product.stock_quantity}</span>
          <span>❤️ {product.like_count} · 👁 {product.view_count}</span>
        </div>
        <button
          onClick={() => onAdd(product)}
          disabled={product.stock_quantity === 0}
          style={{
            width: "100%",
            background: product.stock_quantity === 0 ? "#F3F4F6" : inCart ? "#E1F5EE" : C.primary,
            color: product.stock_quantity === 0 ? C.gray : inCart ? "#085041" : "#fff",
            border: "none", borderRadius: 9, padding: "7px 0",
            fontSize: 10, fontWeight: 700,
            cursor: product.stock_quantity === 0 ? "default" : "pointer",
          }}
        >
          {product.stock_quantity === 0 ? "Out of Stock" : inCart ? `✓ In Cart (${qty})` : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

/* ── Store chip ─────────────────────────────────────────────── */
const StoreChip = ({ store, onClick }: { store: Store; onClick: () => void }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, background: C.white, borderRadius: 22, padding: "6px 12px 6px 6px", border: `1px solid ${C.border}`, cursor: "pointer", flexShrink: 0 }}>
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.softOrange, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
      {store.logo_url ? <img src={store.logo_url} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.dark, whiteSpace: "nowrap" }}>{store.name}</div>
      <div style={{ fontSize: 9, color: C.gray }}>{store.product_count} products</div>
    </div>
  </div>
);

/* ── Filter panel ───────────────────────────────────────────── */
const FilterPanel = ({
  category, setCategory,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  sortBy, setSortBy,
  inStockOnly, setInStockOnly,
  onApply, onClose,
}: {
  category: string; setCategory: (v: string) => void;
  minPrice: string; setMinPrice: (v: string) => void;
  maxPrice: string; setMaxPrice: (v: string) => void;
  sortBy:   string; setSortBy:   (v: string) => void;
  inStockOnly: boolean; setInStockOnly: (v: boolean) => void;
  onApply: () => void; onClose: () => void;
}) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
    {/* Backdrop */}
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />

    {/* Panel */}
    <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.white, borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", maxHeight: "85vh", overflowY: "auto" }}>
      {/* Handle */}
      <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>Filters</div>
        <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer" }}>✕</button>
      </div>

      {/* Sort */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Sort by</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setSortBy(opt.value)}
              style={{ background: sortBy === opt.value ? C.primary : C.white, color: sortBy === opt.value ? "#fff" : C.dark, border: `1.5px solid ${sortBy === opt.value ? C.primary : C.border}`, borderRadius: 10, padding: "9px 0", fontSize: 11, fontWeight: sortBy === opt.value ? 700 : 500, cursor: "pointer" }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Category</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ background: category === cat ? C.primary : C.white, color: category === cat ? "#fff" : C.dark, border: `1.5px solid ${category === cat ? C.primary : C.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: category === cat ? 700 : 500, cursor: "pointer" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Price Range (R)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: C.gray, display: "block", marginBottom: 4 }}>Min price</label>
            <input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" placeholder="0" min="0"
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.gray, display: "block", marginBottom: 4 }}>Max price</label>
            <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" placeholder="Any" min="0"
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box" }} />
          </div>
        </div>
        {/* Quick price ranges */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {[["Under R100", "0", "100"], ["R100–R500", "100", "500"], ["R500–R1000", "500", "1000"], ["Over R1000", "1000", ""]].map(([label, min, max]) => (
            <button key={label} onClick={() => { setMinPrice(min); setMaxPrice(max); }}
              style={{ background: minPrice === min && maxPrice === max ? C.softOrange : "#F9FAFB", color: minPrice === min && maxPrice === max ? C.primary : C.gray, border: `1px solid ${minPrice === min && maxPrice === max ? C.primary : C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 500, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* In stock only */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>In stock only</div>
          <div style={{ fontSize: 11, color: C.gray }}>Hide out of stock products</div>
        </div>
        <div onClick={() => setInStockOnly(!inStockOnly)} style={{ width: 44, height: 24, borderRadius: 12, background: inStockOnly ? C.primary : C.border, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
          <div style={{ position: "absolute", top: 2, left: inStockOnly ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
        </div>
      </div>

      <button onClick={onApply} style={{ width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        Apply Filters
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   SEARCH PAGE (inner — uses useSearchParams)
══════════════════════════════════════════════════════════════ */
function SearchContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { addItem }  = useCart();

  /* Search state */
  const [query,       setQuery]       = useState(searchParams.get("q") || "");
  const [inputVal,    setInputVal]    = useState(searchParams.get("q") || "");
  const inputRef                      = useRef<HTMLInputElement>(null);

  /* Filter state */
  const [category,    setCategory]    = useState("All");
  const [minPrice,    setMinPrice]    = useState("");
  const [maxPrice,    setMaxPrice]    = useState("");
  const [sortBy,      setSortBy]      = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  /* Temp filter state (before Apply) */
  const [tmpCategory,    setTmpCategory]    = useState("All");
  const [tmpMinPrice,    setTmpMinPrice]    = useState("");
  const [tmpMaxPrice,    setTmpMaxPrice]    = useState("");
  const [tmpSortBy,      setTmpSortBy]      = useState("newest");
  const [tmpInStockOnly, setTmpInStockOnly] = useState(false);

  /* Results */
  const [products, setProducts] = useState<Product[]>([]);
  const [stores,   setStores]   = useState<Store[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [toast,    setToast]    = useState("");

  /* Active filter count badge */
  const filterCount = [
    category !== "All",
    !!minPrice,
    !!maxPrice,
    sortBy !== "newest",
    inStockOnly,
  ].filter(Boolean).length;

  /* Search function */
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [prods, strs] = await Promise.all([
        productsApi.getAll({
          search:   q,
          category: category !== "All" ? category : undefined,
        }),
        storesApi.getAll({ search: q, limit: 5 }),
      ]);

      /* Client-side filtering */
      let filtered = prods;

      if (inStockOnly) {
        filtered = filtered.filter(p => p.stock_quantity > 0);
      }
      if (minPrice) {
        filtered = filtered.filter(p => Number(p.price) >= Number(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter(p => Number(p.price) <= Number(maxPrice));
      }

      /* Sort */
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "price_asc":  return Number(a.price) - Number(b.price);
          case "price_desc": return Number(b.price) - Number(a.price);
          case "popular":    return (b.like_count + b.view_count) - (a.like_count + a.view_count);
          default:           return 0; // newest — keep API order
        }
      });

      setProducts(filtered);
      setStores(strs.slice(0, 5));
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [category, minPrice, maxPrice, sortBy, inStockOnly]);

  /* Search on query change (debounced) */
  useEffect(() => {
    if (!query.trim()) { setProducts([]); setStores([]); setSearched(false); return; }
    const timer = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  /* Focus input on mount */
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputVal.trim();
    if (!q) return;
    setQuery(q);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
  };

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
    setToast(`${product.name} added to cart! 🛒`);
  };

  const applyFilters = () => {
    setCategory(tmpCategory);
    setMinPrice(tmpMinPrice);
    setMaxPrice(tmpMaxPrice);
    setSortBy(tmpSortBy);
    setInStockOnly(tmpInStockOnly);
    setShowFilters(false);
  };

  const openFilters = () => {
    setTmpCategory(category);
    setTmpMinPrice(minPrice);
    setTmpMaxPrice(maxPrice);
    setTmpSortBy(sortBy);
    setTmpInStockOnly(inStockOnly);
    setShowFilters(true);
  };

  const clearFilters = () => {
    setCategory("All");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setInStockOnly(false);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      <Header />

      {/* ── Search bar ── */}
      <div style={{ background: C.white, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 60, zIndex: 100 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
          {/* Back button */}
          <button type="button" onClick={() => router.back()} style={{ background: "#F3F4F6", border: "none", borderRadius: 10, width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.dark, flexShrink: 0 }}>
            ‹
          </button>

          {/* Input */}
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); setQuery(e.target.value); }}
              placeholder="Search products, stores…"
              style={{ width: "100%", padding: "12px 36px 12px 36px", border: `1.5px solid ${C.border}`, borderRadius: 11, fontSize: 14, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" }}
            />
            {inputVal && (
              <button type="button" onClick={() => { setInputVal(""); setQuery(""); inputRef.current?.focus(); }}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.gray }}>
                ✕
              </button>
            )}
          </div>

          {/* Filter button */}
          <button type="button" onClick={openFilters}
            style={{ background: filterCount > 0 ? C.primary : "#F3F4F6", border: "none", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, flexShrink: 0, position: "relative" }}>
            ⚙️
            {filterCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#FF6B35", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {filterCount}
              </span>
            )}
          </button>
        </form>

        {/* Active filters row */}
        {filterCount > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.gray }}>Filters:</span>
            {category !== "All" && <span style={{ background: C.softOrange, color: C.primary, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{category}</span>}
            {(minPrice || maxPrice) && <span style={{ background: C.softOrange, color: C.primary, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>R{minPrice || "0"} – R{maxPrice || "∞"}</span>}
            {inStockOnly && <span style={{ background: "#E1F5EE", color: "#085041", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>In stock only</span>}
            {sortBy !== "newest" && <span style={{ background: "#EDE9FE", color: "#5B21B6", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{SORT_OPTIONS.find(s => s.value === sortBy)?.label}</span>}
            <button onClick={clearFilters} style={{ background: "none", border: "none", color: C.gray, fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>Clear all</button>
          </div>
        )}
      </div>

      <div style={{ padding: "16px" }}>

        {/* ── Empty state — no search yet ── */}
        {!query.trim() && !searched && (
          <div>
            {/* Popular categories */}
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Browse Categories</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {[
                { emoji: "👗", label: "Fashion",      color: "#FFF3EE" },
                { emoji: "📱", label: "Electronics",  color: "#EFF6FF" },
                { emoji: "💄", label: "Beauty",       color: "#FDF2F8" },
                { emoji: "🍱", label: "Food",         color: "#F0FDF4" },
                { emoji: "🛋️", label: "Home",         color: "#FFFBEB" },
                { emoji: "⚽", label: "Sports",       color: "#F0F9FF" },
                { emoji: "🛠️", label: "Services",     color: "#F5F3FF" },
                { emoji: "🎨", label: "Art & Crafts", color: "#FEF3C7" },
              ].map(cat => (
                <button key={cat.label}
                  onClick={() => { setInputVal(cat.label); setQuery(cat.label); }}
                  style={{ background: cat.color, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Popular searches */}
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Popular Searches</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Scrubs", "Ankara dress", "Phone accessories", "Jewellery", "Sneakers", "Candles", "Home decor", "Bags"].map(term => (
                <button key={term} onClick={() => { setInputVal(term); setQuery(term); }}
                  style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "7px 14px", fontSize: 12, color: C.dark, cursor: "pointer" }}>
                  🔍 {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 14 }}>Searching…</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {!loading && searched && (
          <>
            {/* Stores that match */}
            {stores.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 10 }}>
                  🏪 Stores matching &ldquo;{query}&rdquo;
                </div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {stores.map(store => (
                    <StoreChip key={store.id} store={store} onClick={() => router.push(`/stores/${store.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>
                {products.length > 0
                  ? `${products.length} product${products.length !== 1 ? "s" : ""} found`
                  : "No products found"
                }
              </div>
              {products.length > 0 && (
                <div style={{ fontSize: 11, color: C.gray }}>
                  {sortBy === "price_asc" ? "↑ Price" : sortBy === "price_desc" ? "↓ Price" : sortBy === "popular" ? "🔥 Popular" : "Newest"}
                </div>
              )}
            </div>

            {products.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 8 }}>
                  No results for &ldquo;{query}&rdquo;
                </div>
                <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, lineHeight: 1.6 }}>
                  Try different keywords, check your spelling, or browse by category
                </div>
                {filterCount > 0 && (
                  <button onClick={clearFilters} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 }}>
                    Clear Filters
                  </button>
                )}
                <button onClick={() => { setInputVal(""); setQuery(""); setSearched(false); }} style={{ background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Browse All
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {products.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={handleAddToCart}
                    onStoreClick={storeId => router.push(`/stores/${storeId}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <FilterPanel
          category={tmpCategory}      setCategory={setTmpCategory}
          minPrice={tmpMinPrice}       setMinPrice={setTmpMinPrice}
          maxPrice={tmpMaxPrice}       setMaxPrice={setTmpMaxPrice}
          sortBy={tmpSortBy}           setSortBy={setTmpSortBy}
          inStockOnly={tmpInStockOnly} setInStockOnly={setTmpInStockOnly}
          onApply={applyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EXPORTED PAGE — wrapped in Suspense for useSearchParams
══════════════════════════════════════════════════════════════ */
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F5F5" }}>
        <div style={{ fontSize: 13, color: "#6B7280" }}>Loading search…</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
