"use client"

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
    window.location.href = "/login"
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
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
          <h2>MAIZU 🚀</h2>

          <p style={{ cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
            Dashboard
          </p>

          <p style={{ cursor: "pointer" }} onClick={() => window.location.href = "/dashboard/create-product"}>
            Create Product
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: "#ef4444",
            color: "white",
            padding: "10px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </aside>

      {/* Main */}
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