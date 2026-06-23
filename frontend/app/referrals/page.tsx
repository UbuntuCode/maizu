"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import BottomNav from "@/components/navigation/BottomNav";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const P     = "#E8401C";
const DARK  = "#0F0F0F";
const MUTED = "#71717A";
const BG    = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER= "#E4E4E7";
const SOFT  = "#FFF3EF";

interface Referral {
  id: string; name: string; role: string; status: string; reward_amount: number; joined_at: string;
}
interface Stats {
  total_referred: number; pending: number; qualified: number; total_earned: number; credit_balance: number;
}

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FEF3C7", color: "#92400E", label: "Pending"   },
  qualified: { bg: "#DBEAFE", color: "#1E40AF", label: "Qualified" },
  rewarded:  { bg: "#D1FAE5", color: "#065F46", label: "Rewarded"  },
  expired:   { bg: "#F3F4F6", color: "#6B7280", label: "Expired"   },
};

export default function ReferralsPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [code,       setCode]       = useState("");
  const [link,        setLink]       = useState("");
  const [stats,       setStats]      = useState<Stats | null>(null);
  const [referrals,   setReferrals]  = useState<Referral[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [copied,      setCopied]     = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        const { data: sd } = await supabase.auth.getSession();
        const token = sd.session?.access_token;
        const res   = await fetch(`${BASE}/api/referrals/my-code`, { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        if (data.success) {
          setCode(data.referral_code);
          setLink(data.referral_link);
          setStats(data.stats);
          setReferrals(data.referrals || []);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [isLoggedIn]);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(`Join me on Maizu — South Africa's marketplace for local entrepreneurs! Sign up with my link and we both get rewarded:\n\n${link}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: MUTED }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 90 }}>

      {/* Header */}
      <div style={{ background: WHITE, padding: "16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: DARK }}>Refer & Earn</div>
      </div>

      <div style={{ padding: "16px" }}>

        {/* Hero card */}
        <div style={{ background: `linear-gradient(135deg,${DARK},#2A1200)`, borderRadius: 18, padding: "24px 20px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: WHITE, marginBottom: 6 }}>Invite friends, earn rewards</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
            Earn R20 when a friend you refer makes their first purchase, or R50 when a vendor you refer makes their first sale.
          </div>
        </div>

        {/* Credit balance */}
        <div style={{ background: WHITE, borderRadius: 16, padding: "18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: MUTED }}>Your credit balance</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: P }}>R{(stats?.credit_balance || 0).toFixed(2)}</div>
          </div>
          <button onClick={() => router.push("/checkout")} style={{ background: SOFT, color: P, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Use at checkout
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Referred",  val: stats?.total_referred || 0 },
            { label: "Pending",   val: stats?.pending || 0        },
            { label: "Qualified", val: stats?.qualified || 0      },
          ].map(s => (
            <div key={s.label} style={{ background: WHITE, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: DARK }}>{s.val}</div>
              <div style={{ fontSize: 10, color: MUTED }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Referral code + link */}
        <div style={{ background: WHITE, borderRadius: 16, padding: "18px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 12 }}>Your referral code</div>
          <div style={{ background: SOFT, borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: P, letterSpacing: 4 }}>{code}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} style={{ flex: 1, background: copied ? "#D1FAE5" : "#F3F4F6", color: copied ? "#065F46" : DARK, border: "none", borderRadius: 10, padding: "12px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>
            <button onClick={handleShareWhatsApp} style={{ flex: 1, background: "#25D366", color: WHITE, border: "none", borderRadius: 10, padding: "12px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              💬 Share on WhatsApp
            </button>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: WHITE, borderRadius: 16, padding: "18px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 14 }}>How it works</div>
          {[
            { n: "1", title: "Share your link",       desc: "Send your referral link or code to friends" },
            { n: "2", title: "They sign up",           desc: "They register on Maizu using your link" },
            { n: "3", title: "They take action",       desc: "Buyer makes a first purchase, or vendor makes a first sale" },
            { n: "4", title: "You get rewarded",       desc: "Credit is added to your account automatically" },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: P, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{s.title}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Referral list */}
        <div style={{ fontSize: 14, fontWeight: 800, color: DARK, marginBottom: 10 }}>Your referrals</div>
        {referrals.length === 0 ? (
          <div style={{ background: WHITE, borderRadius: 16, padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👋</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 4 }}>No referrals yet</div>
            <div style={{ fontSize: 12, color: MUTED }}>Share your link above to start earning</div>
          </div>
        ) : (
          referrals.map(r => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
            return (
              <div key={r.id} style={{ background: WHITE, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{r.role === "vendor" ? "Vendor" : "Buyer"} · joined {new Date(r.joined_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {Number(r.reward_amount) > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>+R{Number(r.reward_amount).toFixed(0)}</div>}
                  <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>{cfg.label}</span>
                </div>
              </div>
            );
          })
        )}

      </div>
      <BottomNav />
    </div>
  );
}
