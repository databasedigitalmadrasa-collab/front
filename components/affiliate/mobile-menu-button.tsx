"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AffiliateSidebar } from "./sidebar"

export function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 bg-white shadow-lg border-gray-200 hover:bg-gray-50"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </Button>

      <AffiliateSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
