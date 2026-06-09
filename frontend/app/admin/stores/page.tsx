"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { AdminNav } from "../page";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Store {
  id:            string;
  name:          string;
  category:      string;
  owner_name:    string;
  owner_email:   string;
  logo_url?:     string;
  is_active:     boolean;
  is_trending:   boolean;
  product_count: number;
  follower_count:number;
  rating:        number;
  total_reviews: number;
  plan:          string;
  created_at:    string;
}

export default function AdminStoresPage() {
  const router  = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();
  const [stores,  setStores]  = useState<Store[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [busy,    setBusy]    = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || profile?.role !== "admin")) router.push("/");
  }, [authLoading, isLoggedIn, profile, router]);

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const token  = await getToken();
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (search) params.set("search", search);
      const res  = await fetch(`${BASE}/api/admin/stores?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setStores(data.stores); setTotal(data.total); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    if (isLoggedIn && profile?.role === "admin") {
      const t = setTimeout(loadStores, 300);
      return () => clearTimeout(t);
    }
  }, [loadStores, isLoggedIn, profile]);

  const toggleActive = async (id: string) => {
    setBusy(id + "active");
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/stores/${id}/toggle-active`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setStores(prev => prev.map(s => s.id === id ? { ...s, is_active: data.store.is_active } : s));
    } catch { /* silent */ }
    finally { setBusy(null); }
  };

  const toggleTrending = async (id: string) => {
    setBusy(id + "trend");
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/stores/${id}/toggle-trending`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setStores(prev => prev.map(s => s.id === id ? { ...s, is_trending: data.store.is_trending } : s));
    } catch { /* silent */ }
    finally { setBusy(null); }
  };

  const deleteStore = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its products? This cannot be undone.`)) return;
    setBusy(id + "del");
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/admin/stores/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setStores(prev => prev.filter(s => s.id !== id));
    } catch { /* silent */ }
    finally { setBusy(null); }
  };

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>⚡ Maizu Admin</div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "#333", color: "#aaa", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>← Back to App</button>
      </div>
      <AdminNav active="/admin/stores" />

      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>🏪 Stores ({total})</div>
          <div style={{ fontSize: 12, color: "#888" }}>Activate, feature, or remove stores</div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores or owners…"
            style={{ width: "100%", padding: "10px 12px 10px 34px", background: "#1E1E1E", border: "1px solid #333", borderRadius: 10, fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>Loading stores…</div>
        ) : stores.length === 0 ? (
          <div style={{ background: "#1E1E1E", borderRadius: 16, padding: "36px 20px", textAlign: "center", color: "#888" }}>No stores found</div>
        ) : (
          stores.map(store => (
            <div key={store.id} style={{ background: "#1E1E1E", borderRadius: 14, padding: "14px", marginBottom: 10, border: "1px solid #2A2A2A" }}>
              {/* Store info row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#2A2A2A", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {store.logo_url ? <img src={store.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                    {store.name}
                    {store.is_trending && <span style={{ fontSize: 10, background: "#FF6B35", color: "#fff", borderRadius: 20, padding: "1px 7px" }}>🔥 Trending</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>{store.category} · By {store.owner_name}</div>
                </div>
                <div style={{ background: store.is_active ? "#1A3A1A" : "#3A1A1A", color: store.is_active ? "#4ADE80" : "#EF4444", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  {store.is_active ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Products",  val: store.product_count  },
                  { label: "Followers", val: store.follower_count },
                  { label: "Rating",    val: Number(store.rating).toFixed(1) },
                  { label: "Reviews",   val: store.total_reviews  },
                ].map(s => (
                  <div key={s.label} style={{ background: "#111", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#666" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => toggleActive(store.id)} disabled={busy === store.id + "active"}
                  style={{ flex: 1, background: store.is_active ? "#3A1A1A" : "#1A3A1A", color: store.is_active ? "#EF4444" : "#4ADE80", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {busy === store.id + "active" ? "…" : store.is_active ? "⏸ Deactivate" : "▶ Activate"}
                </button>
                <button onClick={() => toggleTrending(store.id)} disabled={busy === store.id + "trend"}
                  style={{ flex: 1, background: store.is_trending ? "#2D1E00" : "#1A1A2E", color: store.is_trending ? "#F59E0B" : "#818CF8", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {busy === store.id + "trend" ? "…" : store.is_trending ? "🔥 Un-trend" : "🔥 Set Trending"}
                </button>
                <button onClick={() => router.push(`/stores/${store.id}`)}
                  style={{ background: "#2A2A2A", color: "#aaa", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 11, cursor: "pointer" }}>
                  👁 View
                </button>
                <button onClick={() => deleteStore(store.id, store.name)} disabled={busy === store.id + "del"}
                  style={{ background: "#3A1A1A", color: "#EF4444", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 11, cursor: "pointer" }}>
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
