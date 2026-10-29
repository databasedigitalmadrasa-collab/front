"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock,
  Crown,
  Loader2,
  PartyPopper,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EarningsGrowthArt, MilestoneTrophy } from "@/components/affiliate/earnings-art"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface PeriodStats {
  earnings_cents: number
  previous_earnings_cents: number
  sales: number
  signups: number
}

type PeriodKey = "today" | "week" | "month"

interface AffiliateStats {
  affiliate: {
    this_day_earning_cents?: number
    this_week_earning_cents?: number
    this_month_earning_cents?: number
    total_earnings_cents?: number
  } | null
  metrics?: {
    converted_count: number
    total_commission_cents: number
  }
  // Added to dm-api with this page; absent on older deployments, in which case
  // the cards fall back to the plain totals and the 30-day graph.
  periods?: Record<PeriodKey, PeriodStats>
  daily_earnings?: { date: string; earnings_cents: number }[]
  earning_overview_graph?: { date: string; amount: number }[]
}

const REFERRALS_HREF = "/affiliate/referrals"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const formatCurrency = (cents: number) => currencyFormatter.format((cents || 0) / 100)

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/* ── IST calendar helpers (dm-api buckets earnings on the IST calendar) ───── */

const IST_OFFSET_MS = 330 * 60 * 1000

const istToday = () => new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10)

const shiftDays = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)

/** Monday of the week containing `iso`. */
const weekStart = (iso: string) => shiftDays(iso, -((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7))

/** Daily earnings in paise keyed by IST date. */
function dailySeries(stats: AffiliateStats | null): Map<string, number> {
  const series = new Map<string, number>()
  if (stats?.daily_earnings) {
    for (const d of stats.daily_earnings) series.set(d.date, d.earnings_cents)
  } else {
    // Older API: the 30-day graph, in rupees and bucketed by UTC date.
    for (const d of stats?.earning_overview_graph ?? []) series.set(d.date, Math.round(d.amount * 100))
  }
  return series
}

/* ── milestones ──────────────────────────────────────────────────────────── */

interface Milestone {
  badge: string
  message: string
  chip: string
  title: (total: string) => [string, string]
  body: string
}

const JOURNEY_LINE = "You're not just earning, you're helping someone start their skill journey."

function milestoneFor(conversions: number): Milestone {
  if (conversions <= 0) {
    return {
      badge: "New Partner",
      message: "Share your referral link and help your first student build their future.",
      chip: "Next Milestone",
      title: () => ["Close Your First Client.", "Earn Your First Commission."],
      body: "Every enrollment through your link earns you a commission and starts someone's skill journey.",
    }
  }
  if (conversions < 5) {
    return {
      badge: "First Client Closed",
      message: "Great start! Keep sharing and help more students build their future.",
      chip: "Milestone Achieved",
      title: (total) => ["First Client. First ", `${total} Commission.`],
      body: JOURNEY_LINE,
    }
  }
  const tier = [100, 50, 25, 10, 5].find((t) => conversions >= t) ?? 5
  return {
    badge: `${tier} Clients Closed`,
    message:
      tier >= 25
        ? "You're one of our top referral partners. Thank you for spreading knowledge."
        : "You're building real momentum. Keep sharing and help more students grow.",
    chip: "Milestone Achieved",
    title: (total) => [`${tier} Clients. `, `${total} Earned.`],
    body: JOURNEY_LINE,
  }
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function EarningsPage() {
  const { user } = useUserAuth()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchStats = useCallback(async (userId: number, isCurrent: () => boolean = () => true) => {
    setLoading(true)
    setError(false)
    try {
      const response = await apiClient.get<{ data: AffiliateStats }>(`/affiliates/stats/user/${userId}`)
      if (!isCurrent()) return
      if (response.success && response.data?.data) {
        setStats(response.data.data)
      } else {
        setError(true)
      }
    } catch (e) {
      console.error("Failed to fetch earnings stats", e)
      if (isCurrent()) setError(true)
    } finally {
      if (isCurrent()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let current = true
    fetchStats(user.id, () => current)
    return () => {
      current = false
    }
  }, [user?.id, fetchStats])

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const affiliate = stats?.affiliate ?? {}
  const periods = stats?.periods
  const amount = (key: PeriodKey) =>
    periods?.[key].earnings_cents ??
    {
      today: affiliate.this_day_earning_cents,
      week: affiliate.this_week_earning_cents,
      month: affiliate.this_month_earning_cents,
    }[key] ??
    0

  const totalEarnings = affiliate.total_earnings_cents ?? stats?.metrics?.total_commission_cents ?? 0
  const conversions = stats?.metrics?.converted_count ?? 0
  const milestone = milestoneFor(conversions)
  const milestoneTitle = milestone.title(formatCurrency(totalEarnings))
  const series = dailySeries(stats)
  const today = istToday()

  const salesLine = (p: PeriodStats | undefined, tail: (p: PeriodStats) => string) =>
    p ? `${plural(p.sales, "sale", "sales")} • ${tail(p)}` : null

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-3 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-3 sm:space-y-5">
        {/* Profile */}
        <section className="relative overflow-hidden px-2 pt-3 pb-2 sm:px-2 sm:pt-4">
          <EarningsGrowthArt className="pointer-events-none absolute -right-3 top-0 h-[150px] w-auto sm:right-0 sm:h-[210px]" />

          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <Avatar className="size-[88px] sm:size-28 ring-4 ring-white shadow-[0_0_0_6px_rgba(26,107,255,0.08),0_12px_28px_-10px_rgba(15,23,42,0.35)]">
                {user.profile_pic_url && (
                  <AvatarImage src={user.profile_pic_url} alt={user.full_name} className="object-cover" />
                )}
                <AvatarFallback className="bg-[#e8f0ff] text-[#0a5cff] text-2xl sm:text-3xl font-heading font-bold">
                  {user.full_name?.substring(0, 2).toUpperCase() || "DM"}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute -bottom-0.5 -right-0.5 flex size-8 sm:size-9 items-center justify-center rounded-full bg-[#0a5cff] ring-[3px] ring-white shadow-md"
                title="Referral Partner"
              >
                <Crown className="size-4 sm:size-[18px] text-white" fill="currentColor" strokeWidth={1.5} />
              </span>
            </div>

            <div className="min-w-0 max-w-[62%] sm:max-w-md">
              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] text-gray-500">REFERRAL PARTNER</p>
              <h1 className="mt-0.5 text-[22px] sm:text-3xl font-heading font-bold text-gray-900 leading-tight truncate">
                {user.full_name}
              </h1>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#e8f0ff] px-3 py-1 text-xs sm:text-sm font-medium text-[#0a5cff]">
                <Star className="size-3.5 sm:size-4" fill="currentColor" strokeWidth={0} />
                {loading && !stats ? "Loading…" : milestone.badge}
              </span>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-600">{milestone.message}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>Couldn&apos;t load your latest earnings.</span>
            <button
              type="button"
              onClick={() => fetchStats(user.id)}
              className="shrink-0 font-semibold text-red-700 underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Today */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[linear-gradient(110deg,#0757f2_0%,#1a6bff_60%,#2f7bff_100%)] p-4 sm:p-6 text-white shadow-[0_18px_36px_-18px_rgba(10,92,255,0.75)]">
          <WaveDecoration />
          <div className="relative flex items-center gap-3.5 sm:gap-5">
            <IconTile icon={Clock} tone="onBlue" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="pt-0.5 text-[15px] sm:text-lg font-semibold text-white">Today&apos;s Earning</h2>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  {amount("today") > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] sm:text-xs font-medium ring-1 ring-inset ring-white/30">
                      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]" />
                      New Earning
                    </span>
                  )}
                  <CardLink label="View today's referrals" onBlue />
                </div>
              </div>
              <Amount cents={amount("today")} loading={loading && !stats} onBlue />
              <p className="mt-1 text-xs sm:text-sm text-white/85">
                {salesLine(periods?.today, () => "Referral Commission") ?? "Referral Commission"}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
          {/* This week */}
          <EarningCard
            icon={CalendarDays}
            title="This Week's Earning"
            cents={amount("week")}
            loading={loading && !stats}
            period={periods?.week}
            comparison="last week"
            linkLabel="View this week's referrals"
            subline={salesLine(periods?.week, (p) => plural(p.signups, "student joined", "students joined"))}
            chart={<WeekBars series={series} today={today} />}
          />

          {/* This month */}
          <EarningCard
            icon={BarChart3}
            title="This Month's Earning"
            cents={amount("month")}
            loading={loading && !stats}
            period={periods?.month}
            comparison="last month"
            linkLabel="View this month's referrals"
            subline={salesLine(periods?.month, (p) => plural(p.signups, "student joined", "students joined"))}
            chart={<MonthLine series={series} today={today} />}
          />
        </div>

        {/* Milestone */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#dfe8fb] bg-[linear-gradient(135deg,#eaf1ff_0%,#f6f9ff_55%,#edf3ff_100%)] p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-8">
            <MilestoneTrophy
              className={cn("h-[118px] w-auto shrink-0 sm:h-[160px]", conversions <= 0 && "opacity-60 grayscale-[35%]")}
            />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dfe9ff] px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-[#0a5cff]">
                <PartyPopper className="size-3.5" />
                {milestone.chip}
              </span>
              <p className="mt-2 sm:mt-3 text-lg sm:text-[26px] font-heading font-bold leading-snug text-gray-900">
                {milestoneTitle[0]}
                <span className="text-[#0a5cff]">{milestoneTitle[1]}</span>
              </p>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-[15px] leading-relaxed text-gray-600">{milestone.body}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ── pieces ──────────────────────────────────────────────────────────────── */

function IconTile({ icon: Icon, tone }: { icon: LucideIcon; tone: "onBlue" | "light" }) {
  return (
    <div
      className={cn(
        "flex size-12 sm:size-16 shrink-0 items-center justify-center rounded-2xl",
        tone === "onBlue"
          ? "bg-[linear-gradient(145deg,#ffffff_0%,#dbe7ff_100%)] text-[#0a5cff] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_-8px_rgba(0,30,120,0.55)]"
          : "bg-[linear-gradient(145deg,#f3f7ff_0%,#e3ecff_100%)] text-[#0a5cff] shadow-[inset_0_1px_0_#fff,0_6px_16px_-10px_rgba(10,92,255,0.6)]"
      )}
    >
      <Icon className="size-6 sm:size-7" strokeWidth={2} />
    </div>
  )
}

function Amount({ cents, loading, onBlue }: { cents: number; loading: boolean; onBlue?: boolean }) {
  if (loading) {
    return (
      <div
        className={cn("mt-1.5 h-9 sm:h-12 w-36 sm:w-44 rounded-lg animate-pulse", onBlue ? "bg-white/20" : "bg-gray-100")}
      />
    )
  }
  const text = formatCurrency(cents)
  return (
    <p
      className={cn(
        "mt-0.5 font-heading font-bold tracking-tight tabular-nums leading-tight whitespace-nowrap",
        // Lakh-sized figures step down a size on phones so they never run into the chart.
        text.length > 7 ? "text-[26px] sm:text-[44px]" : "text-[34px] sm:text-5xl",
        onBlue ? "text-white" : "text-gray-900"
      )}
    >
      {text}
    </p>
  )
}

function CardLink({ label, onBlue }: { label: string; onBlue?: boolean }) {
  return (
    <Link
      href={REFERRALS_HREF}
      aria-label={label}
      className={cn(
        "flex size-8 sm:size-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2",
        onBlue
          ? "bg-white/15 text-white ring-1 ring-inset ring-white/30 hover:bg-white/25 focus-visible:ring-white/80"
          : "bg-white text-[#0a5cff] ring-1 ring-inset ring-[#dfe7f5] shadow-sm hover:bg-[#f3f7ff] focus-visible:ring-[#0a5cff]/40"
      )}
    >
      <ChevronRight className="size-4 sm:size-[18px]" strokeWidth={2.5} />
    </Link>
  )
}

function ChangeChip({ period, comparison }: { period?: PeriodStats; comparison: string }) {
  if (!period) return null
  const { earnings_cents: now, previous_earnings_cents: before } = period
  if (now === 0 && before === 0) return null
  // From nothing to something reads as +100%, the convention the design uses.
  const pct = before > 0 ? Math.round(((now - before) / before) * 100) : 100
  const up = pct >= 0
  const Icon = up ? TrendingUp : TrendingDown
  const label = `${Math.min(Math.abs(pct), 999)}%`
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] sm:text-xs font-semibold",
        up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      )}
      title={`${up ? "Up" : "Down"} ${label} vs the same point ${comparison}`}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {label}
      <span className="sr-only">
        {up ? "up" : "down"} vs the same point {comparison}
      </span>
    </span>
  )
}

function EarningCard({
  icon,
  title,
  cents,
  loading,
  period,
  comparison,
  linkLabel,
  subline,
  chart,
}: {
  icon: LucideIcon
  title: string
  cents: number
  loading: boolean
  period?: PeriodStats
  comparison: string
  linkLabel: string
  subline: string | null
  chart: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e6ebf3] bg-white p-4 sm:p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_28px_-18px_rgba(16,24,40,0.18)]">
      <div className="flex items-center gap-3.5 sm:gap-5">
        <IconTile icon={icon} tone="light" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="pt-0.5 text-[15px] sm:text-lg font-semibold text-gray-600 whitespace-nowrap">{title}</h2>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <ChangeChip period={period} comparison={comparison} />
              <CardLink label={linkLabel} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <Amount cents={cents} loading={loading} />
              {subline && <p className="mt-1 text-xs sm:text-sm text-gray-500">{subline}</p>}
            </div>
            <div className="shrink-0 pb-0.5">{chart}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Monday–Sunday bars for the current IST week; days still ahead stay as faint stubs. */
function WeekBars({ series, today }: { series: Map<string, number>; today: string }) {
  const start = weekStart(today)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDays(start, i)
    return { date, cents: series.get(date) ?? 0, future: date > today }
  })
  const max = Math.max(...days.map((d) => d.cents), 1)
  const label = days
    .filter((d) => !d.future)
    .map((d) => `${new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })} ${formatCurrency(d.cents)}`)
    .join(", ")

  return (
    <div role="img" aria-label={`Daily earnings this week: ${label}`} className="flex h-12 sm:h-16 items-end gap-1 sm:gap-1.5">
      {days.map((d) => (
        <div
          key={d.date}
          className={cn(
            "w-2.5 sm:w-3.5 rounded-t-[4px] rounded-b-[2px]",
            d.future
              ? "bg-[#eef3fc]"
              : d.cents > 0
                ? "bg-[linear-gradient(180deg,#1a6bff_0%,#7fadff_100%)] shadow-[0_4px_10px_-4px_rgba(26,107,255,0.6)]"
                : "bg-[#dbe6fb]"
          )}
          style={{ height: d.cents > 0 ? `${Math.max(28, (d.cents / max) * 100)}%` : "14%" }}
        />
      ))}
    </div>
  )
}

/**
 * Smooth path through points without overshooting them (monotone cubic,
 * Fritsch–Carlson), so a flat-then-rising running total never dips below zero.
 */
function monotonePath(pts: [number, number][]) {
  const n = pts.length
  const slopes = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / (p[0] - pts[i][0]))
  const t = pts.map((_, i) =>
    i === 0 ? slopes[0] : i === n - 1 ? slopes[n - 2] : slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2
  )
  slopes.forEach((m, i) => {
    if (m === 0) {
      t[i] = 0
      t[i + 1] = 0
      return
    }
    const a = t[i] / m
    const b = t[i + 1] / m
    const h = a * a + b * b
    if (h > 9) {
      t[i] = (3 / Math.sqrt(h)) * a * m
      t[i + 1] = (3 / Math.sqrt(h)) * b * m
    }
  })
  const f = (v: number) => v.toFixed(1)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const dx = (pts[i + 1][0] - pts[i][0]) / 3
    d += `C${f(pts[i][0] + dx)} ${f(pts[i][1] + t[i] * dx)} ${f(pts[i + 1][0] - dx)} ${f(pts[i + 1][1] - t[i + 1] * dx)} ${f(pts[i + 1][0])} ${f(pts[i + 1][1])}`
  }
  return d
}

/** Running total for the current IST month, as a smoothed line with an end marker. */
function MonthLine({ series, today }: { series: Map<string, number>; today: string }) {
  const start = `${today.slice(0, 8)}01`
  const dayCount = Number(today.slice(8, 10))
  // totals[d] = earnings in the first d days of the month.
  const totals = [0]
  for (let i = 0; i < dayCount; i++) totals.push(totals[i] + (series.get(shiftDays(start, i)) ?? 0))
  const total = totals[dayCount]
  const max = Math.max(total, 1)

  // Sample every few days: a day-by-day line turns a single sale into a cliff.
  const step = Math.max(1, Math.ceil(dayCount / 6))
  const samples: number[] = []
  for (let d = 0; d < dayCount; d += step) samples.push(d)
  samples.push(dayCount)

  const W = 120
  const H = 56
  const pts = samples.map((d): [number, number] => [2 + (d / dayCount) * (W - 8), H - 6 - (totals[d] / max) * (H - 16)])
  const line = monotonePath(pts)
  const end = pts[pts.length - 1]
  const area = `${line}L${end[0].toFixed(1)} ${H}L${pts[0][0].toFixed(1)} ${H}Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Earnings this month so far: ${formatCurrency(total)}`}
      className="h-12 w-[104px] sm:h-16 sm:w-[140px] overflow-visible"
    >
      <defs>
        <linearGradient id="earn-month-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a6bff" stopOpacity=".22" />
          <stop offset="1" stopColor="#1a6bff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#earn-month-area)" />
      <path d={line} stroke="#1a6bff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx={end[0]} cy={end[1]} r="4" fill="#1a6bff" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

/** Soft white waves across the lower right of the Today card. */
function WaveDecoration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute bottom-0 right-0 h-[70%] w-[75%]"
    >
      <path d="M0 120C80 80 140 96 210 70S330 10 400 22V120Z" fill="#fff" opacity=".07" />
      <path d="M60 120C130 92 190 104 260 84S350 48 400 54V120Z" fill="#fff" opacity=".08" />
      <path d="M40 104C120 70 190 86 260 60S350 14 400 18" stroke="#fff" strokeOpacity=".18" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
