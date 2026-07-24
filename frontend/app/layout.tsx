import Footer from "@/components/layout/Footer";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider }     from "@/context/AuthContext";
import { CartProvider }     from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title:       "Maizu Business Hub",
  description: "South Africa's premier digital marketplace.",
  manifest:    "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Maizu" },
};

export const viewport: Viewport = {
  themeColor:   "#E8401C",
  width:        "device-width",
  initialScale: 1,
  viewportFit:  "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="apple-mobile-web-app-capable"          content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title"            content="Maizu" />
        <meta name="mobile-web-app-capable"                content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
          body { background: #F7F7F5; overflow-x: hidden; max-width: 100vw; }

          /* Prevent anything from escaping viewport width */
          #__next, [data-nextjs-scroll-focus-boundary] { overflow-x: hidden; }

          ::-webkit-scrollbar { width: 0; height: 0; }

          /* ── MOBILE — full width, no sidebar ── */
          .maizu-shell      { width: 100%; min-height: 100vh; }
          .maizu-header     { position: sticky; top: 0; z-index: 200; }
          .desktop-sidebar  { display: none !important; }
          .page-content     { width: 100%; padding-bottom: 72px; }
          .bottom-nav-wrapper { display: block; }

          /* Responsive grids */
          .product-grid  { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .store-grid    { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .category-grid { display: flex; overflow-x: auto; gap: 10px; padding-bottom: 4px; }
          .category-grid::-webkit-scrollbar { display: none; }
          .h-scroll      { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
          .h-scroll::-webkit-scrollbar { display: none; }

          /* ── TABLET (640px+) ── */
          @media (min-width: 640px) {
            .product-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
            .store-grid   { grid-template-columns: repeat(3, 1fr); gap: 12px; }
          }

          /* ── DESKTOP (1024px+) ── */
          @media (min-width: 1024px) {
            body { background: #EFEFED; }

            .maizu-shell {
              display: grid;
              grid-template-columns: 220px 1fr;
              grid-template-rows: 56px 1fr;
              grid-template-areas: "header header" "sidebar content";
              min-height: 100vh;
              overflow-x: hidden;
            }
            .maizu-header  { grid-area: header; }
            .desktop-sidebar {
              grid-area: sidebar;
              display: flex !important;
              flex-direction: column;
              background: #fff;
              border-right: 0.5px solid #E4E4E7;
              padding: 16px 0;
              position: sticky;
              top: 56px;
              height: calc(100vh - 56px);
              overflow-y: auto;
            }
            .page-content {
              grid-area: content;
              max-width: 1100px;
              padding: 24px 32px 40px;
              padding-bottom: 40px; /* no bottom nav on desktop */
            }
            .bottom-nav-wrapper { display: none !important; }

            .product-grid  { grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .store-grid    { grid-template-columns: repeat(4, 1fr); gap: 14px; }
            .category-grid { display: grid; grid-template-columns: repeat(8,1fr); gap: 10px; overflow: visible; }
          }

          @media (min-width: 1440px) {
            .maizu-shell   { grid-template-columns: 240px 1fr; }
            .page-content  { max-width: 1280px; }
            .product-grid  { grid-template-columns: repeat(5, 1fr); }
          }

          /* Animations */
          @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          @keyframes spin    { to { transform: rotate(360deg); } }
          @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ServiceWorkerRegistration />
              {children}
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
