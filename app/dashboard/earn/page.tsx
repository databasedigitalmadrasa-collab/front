"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  Gift,
  Link2,
  MessageCircle,
  Monitor,
  Radio,
  Share2,
  Users,
  Wallet,
} from "lucide-react"
import { AffiliateRequestDialog } from "@/components/AffiliateRequestDialog"
import { EarnHeroArt } from "@/components/dashboard/earn-hero-art"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"

const rupees = (cents: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(cents / 100)

/** Promotional copy for the offer strip; edit here when the offer changes. */
const STUDENT_OFFER = {
  label: "STUDENT OFFER",
  headline: "20% OFF",
  note: "A limited time offer for new enrollments",
  bonus: "1 Year + 1 Year Free",
  bonusNote: "when the 2-year scholarship offer is active",
}

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Monitor, title: "6 Practical Digital Skills", text: "In-demand, job-relevant skills" },
  { icon: BrainCircuit, title: "Dedicated AI Training", text: "Learn to use AI in real workflows" },
  { icon: BarChart3, title: "Client Acquisition Training", text: "Get clients and grow your income" },
  { icon: Users, title: "Expert Mentors", text: "Learn from industry professionals" },
  { icon: Radio, title: "Live Classes", text: "Interact, ask questions and learn in real-time" },
  { icon: MessageCircle, title: "Fast WhatsApp Support", text: "Get help whenever you need it" },
]

type AffiliateStatus = "affiliate" | "pending" | "none" | "loading"

export default function EarnWithReferralPage() {
  const { user } = useUserAuth()
  // Lowest and highest per-enrollment commission across plans, in paise.
  const [commissionRange, setCommissionRange] = useState<{ min: number; max: number } | null>(null)
  const [programLoaded, setProgramLoaded] = useState(false)
  const [requestStatus, setRequestStatus] = useState<"pending" | "none" | "loading">("loading")
  const [showApplyDialog, setShowApplyDialog] = useState(false)

  useEffect(() => {
    apiClient
      .get<{ data: { commission_cents: number; min_commission_cents?: number; max_commission_cents?: number } }>(
        "/referral-program"
      )
      .then((res) => {
        const d = res.success ? res.data?.data : null
        if (d) {
          setCommissionRange({
            min: d.min_commission_cents ?? d.commission_cents,
            max: d.max_commission_cents ?? d.commission_cents,
          })
        }
      })
      .catch((err) => console.error("Failed to load referral programme", err))
      .finally(() => setProgramLoaded(true))
  }, [])

  const isAffiliate = user?.is_affiliate === 1

  const loadRequestStatus = async () => {
    if (!user?.id) return
    try {
      const res = await apiClient.get<{ data?: { status?: string }; status?: string }>(`/affiliate-requests/user/${user.id}`)
      const status = res.success ? (res.data?.data?.status ?? res.data?.status) : null
      setRequestStatus(status === "pending" ? "pending" : "none")
    } catch {
      // No application yet answers 404.
      setRequestStatus("none")
    }
  }

  useEffect(() => {
    if (!user?.id || isAffiliate) return
    loadRequestStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAffiliate])

  const status: AffiliateStatus = !user ? "loading" : isAffiliate ? "affiliate" : requestStatus
  // Plans can pay different rates; quote the best one and say so.
  const commission = commissionRange ? rupees(commissionRange.max) : null
  const upTo = commissionRange !== null && commissionRange.min !== commissionRange.max ? "up to " : ""

  return (
    <div className="min-h-full bg-[#f6f8fc] px-4 py-5 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* Hero */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] xl:items-center">
          <div>
            <h1 className="text-[34px] sm:text-5xl font-heading font-bold tracking-tight text-gray-900 leading-[1.1]">
              Earn With <span className="text-[#0a5cff]">Referral</span>
            </h1>
            <p className="mt-3 max-w-xl text-base sm:text-lg leading-relaxed text-gray-600">
              Share Digital Madrasa with your audience and earn {commission ? `${upTo}${commission}` : "a commission"} for
              every successful enrollment.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta status={status} onApply={() => setShowApplyDialog(true)} />
              <SecondaryCta status={status} onApply={() => setShowApplyDialog(true)} />
            </div>

            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
              {["Free to join", "No joining fee", "Real-time tracking"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CircleCheck className="size-[18px] text-white" fill="#0a5cff" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#dce7fb] bg-[linear-gradient(135deg,#e8f0ff_0%,#f2f6ff_55%,#eaf1ff_100%)] px-5 py-6 sm:px-9 sm:py-8">
            <div className="flex items-center gap-2 sm:gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-semibold tracking-[0.12em] leading-relaxed text-gray-600">
                  SAME KNOWLEDGE.
                  <br />A BRIGHTER UMMAH.
                </p>
                <p className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-heading font-bold text-gray-900">
                  Earn{commission && upTo ? " up to" : ""}
                </p>
                {commission ? (
                  <p className="text-[44px] sm:text-6xl font-heading font-bold tracking-tight leading-none text-gray-900 tabular-nums">
                    {commission}
                  </p>
                ) : programLoaded ? (
                  <p className="text-[34px] sm:text-5xl font-heading font-bold tracking-tight leading-none text-gray-900">
                    Commission
                  </p>
                ) : (
                  <div className="mt-1 h-11 sm:h-14 w-40 sm:w-48 rounded-lg bg-white/60 animate-pulse" />
                )}
                <p className="mt-3 whitespace-nowrap text-sm sm:text-base xl:text-[17px] text-gray-800">per successful enrollment</p>
              </div>
              <EarnHeroArt className="h-[170px] w-auto shrink-0 sm:h-[230px]" />
              <div className="hidden w-32 shrink-0 md:block">
                <p className="text-xl leading-snug text-gray-500">
                  Share Knowledge.
                  <br />
                  Create Opportunity.
                </p>
                <span className="mt-4 block h-0.5 w-8 rounded-full bg-[#0a5cff]" />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section>
          <SectionHeading title="How It Works" subtitle="A simple 3-step process to start earning." />
          <ol className="mt-4 grid gap-3 md:grid-cols-3 lg:gap-10">
            {[
              { icon: Link2, title: "Get Your Link", text: "Generate your unique referral link from your dashboard." },
              {
                icon: Share2,
                title: "Share & Promote",
                text: "Share Digital Madrasa with your audience, friends, or community.",
              },
              {
                icon: Wallet,
                title: commission ? `Earn ${upTo}${commission}` : "Earn Commission",
                text: "When someone enrolls through your link, the commission is added to your earnings.",
              },
            ].map((step, i, steps) => (
              <li
                key={step.title}
                className="relative flex gap-3 sm:gap-4 rounded-2xl border border-[#e6ebf3] bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-bold text-[#0a5cff]">
                  {i + 1}
                </span>
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
                  <step.icon className="size-6 text-[#0a5cff]" strokeWidth={2} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-base sm:text-[17px] font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{step.text}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="absolute -right-8 top-1/2 hidden size-5 -translate-y-1/2 text-gray-400 lg:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* What you're sharing */}
        <section>
          <SectionHeading
            title="What You're Sharing"
            subtitle="A complete learning platform that helps students build real digital skills and a balanced life."
          />
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-6 xl:gap-0">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3 xl:border-l xl:border-[#e6ebf3] xl:px-5 xl:first:border-l-0 xl:first:pl-0">
                <f.icon className="mt-0.5 size-7 shrink-0 text-[#0a5cff]" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug text-gray-900">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Offer */}
        <section className="flex flex-col gap-5 rounded-2xl border border-[#dce7fb] bg-[linear-gradient(90deg,#e8f0ff_0%,#eef4ff_100%)] p-5 sm:p-7 lg:flex-row lg:items-center lg:gap-8">
          <div className="lg:w-[30%] lg:shrink-0 lg:border-r lg:border-[#c9daf8] lg:pr-8">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#0a5cff]">{STUDENT_OFFER.label}</p>
            <p className="mt-1 text-4xl font-heading font-bold tracking-tight text-gray-900">{STUDENT_OFFER.headline}</p>
            <p className="mt-1 text-sm text-gray-500">{STUDENT_OFFER.note}</p>
          </div>
          <div className="flex flex-1 items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Gift className="size-6 text-[#0a5cff]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xl font-heading font-bold text-[#0a5cff]">{STUDENT_OFFER.bonus}</p>
              <p className="text-sm text-gray-500">{STUDENT_OFFER.bonusNote}</p>
            </div>
          </div>
          {status === "affiliate" ? (
            <Link
              href="/affiliate/marketing-tools"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0a5cff] px-6 font-semibold text-white shadow-[0_10px_20px_-10px_rgba(10,92,255,0.9)] transition-colors hover:bg-[#0050e0]"
            >
              Share the Opportunity
              <ArrowRight className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowApplyDialog(true)}
              disabled={status !== "none"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0a5cff] px-6 font-semibold text-white shadow-[0_10px_20px_-10px_rgba(10,92,255,0.9)] transition-colors hover:bg-[#0050e0] disabled:opacity-60"
            >
              Share the Opportunity
              <ArrowRight className="size-5" />
            </button>
          )}
        </section>

        {/* FAQ */}
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">Frequently Asked Questions</h2>
              <Link href="/dashboard/support" className="shrink-0 text-sm font-semibold text-[#0a5cff] hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              <Faq question="Who can join the referral program?">
                Any Digital Madrasa learner can apply right here. Joining is free, with no fee at any point. Once your
                application is approved, your referral links appear in the affiliate panel.
              </Faq>
              <Faq question="How and when do I get paid?">
                Your commission is added to your wallet as soon as the enrollment&apos;s payment is confirmed. You can
                follow every rupee in My Earnings and request a withdrawal from your Wallet.
              </Faq>
              <Faq question="How is a successful enrollment counted?">
                When someone opens your referral link and completes their enrollment payment. Commission is credited only
                after the payment gateway confirms the payment, so abandoned or failed payments don&apos;t count.
              </Faq>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#e6ebf3] bg-[#f3f6fb] p-5 sm:p-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <BookOpen className="size-6 text-[#0a5cff]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-semibold text-gray-900">Still have questions?</p>
              <p className="text-sm text-gray-500">We&apos;re here to help.</p>
              <Link
                href="/dashboard/support"
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-[#e3e8f1] bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
              >
                Contact Support
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {user?.id && !isAffiliate && (
        <AffiliateRequestDialog
          open={showApplyDialog}
          onOpenChange={setShowApplyDialog}
          onSuccess={loadRequestStatus}
          userId={user.id}
        />
      )}
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-[28px] font-heading font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm sm:text-base text-gray-500">{subtitle}</p>
    </div>
  )
}

const PRIMARY_CLASS =
  "inline-flex h-12 sm:h-[52px] items-center justify-center gap-3 rounded-xl bg-[#0a5cff] px-6 sm:px-7 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(10,92,255,0.9)] transition-colors hover:bg-[#0050e0] disabled:opacity-60"
const SECONDARY_CLASS =
  "inline-flex h-12 sm:h-[52px] items-center justify-center gap-3 rounded-xl border border-[#e3e8f1] bg-white px-6 sm:px-7 text-base font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"

/** Affiliates go straight to their links; everyone else applies first. */
function PrimaryCta({ status, onApply }: { status: AffiliateStatus; onApply: () => void }) {
  if (status === "affiliate") {
    return (
      <Link href="/affiliate/marketing-tools" className={PRIMARY_CLASS}>
        <Link2 className="size-5" />
        Get My Referral Link
      </Link>
    )
  }
  if (status === "pending") {
    return (
      <button type="button" disabled className={PRIMARY_CLASS}>
        <Clock className="size-5" />
        Application Pending
      </button>
    )
  }
  return (
    <button type="button" onClick={onApply} disabled={status === "loading"} className={PRIMARY_CLASS}>
      <Link2 className="size-5" />
      Get My Referral Link
    </button>
  )
}

function SecondaryCta({ status, onApply }: { status: AffiliateStatus; onApply: () => void }) {
  if (status === "affiliate") {
    return (
      <Link href="/affiliate/earnings" className={SECONDARY_CLASS}>
        <BarChart3 className="size-5 text-[#0a5cff]" />
        View My Earnings
      </Link>
    )
  }
  return (
    <button type="button" onClick={onApply} disabled={status !== "none"} className={SECONDARY_CLASS}>
      <BarChart3 className="size-5 text-[#0a5cff]" />
      View My Earnings
    </button>
  )
}

function Faq({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-[#e3e8f1] bg-white open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm sm:text-[15px] font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown className="size-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
      </summary>
      <p className="px-4 pb-4 text-sm leading-relaxed text-gray-600">{children}</p>
    </details>
  )
}
