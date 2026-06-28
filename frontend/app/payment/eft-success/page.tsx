"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C } from "@/utils/constants";
import BottomNav from "@/components/navigation/BottomNav";

const BANK_DETAILS = {
  bank:           "First National Bank (FNB)",
  account_name:   "UBUNTUCODE (Pty) Ltd",
  account_number: "63173491762",
  branch_code:    "220830",
  account_type:   "Cheque / Current",
};

function EftSuccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("order_id");
  const total   = searchParams.get("total");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied: ${text}`);
  };

  const detailRows: [string, string][] = [
    ["Bank",           BANK_DETAILS.bank],
    ["Account Name",   BANK_DETAILS.account_name],
    ["Account Number", BANK_DETAILS.account_number],
    ["Branch Code",    BANK_DETAILS.branch_code],
    ["Account Type",   BANK_DETAILS.account_type],
    ["Reference",      orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "—"],
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1D4ED8,#3B82F6)", padding: "32px 20px 28px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 14px" }}>
          🏦
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Order Placed!</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Complete your payment via EFT to confirm</div>
      </div>

      <div style={{ padding: "20px 16px" }}>

        {/* Amount due */}
        {total && (
          <div style={{ background: C.white, borderRadius: 16, padding: "20px", marginBottom: 14, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>Amount to transfer</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: C.primary }}>R{Number(total).toFixed(2)}</div>
          </div>
        )}

        {/* Bank details */}
        <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Bank Account Details</div>
          {detailRows.map(([label, value]) => (
            <div key={label} onClick={() => copyToClipboard(value, label)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <span style={{ fontSize: 12, color: C.gray }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.dark, fontFamily: (label === "Account Number" || label === "Branch Code") ? "monospace" : "inherit" }}>
                {value} <span style={{ fontSize: 10, color: C.primary }}>📋</span>
              </span>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
            ⚠️ <strong>Important:</strong> Please use <strong>{orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "your order number"}</strong> as your payment reference. Your order will be confirmed once we receive your payment (usually within 1 business day for standard EFT, or instantly for Instant EFT).
          </div>
        </div>

        {/* What's next */}
        <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>What happens next</div>
          {[
            { n: "1", title: "Make your EFT payment", desc: "Transfer the exact amount using the reference above." },
            { n: "2", title: "We confirm payment",     desc: "Usually within 1 business day of transfer." },
            { n: "3", title: "Vendor ships your order", desc: "Once confirmed, your order is packed and dispatched." },
            { n: "4", title: "Track your delivery",     desc: "You'll get a waybill number to track your parcel." },
          ].map(step => (
            <div key={step.n} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1D4ED8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{step.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: C.gray }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {orderId && (
            <button onClick={() => router.push(`/orders/${orderId}`)}
              style={{ flex: 2, background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              View My Order
            </button>
          )}
          <button onClick={() => router.push("/")}
            style={{ flex: 1, background: C.white, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Home
          </button>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}

export default function EftSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F7F7F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#71717A" }}>Loading…</div>
      </div>
    }>
      <EftSuccessContent />
    </Suspense>
  );
}
