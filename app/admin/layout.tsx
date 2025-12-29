"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { isAuthenticated } from "@/lib/auth"

const isDevelopment = process.env.NODE_ENV === "development"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isDevelopment) {
      console.log("Development mode: skipping authentication")
      setIsChecking(false)
      return
    }

    const checkAuth = () => {
      console.log("Checking admin authentication")
      const authenticated = isAuthenticated()

      if (!authenticated) {
        console.log("Not authenticated, redirecting to login")
        router.push("/admin-login")
      } else {
        console.log("Admin authenticated")
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (!isDevelopment && isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#4b4b4b]">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
