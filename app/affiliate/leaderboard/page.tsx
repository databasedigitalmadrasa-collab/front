"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrendingUp, Loader2, Trophy, Medal, Award } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface LeaderboardItem {
  affiliate_id: number
  user_id: number
  full_name: string
  email: string
  total_conversions: number
  total_referral_amount_cents: number
  total_commission_cents: number
  link_clicks: number
  total_referrals: number
  total_converted: number
  total_earnings_cents: number
}

type Period = "weekly" | "monthly" | "alltime"

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("alltime")
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.get<{
          success: boolean
          period: string
          type: string
          limit: number
          items: LeaderboardItem[]
        }>(`/affiliates/leaderboard?period=${period}&type=amount&limit=10`)

        if (response.success && response.data?.items) {
          setLeaderboard(response.data.items)
        } else {
          setError(response.message || "Failed to fetch leaderboard")
        }
      } catch (err) {
        setError("An error occurred while fetching leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [period])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "weekly":
        return "This Week"
      case "monthly":
        return "This Month"
      case "alltime":
        return "All Time"
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold">Leaderboard</h1>
              </div>
              <p className="text-white/90 text-sm sm:text-base">
                Top 10 performing affiliates - {getPeriodLabel(period)}
              </p>
            </div>

            {/* Period Filter */}
            <div className="flex gap-2 flex-wrap">
              {(["weekly", "monthly", "alltime"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${period === p
                      ? "bg-white text-[#0066ff]"
                      : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  {getPeriodLabel(p)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Card */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-heading text-gray-900">Top Affiliates</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#0066ff] animate-spin" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No leaderboard data available</div>
                ) : (
                  leaderboard.map((affiliate, index) => {
                    const rank = index + 1
                    return (
                      <div
                        key={affiliate.affiliate_id}
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all ${rank <= 3
                            ? "bg-gradient-to-r from-[#0066ff]/5 to-transparent border-[#0066ff]/20 hover:border-[#0066ff]/40"
                            : "bg-gray-50/50 border-gray-200 hover:bg-gray-100/50"
                          }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {/* Rank */}
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl rounded-xl flex-shrink-0 ${rank <= 3 ? "bg-[#0066ff] text-white shadow-md" : "bg-gray-200 text-gray-700"
                              }`}
                          >
                            {getRankIcon(rank) || rank}
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white shadow-sm flex-shrink-0">
                            <AvatarFallback
                              className={`${rank <= 3 ? "bg-[#0066ff] text-white" : "bg-gray-100 text-gray-700"} font-semibold`}
                            >
                              {affiliate.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>

                          {/* Name & Stats */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                              {affiliate.full_name || "Affiliate"}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {affiliate.total_conversions} conversions
                            </p>
                          </div>
                        </div>

                        {/* Earnings */}
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`text-base sm:text-xl font-bold ${rank <= 3 ? "text-[#0066ff]" : "text-gray-900"}`}>
                            {formatCurrency(affiliate.total_earnings_cents)}
                          </p>
                          <p className="text-xs text-gray-500 hidden sm:block">Total earnings</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivational Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900">Keep pushing!</span> You're competing with the best.
              Share your referral link and climb the ranks!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
