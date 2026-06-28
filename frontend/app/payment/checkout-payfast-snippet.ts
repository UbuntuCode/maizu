/* ═══════════════════════════════════════════════════════════════
   ADD THIS TO frontend/app/checkout/page.tsx

   1. Add "payfast" to the PayMethod type:
      type PayMethod = "flutterwave" | "payfast" | "eft" | "cod";

   2. Add this handler alongside handleFlutterwave:
═══════════════════════════════════════════════════════════════ */

const handlePayFast = async () => {
  setBusy(true); setError("");
  try {
    const token = await getToken();
    const res   = await fetch(`${BASE}/api/payfast/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items:            items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        delivery_address: getDeliveryAddress(),
        notes:            address.notes,
        promo_id:         promoResult?.id,
        discount_amount:  discount,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    clearCart();
    window.location.href = data.payment_url; /* Redirect to PayFast hosted checkout */
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Payment failed.");
    setBusy(false);
  }
};

/* ═══════════════════════════════════════════════════════════════
   3. Add this PayFast option card AFTER the Flutterwave card
      in Step 3 of the checkout JSX:
═══════════════════════════════════════════════════════════════ */

const PayFastOptionJSX = `
{/* ── PayFast ── */}
<div onClick={() => { setMethod("payfast"); setShowEft(false); }}
  style={{ background:WHITE, borderRadius:16, padding:"16px", marginBottom:10,
           border:\`2px solid \${method==="payfast"?C.primary:C.border}\`, cursor:"pointer" }}>
  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
    <div style={{ width:44, height:44, borderRadius:12, background:"#E8F5E9",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
      🏦
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>Pay with PayFast</div>
      <div style={{ fontSize:11, color:C.gray }}>
        Visa · Mastercard · Instant EFT · Mobicred · MoreTyme
      </div>
      <div style={{ display:"flex", gap:4, marginTop:5 }}>
        {["💳 Card","🏦 Instant EFT","📱 Mobicred","💰 MoreTyme"].map(m=>(
          <span key={m} style={{ background:"#F3F4F6", color:C.dark, borderRadius:20,
                                  padding:"2px 8px", fontSize:9, fontWeight:500 }}>{m}</span>
        ))}
      </div>
    </div>
    <div style={{ width:20, height:20, borderRadius:"50%",
                  border:\`2px solid \${method==="payfast"?C.primary:C.border}\`,
                  background:method==="payfast"?C.primary:"transparent", flexShrink:0 }}/>
  </div>

  {method==="payfast" && (
    <button onClick={handlePayFast} disabled={busy}
      style={{ width:"100%", background:busy?"#D1D5DB":C.primary, color:WHITE, border:"none",
               borderRadius:12, padding:"13px 0", fontSize:14, fontWeight:700,
               cursor:busy?"default":"pointer", marginTop:14 }}>
      {busy ? "Preparing…" : \`🔒 Pay R\${grandTotal.toFixed(2)} with PayFast\`}
    </button>
  )}
</div>
`;

/*
   PayFast supports:
   - Visa / Mastercard (credit and debit)
   - Instant EFT (via major SA banks)
   - Mobicred
   - MoreTyme (buy now pay later)
   - SCode
   - Masterpass

   This gives buyers MORE payment options than Flutterwave alone.
   Keep both — PayFast for SA-specific options, Flutterwave as backup.
*/
