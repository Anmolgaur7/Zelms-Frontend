/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces .next/standalone + .next/static for a slim Docker runner image.
  // No effect on `next dev` / Vercel — only changes the `next build` output.
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
