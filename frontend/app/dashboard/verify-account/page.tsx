"use client";
import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const CLOUD_NAME    = "ddjf6z9dv";
const UPLOAD_PRESET = "maizu_unsigned";

const P     = "#E8401C";
const DARK  = "#0F0F0F";
const MUTED = "#71717A";
const BG    = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER= "#E4E4E7";
const SOFT  = "#FFF3EF";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 11,
  fontSize: 14, outline: "none", color: DARK, boxSizing: "border-box", background: "#FAFAFA",
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: DARK, display: "block", marginBottom: 6 };

interface Owner { full_name: string; id_number: string; address: string; date_of_birth: string; ownership_pct: string; }

/* ── Document upload field ─────────────────────────────────── */
function DocUpload({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      onChange(data.secure_url);
    } catch { /* silent */ }
    finally { setUploading(false); }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label} *</label>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{hint}</div>
      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 11, padding: "10px 14px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style={{ fontSize: 12, color: "#065F46", flex: 1 }}>Document uploaded</span>
          <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", color: "#059669", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Replace</button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ width: "100%", border: `1.5px dashed ${BORDER}`, borderRadius: 11, padding: "16px", background: "#FAFAFA", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {uploading ? (
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${P}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style={{ fontSize: 12, color: MUTED }}>Tap to upload (PDF, JPG or PNG)</span>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function VerifyAccountPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const storeId       = searchParams.get("store");
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [accountType, setAccountType] = useState<"personal" | "business" | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /* Personal fields */
  const [fullLegalName, setFullLegalName] = useState("");
  const [idNumber,       setIdNumber]      = useState("");
  const [dob,            setDob]           = useState("");
  const [resAddress,     setResAddress]    = useState("");
  const [phone,          setPhone]         = useState("");

  /* Business fields */
  const [legalBizName,   setLegalBizName]  = useState("");
  const [tradeName,      setTradeName]     = useState("");
  const [cipcNumber,     setCipcNumber]    = useState("");
  const [vatNumber,      setVatNumber]     = useState("");
  const [bizAddress,     setBizAddress]    = useState("");
  const [bizPhone,       setBizPhone]      = useState("");
  const [owners,         setOwners]        = useState<Owner[]>([{ full_name: "", id_number: "", address: "", date_of_birth: "", ownership_pct: "" }]);

  /* Banking — shared */
  const [bankName,    setBankName]    = useState("");
  const [accHolder,   setAccHolder]   = useState("");
  const [accNumber,   setAccNumber]   = useState("");
  const [branchCode,  setBranchCode]  = useState("");
  const [accType,     setAccType]     = useState("savings");

  /* Documents */
  const [idDoc,        setIdDoc]        = useState("");
  const [addressDoc,   setAddressDoc]   = useState("");
  const [bankDoc,       setBankDoc]      = useState("");
  const [cipcDoc,       setCipcDoc]      = useState("");
  const [vatDoc,         setVatDoc]       = useState("");

  const addOwner    = () => setOwners(prev => [...prev, { full_name: "", id_number: "", address: "", date_of_birth: "", ownership_pct: "" }]);
  const removeOwner = (i: number) => setOwners(prev => prev.filter((_, idx) => idx !== i));
  const updateOwner = (i: number, field: keyof Owner, value: string) =>
    setOwners(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o));

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token; };

  const canContinueStep1 = accountType !== null;
  const canContinueStep2 = accountType === "personal"
    ? fullLegalName.trim() && idNumber.trim() && resAddress.trim() && phone.trim()
    : legalBizName.trim() && cipcNumber.trim() && bizAddress.trim() && bizPhone.trim();
  const canSubmit = idDoc && addressDoc && bankDoc && accNumber.trim() && bankName.trim();

  const handleSubmit = async () => {
    if (!canSubmit) { setError("Please complete all required fields and upload all required documents."); return; }
    setBusy(true); setError("");
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/verification/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          store_id: storeId, account_type: accountType,
          full_legal_name: fullLegalName, id_number: idNumber, date_of_birth: dob, residential_address: resAddress, phone_number: phone,
          legal_business_name: legalBizName, trade_name: tradeName, cipc_registration_number: cipcNumber, vat_number: vatNumber,
          business_address: bizAddress, business_phone: bizPhone,
          beneficial_owners: accountType === "business" ? owners.filter(o => o.full_name.trim()) : [],
          bank_name: bankName, bank_account_holder: accHolder, bank_account_number: accNumber, bank_branch_code: branchCode, bank_account_type: accType,
          id_document_url: idDoc, proof_of_address_url: addressDoc, bank_confirmation_url: bankDoc, cipc_document_url: cipcDoc, vat_certificate_url: vatDoc,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit verification.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return null;
  if (!isLoggedIn) { router.push("/login"); return null; }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 18 }}>✅</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: DARK, marginBottom: 8 }}>Verification submitted</div>
        <div style={{ fontSize: 13, color: MUTED, maxWidth: 300, lineHeight: 1.6, marginBottom: 24 }}>
          Most accounts are reviewed within 1–2 business days. We'll notify you once it's complete — you can keep listing products in the meantime.
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ background: P, color: "#fff", border: "none", borderRadius: 22, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ background: WHITE, padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => step > 1 ? setStep(s => (s - 1) as any) : router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: DARK }}>Verify Your Account</div>
          <div style={{ fontSize: 11, color: MUTED }}>Required to receive payouts</div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 6, padding: "16px 16px 0" }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? P : BORDER, transition: "background 0.3s" }} />
        ))}
      </div>

      <div style={{ padding: "16px" }}>
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── STEP 1: ACCOUNT TYPE ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 6 }}>How are you selling?</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>This determines what information we'll need from you.</div>

            <button onClick={() => setAccountType("personal")}
              style={{ width: "100%", textAlign: "left", background: accountType === "personal" ? SOFT : WHITE, border: `2px solid ${accountType === "personal" ? P : BORDER}`, borderRadius: 16, padding: "18px", marginBottom: 12, cursor: "pointer" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>Personal Seller</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>You're an individual selling as yourself — crafts, second-hand items, a side hustle. Requires your SA ID and proof of address.</div>
            </button>

            <button onClick={() => setAccountType("business")}
              style={{ width: "100%", textAlign: "left", background: accountType === "business" ? SOFT : WHITE, border: `2px solid ${accountType === "business" ? P : BORDER}`, borderRadius: 16, padding: "18px", marginBottom: 20, cursor: "pointer" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>Registered Business</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>You operate as a company, CC or sole proprietor with CIPC registration. Requires business documents and beneficial owner details.</div>
            </button>

            <button onClick={() => canContinueStep1 && setStep(2)} disabled={!canContinueStep1}
              style={{ width: "100%", background: canContinueStep1 ? P : "#D1D5DB", color: "#fff", border: "none", borderRadius: 14, padding: "15px 0", fontSize: 15, fontWeight: 700, cursor: canContinueStep1 ? "pointer" : "default" }}>
              Continue
            </button>
          </div>
        )}

        {/* ── STEP 2: DETAILS ── */}
        {step === 2 && accountType === "personal" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 16 }}>Your Details</div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full Legal Name *</label>
              <input value={fullLegalName} onChange={e => setFullLegalName(e.target.value)} placeholder="As it appears on your ID" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>South African ID Number *</label>
              <input value={idNumber} onChange={e => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="13-digit ID number" style={{ ...inputStyle, fontFamily: "monospace" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Residential Address *</label>
              <textarea value={resAddress} onChange={e => setResAddress(e.target.value)} placeholder="Street, suburb, city, province, postal code" rows={3} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Phone Number *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="071 234 5678" style={inputStyle} />
            </div>

            <button onClick={() => canContinueStep2 && setStep(3)} disabled={!canContinueStep2}
              style={{ width: "100%", background: canContinueStep2 ? P : "#D1D5DB", color: "#fff", border: "none", borderRadius: 14, padding: "15px 0", fontSize: 15, fontWeight: 700, cursor: canContinueStep2 ? "pointer" : "default" }}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && accountType === "business" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 16 }}>Business Details</div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Legal Business Name *</label>
              <input value={legalBizName} onChange={e => setLegalBizName(e.target.value)} placeholder="As registered with CIPC" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Trade Name (if different)</label>
              <input value={tradeName} onChange={e => setTradeName(e.target.value)} placeholder="e.g. trading as 'Maizu Crafts'" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>CIPC Registration Number *</label>
              <input value={cipcNumber} onChange={e => setCipcNumber(e.target.value)} placeholder="e.g. 2021/123456/07" style={{ ...inputStyle, fontFamily: "monospace" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>VAT Number <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span></label>
              <input value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="SARS VAT number" style={{ ...inputStyle, fontFamily: "monospace" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Official Business Address *</label>
              <textarea value={bizAddress} onChange={e => setBizAddress(e.target.value)} placeholder="Street, suburb, city, province, postal code" rows={3} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Business Phone Number *</label>
              <input value={bizPhone} onChange={e => setBizPhone(e.target.value)} placeholder="011 234 5678" style={inputStyle} />
            </div>

            {/* Beneficial owners */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>Beneficial Owners</div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>List anyone who owns more than 25% of the company.</div>

              {owners.map((owner, i) => (
                <div key={i} style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px", marginBottom: 10, border: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>Owner {i + 1}</span>
                    {owners.length > 1 && (
                      <button onClick={() => removeOwner(i)} style={{ background: "none", border: "none", color: "#DC2626", fontSize: 11, cursor: "pointer" }}>Remove</button>
                    )}
                  </div>
                  <input value={owner.full_name} onChange={e => updateOwner(i, "full_name", e.target.value)} placeholder="Full name" style={{ ...inputStyle, marginBottom: 8 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input value={owner.id_number} onChange={e => updateOwner(i, "id_number", e.target.value)} placeholder="ID number" style={{ ...inputStyle, fontFamily: "monospace" }} />
                    <input value={owner.ownership_pct} onChange={e => updateOwner(i, "ownership_pct", e.target.value)} placeholder="Ownership %" type="number" style={inputStyle} />
                  </div>
                  <input value={owner.address} onChange={e => updateOwner(i, "address", e.target.value)} placeholder="Address" style={{ ...inputStyle, marginBottom: 8 }} />
                  <input type="date" value={owner.date_of_birth} onChange={e => updateOwner(i, "date_of_birth", e.target.value)} style={inputStyle} />
                </div>
              ))}
              <button onClick={addOwner} style={{ width: "100%", background: "none", border: `1.5px dashed ${BORDER}`, borderRadius: 10, padding: "10px 0", fontSize: 12, color: P, fontWeight: 600, cursor: "pointer" }}>
                + Add another owner
              </button>
            </div>

            <button onClick={() => canContinueStep2 && setStep(3)} disabled={!canContinueStep2}
              style={{ width: "100%", background: canContinueStep2 ? P : "#D1D5DB", color: "#fff", border: "none", borderRadius: 14, padding: "15px 0", fontSize: 15, fontWeight: 700, cursor: canContinueStep2 ? "pointer" : "default" }}>
              Continue
            </button>
          </div>
        )}

        {/* ── STEP 3: BANKING + DOCUMENTS ── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 16 }}>Banking & Documents</div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Bank Name *</label>
              <select value={bankName} onChange={e => setBankName(e.target.value)} style={inputStyle}>
                <option value="">Select your bank…</option>
                {["FNB", "Standard Bank", "Absa", "Nedbank", "Capitec", "TymeBank", "Investec", "Bidvest Bank"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Account Holder Name *</label>
              <input value={accHolder} onChange={e => setAccHolder(e.target.value)} placeholder={accountType === "business" ? "Must match legal business name" : "Must match your legal name"} style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Account Number *</label>
                <input value={accNumber} onChange={e => setAccNumber(e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle, fontFamily: "monospace" }} />
              </div>
              <div>
                <label style={labelStyle}>Branch Code *</label>
                <input value={branchCode} onChange={e => setBranchCode(e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle, fontFamily: "monospace" }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Account Type</label>
              <select value={accType} onChange={e => setAccType(e.target.value)} style={inputStyle}>
                <option value="savings">Savings</option>
                <option value="cheque">Cheque / Current</option>
              </select>
            </div>

            <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>Required Documents</div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>We may not need all of these — but uploading them now speeds up your review.</div>

            <DocUpload
              label="Government-Issued Photo ID"
              hint="Your SA ID card, driver's licence or passport"
              value={idDoc} onChange={setIdDoc}
            />
            <DocUpload
              label="Proof of Address"
              hint="A recent utility bill or bank statement showing your name and address (within 3 months)"
              value={addressDoc} onChange={setAddressDoc}
            />
            <DocUpload
              label="Bank Confirmation"
              hint="A bank statement or cancelled cheque confirming your account details"
              value={bankDoc} onChange={setBankDoc}
            />
            {accountType === "business" && (
              <>
                <DocUpload
                  label="CIPC Registration Certificate"
                  hint="Your company registration / incorporation document"
                  value={cipcDoc} onChange={setCipcDoc}
                />
                {vatNumber && (
                  <DocUpload
                    label="VAT Registration Certificate"
                    hint="Only required if you provided a VAT number"
                    value={vatDoc} onChange={setVatDoc}
                  />
                )}
              </>
            )}

            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: "16px 0" }}>
              By submitting, you confirm all information provided is accurate and you authorise Maizu to verify these details with relevant third parties as required under South African financial regulations.
            </div>

            <button onClick={handleSubmit} disabled={busy || !canSubmit}
              style={{ width: "100%", background: (busy || !canSubmit) ? "#D1D5DB" : P, color: "#fff", border: "none", borderRadius: 14, padding: "16px 0", fontSize: 15, fontWeight: 700, cursor: (busy || !canSubmit) ? "default" : "pointer" }}>
              {busy ? "Submitting…" : "Submit for Verification"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
