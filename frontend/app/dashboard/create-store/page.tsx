"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

/*
  Open Store â€” rebuilt from scratch so it can never hang on a loading screen.

  Why the old one didn't load: it waited on the AuthContext "loading" state,
  which sometimes never resolves. This version talks to Supabase directly,
  with a 6-second timeout â€” you always see either the form, a sign-in
  prompt, or a clear error message. Never a blank page.

  3 steps: Details â†’ Logo (optional) â†’ Review & Launch.
  Logo upload uses your Cloudinary unsigned preset (same as create-product).
*/

const CLOUD_NAME    = "ddjf6z9dv";
const UPLOAD_PRESET = "maizu_unsigned";

const T = {
  primary: "#E8401C", primarySoft: "#FDEAE4",
  ink: "#161B26", sub: "#6B7080", faint: "#9CA1AD",
  bg: "#F7F7F5", card: "#FFFFFF", border: "#ECECEA",
};

const CATEGORIES = [
  "Fashion & Clothing", "Food & Drinks", "Beauty & Health", "Electronics",
  "Home & Decor", "Art & Crafts", "Services", "Other",
];

export default function CreateStorePage() {
  const router = useRouter();

  const [authState, setAuthState] = useState<"checking" | "in" | "out" | "error">("checking");
  const [userId, setUserId]       = useState("");

  const [step, setStep]         = useState(1);
  const [name, setName]         = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [desc, setDesc]         = useState("");
  const [city, setCity]         = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPrev, setLogoPrev] = useState("");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");

  /* â”€â”€ Auth check that cannot hang: direct call + 6s timeout â”€â”€ */
  useEffect(() => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; setAuthState("error"); }
    }, 6000);

    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error || !data?.user) setAuthState("out");
        else { setUserId(data.user.id); setAuthState("in"); }
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        setAuthState("error");
      });

    return () => clearTimeout(timer);
  }, []);

  const onPickLogo = (f: File | null) => {
    setLogoFile(f);
    if (f) {
      const r = new FileReader();
      r.onload = () => setLogoPrev(r.result as string);
      r.readAsDataURL(f);
    } else setLogoPrev("");
  };

  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return "";
    const fd = new FormData();
    fd.append("file", logoFile);
    fd.append("upload_preset", UPLOAD_PRESET);
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error("Logo upload failed â€” you can skip the logo and add it later.");
    return data.secure_url;
  };

  const launch = async () => {
    setError("");
    setBusy(true);
    try {
      const logo_url = await uploadLogo();
      const { data, error: dbErr } = await supabase
        .from("stores")
        .insert({
          owner_id:    userId,
          name:        name.trim(),
          category,
          description: desc.trim(),
          location:    city.trim() || null,
          logo_url:    logo_url || null,
        })
        .select("id")
        .single();
      if (dbErr) throw new Error(dbErr.message);

      // Make sure the account is marked as a vendor
      await supabase.from("users").update({ role: "vendor" }).eq("id", userId);

      router.push(data?.id ? `/dashboard/stores/${data.id}` : "/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create the store. Please try again.");
      setBusy(false);
    }
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 6, display: "block" };
  const input: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #E0E0DD",
    fontSize: 14, color: T.ink, background: "#FBFBFA", outline: "none",
  };
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: 24 }}>{children}</div>
  );

  /* â”€â”€ Auth gates: always show SOMETHING, never blank â”€â”€ */
  if (authState === "checking") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "70px 20px", color: T.sub, fontSize: 14 }}>
          Checking your accountâ€¦
        </div>
      </Shell>
    );
  }
  if (authState === "out") {
    return (
      <Shell>
        <Card>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>Sign in to open your store</div>
            <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6 }}>It takes less than a minute, and stores are free.</div>
            <button onClick={() => router.push("/login")}
              style={{ marginTop: 18, background: T.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Sign in
            </button>
          </div>
        </Card>
      </Shell>
    );
  }
  if (authState === "error") {
    return (
      <Shell>
        <Card>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>Connection problem</div>
           <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6 }}>
              We couldn&apos;t reach the server. Check your internet and try again.
            </div>
            <button onClick={() => window.location.reload()}
              style={{ marginTop: 18, background: T.ink, color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Retry
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  /* â”€â”€ Wizard â”€â”€ */
  const steps = ["Store details", "Logo", "Review & launch"];

  return (
    <Shell>
      {/* Back + heading */}
      <button onClick={() => (step > 1 ? setStep(step - 1) : router.push("/dashboard"))}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: T.sub, fontSize: 13.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6 6-6-6 6-6" /></svg>
        {step > 1 ? "Back" : "Dashboard"}
      </button>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: "10px 0 4px", letterSpacing: -0.4 }}>Open your store</h1>
      <p style={{ fontSize: 14, color: T.sub, margin: "0 0 18px" }}>Free to open. Start selling to buyers across South Africa.</p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {steps.map((s, i) => {
          const on = step === i + 1, past = step > i + 1;
          return (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 99, background: on || past ? T.primary : "#E6E6E3" }} />
              <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6, color: on ? T.primary : T.faint }}>{s}</div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <Card>
          <label style={label}>Store name</label>
          <input style={{ ...input, marginBottom: 16 }} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thandi's Kitchen" maxLength={60} />

          <label style={label}>Category</label>
          <select style={{ ...input, marginBottom: 16 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <label style={label}>What do you sell?</label>
          <textarea style={{ ...input, marginBottom: 16, minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
            value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="A short description buyers will see on your store page" maxLength={400} />

          <label style={label}>City (optional)</label>
          <input style={{ ...input, marginBottom: 20 }} value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Durban" maxLength={60} />

          <button
            onClick={() => {
              if (!name.trim()) return setError("Give your store a name.");
              setError(""); setStep(2);
            }}
            style={{ width: "100%", background: T.primary, color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            Continue
          </button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <label style={label}>Store logo (optional)</label>
          <label htmlFor="mzs-logo" style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
            border: "1.5px dashed #D8D8D4", borderRadius: 14, padding: "30px 16px", cursor: "pointer",
            background: "#FBFBFA", textAlign: "center",
          }}>
            {logoPrev ? (
              <img src={logoPrev} alt="" style={{ width: 92, height: 92, borderRadius: 18, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 18, background: T.primarySoft, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 28 }}>
                {(name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>
              {logoFile ? logoFile.name : "Tap to choose a logo"}
            </div>
            <div style={{ fontSize: 12, color: T.faint }}>Square images look best. You can skip this and add one later.</div>
          </label>
          <input id="mzs-logo" type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => onPickLogo(e.target.files?.[0] || null)} />

          <button onClick={() => { setError(""); setStep(3); }}
            style={{ marginTop: 20, width: "100%", background: T.primary, color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            Continue
          </button>
          <button onClick={() => { onPickLogo(null); setError(""); setStep(3); }}
            style={{ marginTop: 10, width: "100%", background: "#fff", color: T.sub, border: "1px solid #E0E0DD", borderRadius: 12, padding: "12px 0", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            Skip for now
          </button>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            {logoPrev ? (
              <img src={logoPrev} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 14, background: T.primarySoft, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22 }}>
                {(name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{name}</div>
              <div style={{ fontSize: 12.5, color: T.sub }}>{category}{city.trim() ? ` Â· ${city.trim()}` : ""}</div>
            </div>
          </div>
          {desc.trim() && <div style={{ fontSize: 13.5, color: T.sub, padding: "14px 0 2px" }}>{desc.trim()}</div>}

          <button onClick={launch} disabled={busy}
            style={{ marginTop: 20, width: "100%", background: busy ? "#F0A18E" : T.primary, color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: busy ? "default" : "pointer" }}>
            {busy ? "Creating your storeâ€¦" : "Launch my store"}
          </button>
        </Card>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 60px" }}>{children}</div>
    </div>
  );
}


