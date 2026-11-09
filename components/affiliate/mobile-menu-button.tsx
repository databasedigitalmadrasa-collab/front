"use client"

import { Menu } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AffiliateSidebar } from "./sidebar"

export function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200/70 bg-white/90 px-4 backdrop-blur">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="shrink-0 bg-white shadow-sm border-gray-200 hover:bg-gray-50"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </Button>

        <Link href="/affiliate" className="flex min-w-0 items-center gap-2.5">
          <Image src="/logo/logo_icon.png" alt="Digital Madrasa Logo" width={36} height={36} className="shrink-0" />
          <div className="min-w-0 leading-tight">
            <span className="block truncate font-heading text-base font-bold text-gray-900">Digital Madrasa</span>
            <span className="block text-xs text-gray-500">Affiliate Panel</span>
          </div>
        </Link>
      </header>

      <AffiliateSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
