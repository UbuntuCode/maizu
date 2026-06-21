/* ════════════════════════════════════════════════════════════
   CAROUSEL DOTS — REPLACE in frontend/app/page.tsx

   Find this block (the banner dot indicators):
════════════════════════════════════════════════════════════ */

{/* OLD — no accessible name */}
{/*
<div style={{ position:"absolute", bottom:12, right:14, display:"flex", gap:5 }}>
  {AD_BANNERS.map((_,i) => (
    <button key={i} onClick={e => { e.stopPropagation(); setBannerIdx(i); }}
      style={{ width:i===bannerIdx?18:6, height:6, borderRadius:3, background:i===bannerIdx?"#fff":"rgba(255,255,255,0.35)", border:"none", cursor:"pointer", padding:0, transition:"all 0.3s" }} />
  ))}
</div>
*/}

{/* NEW — adds aria-label + larger hit area while keeping visual size */}
<div role="tablist" aria-label="Promotional banners" style={{ position:"absolute", bottom:12, right:14, display:"flex", gap:5 }}>
  {AD_BANNERS.map((banner, i) => (
    <button
      key={i}
      role="tab"
      aria-label={`Show banner ${i + 1} of ${AD_BANNERS.length}: ${banner.headline}`}
      aria-selected={i === bannerIdx}
      onClick={e => { e.stopPropagation(); setBannerIdx(i); }}
      style={{
        width: i === bannerIdx ? 18 : 6,
        height: 6,
        borderRadius: 3,
        background: i === bannerIdx ? "#fff" : "rgba(255,255,255,0.35)",
        border: "none",
        cursor: "pointer",
        padding: 8,            /* enlarges touch target to ~22px without changing visual dot size */
        margin: -8,            /* offsets the padding so layout doesn't shift */
        transition: "all 0.3s",
      }}
    />
  ))}
</div>

/* ════════════════════════════════════════════════════════════
   BOTTOM NAV — same fix if any icon-only buttons lack aria-label.
   In BottomNav.tsx, each tab button already has visible text
   labels ("Home", "Discover" etc.) so those are fine for
   accessibility — no change needed there.
════════════════════════════════════════════════════════════ */
