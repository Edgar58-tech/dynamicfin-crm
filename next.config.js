/** @type {import('next').NextConfig} */
const nextConfig = {
  // Asegura que la carpeta de build sea siempre .next
  distDir: ".next",
  // Desactiva cualquier feature experimental que pueda romper en Vercel
  experimental: {},
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;