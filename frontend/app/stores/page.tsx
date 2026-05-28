"use client";
import React, { useState, useEffect, useCallback } from "react";
import { C } from "@/utils/constants";
import { SearchIc, StarIc, PeopleIc, TrendIc, ImgIc } from "@/components/ui/icons";
import Header from "@/components/layout/Header";
import Footer from "@/components/ui/Footer";
import BottomNav from "@/components/navigation/BottomNav";
import { storesApi, type Store } from "@/utils/api";

const CATS = ["All", "Fashion", "Electronics", "Beauty", "Food", "Home", "Sports", "Services"];

/* ── Skeleton loader ────────────────────────────────────────── */
const SkeletonCard = () => (
  <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
    <div style={{ height: 84, background: "#F0F0F0", animation: "pulse 1.5s ease-in-out infinite" }} />
    <div style={{ padding: "9px 10px 11px" }}>
      <div style={{ height: 12, background: "#F0F0F0", borderRadius: 4, marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 10, background: "#F0F0F0", borderRadius: 4, width: "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  </div>
);

/* ── Store card ─────────────────────────────────────────────── */
const StoreCard = ({ store }: { store: Store }) => (
  <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", cursor: "pointer", position: "relative" }}>
    {/* Image / Logo */}
    <div style={{ height: 84, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {store.logo_url ? (
        <img src={store.logo_url} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <ImgIc />
      )}
      {store.is_trending && (
        <div style={{ position: "absolute", top: 5, left: 5, background: C.trendOrng, color: "#fff", borderRadius: 8, padding: "2px 7px", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
          <TrendIc sz={9} /> Trending
        </div>
      )}
    </div>

    {/* Info */}
    <div style={{ padding: "9px 10px 11px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</div>
      <div style={{ fontSize: 10, color: C.gray, marginBottom: 6 }}>{store.category}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 5 }}>
        <StarIc />
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dark }}>{store.rating ? Number(store.rating).toFixed(1) : "—"}</span>
        {store.total_reviews > 0 && <span style={{ fontSize: 9, color: C.gray }}>({store.total_reviews})</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: C.gray }}>
        <PeopleIc sz={11} />{store.follower_count?.toLocaleString() || 0}
      </div>
    </div>
  </div>
);

/* ── Page ───────────────────────────────────────────────────── */
export default function StoresPage() {
  const [cat,     setCat]     = useState("All");
  const [q,       setQ]       = useState("");
  const [stores,  setStores]  = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await storesApi.getAll({ category: cat, search: q });
      setStores(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load stores.");
    } finally {
      setLoading(false);
    }
  }, [cat, q]);

  // Debounce search — only fire after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => { fetchStores(); }, q ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchStores, q]);

  return (
    <div className="page-enter" style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <Header />

      <div style={{ background: C.white, padding: "20px 16px 0" }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.dark, marginBottom: 3 }}>Store Directory</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>Discover stores across all categories</div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <SearchIc col="#9CA3AF" sz={16} />
          </div>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search stores..."
            style={{ width: "100%", padding: "11px 12px 11px 36px", border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 13, outline: "none", background: "#FAFAFA", color: C.dark, boxSizing: "border-box" }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? C.primary : C.white, color: cat === c ? "#fff" : C.dark, border: cat === c ? "none" : `1.5px solid ${C.border}`, borderRadius: 22, padding: "7px 17px", fontSize: 13, fontWeight: cat === c ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        {/* Count */}
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 12 }}>
          {loading ? "Loading…" : `Showing ${stores.length} store${stores.length !== 1 ? "s" : ""}`}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B", textAlign: "center" }}>
            {error}
            <button onClick={fetchStores} style={{ display: "block", margin: "8px auto 0", background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : stores.length > 0
              ? stores.map(st => <StoreCard key={st.id} store={st} />)
              : !error && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: C.gray }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No stores found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try a different category or search term</div>
                </div>
              )
          }
        </div>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
