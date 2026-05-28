# MAIZU FRONTEND — COMPLETE SETUP GUIDE
# Follow every step in order. Do not skip any step.

================================================================
STEP 1 — DELETE THESE FILES/FOLDERS INSIDE frontend/
================================================================

Delete these because they conflict or are wrong:

  ❌ next.config.js          (keep only next.config.ts)
  ❌ components/ui/icon.tsx  (the singular one — keep icons.tsx)
  ❌ public/app.js
  ❌ public/index.html
  ❌ public/manifest.json
  ❌ public/style.css
  ❌ public/sw.js
  ❌ utils/supabase.js       (replace with utils/supabase.ts below)
  ❌ utils/auth.ts           (leave empty or replace with the one below)

  Any empty page.tsx files that just say "Live" or placeholder text.

================================================================
STEP 2 — YOUR FINAL FILE STRUCTURE (every file listed)
================================================================

frontend/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          ← redirects to /
│   ├── discover/
│   │   └── page.tsx          ← video feed page
│   ├── live/
│   │   └── page.tsx          ← live streams page
│   ├── login/
│   │   └── page.tsx          ← login form
│   ├── profile/
│   │   └── page.tsx          ← user profile
│   ├── register/
│   │   └── page.tsx          ← register form
│   ├── stores/
│   │   └── page.tsx          ← store directory
│   ├── favicon.ico           ← keep existing
│   ├── globals.css           ← REPLACE with new one
│   ├── layout.tsx            ← REPLACE with new one
│   └── page.tsx              ← REPLACE with new one (Mall homepage)
│
├── components/
│   ├── cards/                ← leave empty for now (future use)
│   ├── home/                 ← leave empty for now (future use)
│   ├── layout/
│   │   └── Header.tsx        ← REPLACE with new one
│   ├── navigation/
│   │   └── BottomNav.tsx     ← REPLACE with new one
│   ├── stores/
│   │   └── StoreCard.tsx     ← ADD this new file
│   └── ui/
│       ├── Bell.tsx          ← REPLACE with new one
│       ├── Footer.tsx        ← REPLACE with new one
│       ├── icons.tsx         ← REPLACE with new one
│       └── Logo.tsx          ← REPLACE with new one
│
├── public/
│   └── (leave empty — Next.js manages this)
│
├── utils/
│   ├── auth.ts               ← keep or replace
│   ├── constants.ts          ← REPLACE with new one
│   └── supabase.ts           ← rename supabase.js → supabase.ts
│
├── .gitignore                ← keep existing
├── eslint.config.mjs         ← keep existing
├── next-env.d.ts             ← keep existing (auto-generated)
├── next.config.ts            ← REPLACE with new one
├── package.json              ← keep existing
├── postcss.config.mjs        ← keep existing
├── README.md                 ← keep existing
└── tsconfig.json             ← REPLACE with new one

================================================================
STEP 3 — REPLACE tsconfig.json (most critical fix)
================================================================

The bug: your old tsconfig had "@/*": ["./src/*"]
But you have NO src/ folder. Fix it to point to "./*"

REPLACE your entire tsconfig.json with this:

{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

================================================================
STEP 4 — REPLACE next.config.ts
================================================================

import type { NextConfig } from "next";
const nextConfig: NextConfig = { reactStrictMode: true };
export default nextConfig;

================================================================
STEP 5 — REPLACE utils/supabase.js → utils/supabase.ts
================================================================

Rename supabase.js to supabase.ts and use this content:

import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

================================================================
STEP 6 — RUN THESE COMMANDS in your frontend/ folder
================================================================

# Delete the broken .next cache (always do this after config changes)
rm -rf .next

# Install dependencies (if you haven't already)
npm install

# Start the dev server
npm run dev

# App will be at: http://localhost:3000

================================================================
STEP 7 — IMPORT PATHS REFERENCE
================================================================

All your imports use @/ which maps to the frontend/ root.

CORRECT imports to use in every file:
  import { C }          from "@/utils/constants";
  import Logo           from "@/components/ui/Logo";
  import Bell           from "@/components/ui/Bell";
  import Footer         from "@/components/ui/Footer";
  import Header         from "@/components/layout/Header";
  import BottomNav      from "@/components/navigation/BottomNav";
  import StoreCard      from "@/components/stores/StoreCard";
  import { supabase }   from "@/utils/supabase";
  import { HeartIc }    from "@/components/ui/icons";

WRONG (do NOT use relative paths like these):
  import Logo from "../../components/ui/Logo";    ← WRONG
  import { C } from "../utils/constants";          ← WRONG

================================================================
STEP 8 — COMMON ERRORS AND FIXES
================================================================

ERROR: Module not found: Can't resolve '@/...'
FIX:   Check tsconfig.json — paths must be "@/*": ["./*"]
       Then delete .next/ and restart npm run dev

ERROR: React is not defined
FIX:   Add  import React from "react";  at top of every .tsx file

ERROR: 'apostrophe' or quote errors
FIX:   Replace  '  with  &apos;  inside JSX text
       Replace  "  with  &quot;  inside JSX text

ERROR: Type 'null' is not assignable
FIX:   Use  value!  (non-null assertion) or check  value ?? ""

ERROR: Cannot find module 'next/navigation'
FIX:   Make sure next is installed:  npm install next

================================================================
FILE COUNT SUMMARY
================================================================

Total files you need to have (excluding node_modules, .next):

  app/          8 files (layout, globals, page + 5 route pages)
  components/   7 files (Header, BottomNav, StoreCard, Bell, Footer, icons, Logo)
  utils/        3 files (constants, auth, supabase)
  root/         6 files (tsconfig, next.config, package.json, postcss, eslint, next-env)

  TOTAL: 24 files

================================================================
