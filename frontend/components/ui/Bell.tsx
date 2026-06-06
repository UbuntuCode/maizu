"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Notification {
  id:         string;
  type:       string;
  title:      string;
  body?:      string;
  data?:      Record<string, string>;
  is_read:    boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  order_placed:    { emoji: "🎉", color: "#059669", bg: "#D1FAE5" },
  new_order:       { emoji: "📦", color: "#2563EB", bg: "#DBEAFE" },
  order_confirmed: { emoji: "✅", color: "#2563EB", bg: "#DBEAFE" },
  order_shipped:   { emoji: "🚚", color: "#7C3AED", bg: "#EDE9FE" },
  order_delivered: { emoji: "🎉", color: "#059669", bg: "#D1FAE5" },
  order_cancelled: { emoji: "❌", color: "#DC2626", bg: "#FEE2E2" },
  default:         { emoji: "🔔", color: C.primary, bg: "#FFF3EE" },
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function Bell() {
  const router              = useRouter();
  const { isLoggedIn }      = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread,        setUnread]        = useState(0);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const panelRef                          = useRef<HTMLDivElement>(null);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data  = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnread(data.unread_count);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  /* Load on mount + poll every 30s */
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  /* Close panel when clicking outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open) fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.is_read) await markAsRead(notif.id);
    if (notif.data?.order_id) {
      router.push(`/orders/${notif.data.order_id}`);
      setOpen(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={open ? C.primary : C.dark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {/* Unread badge */}
        {unread > 0 && (
          <span style={{ position: "absolute", top: -3, right: -3, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 17, height: 17, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, border: "2px solid #fff" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:  "absolute",
          top:       "calc(100% + 10px)",
          right:     -16,
          width:     340,
          maxWidth:  "calc(100vw - 32px)",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          zIndex:    999,
          overflow:  "hidden",
          border:    `1px solid ${C.border}`,
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>
              Notifications {unread > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444" }}>({unread} new)</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ background: "none", border: "none", fontSize: 11, color: C.primary, fontWeight: 600, cursor: "pointer" }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => { router.push("/notifications"); setOpen(false); }} style={{ background: "none", border: "none", fontSize: 11, color: C.gray, cursor: "pointer" }}>
                See all →
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: C.gray, fontSize: 13 }}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 4 }}>All caught up!</div>
                <div style={{ fontSize: 12, color: C.gray }}>No notifications yet</div>
              </div>
            ) : (
              notifications.slice(0, 10).map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    style={{
                      display:    "flex",
                      gap:        10,
                      padding:    "12px 16px",
                      cursor:     "pointer",
                      background: notif.is_read ? "transparent" : "#FAFBFF",
                      borderBottom: `1px solid ${C.border}`,
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Icon */}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {cfg.emoji}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: notif.is_read ? 500 : 700, color: C.dark, lineHeight: 1.3 }}>
                          {notif.title}
                        </div>
                        {!notif.is_read && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", flexShrink: 0, marginTop: 3 }} />
                        )}
                      </div>
                      {notif.body && (
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {notif.body}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: C.grayLight, marginTop: 4 }}>{timeAgo(notif.created_at)}</div>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={e => deleteOne(notif.id, e)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.grayLight, padding: 0, flexShrink: 0, alignSelf: "flex-start" }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
