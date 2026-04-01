"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveToken } from "@/utils/auth"

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      alert("Please fill in all fields ❌")
      return
    }

    try {
      setLoading(true)

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      console.log("LOGIN RESPONSE:", data)

      if (!res.ok) {
        alert(data.message || "Login failed ❌")
        return
      }

      if (!data.token) {
        alert("No token returned ❌")
        return
      }

      saveToken(data.token)

      console.log("TOKEN SAVED:", data.token)

      alert("Login successful ✅")

      router.push("/dashboard")

    } catch (error) {
      console.error(error)
      alert("Login failed ❌")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      
      {/* 🔥 DEBUG HEADER */}
      <h1 style={{ color: "red" }}>LOGIN PAGE</h1>

      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  )
}