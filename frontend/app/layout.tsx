import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider }     from "@/context/AuthContext";
import { CartProvider }     from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";


export const metadata: Metadata = {
  title:       "Maizu Business Hub",
  description: "South Africa's premier digital marketplace connecting local vendors and buyers.",
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
        <meta name="apple-mobile-web-app-capable"          content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title"            content="Maizu" />
        <meta name="mobile-web-app-capable"                content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }

          body { background: #F7F7F5; }

          /* ── Responsive container ── */
          .maizu-shell {
            width: 100%;
            min-height: 100vh;
            position: relative;
          }

          /* ── Bottom nav: hidden on desktop ── */
          .bottom-nav-wrapper {
            display: block;
          }

          /* ── Desktop sidebar nav ── */
          .desktop-sidebar {
            display: none;
          }

          /* ── Content area ── */
          .page-content {
            width: 100%;
          }

          /* ── Scrollbar ── */
          ::-webkit-scrollbar { width: 0; height: 0; }

          /* ── Product grid responsive ── */
          .product-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          /* ── Category grid ── */
          .category-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }

          /* ── Store grid ── */
          .store-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          /* ── Horizontal scroll strip ── */
          .h-scroll {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .h-scroll::-webkit-scrollbar { display: none; }

          /* ── TABLET (640px+) ── */
          @media (min-width: 640px) {
            .product-grid  { grid-template-columns: repeat(3, 1fr); gap: 14px; }
            .category-grid { grid-template-columns: repeat(5, 1fr); gap: 12px; }
            .store-grid    { grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .banner-height { height: 220px !important; }
            .page-pad      { padding: 0 24px; }
          }

          /* ── DESKTOP (1024px+) ── */
          @media (min-width: 1024px) {
            body { background: #F0F0EE; }

            .maizu-shell {
              display: grid;
              grid-template-columns: 220px 1fr;
              grid-template-rows: 64px 1fr;
              grid-template-areas:
                "header header"
                "sidebar content";
              min-height: 100vh;
            }

            .maizu-header   { grid-area: header; }
            .desktop-sidebar {
              grid-area: sidebar;
              display: flex !important;
              flex-direction: column;
              background: #fff;
              border-right: 0.5px solid #E4E4E7;
              padding: 20px 0;
              position: sticky;
              top: 64px;
              height: calc(100vh - 64px);
              overflow-y: auto;
            }
            .page-content { grid-area: content; max-width: 1100px; padding: 24px 32px; }
            .bottom-nav-wrapper { display: none !important; }

            .product-grid  { grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .category-grid { grid-template-columns: repeat(8, 1fr); gap: 10px; }
            .store-grid    { grid-template-columns: repeat(4, 1fr); gap: 14px; }
            .banner-height { height: 260px !important; }
            .h-scroll      { flex-wrap: wrap; overflow-x: visible; }

            /* On desktop, product cards in h-scroll wrap */
            .h-scroll-card { width: calc(20% - 10px) !important; }
            .page-pad      { padding: 0; }
          }

          /* ── XL DESKTOP (1440px+) ── */
          @media (min-width: 1440px) {
            .maizu-shell { grid-template-columns: 240px 1fr; }
            .page-content { max-width: 1280px; }
            .product-grid { grid-template-columns: repeat(5, 1fr); }
          }

          /* Smooth image loading */
          img { transition: opacity 0.2s; }
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ServiceWorkerRegistration />
              
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
