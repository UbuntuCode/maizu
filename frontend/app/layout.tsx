import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider }      from "@/context/AuthContext";
import { CartProvider }      from "@/context/CartContext";
import { WishlistProvider }  from "@/context/WishlistContext";
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
  maximumScale: 1,
  userScalable: false,
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
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ServiceWorkerRegistration />
              <div style={{
                maxWidth:   430,
                margin:     "0 auto",
                minHeight:  "100vh",
                position:   "relative",
                background: "#F5F5F5",
              }}>
                {children}
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
