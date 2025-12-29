"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, BookOpen, Award, CreditCard, Settings, HelpCircle, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUserAuth } from "@/hooks/use-user-auth"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUserAuth()

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "My Skills", icon: BookOpen, href: "/dashboard/skills" },
    { name: "Certificates", icon: Award, href: "/dashboard/certificates" },
    { name: "Billing", icon: CreditCard, href: "/dashboard/billing" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
    { name: "Support", icon: HelpCircle, href: "/dashboard/support" },
  ]

  const handleLogout = () => {
    logout()
  }

  const getUserInitials = () => {
    if (!user?.full_name) return "U"
    const names = user.full_name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0].substring(0, 2).toUpperCase()
  }

  const getUserRole = () => {
    if (user?.is_affiliate === 1 && user?.is_student === 1) return "Student & Affiliate"
    if (user?.is_affiliate === 1) return "Affiliate"
    if (user?.is_student === 1) return "Student"
    return "Learner"
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/logo/logo_icon.png"
                  alt="Digital Madrasa Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-heading font-bold text-lg">Digital Madrasa</span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-all ${isActive ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-all text-red-600 hover:bg-red-50 mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {user?.profile_pic_url && (
                <AvatarImage src={user.profile_pic_url || "/placeholder.svg"} alt={user?.full_name || "User"} />
              )}
              <AvatarFallback className="bg-[#0066ff] text-white text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-gray-500">{getUserRole()}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
