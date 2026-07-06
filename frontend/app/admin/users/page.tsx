"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import AdminNav from "@/components/admin/AdminNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AdminUser {
  id:          string;
  full_name:   string;
  email:       string;
  role:        string;
  plan:        string;
  avatar_url?: string;
  created_at:  string;
}

const ROLE_CFG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  buyer:  { color: "#3B82F6", bg: "#0F1E3A", label: "Buyer",  icon: "🛒" },
  vendor: { color: "#10B981", bg: "#0A2A1A", label: "Vendor", icon: "🏪" },
  admin:  { color: "#F59E0B", bg: "#2D1E00", label: "Admin",  icon: "⚡" },
};

const ROLES = ["all", "buyer", "vendor", "admin"];

export default function AdminUsersPage() {
  const router = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();
  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busy,       setBusy]       = useState<string | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || profile?.role !== "admin")) router.push("/");
  }, [authLoading, isLoggedIn, profile, router]);

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token  = await getToken();
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (search)              params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
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

  const changeRole = async (id: string, role: string) => {
    if (id === profile?.id) { alert("You cannot change your own role."); return; }
    setBusy(id);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      else alert(data.message || "Could not update role.");
    } catch { alert("Network error — role not updated."); }
    finally { setBusy(null); }
  };

  const removeUser = async (id: string, name: string) => {
    if (id === profile?.id) { alert("You cannot delete your own account."); return; }
    if (!confirm(`Delete "${name}"? This removes the user and cannot be undone.`)) return;
    setBusy(id);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/admin/users/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setUsers(prev => prev.filter(u => u.id !== id)); setTotal(t => t - 1); }
      else alert(data.message || "Could not delete user.");
    } catch { alert("Network error — user not deleted."); }
    finally { setBusy(null); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  if (authLoading) {
    return (
      <div style={{ background: "#111", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#aaa" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>👥 Users</div>
          <div style={{ fontSize: 11, color: "#888" }}>{total} registered</div>
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "#333", color: "#aaa", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
          ← Back to App
        </button>
      </div>

      <AdminNav active="/admin/users" />

      <div style={{ padding: "16px" }}>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          style={{ width: "100%", boxSizing: "border-box", background: "#1D1D1D", border: "1px solid #333", borderRadius: 12, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", marginBottom: 10 }}
        />

        {/* Role filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
          {ROLES.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{ flex: "none", background: roleFilter === r ? C.primary : "#1D1D1D", color: roleFilter === r ? "#fff" : "#888", border: "1px solid #333", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: roleFilter === r ? 700 : 400, cursor: "pointer", textTransform: "capitalize" }}>
              {r}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 13, color: "#888" }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 13, color: "#888" }}>No users found.</div>
        ) : (
          users.map(u => {
            const cfg    = ROLE_CFG[u.role] || ROLE_CFG.buyer;
            const isMe   = u.id === profile?.id;
            const isOpen = expanded === u.id;
            return (
              <div key={u.id} style={{ background: "#1D1D1D", border: "1px solid #333", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
                <div onClick={() => setExpanded(isOpen ? null : u.id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, #FF8C61)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (u.full_name?.charAt(0)?.toUpperCase() || "U")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.full_name || "Unnamed"}{isMe && <span style={{ fontSize: 10, color: "#888" }}> (you)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #333" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
                      Joined {fmtDate(u.created_at)} · Plan: <span style={{ color: "#aaa", textTransform: "capitalize" }}>{u.plan || "free"}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 6 }}>Change role</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                      {["buyer", "vendor", "admin"].map(r => (
                        <button key={r} disabled={busy === u.id || isMe || u.role === r}
                          onClick={() => changeRole(u.id, r)}
                          style={{ flex: 1, background: u.role === r ? ROLE_CFG[r].bg : "#111", color: u.role === r ? ROLE_CFG[r].color : "#888", border: `1px solid ${u.role === r ? ROLE_CFG[r].color : "#333"}`, borderRadius: 10, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: isMe || u.role === r ? "default" : "pointer", opacity: busy === u.id ? 0.5 : 1, textTransform: "capitalize" }}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <button disabled={busy === u.id || isMe}
                      onClick={() => removeUser(u.id, u.full_name || u.email)}
                      style={{ width: "100%", background: "#2A0A0A", color: "#EF4444", border: "1px solid #4A1515", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: isMe ? "default" : "pointer", opacity: busy === u.id || isMe ? 0.5 : 1 }}>
                      {busy === u.id ? "Working…" : "🗑 Delete user"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}