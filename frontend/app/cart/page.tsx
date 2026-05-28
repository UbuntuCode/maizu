"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { C } from "@/utils/constants";
import { useCart } from "@/context/CartContext";
import BottomNav from "@/components/navigation/BottomNav";

/* ── Cart item row ──────────────────────────────────────────── */
const CartRow = ({
  item,
  onRemove,
  onInc,
  onDec,
}: {
  item: import("@/context/CartContext").CartItem;
  onRemove: () => void;
  onInc:    () => void;
  onDec:    () => void;
}) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
    {/* Image */}
    <div style={{ width: 70, height: 70, borderRadius: 10, background: "#F3F4F6", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
      {item.image_url
        ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : "📦"
      }
    </div>

    {/* Info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
      <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>{item.store_name}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>R{(item.price * item.quantity).toFixed(2)}</div>
      <div style={{ fontSize: 10, color: C.grayLight }}>R{item.price.toFixed(2)} each</div>
    </div>

    {/* Qty controls + remove */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.grayLight, padding: 0 }}>✕</button>
      <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1.5px solid ${C.border}`, borderRadius: 22, overflow: "hidden" }}>
        <button onClick={onDec} style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
        <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 700, color: C.dark }}>{item.quantity}</span>
        <button onClick={onInc} disabled={item.quantity >= item.stock_quantity} style={{ width: 28, height: 28, background: "none", border: "none", cursor: item.quantity >= item.stock_quantity ? "default" : "pointer", fontSize: 16, color: item.quantity >= item.stock_quantity ? C.grayLight : C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>
    </div>
  </div>
);

/* ── Cart page ──────────────────────────────────────────────── */
export default function CartPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, removeItem, updateQty, clearCart } = useCart();

  /* Group items by store */
  const stores = items.reduce((acc, item) => {
    if (!acc[item.store_id]) acc[item.store_id] = { name: item.store_name, items: [] };
    acc[item.store_id].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: typeof items }>);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ height: 60, background: "#fff", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", position: "sticky", top: 0, zIndex: 200 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.dark, display: "flex", alignItems: "center", gap: 4 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>My Cart ({totalItems})</div>
        {items.length > 0
          ? <button onClick={clearCart} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.gray, textDecoration: "underline" }}>Clear all</button>
          : <div style={{ width: 40 }} />
        }
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 8 }}>Your cart is empty</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 28, lineHeight: 1.6 }}>Add products from stores to start shopping</div>
          <button onClick={() => router.push("/stores")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 24, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Browse Stores
          </button>
        </div>
      ) : (
        <div style={{ padding: "16px 16px 0" }}>

          {/* Items grouped by store */}
          {Object.entries(stores).map(([storeId, storeData]) => (
            <div key={storeId} style={{ marginBottom: 16 }}>
              {/* Store label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🏪</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{storeData.name}</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              {/* Items */}
              {storeData.items.map(item => (
                <CartRow
                  key={item.product_id}
                  item={item}
                  onRemove={() => removeItem(item.product_id)}
                  onInc={() => updateQty(item.product_id, item.quantity + 1)}
                  onDec={() => updateQty(item.product_id, item.quantity - 1)}
                />
              ))}
            </div>
          ))}

          {/* Order summary */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Order Summary</div>
            {[
              ["Subtotal",       `R${totalPrice.toFixed(2)}`],
              ["Delivery fee",   "Free"],
              ["Service fee",    `R${(totalPrice * 0.05).toFixed(2)}`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.gray }}>{label}</span>
                <span style={{ color: C.dark, fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, padding: "10px 0 0", fontWeight: 800 }}>
              <span style={{ color: C.dark }}>Total</span>
              <span style={{ color: C.primary }}>R{(totalPrice * 1.05).toFixed(2)}</span>
            </div>
          </div>

          {/* Promo code */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", marginBottom: 16, display: "flex", gap: 8 }}>
            <input placeholder="Promo code" style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", color: C.dark, background: "#FAFAFA" }} />
            <button style={{ background: C.softOrange, color: C.primary, border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Apply</button>
          </div>

        </div>
      )}

      {/* Checkout button — sticky bottom */}
      {items.length > 0 && (
        <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "12px 16px", background: C.bg, borderTop: `1px solid ${C.border}`, zIndex: 100 }}>
          <button
            onClick={() => router.push("/checkout")}
            style={{ width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 16, padding: "15px 0", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            Proceed to Checkout · R{(totalPrice * 1.05).toFixed(2)}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
