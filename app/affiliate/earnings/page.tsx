"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar, TrendingUp, DollarSign, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"

export default function EarningsPage() {
  const { user } = useUserAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get<any>(`/affiliates/stats/user/${user.id}`)
        if (response.success && response.data?.data) {
          setStats(response.data.data)
        }
      } catch (e) {
        console.error("Failed to fetch earnings stats", e)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toLocaleString('en-IN')}`
  }

  // Use fetched stats or fallback to user's baked-in stats if initial load
  // If stats is null, fallback to 0
  const affiliate = stats?.affiliate || {}

  const todayEarnings = affiliate.this_day_earning_cents || 0
  const weekEarnings = affiliate.this_week_earning_cents || 0
  const monthEarnings = affiliate.this_month_earning_cents || 0
  const allTimeEarnings = affiliate.total_earnings_cents || 0

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center relative overflow-hidden">
              <Image
                src="/logo/logo_icon.png"
                alt="Digital Madrasa Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg sm:text-xl font-heading font-bold text-gray-900">Digital Madarsa</span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white shadow-sm">
            <AvatarImage src={user.profile_pic_url || ""} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
              {user.full_name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">{user.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs sm:text-sm text-gray-600">Affiliate Partner</p>
              {user.is_subscribed === 1 && (
                <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                  Subscribed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Today's Earning</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {loading ? <span className="text-gray-300 animate-pulse">...</span> : formatCurrency(todayEarnings)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">This Week Earning</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {loading ? <span className="text-gray-300 animate-pulse">...</span> : formatCurrency(weekEarnings)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">This Month Earning</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {loading ? <span className="text-gray-300 animate-pulse">...</span> : formatCurrency(monthEarnings)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm border-l-4 border-l-[#0066ff]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">All Time Earning</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {loading ? <span className="text-gray-300 animate-pulse">...</span> : formatCurrency(allTimeEarnings)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#0066ff]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
