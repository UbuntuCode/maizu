"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { storesApi, productsApi, type Store, type Product } from "@/utils/api";
import Header from "@/components/layout/Header";

/* ── Read-only product card (public view — no manage buttons) ── */
const PublicProductCard = ({ product }: { product: Product }) => (
  <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
    <div style={{ height: 100, background: "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
      {product.image_urls?.[0]
        ? <img src={product.image_urls[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : "📦"
      }
    </div>
    <div style={{ padding: "10px 10px 12px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginBottom: 4 }}>R{Number(product.price).toFixed(2)}</div>
      <div style={{ fontSize: 10, color: product.stock_quantity > 0 ? C.gray : "#DC2626" }}>
        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   PUBLIC STORE PAGE
══════════════════════════════════════════════════════ */
export default function PublicStorePage() {
  const router  = useRouter();
  const params  = useParams();
  const storeId = params.id as string;
  const { authUser, isLoggedIn } = useAuth();

  const [store,        setStore]        = useState<Store | null>(null);
  const [products,     setProducts]     = useState<Product[]>([]);
  const [pageLoading,  setPageLoading]  = useState(true);
  const [error,        setError]        = useState("");
  const [isFollowing,  setIsFollowing]  = useState(false);
  const [followBusy,   setFollowBusy]   = useState(false);

  const isOwner = !!authUser && !!store && authUser.id === store.owner_id;

  const loadData = useCallback(async () => {
    setPageLoading(true);
    try {
      const [storeData, productsData] = await Promise.all([
        storesApi.getOne(storeId),
        productsApi.getAll({ store_id: storeId }),
      ]);
      setStore(storeData);
      setProducts(productsData);

      if (isLoggedIn) {
        try {
          const myFollows = await storesApi.getMyFollows();
          setIsFollowing(myFollows.some(s => s.id === storeId));
        } catch { /* silent — follow state just won't be pre-checked */ }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load store.");
    } finally {
      setPageLoading(false);
    }
  }, [storeId, isLoggedIn]);

  useEffect(() => { if (storeId) loadData(); }, [storeId, loadData]);

  const handleFollow = async () => {
    if (!isLoggedIn) { router.push(`/login?next=/stores/${storeId}`); return; }
    if (followBusy || !store) return;
    setFollowBusy(true);
    try {
      const nowFollowing = await storesApi.follow(storeId);
      setIsFollowing(nowFollowing);
      setStore(prev => prev ? { ...prev, follower_count: prev.follower_count + (nowFollowing ? 1 : -1) } : prev);
    } catch {
      alert("Failed to update follow status.");
    } finally {
      setFollowBusy(false);
    }
  };

  if (pageLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loading store…</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, color: C.dark, marginBottom: 16 }}>{error || "Store not found."}</div>
          <button onClick={() => router.push("/stores")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Back to Stores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      <Header />

      {/* Store header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ height: 110, background: store.banner_url ? "transparent" : `linear-gradient(135deg, ${C.primary}30, ${C.primary}50)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {store.banner_url
            ? <img src={store.banner_url} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ fontSize: 48 }}>🏪</div>
          }
          <button onClick={() => router.back()} style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "5px 12px", color: "#fff", fontSize: 13, cursor: "pointer", backdropFilter: "blur(4px)" }}>
            ‹ Back
          </button>
        </div>

        <div style={{ padding: "0 16px 16px", display: "flex", alignItems: "flex-end", gap: 12, marginTop: -26 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: store.logo_url ? "transparent" : C.softOrange, border: `3px solid ${C.white}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {store.logo_url ? <img src={store.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
          </div>
          <div style={{ flex: 1, paddingBottom: 2 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>{store.name}</div>
            <div style={{ fontSize: 11, color: C.gray }}>{store.category} · {store.follower_count} followers</div>
          </div>

          {isOwner ? (
            <button onClick={() => router.push(`/dashboard/stores/${storeId}`)}
              style={{ background: C.dark, color: "#fff", border: "none", borderRadius: 20, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              Manage Store
            </button>
          ) : (
            <button onClick={handleFollow} disabled={followBusy}
              style={{
                background: isFollowing ? C.white : C.primary,
                color: isFollowing ? C.primary : "#fff",
                border: isFollowing ? `1.5px solid ${C.primary}` : "none",
                borderRadius: 20, padding: "9px 16px", fontSize: 12.5, fontWeight: 700,
                cursor: followBusy ? "default" : "pointer",
              }}>
              {followBusy ? "…" : isFollowing ? "Following ✓" : "+ Follow"}
            </button>
          )}
        </div>

        {store.description && (
          <div style={{ padding: "0 16px 14px", fontSize: 12.5, color: C.gray, lineHeight: 1.6 }}>
            {store.description}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${C.border}` }}>
          {[["📦", store.product_count, "Products"], ["👥", store.follower_count, "Followers"], ["⭐", Number(store.rating).toFixed(1) || "—", "Rating"]].map(([emoji, val, label]) => (
            <div key={label as string} style={{ padding: "12px 0", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{val}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 14 }}>
          Products ({products.length})
        </div>

        {products.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 16, padding: "36px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>No products yet</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>This store hasn&apos;t listed anything yet — check back soon.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {products.map(p => <PublicProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}