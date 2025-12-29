"use client"

import type React from "react"
import { AffiliateSidebar } from "@/components/affiliate/sidebar"
import { MobileMenuButton } from "@/components/affiliate/mobile-menu-button"

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#fafafa]">
      <div className="hidden lg:block">
        <AffiliateSidebar />
      </div>

      <div className="lg:hidden">
        <MobileMenuButton />
      </div>

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 lg:ml-64">{children}</main>
    </div>
  )
}
