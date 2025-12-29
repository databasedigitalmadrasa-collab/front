"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { useUserAuth } from "@/hooks/use-user-auth"

const isDevelopment = process.env.NODE_ENV === "development"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, isStudent, isLoading } = useUserAuth()
  const router = useRouter()

  useEffect(() => {
    if (isDevelopment) {
      return
    }

    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (!isStudent) {
        router.push("/login")
      }
    }
  }, [isAuthenticated, isStudent, isLoading, router])

  if (!isDevelopment && (isLoading || !isAuthenticated || !isStudent)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
