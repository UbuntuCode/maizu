"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { AdminNav } from "../page";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  id:         string;
  full_name:  string;
  email:      string;
  role:       string;
  plan:       string;
  created_at: string;
  avatar_url?: string;
}

const ROLE_CFG: Record<string, { color: string; bg: string }> = {
  admin:  { color: "#7C3AED", bg: "#EDE9FE" },
  vendor: { color: "#D97706", bg: "#FEF3C7" },
  buyer:  { color: "#059669", bg: "#D1FAE5" },
};

const PLAN_CFG: Record<string, { color: string; bg: string }> = {
  pro:   { color: "#E8401C", bg: "#FFF3EE" },
  basic: { color: "#2563EB", bg: "#DBEAFE" },
  free:  { color: "#6B7280", bg: "#F3F4F6" },
};

export default function AdminUsersPage() {
  const router  = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();
  const [users,      setUsers]      = useState<User[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [busy,       setBusy]       = useState(false);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || profile?.role !== "admin")) router.push("/");
  }, [authLoading, isLoggedIn, profile, router]);

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token  = await getToken();
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (search)                 params.set("search", search);
      if (roleFilter !== "all")   params.set("role",   roleFilter);
      const res  = await fetch(`${BASE}/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setUsers(data.users); setTotal(data.total); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => {
    if (isLoggedIn && profile?.role === "admin") {
      const t = setTimeout(loadUsers, 300);
      return () => clearTimeout(t);
    }
  }, [loadUsers, isLoggedIn, profile]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setBusy(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/users/${userId}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setActionUser(null);
      }
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user and all their data?")) return;
    setBusy(true);
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/admin/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.filter(u => u.id !== userId));
      setActionUser(null);
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>⚡ Maizu Admin</div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "#333", color: "#aaa", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>← Back to App</button>
      </div>
      <AdminNav active="/admin/users" />

      <div style={{ padding: "16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>👥 Users ({total})</div>
          <div style={{ fontSize: 12, color: "#888" }}>Manage roles, plans and accounts</div>
        </div>

        {/* Search + filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
              style={{ width: "100%", padding: "10px 12px 10px 34px", background: "#1E1E1E", border: "1px solid #333", borderRadius: 10, fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box" }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ background: "#1E1E1E", border: "1px solid #333", borderRadius: 10, padding: "0 10px", color: "#fff", fontSize: 12, cursor: "pointer" }}>
            <option value="all">All roles</option>
            <option value="buyer">Buyer</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* User cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ background: "#1E1E1E", borderRadius: 16, padding: "36px 20px", textAlign: "center", color: "#888" }}>No users found</div>
        ) : (
          users.map(user => {
            const roleCfg = ROLE_CFG[user.role] || ROLE_CFG.buyer;
            const planCfg = PLAN_CFG[user.plan || "free"] || PLAN_CFG.free;
            return (
              <div key={user.id} style={{ background: "#1E1E1E", borderRadius: 14, padding: "14px", marginBottom: 10, border: "1px solid #2A2A2A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${C.primary},#FF8C61)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                    {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.full_name || "No name"}</div>
                    <div style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <span style={{ background: roleCfg.bg, color: roleCfg.color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{user.role}</span>
                    <span style={{ background: planCfg.bg, color: planCfg.color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{user.plan || "free"}</span>
                  </div>
                </div>

                <div style={{ fontSize: 10, color: "#666", marginBottom: 10 }}>
                  Joined {new Date(user.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["buyer", "vendor", "admin"].map(r => (
                    <button key={r} onClick={() => handleRoleChange(user.id, r)} disabled={busy || user.role === r}
                      style={{ background: user.role === r ? ROLE_CFG[r].bg : "#2A2A2A", color: user.role === r ? ROLE_CFG[r].color : "#888", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 10, fontWeight: user.role === r ? 700 : 500, cursor: user.role === r ? "default" : "pointer" }}>
                      {user.role === r ? `✓ ${r}` : `Set ${r}`}
                    </button>
                  ))}
                  <button onClick={() => handleDelete(user.id)} disabled={busy}
                    style={{ background: "#3A1A1A", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
