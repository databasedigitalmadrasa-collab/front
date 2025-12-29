"use client"

import { Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminTopbarProps {
  onMenuClick: () => void
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-[#150101] font-heading">Admin Dashboard</h1>
      </div>

      
    </header>
  )
}
