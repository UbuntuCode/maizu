import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Maizu Business Hub",
  description: "South Africa's premier business hub empowering entrepreneurs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <div style={{
              maxWidth: 430,
              margin: "0 auto",
              minHeight: "100vh",
              position: "relative",
              background: "#F5F5F5",
            }}>
              {children}
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
