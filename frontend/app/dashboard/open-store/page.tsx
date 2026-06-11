"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/*
  /dashboard/open-store — this route used to 404.
  Any "Open store" button that points here now lands on the
  3-step create-store wizard instead of a missing page.
*/
export default function OpenStoreRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/create-store"); }, [router]);
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7080", fontSize: 14 }}>
      Opening store setup…
    </div>
  );
}
