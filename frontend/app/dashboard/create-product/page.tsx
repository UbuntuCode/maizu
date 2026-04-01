"use client"

import { useState } from "react"
import { getToken } from "@/utils/auth"

export default function CreateProductPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState<File | null>(null)

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const token = getToken()

    if (!token) {
      alert("Login again ❌")
      return
    }

    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("price", price)

    if (image) {
      formData.append("image", image)
    }

    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      console.log("UPLOAD RESPONSE:", data)

      if (!res.ok) {
        alert(data.message)
        return
      }

      alert("Product created ✅")

      // clear form
      setTitle("")
      setDescription("")
      setPrice("")
      setImage(null)

    } catch (error) {
      console.error(error)
      alert("Upload failed ❌")
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Create Product</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br />

        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <br />

        <input
          type="file"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
        <br />

        <button type="submit">Upload Product</button>
      </form>
    </div>
  )
}
