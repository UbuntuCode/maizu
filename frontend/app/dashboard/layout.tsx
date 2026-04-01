"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { logout } from "@/utils/auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* SIDEBAR */}
      <aside
        style={{
          width: "250px",
          background: "#0f172a",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div>
          <h2 style={{ marginBottom: "30px" }}>MAIZU 🚀</h2>

          <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            
            <Link href="/dashboard" style={{ color: "white" }}>
              Dashboard
            </Link>

            <Link href="/dashboard/create-product" style={{ color: "white" }}>
              Create Product
            </Link>

            <Link href="/dashboard/products" style={{ color: "white" }}>
              Products
            </Link>

          </nav>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          style={{
            padding: "10px",
            background: "#ef4444",
            border: "none",
            color: "white",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          padding: "20px",
          background: "#f8fafc"
        }}
      >
        {children}
      </main>
    </div>
  )
}