/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /* Allow Next.js Image component to optimize Unsplash + Cloudinary images */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    /* Generates WebP/AVIF automatically, served at the right size */
    formats: ["image/avif", "image/webp"],
  },

  /* Reduce legacy JS bloat — only target modern browsers */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

module.exports = nextConfig;
