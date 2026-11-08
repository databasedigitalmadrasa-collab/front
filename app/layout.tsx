import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
// Self-hosted rather than next/font/google, which fetches from Google during
// the build and failed a production build when that fetch did. See fonts.css.
import "./fonts.css"
import "./globals.css"
import SecurityProvider from "@/components/security-provider"

export const metadata: Metadata = {
  title: "Digital Madrasa - Transform into a Global Freelancer in 90 Days",
  description: "Learn 5 high-paying digital skills with AI integration. From Content Creation to WordPress, become market-ready for international clients.",
  keywords: [
    "digital marketing",
    "freelancing",
    "content creation",
    "wordpress",
    "email marketing",
    "social media",
    "AI training",
    "online education",
    "digitalmadarsa",
    "digitalmadrasa",
  ],
  authors: [{ name: "Digital Madrasa" }],
  creator: "Digital Madrasa",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Digital Madrasa",
    title: "Digital Madrasa - Transform into a Global Freelancer in 90 Days",
    description:
      "Learn 5 high-paying digital skills with AI integration. From Content Creation to WordPress, become market-ready for international clients.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Madrasa - Transform into a Global Freelancer in 90 Days",
    description: "Learn 5 high-paying digital skills with AI integration. From Content Creation to WordPress, become market-ready for international clients.",
  },
  icons: {
    icon: '/logo/logo_icon.png',
    apple: '/logo/logo_icon.png',
  },
  generator: 'Digital Madrasa'
}

export const viewport = {
  themeColor: "#0066ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Digital Madarsa",
    "url": "https://digitalmadrasa.in",
    "logo": "https://digitalmadrasa.in/logo/logo_icon.png",
    "sameAs": [
      "https://www.facebook.com/share/1BEuZBeuvQ/?mibextid=wwXIfr",
      "https://www.instagram.com/digitalmadrasa?igsh=enNhanB5OXdiMTR6",
      "https://youtube.com/@digitalmadarsa?si=f-s-ybSYzLioYKxJ"
    ]
  };

  return (
    <html lang="en">
      <head>
        {/* The Latin files every page needs, as next/font preloaded them. */}
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      </head>
      <body className="site-fonts font-body antialiased">
        <SecurityProvider />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
