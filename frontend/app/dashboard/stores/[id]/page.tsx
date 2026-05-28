"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { storesApi, productsApi, ordersApi, type Store, type Product, type Order } from "@/utils/api";
import Header from "@/components/layout/Header";

/* ══════════════════════════════════════════════════════════════
   STATUS CONFIG
══════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending:   { color: "#D97706", bg: "#FEF3C7", icon: "⏳", label: "Pending"    },
  confirmed: { color: "#2563EB", bg: "#DBEAFE", icon: "✅", label: "Confirmed"  },
  shipped:   { color: "#7C3AED", bg: "#EDE9FE", icon: "🚚", label: "Shipped"    },
  delivered: { color: "#059669", bg: "#D1FAE5", icon: "🎉", label: "Delivered"  },
  cancelled: { color: "#DC2626", bg: "#FEE2E2", icon: "❌", label: "Cancelled"  },
};

const NEXT_STATUS: Record<string, Order["status"]> = {
  pending:   "confirmed",
  confirmed: "shipped",
  shipped:   "delivered",
};

/* ══════════════════════════════════════════════════════════════
   ORDER CARD
══════════════════════════════════════════════════════════════ */
const OrderCard = ({
  order,
  onUpdateStatus,
}: {
  order:          Order;
  onUpdateStatus: (id: string, status: Order["status"]) => Promise<void>;
}) => {
  const [busy, setBusy] = useState(false);
  const cfg             = STATUS_CFG[order.status] || STATUS_CFG.pending;
  const nextStatus      = NEXT_STATUS[order.status];

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setBusy(true);
    try { await onUpdateStatus(order.id, nextStatus); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
            {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <span>{cfg.icon}</span> {cfg.label}
        </div>
      </div>

      {/* Buyer + address */}
      <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
        {order.buyer_name && (
          <div style={{ fontSize: 12, fontWeight: 600, color: C.dark, marginBottom: 3 }}>
            👤 {order.buyer_name}
          </div>
        )}
        {order.buyer_email && (
          <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>✉️ {order.buyer_email}</div>
        )}
        <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>
          📍 {order.delivery_address}
        </div>
        {order.notes && (
          <div style={{ fontSize: 11, color: C.gray, marginTop: 4, fontStyle: "italic" }}>
            📝 {order.notes}
          </div>
        )}
      </div>

      {/* Total */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: C.gray }}>Order Total</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>
          R{Number(order.total_amount).toFixed(2)}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* Advance status */}
        {nextStatus && order.status !== "cancelled" && (
          <button
            onClick={handleAdvance}
            disabled={busy}
            style={{
              flex: 2,
              background: busy ? "#F3F4F6" : cfg.color,
              color: busy ? C.gray : "#fff",
              border: "none", borderRadius: 10,
              padding: "9px 0", fontSize: 12, fontWeight: 700,
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "Updating…" : `Mark as ${STATUS_CFG[nextStatus].label} ${STATUS_CFG[nextStatus].icon}`}
          </button>
        )}
        {/* Cancel button (only for pending/confirmed) */}
        {(order.status === "pending" || order.status === "confirmed") && (
          <button
            onClick={() => onUpdateStatus(order.id, "cancelled")}
            style={{ flex: 1, background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
        )}
        {/* Delivered / Cancelled — no actions */}
        {(order.status === "delivered" || order.status === "cancelled") && (
          <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.gray, padding: "9px 0" }}>
            {order.status === "delivered" ? "Order complete ✓" : "Order cancelled"}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════════════════════════ */
const ProductCard = ({ product, onDelete }: { product: Product; onDelete: (id: string) => void }) => (
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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.gray, marginBottom: 8 }}>
        <span>Stock: {product.stock_quantity}</span>
        <span>👁 {product.view_count}</span>
      </div>
      <button onClick={() => onDelete(product.id)} style={{ width: "100%", background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 8, padding: "5px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
        Remove
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   ADD PRODUCT MODAL
══════════════════════════════════════════════════════════════ */
const AddProductModal = ({ storeId, onClose, onAdded }: { storeId: string; onClose: () => void; onAdded: () => void }) => {
  const [form, setForm]   = useState({ name: "", description: "", price: "", category: "", stock_quantity: "1" });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");
  const fileRef           = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price) { setError("Name and price are required."); return; }
    setBusy(true); setError("");
    try {
      const fd = new FormData();
      fd.append("store_id", storeId);
      fd.append("name",           form.name.trim());
      fd.append("description",    form.description);
      fd.append("price",          form.price);
      fd.append("category",       form.category);
      fd.append("stock_quantity", form.stock_quantity);
      images.forEach(img => fd.append("images", img));
      await productsApi.create(fd);
      onAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add product.");
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, fontSize: 14, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>Add Product</div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
        {error && <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Product Name *</label>
            <input value={form.name} onChange={set("name")} placeholder="e.g. Ankara Wrap Dress" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Price (R) *</label>
              <input value={form.price} onChange={set("price")} type="number" placeholder="0.00" min="0" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Stock</label>
              <input value={form.stock_quantity} onChange={set("stock_quantity")} type="number" placeholder="1" min="0" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Category</label>
            <select value={form.category} onChange={set("category")} style={inputStyle}>
              <option value="">Select…</option>
              {["Fashion", "Electronics", "Beauty", "Food", "Home", "Sports", "Art & Crafts", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Description</label>
            <textarea value={form.description} onChange={set("description") as React.ChangeEventHandler<HTMLTextAreaElement>} placeholder="Describe your product…" rows={3} style={{ ...inputStyle, resize: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Images (max 5)</label>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {previews.map((p, i) => (
                <div key={i} style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden" }}>
                  <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              {previews.length < 5 && (
                <div onClick={() => fileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 10, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 22, color: C.grayLight, background: "#FAFAFA" }}>+</div>
              )}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={busy} style={{ background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer", marginTop: 6 }}>
            {busy ? "Adding product…" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   STORE MANAGEMENT PAGE
══════════════════════════════════════════════════════════════ */
export default function StoreManagePage() {
  const router  = useRouter();
  const params  = useParams();
  const storeId = params.id as string;
  const { isLoggedIn, loading } = useAuth();

  const [store,       setStore]       = useState<Store | null>(null);
  const [products,    setProducts]    = useState<Product[]>([]);
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [activeTab,   setActiveTab]   = useState<"products" | "orders" | "settings">("products");
  const [showModal,   setShowModal]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error,       setError]       = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/login");
  }, [loading, isLoggedIn, router]);

  /* Load store + products */
  const loadData = useCallback(async () => {
    setPageLoading(true);
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
      setPageLoading(false);
    }
  }, [storeId]);

  /* Load orders — only when orders tab is opened */
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await ordersApi.getStoreOrders(storeId);
      setOrders(data);
    } catch (err: unknown) {
      console.error("Orders load error:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [storeId]);

  useEffect(() => { if (storeId) loadData(); }, [loadData, storeId]);

  useEffect(() => {
    if (activeTab === "orders") loadOrders();
  }, [activeTab, loadOrders]);

  /* Update order status */
  const handleUpdateStatus = async (orderId: string, status: Order["status"]) => {
    await ordersApi.updateStatus(orderId, status);
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status } : o)
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Remove this product?")) return;
    try {
      await productsApi.delete(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch { alert("Failed to delete product."); }
  };

  /* Filter orders */
  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(o => o.status === filterStatus);

  /* Order stats */
  const orderStats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped:   orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    revenue:   orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
  };

  if (loading || pageLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: 13, color: C.gray }}>Loading store…</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20, gap: 16 }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 14, color: C.dark }}>{error || "Store not found."}</div>
        <button onClick={() => router.push("/dashboard")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      <Header />

      {/* Store header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        {/* Banner */}
        <div style={{ height: 110, background: store.banner_url ? "transparent" : `linear-gradient(135deg,${C.primary}30,${C.primary}50)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {store.banner_url ? <img src={store.banner_url} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: 48 }}>🏪</div>}
          <button onClick={() => router.push("/dashboard")} style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "5px 12px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
            ‹ Dashboard
          </button>
        </div>

        {/* Logo + name */}
        <div style={{ padding: "0 16px 16px", display: "flex", alignItems: "flex-end", gap: 12, marginTop: -26 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: store.logo_url ? "transparent" : C.softOrange, border: `3px solid ${C.white}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {store.logo_url ? <img src={store.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
          </div>
          <div style={{ flex: 1, paddingBottom: 2 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>{store.name}</div>
            <div style={{ fontSize: 11, color: C.gray }}>{store.category} · {store.follower_count} followers</div>
          </div>
          <div style={{ background: store.is_active ? "#E1F5EE" : "#F3F4F6", color: store.is_active ? "#085041" : C.gray, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
            {store.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${C.border}` }}>
          {[["📦", store.product_count, "Products"], ["👥", store.follower_count, "Followers"], ["⭐", Number(store.rating).toFixed(1), "Rating"]].map(([e, v, l]) => (
            <div key={l as string} style={{ padding: "12px 0", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{e}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{v}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, display: "flex", borderBottom: `1px solid ${C.border}` }}>
        {(["products", "orders", "settings"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, background: "none", border: "none", padding: "12px 0", fontSize: 12, fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? C.primary : C.gray, cursor: "pointer", borderBottom: activeTab === tab ? `2.5px solid ${C.primary}` : "2.5px solid transparent", textTransform: "capitalize" }}>
            {tab === "products" ? `📦 Products` : tab === "orders" ? `📋 Orders ${orders.length > 0 ? `(${orders.length})` : ""}` : "⚙️ Settings"}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>

        {/* ══ PRODUCTS TAB ══ */}
        {activeTab === "products" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>Products ({products.length})</div>
              <button onClick={() => setShowModal(true)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Add Product
              </button>
            </div>
            {products.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 16, padding: "36px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 6 }}>No products yet</div>
                <div style={{ fontSize: 12, color: C.gray, marginBottom: 16 }}>Add your first product to start selling</div>
                <button onClick={() => setShowModal(true)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add First Product</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {products.map(p => <ProductCard key={p.id} product={p} onDelete={handleDeleteProduct} />)}
              </div>
            )}
          </>
        )}

        {/* ══ ORDERS TAB ══ */}
        {activeTab === "orders" && (
          <>
            {/* Order stats cards */}
            {!ordersLoading && orders.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Total Orders",  val: orderStats.total,              color: C.primary,  emoji: "📋" },
                  { label: "Total Revenue", val: `R${orderStats.revenue.toFixed(2)}`, color: "#059669", emoji: "💰" },
                  { label: "Pending",       val: orderStats.pending,            color: "#D97706",  emoji: "⏳" },
                  { label: "Delivered",     val: orderStats.delivered,          color: "#059669",  emoji: "🎉" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.emoji}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: C.gray }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter pills */}
            {!ordersLoading && orders.length > 0 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
                {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => {
                  const count = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
                  if (s !== "all" && count === 0) return null;
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      style={{ background: filterStatus === s ? C.primary : C.white, color: filterStatus === s ? "#fff" : C.dark, border: filterStatus === s ? "none" : `1.5px solid ${C.border}`, borderRadius: 22, padding: "6px 12px", fontSize: 11, fontWeight: filterStatus === s ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {s === "all" ? "All" : STATUS_CFG[s]?.label} {count > 0 && `(${count})`}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Orders list */}
            {ordersLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.gray }}>
                <div style={{ fontSize: 13 }}>Loading orders…</div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 16, padding: "36px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 6 }}>
                  {filterStatus === "all" ? "No orders yet" : `No ${filterStatus} orders`}
                </div>
                <div style={{ fontSize: 12, color: C.gray }}>
                  {filterStatus === "all"
                    ? "Orders from customers will appear here once they buy from your store"
                    : `You have no orders with status "${filterStatus}" right now`
                  }
                </div>
                {filterStatus !== "all" && (
                  <button onClick={() => setFilterStatus("all")} style={{ marginTop: 12, background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Show all orders
                  </button>
                )}
              </div>
            ) : (
              <div>
                {filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {activeTab === "settings" && (
          <div style={{ background: C.white, borderRadius: 16, padding: "20px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 16 }}>Store Settings</div>
            {[
              { label: "Store Name",     val: store.name },
              { label: "Category",       val: store.category },
              { label: "Floor Location", val: store.floor_location || "Not set" },
              { label: "Description",    val: store.description || "Not set" },
              { label: "Status",         val: store.is_active ? "Active" : "Inactive" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.gray }}>{item.label}</span>
                <span style={{ color: C.dark, fontWeight: 500, maxWidth: "55%", textAlign: "right" }}>{item.val}</span>
              </div>
            ))}
            <button style={{ marginTop: 20, width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Edit Store Details
            </button>
            <button style={{ marginTop: 10, width: "100%", background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Delete Store
            </button>
          </div>
        )}
      </div>

      {showModal && <AddProductModal storeId={storeId} onClose={() => setShowModal(false)} onAdded={loadData} />}
    </div>
  );
}
