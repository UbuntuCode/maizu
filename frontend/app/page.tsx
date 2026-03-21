"use client"

import { useEffect, useState } from "react"

export default function Home() {
const [message, setMessage] = useState("Loading...")

useEffect(() => {
fetch("http://localhost:5000/api/test")
.then(res => res.json())
.then(data => setMessage(data.message))
}, [])

return '('

const name = "MAIZU" 
{message}

')'
}