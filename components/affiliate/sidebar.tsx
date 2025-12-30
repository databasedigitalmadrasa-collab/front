"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  DollarSign,
  Trophy,
  Users,
  HelpCircle,
  X,
  LogOut,
  GraduationCap,
  Wallet,
  BookOpen,
  Settings2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUserAuth } from "@/hooks/use-user-auth"

interface AffiliateSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AffiliateSidebar({ isOpen = true, onClose }: AffiliateSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUserAuth()

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/affiliate" },
    { name: "My Earnings", icon: DollarSign, href: "/affiliate/earnings" },
    { name: "My Skills", icon: BookOpen, href: "/affiliate/my-skills" },
    { name: "Leaderboard", icon: Trophy, href: "/affiliate/leaderboard" },
    { name: "Referrals", icon: Users, href: "/affiliate/referrals" },
    { name: "Wallet", icon: Wallet, href: "/affiliate/wallet" },
  ]

  const bottomNavItems = [

    { name: "Settings", icon: Settings2Icon, href: "/affiliate/settings" },


    { name: "Support", icon: HelpCircle, href: "/affiliate/support" },
  ]

  const handleLogout = () => {
    logout()
  }

  const isMobileMode = !!onClose

  const getUserInitials = () => {
    if (!user?.full_name) return "U"
    return user.full_name.substring(0, 2).toUpperCase()
  }

  return (
    <>
      {isMobileMode && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${isMobileMode ? `z-50 ${isOpen ? "translate-x-0" : "-translate-x-full"}` : "z-10"
          }`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/affiliate" className="flex items-center gap-3" onClick={onClose}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/logo/logo_icon.png"
                  alt="Digital Madrasa Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-heading font-bold text-base block text-gray-900">Digital Madrasa</span>
                <span className="text-xs text-gray-500">Affiliate Panel</span>
              </div>
            </Link>
            {isMobileMode && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200" />

          {/* Bottom Navigation */}
          <div className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              )
            })}

            {user?.is_student === 1 && (
              <Link
                href="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-[#0066ff] hover:bg-blue-50"
              >
                <GraduationCap className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Learning</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profile_pic_url || ""} />
              <AvatarFallback className="bg-[#0066ff] text-white">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </>
              ) : (
                <div className="bg-gray-200 h-8 w-full rounded animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}



