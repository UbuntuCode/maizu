# Maizu Vendor Fix Package

## 1. Copy these files into your project

| File in this zip | Goes to (replace if it exists) |
|---|---|
| `frontend/components/layout/Logo.tsx` | `frontend/components/layout/Logo.tsx` (new) |
| `frontend/components/layout/DesktopSidebar.tsx` | `frontend/components/layout/DesktopSidebar.tsx` (replace) |
| `frontend/app/dashboard/page.tsx` | `frontend/app/dashboard/page.tsx` (replace) |
| `frontend/app/dashboard/create-product/page.tsx` | `frontend/app/dashboard/create-product/page.tsx` (new folder) |
| `frontend/app/dashboard/orders/page.tsx` | `frontend/app/dashboard/orders/page.tsx` (replace or new) |
| `frontend/app/dashboard/open-store/page.tsx` | `frontend/app/dashboard/open-store/page.tsx` (new folder) |

## 2. Delete the old useless pages

In PowerShell, from your project root:

```powershell
# Old "Discover Products" desktop page — delete whichever of these exist:
Remove-Item -Recurse -Force frontend\app\discover -ErrorAction SilentlyContinue
```

(Keep `frontend/app/discovery` — that's the real video Discover feed.)

## 3. One-time Cloudinary setup (2 minutes, needed for product photos)

1. Log into cloudinary.com (cloud: ddjf6z9dv)
2. Settings → Upload → Upload presets → **Add upload preset**
3. Signing mode: **Unsigned**, name it exactly: `maizu_unsigned`
4. Save.

If you already have an unsigned preset with a different name, open
`frontend/app/dashboard/create-product/page.tsx` and change the
`UPLOAD_PRESET` constant at the top.

## 4. If updating order status fails with a permissions error

That means Supabase Row Level Security is blocking vendors from updating
orders. Run this once in Supabase → SQL Editor:

```sql
create policy "Vendors update orders for their stores"
on orders for update
using (
  exists (
    select 1 from order_items oi
    join stores s on s.id = oi.store_id
    where oi.order_id = orders.id
      and s.owner_id = auth.uid()
  )
);
```

## 5. The old dark-blue app with emojis (your first 3 screenshots)

That window is an OLD cached copy of Maizu installed as a desktop app —
it no longer exists in your code. To remove it:

1. Open that window → click the three-dot menu in its title bar → **Uninstall Maizu Business Hub**
2. Open Chrome → go to maizu.vercel.app → F12 → Application tab →
   Service Workers → **Unregister**, then Clear storage → **Clear site data**
3. Hard refresh with Ctrl+Shift+R
4. (Optional) Reinstall the app from the install icon in Chrome's address bar —
   it will now install the current design.

## 6. Push to deploy

```powershell
cd C:\Users\Sinethamba\maizu
git add .
git commit -m "Vendor dashboard redesign, orders fix, open-store fix, brand logo"
git push origin main --force
```
