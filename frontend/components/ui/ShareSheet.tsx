"use client";
import React, { useState, useEffect } from "react";
import { C } from "@/utils/constants";

/* ── Types ──────────────────────────────────────────────────── */
interface ShareSheetProps {
  url:      string;
  title:    string;
  message:  string;   // WhatsApp/main share message
  onClose:  () => void;
}

/* ── Individual share option ────────────────────────────────── */
const ShareOption = ({
  icon, label, color, bg, onClick,
}: {
  icon:    string;
  label:   string;
  color:   string;
  bg:      string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      gap:            8,
      background:     "none",
      border:         "none",
      cursor:         "pointer",
      padding:        "4px 0",
      flex:           1,
    }}
  >
    <div style={{
      width: 54, height: 54, borderRadius: 16,
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 26,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    }}>
      {icon}
    </div>
    <span style={{ fontSize: 11, fontWeight: 500, color: C.dark }}>{label}</span>
  </button>
);

/* ══════════════════════════════════════════════════════════════
   SHARE SHEET — bottom drawer that slides up
══════════════════════════════════════════════════════════════ */
export default function ShareSheet({ url, title, message, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  /* Prevent body scroll when open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const fullUrl     = url.startsWith("http") ? url : `https://maizu.vercel.app${url}`;
  const encodedUrl  = encodeURIComponent(fullUrl);
  const encodedMsg  = encodeURIComponent(`${message}\n\n${fullUrl}`);
  const encodedText = encodeURIComponent(message);

  /* ── Share handlers ── */
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedMsg}`, "_blank");
    onClose();
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
    onClose();
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, "_blank");
    onClose();
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, "_blank");
    onClose();
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodedMsg}`, "_blank");
    onClose();
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: message, url: fullUrl });
        onClose();
      } catch { /* user cancelled */ }
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1500);
    } catch {
      /* Fallback for older browsers */
      const el = document.createElement("textarea");
      el.value = fullUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1500);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      />

      {/* Sheet */}
      <div style={{
        position:     "absolute",
        bottom:       0,
        left:         "50%",
        transform:    "translateX(-50%)",
        width:        "100%",
        maxWidth:     430,
        background:   C.white,
        borderRadius: "22px 22px 0 0",
        padding:      "10px 20px 48px",
        animation:    "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "8px auto 18px" }} />

        {/* Title */}
        <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 4 }}>Share</div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </div>

        {/* Share options */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <ShareOption
            icon="💬" label="WhatsApp" color="#25D366" bg="#E9FBF0"
            onClick={shareWhatsApp}
          />
          <ShareOption
            icon="📘" label="Facebook" color="#1877F2" bg="#E7F0FD"
            onClick={shareFacebook}
          />
          <ShareOption
            icon="🐦" label="Twitter/X" color="#1DA1F2" bg="#E8F5FD"
            onClick={shareTwitter}
          />
          <ShareOption
            icon="✈️" label="Telegram" color="#0088CC" bg="#E3F4FC"
            onClick={shareTelegram}
          />
          <ShareOption
            icon="📧" label="Email" color="#EA4335" bg="#FEEBEA"
            onClick={shareEmail}
          />
        </div>

        {/* URL bar + copy */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#F9FAFB", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: C.gray, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fullUrl}
          </span>
          <button
            onClick={copyLink}
            style={{ background: copied ? "#E1F5EE" : C.primary, color: copied ? "#065F46" : "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>

        {/* Native share (mobile) */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={shareNative}
            style={{ width: "100%", background: C.softOrange, color: C.primary, border: `1.5px solid ${C.primary}33`, borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            📤 More sharing options…
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARE BUTTON — small trigger button for any page
══════════════════════════════════════════════════════════════ */
export function ShareButton({
  url, title, message, style, label = "Share",
}: {
  url:      string;
  title:    string;
  message:  string;
  style?:   React.CSSProperties;
  label?:   string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background:   "rgba(0,0,0,0.35)",
          border:       "none",
          borderRadius: 22,
          padding:      "6px 14px",
          color:        "#fff",
          fontSize:     13,
          cursor:       "pointer",
          backdropFilter: "blur(6px)",
          display:      "flex",
          alignItems:   "center",
          gap:          5,
          ...style,
        }}
      >
        ↗ {label}
      </button>

      {open && (
        <ShareSheet
          url={url}
          title={title}
          message={message}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   WHATSAPP QUICK BUTTON — single-tap WhatsApp share
══════════════════════════════════════════════════════════════ */
export function WhatsAppButton({
  url, message, style,
}: {
  url:     string;
  message: string;
  style?:  React.CSSProperties;
}) {
  const fullUrl    = url.startsWith("http") ? url : `https://maizu.vercel.app${url}`;
  const encodedMsg = encodeURIComponent(`${message}\n\n${fullUrl}`);

  return (
    <button
      onClick={() => window.open(`https://wa.me/?text=${encodedMsg}`, "_blank")}
      style={{
        background:   "#25D366",
        border:       "none",
        borderRadius: 22,
        padding:      "8px 16px",
        color:        "#fff",
        fontSize:     13,
        fontWeight:   700,
        cursor:       "pointer",
        display:      "flex",
        alignItems:   "center",
        gap:          6,
        ...style,
      }}
    >
      💬 Share on WhatsApp
    </button>
  );
}
