/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Fix workspace root warning (VERY IMPORTANT for your setup)
  turbopack: {
    root: __dirname,
  },

  // Enable external images (for Cloudinary later)
  images: {
    domains: ["res.cloudinary.com"],
  },
}

module.exports = nextConfig