/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Self-hosted fonts (app/fonts.css). public/ files are otherwise revalidated
  // on every page load; these never change in place (a changed font gets a
  // new file name), so let browsers and the CDN keep them for a year.
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },
}

export default nextConfig
