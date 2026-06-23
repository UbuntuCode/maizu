"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P     = "#E8401C";
const DARK  = "#0F0F0F";
const MUTED = "#71717A";
const BG    = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER= "#E4E4E7";
const SOFT  = "#FFF3EF";

interface Product {
  id:             string;
  name:           string;
  price:          number;
  stock_quantity: number;
  image_urls?:    string[];
  category:       string;
  is_active:      boolean;
  created_at:     string;
}

interface Store {
  id:   string;
  name: string;
}

/* ── Image placeholder ─────────────────────────────────────── */
function ImgPlaceholder() {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#F4F4F4,#E8E8E8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CACACA" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
}

/* ── Product card ───────────────────────────────────────────── */
function ProductCard({ product, onEdit, onToggle, onDelete }: {
  product: Product;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ background: WHITE, borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`, position: "relative" }}>
      <div style={{ aspectRatio: "1", background: "#F4F4F4", position: "relative" }}>
        {product.image_urls?.[0] ? (
          <img src={product.image_urls[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <ImgPlaceholder />
        )}

        {!product.is_active && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: DARK, color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>HIDDEN</span>
          </div>
        )}

        {product.stock_quantity === 0 && product.is_active && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "#DC2626", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>
            SOLD OUT
          </div>
        )}

        <button onClick={() => setShowMenu(s => !s)} style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: DARK }}>
          ⋯
        </button>

        {showMenu && (
          <div style={{ position: "absolute", top: 38, right: 6, background: WHITE, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 10, minWidth: 130 }}>
            <button onClick={() => { setShowMenu(false); onEdit(); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: DARK }}>✏️ Edit</button>
            <button onClick={() => { setShowMenu(false); onToggle(); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: DARK, borderTop: `1px solid ${BORDER}` }}>
              {product.is_active ? "🙈 Hide" : "👁️ Show"}
            </button>
            <button onClick={() => { setShowMenu(false); onDelete(); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#DC2626", borderTop: `1px solid ${BORDER}` }}>🗑️ Delete</button>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: DARK, lineHeight: 1.35, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", minHeight: 32 }}>
          {product.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: DARK }}>R{Number(product.price).toFixed(2)}</span>
          <span style={{ fontSize: 10, color: MUTED }}>{product.stock_quantity} in stock</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS LIST CONTENT — wrapped in Suspense below
══════════════════════════════════════════════════════════════ */
function ProductsPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const storeId       = searchParams.get("store");
  const justCreated   = searchParams.get("created") === "true";
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [stores,        setStores]        = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(storeId);
  const [products,      setProducts]      = useState<Product[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [filter,         setFilter]        = useState<"all" | "active" | "hidden" | "sold_out">("all");
  const [toast,          setToast]         = useState("");

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  /* Load vendor's stores */
  useEffect(() => {
    if (!isLoggedIn) return;
    const loadStores = async () => {
      try {
        const token = await getToken();
        const res   = await fetch(`${BASE}/api/vendors/my/stores`, { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        if (data.success) {
          setStores(data.stores || []);
          if (!activeStoreId && data.stores?.length > 0) setActiveStoreId(data.stores[0].id);
        }
      } catch { /* silent */ }
    };
    loadStores();
  }, [isLoggedIn, activeStoreId]);

  /* Load products for active store */
  const loadProducts = useCallback(async () => {
    if (!activeStoreId) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/products?store_id=${activeStoreId}&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [activeStoreId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    if (justCreated) {
      setToast("Listing published! 🎉");
      setTimeout(() => setToast(""), 3000);
    }
  }, [justCreated]);

  const handleToggle = async (productId: string, currentActive: boolean) => {
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !currentActive } : p));
    } catch { /* silent */ }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/products/${productId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch { /* silent */ }
  };

  const filteredProducts = products.filter(p => {
    if (filter === "active")    return p.is_active && p.stock_quantity > 0;
    if (filter === "hidden")    return !p.is_active;
    if (filter === "sold_out")  return p.stock_quantity === 0;
    return true;
  });

  const counts = {
    all:      products.length,
    active:   products.filter(p => p.is_active && p.stock_quantity > 0).length,
    hidden:   products.filter(p => !p.is_active).length,
    sold_out: products.filter(p => p.stock_quantity === 0).length,
  };

  if (authLoading) return null;
  if (!isLoggedIn) { router.push("/login"); return null; }

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 90 }}>

      {toast && (
        <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#059669", color: "#fff", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: WHITE, padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: DARK }}>My Products</div>
          <div style={{ fontSize: 11, color: MUTED }}>{products.length} listing{products.length !== 1 ? "s" : ""}</div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/products/create${activeStoreId ? `?store=${activeStoreId}` : ""}`)}
          style={{ background: P, color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          + New
        </button>
      </div>

      {/* Store selector — only show if vendor has multiple stores */}
      {stores.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px 0" }}>
          {stores.map(s => (
            <button key={s.id} onClick={() => setActiveStoreId(s.id)}
              style={{ background: activeStoreId === s.id ? P : WHITE, color: activeStoreId === s.id ? "#fff" : DARK, border: `1.5px solid ${activeStoreId === s.id ? P : BORDER}`, borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: activeStoreId === s.id ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 16px 0" }}>
        {([
          ["all",      `All (${counts.all})`],
          ["active",   `Active (${counts.active})`],
          ["hidden",   `Hidden (${counts.hidden})`],
          ["sold_out", `Sold Out (${counts.sold_out})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ background: filter === key ? SOFT : "transparent", color: filter === key ? P : MUTED, border: "none", borderRadius: 20, padding: "7px 12px", fontSize: 11, fontWeight: filter === key ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>

        {!activeStoreId ? (
          <div style={{ background: WHITE, borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 6 }}>No store yet</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>Open a store before adding products.</div>
            <button onClick={() => router.push("/dashboard/stores/create")} style={{ background: P, color: "#fff", border: "none", borderRadius: 22, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Open a Store
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: WHITE, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ aspectRatio: "1", background: "#F0F0F0", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ padding: 12 }}>
                  <div style={{ height: 12, background: "#F0F0F0", borderRadius: 4, marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 14, width: "50%", background: "#F0F0F0", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ background: WHITE, borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 6 }}>
              {filter === "all" ? "No products yet" : `No ${filter.replace("_", " ")} products`}
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>
              {filter === "all" ? "List your first product to start selling." : "Try a different filter."}
            </div>
            {filter === "all" && (
              <button onClick={() => router.push(`/dashboard/products/create?store=${activeStoreId}`)} style={{ background: P, color: "#fff", border: "none", borderRadius: 22, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Create Your First Listing
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => router.push(`/dashboard/products/${product.id}/edit`)}
                onToggle={() => handleToggle(product.id, product.is_active)}
                onDelete={() => handleDelete(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DEFAULT EXPORT — wraps content in Suspense
   (fixes the "useSearchParams should be wrapped in suspense" build error)
══════════════════════════════════════════════════════════════ */
export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: BG }} />}>
      <ProductsPageContent />
    </Suspense>
  );
}
