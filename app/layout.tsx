import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
})

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
    "url": "https://digitalmadrasa.co.in",
    "logo": "https://digitalmadrasa.co.in/logo/logo_icon.png",
    "sameAs": [
      "https://www.facebook.com/share/1BEuZBeuvQ/?mibextid=wwXIfr",
      "https://www.instagram.com/digitalmadrasa?igsh=enNhanB5OXdiMTR6",
      "https://youtube.com/@digitalmadarsa?si=f-s-ybSYzLioYKxJ"
    ]
  };

  return (
    <html lang="en">
      <head>
        <Script src="https://mercury.phonepe.com/web/bundle/checkout.js" strategy="beforeInteractive" />
      </head>
      <body className={`${plusJakartaSans.variable} ${inter.variable} font-body antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
