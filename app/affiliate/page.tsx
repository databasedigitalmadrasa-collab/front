"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IndianRupee, Users, TrendingUp, Award, Copy, CheckCircle2, Bell } from "lucide-react"
import { EarningsChart } from "@/components/affiliate/earnings-chart"
import { RecentReferrals } from "@/components/affiliate/recent-referrals"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"

interface PlatformUpdate {
  // ...
  id: number
  title: string
  message: string
  channel: string
  published: number
  created_at: string
  updated_at: string
}

export default function AffiliateDashboard() {
  const { user } = useUserAuth()
  const [copied, setCopied] = useState(false)
  const [updates, setUpdates] = useState<PlatformUpdate[]>([])
  const [loadingUpdates, setLoadingUpdates] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const { toast } = useToast()

  const referralCode = user?.affiliate?.referral_code || "LOADING"
  const referralLink = user?.affiliate?.referral_link || `https://digitalmadrasa.in/ref/${referralCode}`

  // Fetch full affiliate stats
  useEffect(() => {
    if (!user?.id) return;
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<any>(`/affiliates/stats/user/${user.id}`)
        if (response.success && response.data?.data) {
          setDashboardStats(response.data.data)
        }
      } catch (e) {
        console.error("Failed to load affiliate stats", e)
      }
    }
    fetchStats()
  }, [user?.id])

  // Use dashboardStats metrics if available
  const metrics = dashboardStats?.metrics || {}
  const rulesReferrals = metrics.referrals_count || user?.affiliate_stats?.total_referrals || 0
  const rulesEarnings = (metrics.total_commission_cents || user?.affiliate_stats?.total_earnings_cents || 0) / 100
  const totalLeads = metrics.referrals_count || 0;
  const converted = metrics.converted_count || 0;
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0.0";

  // ...

  const rank = dashboardStats?.affiliate?.rank || user?.affiliate_stats?.rank || 0;
  const rankDisplay = rank > 0 ? `#${rank}` : "-";

  const statsCards = [
    {
      label: "Total Earnings",
      value: `₹${rulesEarnings.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      badge: "+12.5% from last month",
      badgeColor: "bg-green-100 text-green-700",
    },
    {
      label: "Active Referrals",
      value: `${rulesReferrals}`,
      icon: Users,
      badge: "+23 this month",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      badge: "+3.2% increase",
      badgeColor: "bg-green-100 text-green-700",
    },
    { label: "Your Rank", value: rankDisplay, icon: Award, badge: "Top 5%", badgeColor: "bg-purple-100 text-purple-700" },
  ]

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch("https://srv.digitalmadrasa.co.in/api/v1/platform-updates")
        const result = await response.json()

        if (result.success && result.items) {
          const filteredUpdates = result.items.filter(
            (update: PlatformUpdate) =>
              update.published === 1 &&
              (update.channel === "affiliates" || update.channel === "global" || update.channel === "system"),
          )
          setUpdates(filteredUpdates)
        }
      } catch (error) {
        console.error("Error fetching platform updates:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load platform updates",
        })
      } finally {
        setLoadingUpdates(false)
      }
    }

    fetchUpdates()
  }, [])

  const getUpdateColor = (channel: string) => {
    switch (channel) {
      case "global":
        return "bg-blue-500"
      case "system":
        return "bg-orange-500"
      case "affiliates":
        return "bg-purple-500"
      default:
        return "bg-gray-800"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-4 border-white/30 shadow-lg">
                <AvatarImage src={user?.profile_pic_url || ""} />
                <AvatarFallback className="bg-white text-[#0066ff] text-lg sm:text-xl font-bold">
                  {user?.full_name?.substring(0, 2).toUpperCase() || "AA"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-heading font-bold">
                {user ? `Welcome, ${user.full_name.split(' ')[0]}!` : "Welcome..."}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-white/20 text-white border-0 text-[10px] sm:text-xs">
                  Affiliate ID: #{referralCode}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCopyLink}
            className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 w-full sm:w-auto shadow-lg text-xs sm:text-base px-4 py-2 h-auto min-h-[40px]"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Share Referral Link</span>
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
          {statsCards
            .filter((card) => card && card.label)
            .map((card, index) => (
              <div key={index}>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold">{card.value}</div>
                <div className="text-[10px] sm:text-sm text-white/80 mt-0.5">{card.label}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Earnings Overview Chart */}
          <EarningsChart data={dashboardStats?.earning_overview_graph} />

          {/* Recent Referrals */}
          <RecentReferrals referrals={dashboardStats?.recent_referrals} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-4 sm:space-y-6">
          {/* Referral Link Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-heading font-bold text-gray-900 mb-3 sm:mb-4">
              Your Referral Link
            </h3>

            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 mb-3 sm:mb-4">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Share this link to earn commissions</p>
              <p className="text-xs sm:text-sm font-mono text-gray-900 break-all">
                {referralLink}
              </p>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-heading font-bold text-gray-900 mb-3 sm:mb-4">Performance Tips</h3>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Share on social media</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">Boost your reach by 3x</p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Create content</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">Blog posts convert better</p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Engage your audience</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">Personal touch matters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Updates */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-heading font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                Platform Updates
              </h3>
              <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs">{updates.length} New</Badge>
            </div>

            {loadingUpdates ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2 sm:gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : updates.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {updates.slice(0, 5).map((update) => (
                  <div key={update.id} className="flex gap-2 sm:gap-3">
                    <div className={`w-2 h-2 rounded-full ${getUpdateColor(update.channel)} mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">{update.title}</h4>
                        <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(update.created_at)}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-sm text-gray-600 leading-relaxed">{update.message}</p>
                      <Badge
                        variant="outline"
                        className="mt-1 text-[8px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5 capitalize"
                      >
                        {update.channel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500">No updates available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
