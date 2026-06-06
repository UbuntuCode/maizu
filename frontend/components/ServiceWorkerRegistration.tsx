"use client";
import { useEffect, useState } from "react";
import { C } from "@/utils/constants";

/* ── Install prompt banner ──────────────────────────────────── */
const InstallBanner = ({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) => (
  <div style={{
    position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
    width: "calc(100% - 32px)", maxWidth: 398,
    background: C.dark, borderRadius: 16, padding: "14px 16px",
    display: "flex", alignItems: "center", gap: 12,
    zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    animation: "slideUp 0.3s ease",
  }}>
    <style>{`@keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}`}</style>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
      🏪
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Install Maizu App</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Add to your home screen for quick access</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={onInstall}
        style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        Install
      </button>
      <button
        onClick={onDismiss}
        style={{ background: "none", color: "rgba(255,255,255,0.6)", border: "none", fontSize: 10, cursor: "pointer" }}
      >
        Not now
      </button>
    </div>
  </div>
);

/* ── iOS Install Instructions ───────────────────────────────── */
const IOSBanner = ({ onDismiss }: { onDismiss: () => void }) => (
  <div style={{
    position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
    width: "calc(100% - 32px)", maxWidth: 398,
    background: C.dark, borderRadius: 16, padding: "16px",
    zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>🏪 Install Maizu App</div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 16 }}>✕</button>
    </div>
    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
      1. Tap the <strong style={{ color: "#fff" }}>Share</strong> button <span style={{ fontSize: 14 }}>⎋</span> at the bottom<br />
      2. Scroll down and tap <strong style={{ color: "#fff" }}>"Add to Home Screen"</strong><br />
      3. Tap <strong style={{ color: "#fff" }}>"Add"</strong> to install Maizu
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   SERVICE WORKER REGISTRATION + INSTALL PROMPT
══════════════════════════════════════════════════════════════ */
export default function ServiceWorkerRegistration() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner,    setShowBanner]    = useState(false);
  const [showIOS,       setShowIOS]       = useState(false);

  useEffect(() => {
    /* Register service worker */
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("✅ Service Worker registered:", reg.scope);

            /* Check for updates */
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("🔄 New version available");
                  }
                });
              }
            });
          })
          .catch((err) => console.log("Service Worker registration failed:", err));
      });
    }

    /* Detect Android/Chrome install prompt */
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);

      /* Only show if not dismissed before */
      const dismissed = localStorage.getItem("maizu_install_dismissed");
      if (!dismissed) {
        /* Wait 30 seconds before showing */
        setTimeout(() => setShowBanner(true), 30000);
      }
    };

    /* Detect iOS Safari */
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    const iosDismissed = localStorage.getItem("maizu_ios_dismissed");

    if (isIOS && !isInStandaloneMode && !iosDismissed) {
      setTimeout(() => setShowIOS(true), 30000);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    /* Hide banner when app is installed */
    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setInstallPrompt(null);
      console.log("✅ Maizu installed as PWA");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOS(false);
    localStorage.setItem("maizu_install_dismissed", "true");
    localStorage.setItem("maizu_ios_dismissed",     "true");
  };

  return (
    <>
      {showBanner && installPrompt && (
        <InstallBanner onInstall={handleInstall} onDismiss={handleDismiss} />
      )}
      {showIOS && !showBanner && (
        <IOSBanner onDismiss={handleDismiss} />
      )}
    </>
  );
}

/* TypeScript type for install prompt */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}
