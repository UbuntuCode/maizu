"use client"

import { useEffect, useState } from "react"

type Product = {
  id: number
  title: string
  description: string
  price: string
  image: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then(res => res.json())
      .then(data => setProducts(data.products))
      .catch(err => console.error(err))
  }, [])

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{
        fontSize: "28px",
        fontWeight: "bold",
        marginBottom: "25px"
      }}>
        Discover Products ✨
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "25px"
      }}>
        {products.map(product => (
          <div
            key={product.id}
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              background: "white",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            {/* IMAGE */}
            <div style={{
              overflow: "hidden",
              height: "220px"
            }}>
              <img
                src={product.image}
                alt={product.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.4s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)"
                }}
              />
            </div>

            {/* CONTENT */}
            <div style={{ padding: "16px" }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#111827"
              }}>
                {product.title}
              </h3>

              <p style={{
                fontSize: "13px",
                color: "#6b7280",
                height: "40px",
                overflow: "hidden"
              }}>
                {product.description}
              </p>

              {/* PRICE */}
              <div style={{
                marginTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#0f172a"
                }}>
                  R{product.price}
                </span>

                <button style={{
                  padding: "6px 12px",
                  background: "#0f172a",
                  color: "white",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12px",
                  cursor: "pointer"
                }}>
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}