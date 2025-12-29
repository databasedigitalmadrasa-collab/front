"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Users,
  Settings,
  X,
  LogOut,
  UserCog,
  BookOpen,
  Upload,
  Award,
  CreditCard,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  Activity,
  Gift,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { logout, admin } = useAuth()

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Manage Courses", icon: BookOpen, href: "/admin/courses" },
    { name: "Media Library", icon: Upload, href: "/admin/media" },

    // Admin & User Management
    { name: "Manage Admins", icon: UserCog, href: "/admin/admins" },
    { name: "Manage Users", icon: Users, href: "/admin/users" },
    { name: "Manage KYC", icon: Users, href: "/admin/manage-kyc" },
    { name: "Manage Mentors", icon: Award, href: "/admin/mentors" },

    // Business Management
    { name: "Manage Plans", icon: ClipboardList, href: "/admin/plans" },
    { name: "Manage Subscriptions", icon: CreditCard, href: "/admin/subscriptions" },
    { name: "Payout Requests", icon: TrendingUp, href: "/admin/payouts" },

    // Support & Engagement
    { name: "Support Requests", icon: AlertCircle, href: "/admin/support-requests" },
    { name: "Referrals", icon: Gift, href: "/admin/referrals" },

    // Content Management
    { name: "Certificates", icon: Award, href: "/admin/certificates" },
    { name: "Platform Updates", icon: Bell, href: "/admin/platform-updates" }, // Added Platform Updates navigation item
    { name: "Logs", icon: Activity, href: "/admin/logs" },

    // Settings
    { name: "Settings", icon: Settings, href: "/admin/settings" },
  ]

  const handleLogout = () => {
    logout()
    onClose?.()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/logo/logo_icon.png"
                  alt="Digital Madrasa Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-heading font-bold text-lg text-[#150101]">Admin Panel</span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-all ${isActive ? "bg-[#0066ff]/10 text-[#0066ff] font-medium" : "text-[#4b4b4b] hover:bg-gray-50"
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
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback className="bg-[#0066ff] text-white">
                {admin ? getInitials(admin.name) : "SA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#150101] truncate">{admin?.name || "Admin User"}</p>
              <p className="text-xs text-[#4b4b4b] capitalize">{admin?.role || "Administrator"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
