"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ════════════════════════════════════════════════════════════
   Handles content shared TO Maizu from other apps
   (e.g. "Share" a link from WhatsApp/Chrome -> opens Maizu)

   Currently routes the shared URL/text to the search page so
   users can find related products. Extend later to detect
   product links and deep-link directly to that product.
════════════════════════════════════════════════════════════ */

function ShareHandlerContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const sharedText = params.get("text") || params.get("title") || "";
    const sharedUrl   = params.get("url") || "";

    const query = sharedText || sharedUrl;
    if (query) {
      router.replace(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F5" }}>
      <div style={{ fontSize: 13, color: "#71717A" }}>Opening Maizu…</div>
    </div>
  );
}

export default function ShareHandlerPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F7F7F5" }} />}>
      <ShareHandlerContent />
    </Suspense>
  );
}
