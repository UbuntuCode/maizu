"use client"

export default function Navbar() {
  return (
    <div style={styles.navbar}>
      <h3>Dashboard</h3>
      <p>Welcome back 👋</p>
    </div>
  )
}

const styles = {
  navbar: {
    padding: "20px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between"
  }
}