"use client"

import { useEffect, useState } from "react"
import {
  Users,
  IndianRupee,
  UserCheck,
  Wallet,
  UserPlus,
  Clock,
  TrendingUp,
  GraduationCap,
  CreditCard,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface AdminTotals {
  total_users: number
  total_learners: number
  total_affiliates: number
  active_subscriptions: number
  total_revenue_cents: number
  affiliates_total_earnings_cents: number
  pending_referrals: number
  pending_payouts_count: number
  pending_payouts_total_cents: number
  todays_signups: number
}

interface RecentSignup {
  id: number
  full_name: string
  email: string
  created_at: string
}

interface RecentPayment {
  id: number
  user_id: number
  amount_cents: number
  subscription_status: string
  order_id: string
  created_at: string
}

interface AdminStats {
  totals: AdminTotals
  recent_signups: RecentSignup[]
  recent_payments: RecentPayment[]
}

const formatCurrency = (cents: number): string => {
  const rupees = cents / 100
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)}L`
  } else if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}K`
  }
  return `₹${rupees.toLocaleString("en-IN")}`
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString.replace(" ", "T"))
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

export default function AdminDashboardPage() {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await apiClient.get("/admin/stats")
        if (response.success && response.data?.data) {
          setAdminStats(response.data.data)
        } else if (response.success && response.data?.totals) {
          // Fallback if data is directly in response.data
          setAdminStats(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminStats()
  }, [])

  const stats = adminStats || {
    totals: {
      total_users: 0,
      total_learners: 0,
      total_affiliates: 0,
      active_subscriptions: 0,
      total_revenue_cents: 0,
      affiliates_total_earnings_cents: 0,
      pending_referrals: 0,
      pending_payouts_count: 0,
      pending_payouts_total_cents: 0,
      todays_signups: 0,
    },
    recent_signups: [],
    recent_payments: [],
  }

  const statsCards = [
    {
      label: "Total Users",
      value: stats.totals.total_users?.toLocaleString() || "0",
      icon: Users,
      badge: `${stats.totals.todays_signups || 0} signups today`,
      trend: "up",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Learners",
      value: stats.totals.total_learners?.toLocaleString() || "0",
      icon: GraduationCap,
      badge: "Active learners",
      trend: "up",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Total Revenue",
      value: stats.totals.total_revenue_cents ? formatCurrency(stats.totals.total_revenue_cents) : "₹0",
      icon: IndianRupee,
      badge: "Lifetime earnings",
      trend: "up",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Active Affiliates",
      value: stats.totals.total_affiliates?.toLocaleString() || "0",
      icon: UserCheck,
      badge: `${stats.totals.pending_referrals || 0} pending referrals`,
      trend: "up",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Pending Payouts",
      value: stats.totals.pending_payouts_total_cents ? formatCurrency(stats.totals.pending_payouts_total_cents) : "₹0",
      icon: Wallet,
      badge: `${stats.totals.pending_payouts_count || 0} requests`,
      trend: "neutral",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Active Subscriptions",
      value: stats.totals.active_subscriptions?.toLocaleString() || "0",
      icon: UserPlus,
      badge: "Currently active",
      trend: "up",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
  ]

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8 text-white shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-white/90">Manage and monitor Digital Madrasa platform performance</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
              {stats.totals.total_users?.toLocaleString() || "0"}
            </div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">Total Users</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
              {stats.totals.total_revenue_cents ? formatCurrency(stats.totals.total_revenue_cents) : "₹0"}
            </div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">Total Revenue</div>
          </div>
          <div className="col-span-2 lg:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
              {stats.totals.active_subscriptions?.toLocaleString() || "0"}
            </div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">Active Subscriptions</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${card.iconColor}`} />
                </div>
                {card.trend === "up" && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">Growth</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading">{card.value}</p>
                <p className="text-xs text-gray-500 mt-2">{card.badge}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Signups */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Recent Signups</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Latest user registrations</p>
          </div>

          <div className="divide-y divide-gray-100">
            {stats.recent_signups && stats.recent_signups.length > 0 ? (
              stats.recent_signups.map((signup) => (
                <div key={signup.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                      {signup.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{signup.full_name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{signup.email}</p>

                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No recent signups</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Recent Payments</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Latest transactions</p>
          </div>

          <div className="divide-y divide-gray-100">
            {stats.recent_payments && stats.recent_payments.length > 0 ? (
              stats.recent_payments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">User #{payment.user_id}</p>

                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{payment.order_id}</p>

                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No recent payments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
