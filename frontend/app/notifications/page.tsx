"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";

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
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
};

export default function NotificationsPage() {
  const router              = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [loading,       setLoading]         = useState(true);
  const [filter,        setFilter]          = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const res   = await fetch(`${BASE}/api/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data  = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isLoggedIn) fetchNotifications(); }, [isLoggedIn]);

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/notifications/${id}/read`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/notifications/read-all`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const deleteOne = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/notifications/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications?")) return;
    try {
      const token = await getToken();
      await fetch(`${BASE}/api/notifications/clear-all`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch { /* silent */ }
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) await markAsRead(notif.id);
    if (notif.data?.order_id) router.push(`/orders/${notif.data.order_id}`);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayed   = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  /* Group by date */
  const grouped: Record<string, Notification[]> = {};
  displayed.forEach(n => {
    const d = new Date(n.created_at);
    const now = new Date();
    let label = d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
    if (d.toDateString() === now.toDateString()) label = "Today";
    else {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    }
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(n);
  });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>
      <Header />

      {/* Page header */}
      <div style={{ background: C.white, padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.dark }}>Notifications 🔔</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: C.softOrange, color: C.primary, border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} style={{ background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {(["all", "unread"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter === f ? C.primary : C.white, color: filter === f ? "#fff" : C.dark, border: `1.5px solid ${filter === f ? C.primary : C.border}`, borderRadius: 22, padding: "6px 14px", fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: "pointer" }}>
              {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: 13 }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 16, padding: "48px 20px", textAlign: "center", marginTop: 8 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </div>
            <div style={{ fontSize: 13, color: C.gray }}>
              {filter === "unread" ? "You're all caught up!" : "Order updates and alerts will appear here"}
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, notifs]) => (
            <div key={dateLabel} style={{ marginBottom: 20 }}>
              {/* Date label */}
              <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, paddingLeft: 4 }}>
                {dateLabel}
              </div>
              {/* Notifications */}
              {notifs.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
                return (
                  <div key={notif.id}
                    onClick={() => handleClick(notif)}
                    style={{ background: notif.is_read ? C.white : "#F8FBFF", borderRadius: 14, padding: "14px", marginBottom: 8, display: "flex", gap: 12, cursor: notif.data?.order_id ? "pointer" : "default", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: notif.is_read ? "none" : `1px solid ${C.primary}22` }}
                  >
                    {/* Icon */}
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {cfg.emoji}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: notif.is_read ? 500 : 800, color: C.dark, lineHeight: 1.3 }}>
                          {notif.title}
                        </div>
                        {!notif.is_read && (
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", flexShrink: 0, marginTop: 2 }} />
                        )}
                      </div>
                      {notif.body && (
                        <div style={{ fontSize: 12, color: C.gray, marginTop: 4, lineHeight: 1.6 }}>{notif.body}</div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: C.grayLight }}>{timeAgo(notif.created_at)}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {!notif.is_read && (
                            <button onClick={e => { e.stopPropagation(); markAsRead(notif.id); }}
                              style={{ background: "none", border: "none", fontSize: 11, color: C.primary, fontWeight: 600, cursor: "pointer" }}>
                              Mark read
                            </button>
                          )}
                          {notif.data?.order_id && (
                            <button onClick={e => { e.stopPropagation(); router.push(`/orders/${notif.data!.order_id}`); }}
                              style={{ background: C.softOrange, color: C.primary, border: "none", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                              View Order →
                            </button>
                          )}
                          <button onClick={e => { e.stopPropagation(); deleteOne(notif.id); }}
                            style={{ background: "none", border: "none", fontSize: 13, color: C.grayLight, cursor: "pointer" }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
