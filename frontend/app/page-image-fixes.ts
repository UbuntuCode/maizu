/* ════════════════════════════════════════════════════════════
   REPLACE the AD_BANNER images in frontend/app/page.tsx

   1. Add this import at the top of the file:
      import Image from "next/image";

   2. Change every banner img URL to request a smaller size.
      Old: https://images.unsplash.com/photo-XXXX?w=900&q=80
      New: https://images.unsplash.com/photo-XXXX?w=480&q=70&auto=format

   3. Replace the <img> tag inside the banner div with <Image>:
════════════════════════════════════════════════════════════ */

const AD_BANNERS = [
  {
    tag: "SUMMER DEALS", headline: "Up to 40% off fashion",
    sub: "New arrivals from South African designers", cta: "Shop now",
    bg: "#1A1A2E", accent: "#E8401C",
    /* Smaller width, auto format = WebP/AVIF when supported */
    img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=480&q=70&auto=format&fit=crop",
    link: "/search?q=fashion",
  },
  {
    tag: "FRESH IN", headline: "New arrivals every day",
    sub: "Discover products from local SA vendors", cta: "Browse stores",
    bg: "#0D1B2A", accent: "#F59E0B",
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=480&q=70&auto=format&fit=crop",
    link: "/stores",
  },
  {
    tag: "HANDMADE IN SA", headline: "Support local crafters",
    sub: "Unique handmade goods from Mzansi artisans", cta: "Explore crafts",
    bg: "#1B1F1B", accent: "#10B981",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=480&q=70&auto=format&fit=crop",
    link: "/search?q=crafts",
  },
];

/* ── Banner JSX replacement ──────────────────────────────────
   Replace your existing:
     <img src={banner.img} alt={banner.headline} style={{ position:"absolute", inset:0, ... }} />
   with:
*/

/*
<div style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
  <Image
    src={banner.img}
    alt={banner.headline}
    fill
    priority           // tells Next.js this is above-the-fold — loads it first, sets fetchpriority="high"
    sizes="(max-width: 768px) 100vw, 480px"
    style={{ objectFit: "cover", opacity: 0.55 }}
  />
</div>
*/

/* ════════════════════════════════════════════════════════════
   CATEGORY ICONS — same fix
   Old: https://images.unsplash.com/photo-XXXX?w=200&q=75
   New: smaller request since these only render at ~56-68px
════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { label:"Fashion",     img:"https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&q=65&auto=format&fit=crop", q:"fashion"     },
  { label:"Electronics", img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&q=65&auto=format&fit=crop", q:"electronics" },
  { label:"Beauty",      img:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&q=65&auto=format&fit=crop", q:"beauty"      },
  { label:"Food",        img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=65&auto=format&fit=crop", q:"food"        },
  { label:"Home",        img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&q=65&auto=format&fit=crop",   q:"home"        },
  { label:"Sports",      img:"https://images.unsplash.com/photo-1517649763962-0c623066013b?w=100&q=65&auto=format&fit=crop", q:"sports"      },
  { label:"Art & Crafts",img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=100&q=65&auto=format&fit=crop", q:"crafts"      },
  { label:"Services",    img:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&q=65&auto=format&fit=crop", q:"services"    },
];

/* Category image JSX replacement — replace the <img> with: */
/*
<Image
  src={cat.img}
  alt={cat.label}
  fill
  sizes="68px"
  style={{ objectFit: "cover" }}
  loading="lazy"
/>
*/
