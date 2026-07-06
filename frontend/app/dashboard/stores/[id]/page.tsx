"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { storesApi, productsApi, ordersApi, type Store, type Product, type Order } from "@/utils/api";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const BANK = {
  account_name:   "Maizu Business Hub (Pty) Ltd",
  account_number: "62812345678",
  branch_code:    "250655",
  bank:           "FNB",
};

/* â”€â”€ BOOST PLAN CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const BoostPlanCard = ({
  plan, selected, onSelect,
}: {
  planKey:  string;
  plan:     { name: string; price: number; duration: number; description: string; features: string[]; color: string; emoji: string; popular?: boolean };
  selected: boolean;
  onSelect: () => void;
}) => (
  <div
    onClick={onSelect}
    style={{ background: selected ? plan.color + "10" : C.white, borderRadius: 14, padding: "14px", border: `2px solid ${selected ? plan.color : C.border}`, cursor: "pointer", transition: "all 0.2s", position: "relative" }}
  >
    {plan.popular && (
      <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", borderRadius: 20, padding: "2px 12px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
        Most Popular
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 22 }}>{plan.emoji}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: plan.color }}>{plan.name}</div>
        <div style={{ fontSize: 11, color: C.gray }}>{plan.description}</div>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>R{plan.price}</div>
        <div style={{ fontSize: 10, color: C.gray }}>{plan.duration} days</div>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {plan.features.map(f => (
        <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.dark }}>
          <span style={{ color: plan.color, fontWeight: 700 }}>âœ“</span> {f}
        </div>
      ))}
    </div>
    {selected && (
      <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: plan.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>âœ“</span>
      </div>
    )}
  </div>
);

/* â”€â”€ STATUS CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STATUS_CFG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending:   { color: "#D97706", bg: "#FEF3C7", icon: "â³", label: "Pending"   },
  confirmed: { color: "#2563EB", bg: "#DBEAFE", icon: "âœ…", label: "Confirmed" },
  shipped:   { color: "#7C3AED", bg: "#EDE9FE", icon: "ðŸšš", label: "Shipped"   },
  delivered: { color: "#059669", bg: "#D1FAE5", icon: "ðŸŽ‰", label: "Delivered" },
  cancelled: { color: "#DC2626", bg: "#FEE2E2", icon: "âŒ", label: "Cancelled" },
};

const NEXT_STATUS: Record<string, Order["status"]> = {
  pending:   "confirmed",
  confirmed: "shipped",
  shipped:   "delivered",
};

/* â”€â”€ ORDER CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const OrderCard = ({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: Order["status"]) => Promise<void> }) => {
  const [busy, setBusy] = useState(false);
  const cfg             = STATUS_CFG[order.status] || STATUS_CFG.pending;
  const nextStatus      = NEXT_STATUS[order.status];

  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
          <div style={{ fontSize: 11, color: C.gray }}>{new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
        <div style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{cfg.icon} {cfg.label}</div>
      </div>
      {order.buyer_name && <div style={{ fontSize: 12, color: C.gray, marginBottom: 6 }}>ðŸ‘¤ {order.buyer_name}</div>}
      <div style={{ fontSize: 12, color: C.gray, marginBottom: 10, lineHeight: 1.5 }}>ðŸ“ {order.delivery_address}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: C.gray }}>Total</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.primary }}>R{Number(order.total_amount).toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {nextStatus && order.status !== "cancelled" && (
          <button onClick={async () => { setBusy(true); try { await onUpdateStatus(order.id, nextStatus); } finally { setBusy(false); } }} disabled={busy}
            style={{ flex: 2, background: busy ? "#F3F4F6" : cfg.color, color: busy ? C.gray : "#fff", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
            {busy ? "â€¦" : `Mark ${STATUS_CFG[nextStatus].label} ${STATUS_CFG[nextStatus].icon}`}
          </button>
        )}
        {(order.status === "pending" || order.status === "confirmed") && (
          <button onClick={() => onUpdateStatus(order.id, "cancelled")} style={{ flex: 1, background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        )}
      </div>
    </div>
  );
};

/* â”€â”€ PRODUCT CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ProductCard = ({ product, onDelete }: { product: Product; onDelete: (id: string) => void }) => (
  <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
    <div style={{ height: 100, background: "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
      {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "ðŸ“¦"}
    </div>
    <div style={{ padding: "10px 10px 12px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginBottom: 4 }}>R{Number(product.price).toFixed(2)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.gray, marginBottom: 8 }}>
        <span>Stock: {product.stock_quantity}</span><span>ðŸ‘ {product.view_count}</span>
      </div>
      <button onClick={() => onDelete(product.id)} style={{ width: "100%", background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 8, padding: "5px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Remove</button>
    </div>
  </div>
);

/* â”€â”€ ADD PRODUCT MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const AddProductModal = ({ storeId, onClose, onAdded }: { storeId: string; onClose: () => void; onAdded: () => void }) => {
  const [form, setForm]     = useState({ name: "", description: "", price: "", category: "", stock_quantity: "1" });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");
  const fileRef             = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
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
      fd.append("store_id", storeId); fd.append("name", form.name.trim());
      fd.append("description", form.description); fd.append("price", form.price);
      fd.append("category", form.category); fd.append("stock_quantity", form.stock_quantity);
      images.forEach(img => fd.append("images", img));
      await productsApi.create(fd);
      onAdded(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed."); setBusy(false); }
  };

  const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>Add Product</div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer" }}>âœ•</button>
        </div>
        {error && <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Product Name *</label><input value={form.name} onChange={set("name")} placeholder="e.g. Ankara Wrap Dress" style={inp} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Price (R) *</label><input value={form.price} onChange={set("price")} type="number" placeholder="0.00" style={inp} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Stock</label><input value={form.stock_quantity} onChange={set("stock_quantity")} type="number" style={inp} /></div>
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Category</label>
            <select value={form.category} onChange={set("category")} style={inp}>
              <option value="">Selectâ€¦</option>
              {["Fashion","Electronics","Beauty","Food","Home","Sports","Art & Crafts","Other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Description</label><textarea value={form.description} onChange={set("description") as React.ChangeEventHandler<HTMLTextAreaElement>} rows={3} style={{ ...inp, resize: "none" }} /></div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Images (max 5)</label>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {previews.map((p, i) => <div key={i} style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden" }}><img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
              {previews.length < 5 && <div onClick={() => fileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 10, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 22, color: C.grayLight }}>+</div>}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={busy} style={{ background: busy ? C.grayLight : C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
            {busy ? "Addingâ€¦" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STORE MANAGEMENT PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function StoreManagePage() {
  const router  = useRouter();
  const params  = useParams();
  const storeId = params.id as string;
  const { isLoggedIn, loading } = useAuth();

  const [store,         setStore]         = useState<Store | null>(null);
  const [products,      setProducts]      = useState<Product[]>([]);
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [activeTab,     setActiveTab]     = useState<"products" | "orders" | "boost" | "settings">("products");
  const [showModal,     setShowModal]     = useState(false);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");

  /* Boost state */
  const [boostPlans,    setBoostPlans]    = useState<Record<string, any>>({});
  const [selectedBoost, setSelectedBoost] = useState("growth");
  const [activeBoost,   setActiveBoost]   = useState<any>(null);
  const [boostRef,      setBoostRef]      = useState("");
  const [boosting,      setBoosting]      = useState(false);
  const [boostSuccess,  setBoostSuccess]  = useState(false);
  const [boostError,    setBoostError]    = useState("");

  useEffect(() => { if (!loading && !isLoggedIn) router.push("/login"); }, [loading, isLoggedIn, router]);

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const loadData = useCallback(async () => {
    setPageLoading(true);
    try {
      const [storeData, productsData] = await Promise.all([
        storesApi.getOne(storeId),
        productsApi.getAll({ store_id: storeId }),
      ]);
      setStore(storeData);
      setProducts(productsData);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to load."); }
    finally { setPageLoading(false); }
  }, [storeId]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try { setOrders(await ordersApi.getStoreOrders(storeId)); }
    catch { /* silent */ }
    finally { setOrdersLoading(false); }
  }, [storeId]);

  const loadBoostData = useCallback(async () => {
    try {
      const [plansRes, myBoostsRes] = await Promise.all([
        fetch(`${BASE}/api/featured/plans`),
        fetch(`${BASE}/api/featured/my`, { headers: { Authorization: `Bearer ${await getToken()}` } }),
      ]);
      const plansData    = await plansRes.json();
      const myBoostsData = await myBoostsRes.json();
      if (plansData.success)    setBoostPlans(plansData.plans);
      if (myBoostsData.success) {
        const current = myBoostsData.boosts.find((b: any) => b.store_id === storeId && b.status === "active" && new Date(b.expires_at) > new Date());
        setActiveBoost(current || null);
      }
    } catch { /* silent */ }
  }, [storeId]);

  useEffect(() => { if (storeId) { loadData(); } }, [loadData, storeId]);
  useEffect(() => { if (activeTab === "orders") loadOrders(); }, [activeTab, loadOrders]);
  useEffect(() => { if (activeTab === "boost") loadBoostData(); }, [activeTab, loadBoostData]);

  const handleUpdateStatus = async (orderId: string, status: Order["status"]) => {
    await ordersApi.updateStatus(orderId, status);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Remove this product?")) return;
    try { await productsApi.delete(productId); setProducts(prev => prev.filter(p => p.id !== productId)); }
    catch { alert("Failed to delete."); }
  };

  const handleBoost = async () => {
    setBoosting(true); setBoostError(""); setBoostSuccess(false);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/featured/boost`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ store_id: storeId, plan: selectedBoost, payment_ref: boostRef }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setBoostSuccess(true);
      await loadBoostData();
    } catch (err: unknown) { setBoostError(err instanceof Error ? err.message : "Boost failed."); }
    finally { setBoosting(false); }
  };

  const orderStats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === "pending").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    revenue:   orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
  };

  const filteredOrders = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);

  if (loading || pageLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}><div style={{ fontSize: 13, color: C.gray }}>Loading storeâ€¦</div></div>;
  }

  if (error || !store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20, gap: 16 }}>
        <div style={{ fontSize: 36 }}>âš ï¸</div>
        <div style={{ fontSize: 14, color: C.dark }}>{error || "Store not found."}</div>
        <button onClick={() => router.push("/dashboard")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back</button>
      </div>
    );
  }

  const tabs = [
    { id: "products", label: `ðŸ“¦ Products` },
    { id: "orders",   label: `ðŸ“‹ Orders${orders.length > 0 ? ` (${orders.length})` : ""}` },
    { id: "boost",    label: "ðŸš€ Boost" },
    { id: "settings", label: "âš™ï¸ Settings" },
  ] as const;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      <Header />

      {/* Store header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ height: 110, background: store.banner_url ? "transparent" : `linear-gradient(135deg,${C.primary}30,${C.primary}50)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {store.banner_url ? <img src={store.banner_url} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: 48 }}>ðŸª</div>}
          <button onClick={() => router.push("/dashboard")} style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 22, padding: "5px 12px", color: "#fff", fontSize: 13, cursor: "pointer" }}>â€¹ Dashboard</button>
          {activeBoost && <div style={{ position: "absolute", top: 10, right: 10, background: "#FF6B35", color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700 }}>ðŸ”¥ BOOSTED</div>}
        </div>
        <div style={{ padding: "0 16px 16px", display: "flex", alignItems: "flex-end", gap: 12, marginTop: -26 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: store.logo_url ? "transparent" : C.softOrange, border: `3px solid ${C.white}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {store.logo_url ? <img src={store.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "ðŸª"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>{store.name}</div>
            <div style={{ fontSize: 11, color: C.gray }}>{store.category} Â· {store.follower_count} followers</div>
          </div>
          <div style={{ background: store.is_active ? "#E1F5EE" : "#F3F4F6", color: store.is_active ? "#085041" : C.gray, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
            {store.is_active ? "Active" : "Inactive"}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${C.border}` }}>
          {[["ðŸ“¦", store.product_count, "Products"], ["ðŸ‘¥", store.follower_count, "Followers"], ["â­", Number(store.rating).toFixed(1), "Rating"]].map(([e, v, l]) => (
            <div key={l as string} style={{ padding: "12px 0", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{e}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{v}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, display: "flex", borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{ flex: "none", background: "none", border: "none", padding: "12px 14px", fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? C.primary : C.gray, cursor: "pointer", borderBottom: activeTab === tab.id ? `2.5px solid ${C.primary}` : "2.5px solid transparent", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>

        {/* â•â• PRODUCTS TAB â•â• */}
        {activeTab === "products" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>Products ({products.length})</div>
              <button onClick={() => setShowModal(true)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Product</button>
            </div>
            {products.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 16, padding: "36px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>ðŸ“¦</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 6 }}>No products yet</div>
                <button onClick={() => setShowModal(true)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 22, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add First Product</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {products.map(p => <ProductCard key={p.id} product={p} onDelete={handleDeleteProduct} />)}
              </div>
            )}
          </>
        )}

        {/* â•â• ORDERS TAB â•â• */}
        {activeTab === "orders" && (
          <>
            {!ordersLoading && orders.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Total Orders", val: orderStats.total,                          emoji: "ðŸ“‹", color: C.primary },
                  { label: "Revenue",      val: `R${orderStats.revenue.toFixed(2)}`,       emoji: "ðŸ’°", color: "#059669" },
                  { label: "Pending",      val: orderStats.pending,                         emoji: "â³", color: "#D97706" },
                  { label: "Delivered",    val: orderStats.delivered,                       emoji: "ðŸŽ‰", color: "#059669" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.emoji}</div>
                    <div><div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{s.val}</div><div style={{ fontSize: 10, color: C.gray }}>{s.label}</div></div>
                  </div>
                ))}
              </div>
            )}
            {!ordersLoading && orders.length > 0 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14 }}>
                {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => {
                  const count = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
                  if (s !== "all" && count === 0) return null;
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      style={{ background: filterStatus === s ? C.primary : C.white, color: filterStatus === s ? "#fff" : C.dark, border: filterStatus === s ? "none" : `1.5px solid ${C.border}`, borderRadius: 22, padding: "6px 12px", fontSize: 11, fontWeight: filterStatus === s ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {s === "all" ? "All" : STATUS_CFG[s]?.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}
            {ordersLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: 13 }}>Loading ordersâ€¦</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 16, padding: "36px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>ðŸ“‹</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{filterStatus === "all" ? "No orders yet" : `No ${filterStatus} orders`}</div>
              </div>
            ) : (
              filteredOrders.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} />)
            )}
          </>
        )}

        {/* â•â• BOOST TAB â•â• */}
        {activeTab === "boost" && (
          <div>
            {/* Active boost banner */}
            {activeBoost && (
              <div style={{ background: "linear-gradient(135deg,#FF6B35,#E8401C)", borderRadius: 16, padding: "16px", marginBottom: 16, color: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>ðŸ”¥</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>Store is currently BOOSTED!</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{activeBoost.plan.charAt(0).toUpperCase() + activeBoost.plan.slice(1)} plan</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, opacity: 0.9, marginBottom: 10 }}>
                  <span>ðŸ‘ {activeBoost.impressions} views</span>
                  <span>ðŸ–±ï¸ {activeBoost.clicks} clicks</span>
                  <span>â° Expires {new Date(activeBoost.expires_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
                </div>
                <button onClick={() => {/* extend â€” goes to plan selection below */}} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Extend Boost â†“
                </button>
              </div>
            )}

            {/* What boosting does */}
            {!activeBoost && (
              <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 12 }}>ðŸš€ Boost Your Store</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { emoji: "ðŸ ", text: "Featured on the home page â€” seen by every visitor" },
                    { emoji: "ðŸ”", text: "Top of search results and store directory" },
                    { emoji: "ðŸ”¥", text: "Trending badge on your store and products" },
                    { emoji: "ðŸ“Š", text: "See impressions and click stats in real time" },
                  ].map(item => (
                    <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.dark }}>
                      <span style={{ fontSize: 18 }}>{item.emoji}</span>{item.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan selector */}
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12 }}>
              {activeBoost ? "Extend or upgrade your boost" : "Choose a boost plan"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {Object.entries(boostPlans).map(([key, plan]: [string, any]) => (
                <BoostPlanCard key={key} planKey={key} plan={plan} selected={selectedBoost === key} onSelect={() => setSelectedBoost(key)} />
              ))}
            </div>

            {/* Payment */}
            {Object.keys(boostPlans).length > 0 && (
              <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>ðŸ¦ Pay via EFT Bank Transfer</div>

                {/* Bank details */}
                <div style={{ background: "#F0F9FF", borderRadius: 12, padding: "12px", marginBottom: 12 }}>
                  {[
                    { label: "Account Name",   value: BANK.account_name },
                    { label: "Account Number", value: BANK.account_number },
                    { label: "Branch Code",    value: BANK.branch_code },
                    { label: "Bank",           value: BANK.bank },
                    { label: "Amount",         value: `R${boostPlans[selectedBoost]?.price || "â€”"}` },
                    { label: "Reference",      value: `BOOST-${storeId.slice(0, 8).toUpperCase()}` },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #DBEAFE" }}>
                      <span style={{ color: "#64748B" }}>{row.label}</span>
                      <span style={{ color: "#0C447C", fontWeight: 700, fontFamily: (row.label === "Account Number" || row.label === "Branch Code" || row.label === "Reference") ? "monospace" : "inherit" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Payment ref input */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5 }}>Your payment reference / proof</label>
                  <input value={boostRef} onChange={e => setBoostRef(e.target.value)} placeholder="e.g. FNB transaction ID or ref number"
                    style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, fontSize: 13, outline: "none", color: C.dark, boxSizing: "border-box", background: "#FAFAFA" }} />
                </div>

                {boostError && <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#991B1B" }}>{boostError}</div>}

                {boostSuccess && (
                  <div style={{ background: "#D1FAE5", borderRadius: 12, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: "#065F46", fontWeight: 600, textAlign: "center" }}>
                    ðŸŽ‰ Boost activated! Your store is now featured.
                  </div>
                )}

                <button onClick={handleBoost} disabled={boosting}
                  style={{ width: "100%", background: boosting ? C.grayLight : "#FF6B35", color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: boosting ? "default" : "pointer", marginBottom: 10 }}>
                  {boosting ? "Activatingâ€¦" : `ðŸš€ Boost Store â€” R${boostPlans[selectedBoost]?.price || "â€”"}`}
                </button>

                <button
                  onClick={() => {
                    const plan = boostPlans[selectedBoost];
                    const msg  = encodeURIComponent(`Hi Maizu! I'd like to boost my store.\n\n*Store:* ${store.name}\n*Plan:* ${plan?.name} (R${plan?.price})\n*Reference:* BOOST-${storeId.slice(0, 8).toUpperCase()}\n*Payment ref:* ${boostRef || "will send shortly"}\n\nPlease activate my boost! ðŸš€`);
                    window.open(`https://wa.me/?text=${msg}`, "_blank");
                  }}
                  style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 14, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  ðŸ’¬ Send Payment via WhatsApp instead
                </button>
              </div>
            )}

            {/* ROI calculator */}
            <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>ðŸ’¡ Is it worth it?</div>
              <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.7 }}>
                If boosting gets you just <strong style={{ color: C.dark }}>2 extra sales</strong> of R300 each = <strong style={{ color: "#059669" }}>R600 revenue</strong>.
                {selectedBoost && boostPlans[selectedBoost] && (
                  <span> The {boostPlans[selectedBoost].name} costs <strong style={{ color: C.primary }}>R{boostPlans[selectedBoost].price}</strong> â€” that&apos;s a <strong style={{ color: "#059669" }}>R{600 - boostPlans[selectedBoost].price} profit</strong> just from 2 sales.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* â•â• SETTINGS TAB â•â• */}
        {activeTab === "settings" && (
          <div style={{ background: C.white, borderRadius: 16, padding: "20px 16px" }}>
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
            <button style={{ marginTop: 20, width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Edit Store Details</button>
            <button style={{ marginTop: 10, width: "100%", background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Delete Store</button>
          </div>
        )}
      </div>

      {showModal && <AddProductModal storeId={storeId} onClose={() => setShowModal(false)} onAdded={loadData} />}
    </div>
  );
}


