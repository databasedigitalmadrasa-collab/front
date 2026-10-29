"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Trophy } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { LeaderboardTrophy, RankMedal } from "@/components/affiliate/leaderboard-art"

interface LeaderboardItem {
  affiliate_id: number
  user_id: number
  full_name: string
  email: string
  profile_pic_url: string | null
  total_conversions: number
  total_referral_amount_cents: number
  total_commission_cents: number
  link_clicks: number
  total_referrals: number
  total_converted: number
  total_earnings_cents: number
}

type Period = "weekly" | "monthly" | "alltime"

const PERIODS: { value: Period; label: string }[] = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "alltime", label: "All Time" },
]

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const formatCurrency = (cents: number) => currencyFormatter.format((cents || 0) / 100)

const getInitials = (name: string | null | undefined) =>
  name
    ?.split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??"

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("alltime")
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Switching periods quickly can resolve requests out of order; only the
    // latest one may write state.
    let ignore = false

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

        if (ignore) return
        if (response.success && response.data?.items) {
          setLeaderboard(response.data.items)
        } else {
          setError(response.message || "Failed to fetch leaderboard")
        }
      } catch (err) {
        if (!ignore) setError("An error occurred while fetching leaderboard")
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchLeaderboard()
    return () => {
      ignore = true
    }
  }, [period])

  const periodLabel = PERIODS.find((p) => p.value === period)?.label

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[linear-gradient(100deg,#0757f2_0%,#1a6bff_55%,#3b87ff_100%)] text-white shadow-[0_14px_32px_-14px_rgba(10,92,255,0.6)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-20 h-64 w-72 rounded-full bg-white/20 blur-3xl"
          />
          <LeaderboardTrophy className="pointer-events-none absolute bottom-0 -right-10 h-[100px] w-auto sm:right-0 sm:h-full sm:max-h-[150px] md:[&_.lb-trophy-sparkles]:hidden md:[&_.lb-trophy-arc]:opacity-15" />

          <div className="relative flex flex-wrap items-start gap-x-8 gap-y-4 px-4 py-5 sm:px-9 sm:py-8 sm:pr-56">
            <div className="max-w-[62%] sm:max-w-none">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <TrendingUp className="w-6 h-6 sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
                <h1 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight leading-tight">
                  Leaderboard
                </h1>
              </div>
              <p className="mt-1.5 sm:mt-2 text-sm sm:text-[17px] leading-snug text-white/90">
                Top 10 performing referral partners - {periodLabel}
              </p>
            </div>

            {/* Period Filter (tablet & desktop) */}
            <div role="group" aria-label="Time period" className="hidden sm:flex gap-2 sm:mt-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value)}
                  aria-pressed={period === p.value}
                  className={cn(
                    "h-9 px-4 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                    period === p.value
                      ? "bg-white text-[#0a5cff] font-semibold shadow-sm"
                      : "bg-white/15 text-white font-medium ring-1 ring-inset ring-white/25 hover:bg-white/25"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Period Filter (mobile) */}
        <div role="group" aria-label="Time period" className="grid grid-cols-3 gap-2 sm:hidden">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={cn(
                "h-10 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a5cff]/40",
                period === p.value
                  ? "bg-[#0a5cff] text-white font-semibold shadow-[0_6px_14px_-6px_rgba(10,92,255,0.8)]"
                  : "bg-[#edf2f9] text-gray-700 font-medium ring-1 ring-inset ring-[#dfe6f1]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#e6ebf3] bg-white p-3 sm:p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-16px_rgba(16,24,40,0.12)]">
          <h2 className="px-2 pt-2 pb-4 sm:px-0 sm:pt-0 sm:pb-5 text-xl sm:text-[22px] font-heading font-bold text-gray-900">
            Top Referral Partners
          </h2>

          {loading && (
            <div className="space-y-2 sm:space-y-2.5" aria-busy="true" aria-label="Loading leaderboard">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-[#e7ebf2] px-3 py-3 sm:px-5 sm:py-2.5"
                >
                  <div className="w-9 h-9 sm:w-14 sm:h-12 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3.5 w-24 sm:w-36 max-w-full rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-16 sm:w-20 max-w-full rounded bg-gray-100 animate-pulse" />
                  </div>
                  <div className="space-y-2 flex flex-col items-end shrink-0">
                    <div className="h-4 w-14 sm:w-20 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-18 sm:w-24 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{error}</div>
          )}

          {!loading && !error && (
            <>
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12 text-gray-500">
                  <div className="w-14 h-14 rounded-2xl bg-[#eef4ff] flex items-center justify-center mb-3">
                    <Trophy className="w-7 h-7 text-[#0a5cff]" />
                  </div>
                  <p className="font-medium text-gray-900">No rankings yet</p>
                  <p className="text-sm mt-1">Referral partners will appear here once they start earning.</p>
                </div>
              ) : (
                <ol className="space-y-2 sm:space-y-2.5">
                  {leaderboard.map((affiliate, index) => {
                    const rank = index + 1
                    const isTop = rank <= 3
                    const conversions = affiliate.total_conversions || 0
                    return (
                      <li
                        key={affiliate.affiliate_id}
                        className={cn(
                          "flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border px-3 py-3 sm:px-5 sm:py-2.5 transition-colors",
                          isTop
                            ? "bg-[linear-gradient(90deg,#eaf2ff_0%,#f2f7ff_100%)] border-[#cfdffd]"
                            : "bg-white border-[#e7ebf2] hover:bg-gray-50/70",
                          rank === 1 && "border-[#a9c8ff] shadow-[0_0_0_3px_rgba(26,107,255,0.07)]"
                        )}
                      >
                        {/* Rank */}
                        <div className="flex items-center justify-center gap-2.5 w-9 sm:w-14 shrink-0">
                          {isTop ? (
                            <>
                              <RankMedal rank={rank as 1 | 2 | 3} className="h-8 w-[25.6px] sm:h-9 sm:w-[28.8px] shrink-0" />
                              <span className="hidden sm:inline text-xl font-bold text-[#0a5cff] tabular-nums">
                                {rank}
                              </span>
                            </>
                          ) : (
                            <span className="flex items-center justify-center w-9 h-9 sm:w-14 sm:h-12 rounded-lg sm:rounded-xl bg-[#eef1f5] text-base sm:text-xl font-semibold text-gray-700 tabular-nums">
                              {rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className="size-10 sm:size-13 ring-[3px] ring-white shadow-[0_2px_10px_rgba(15,23,42,0.14)]">
                          {affiliate.profile_pic_url && (
                            <AvatarImage
                              src={affiliate.profile_pic_url}
                              alt={affiliate.full_name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-white text-sm sm:text-base font-semibold text-gray-700">
                            {getInitials(affiliate.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name & Stats */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm sm:text-base font-semibold text-gray-900 truncate"
                            title={affiliate.full_name || undefined}
                          >
                            {affiliate.full_name || "Referral Partner"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {conversions} {conversions === 1 ? "conversion" : "conversions"}
                          </p>
                        </div>

                        {/* Earnings */}
                        <div className="text-right shrink-0">
                          <p
                            className={cn(
                              "text-[17px] sm:text-xl font-bold tabular-nums leading-tight",
                              isTop ? "text-[#0a5cff]" : "text-gray-900"
                            )}
                          >
                            {formatCurrency(affiliate.total_earnings_cents)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">Total earnings</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
