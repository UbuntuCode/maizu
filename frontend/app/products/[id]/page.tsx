"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { C } from "@/utils/constants";
import { useCart } from "@/context/CartContext";
import { productsApi, type Product } from "@/utils/api";
import Header from "@/components/layout/Header";
import HeartButton from "@/components/ui/HeartButton";
import ReviewSection from "@/components/reviews/ReviewSection";

export default function ProductDetailPage() {
  const router    = useRouter();
  const params    = useParams();
  const productId = params.id as string;
  const { addItem, isInCart, getQty, updateQty } = useCart();

  const [product,     setProduct]     = useState<Product | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error,       setError]       = useState("");
  const [activeImg,   setActiveImg]   = useState(0);
  const [toast,       setToast]       = useState("");

  const loadProduct = useCallback(async () => {
    setPageLoading(true);
    try {
      const data = await productsApi.getOne(productId);
      setProduct(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load product.");
    } finally {
      setPageLoading(false);
    }
  }, [productId]);

  useEffect(() => { if (productId) loadProduct(); }, [productId, loadProduct]);

  const handleAddToCart = () => {
    if (!product || product.stock_quantity === 0) return;
    addItem({
      product_id:     product.id,
      name:           product.name,
      price:          Number(product.price),
      image_url:      product.image_urls?.[0],
      store_id:       product.store_id,
      store_name:     product.store_name || "",
      stock_quantity: product.stock_quantity,
    });
    setToast("Added to cart!");
    setTimeout(() => setToast(""), 1800);
  };

  const inCart = product ? isInCart(product.id) : false;
  const qty    = product ? getQty(product.id) : 0;

  if (pageLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loading product…</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, color: C.dark, marginBottom: 16 }}>{error || "Product not found."}</div>
          <button onClick={() => router.push("/stores")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Browse Stores
          </button>
        </div>
      </div>
    );
  }

  const images = product.image_urls?.length ? product.image_urls : [];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 100 }}>
      <Header />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#059669", color: "#fff", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          {toast}
        </div>
      )}

      {/* Back button */}
      <div style={{ padding: "12px 16px 0" }}>
        <button onClick={() => router.back()} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, color: C.dark, cursor: "pointer" }}>
          ‹ Back
        </button>
      </div>

      {/* Image gallery */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ position: "relative", height: 280, borderRadius: 16, overflow: "hidden", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {images.length > 0 ? (
            <img src={images[activeImg]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 64 }}>📦</span>
          )}
          <HeartButton productId={product.id} size="lg" count={product.like_count} showCount
            style={{ position: "absolute", top: 12, right: 12 }} />
          {product.is_trending && (
            <div style={{ position: "absolute", top: 12, left: 12, background: "#FF6B35", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
              🔥 Trending
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", border: `2px solid ${activeImg === i ? C.primary : "transparent"}`, padding: 0, cursor: "pointer", flexShrink: 0, background: "none" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ background: C.white, borderRadius: 16, padding: "18px 16px", marginBottom: 12 }}>
          {product.store_name && (
            <button onClick={() => router.push(`/stores/${product.store_id}`)}
              style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>
              {product.store_name} →
            </button>
          )}

          <div style={{ fontSize: 19, fontWeight: 800, color: C.dark, marginBottom: 6 }}>{product.name}</div>

          <div style={{ fontSize: 24, fontWeight: 900, color: C.primary, marginBottom: 10 }}>
            R{Number(product.price).toFixed(2)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, fontSize: 12, color: C.gray }}>
            <span style={{ color: product.stock_quantity > 0 ? "#059669" : "#DC2626", fontWeight: 600 }}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
            </span>
            {product.category && <span>· {product.category}</span>}
            <span>· 👁 {product.view_count}</span>
          </div>

          {product.description && (
            <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.7, marginBottom: 4 }}>
              {product.description}
            </div>
          )}
        </div>

        {/* Add to cart */}
        <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 12 }}>
          {product.stock_quantity === 0 ? (
            <button disabled style={{ width: "100%", background: "#F3F4F6", color: C.gray, border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700 }}>
              Out of Stock
            </button>
          ) : inCart ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${C.border}`, borderRadius: 22, overflow: "hidden" }}>
                <button onClick={() => updateQty(product.id, qty - 1)} style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.dark }}>−</button>
                <span style={{ width: 36, textAlign: "center", fontSize: 14, fontWeight: 700, color: C.dark }}>{qty}</span>
                <button onClick={() => updateQty(product.id, qty + 1)} disabled={qty >= product.stock_quantity}
                  style={{ width: 40, height: 40, background: "none", border: "none", cursor: qty >= product.stock_quantity ? "default" : "pointer", fontSize: 18, color: qty >= product.stock_quantity ? C.grayLight : C.dark }}>+</button>
              </div>
              <button onClick={() => router.push("/cart")} style={{ flex: 1, background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                View Cart
              </button>
            </div>
          ) : (
            <button onClick={handleAddToCart} style={{ width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ marginTop: 8 }}>
        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
}