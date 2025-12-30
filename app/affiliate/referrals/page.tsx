"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Award, Copy, CheckCircle2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { getUser } from "@/lib/user-auth"

interface Referral {
  id: number
  referrer_user_id: number
  referred_user_id: number
  referred_user_email: string
  referral_code: string
  referral_link: string
  plan_id: number
  referral_amount_cents: number
  earned_commission_cents: number
  signup_timestamp: string
  conversion_timestamp: string | null
  ip_address: string
  user_agent: string
  status: string
  created_at: string
  updated_at: string
}

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referralLink, setReferralLink] = useState("https://digitalmadrasa.com/ref/LOADING")

  useEffect(() => {
    const fetchReferrals = async () => {
      const user = getUser()
      if (!user) {
        setError("User not logged in")
        setLoading(false)
        return
      }

      try {
        const response = await apiClient.get<{ success: boolean; items: Referral[] }>(
          `/referrals/user/${user.id}?mode=referrer`
        )

        if (response.success && response.data?.items) {
          setReferrals(response.data.items)
          if (response.data.items.length > 0 && response.data.items[0].referral_link) {
            setReferralLink(response.data.items[0].referral_link)
          }
        } else {
          setError(response.message || "Failed to fetch referrals")
        }
      } catch (err) {
        setError("An error occurred while fetching referrals")
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalReferrals = referrals.length
  const activeReferrals = referrals.filter((r) => r.status === "converted").length
  const totalCommission = referrals.reduce((sum, r) => sum + r.earned_commission_cents, 0) / 100

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
  }

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split("@")
    if (!domain || localPart.length <= 4) {
      return `${localPart.charAt(0)}****@${domain || ""}`
    }
    const start = localPart.slice(0, 2)
    const end = localPart.slice(-2)
    return `${start}****${end}@${domain}`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-balance">Your Referrals</h1>
            <p className="text-white/90 mt-2 text-sm sm:text-base leading-relaxed">
              Track all your referrals and earn commissions for every successful signup
            </p>
          </div>

          {/* <Button
            onClick={copyLink}
            className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 w-full lg:w-auto shadow-lg font-semibold px-4 sm:px-6 text-sm sm:text-base"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Referral Link
              </>
            )}
          </Button> */}


        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Referrals</p>
                <p className="text-3xl font-heading font-bold text-gray-900">{totalReferrals}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Referrals</p>
                <p className="text-3xl font-heading font-bold text-gray-900">{activeReferrals}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Commission Earned</p>
                <p className="text-3xl font-heading font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">Referral History</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Complete list of all users you've referred to the platform
              </p>
            </div>

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
              <>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">
                          #
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">
                          Referral Code
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">
                          Signup Date
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">
                          Commission
                        </th>
                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                            No referrals found
                          </td>
                        </tr>
                      ) : (
                        referrals.map((referral, index) => (
                          <tr
                            key={referral.id}
                            className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                          >
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 font-semibold">
                              {index + 1}
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                              <p className="text-xs sm:text-sm font-mono text-gray-700">{maskEmail(referral.referred_user_email)}</p>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                              <p className="text-xs sm:text-sm font-mono text-gray-700">{referral.referral_code}</p>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-700">
                              {referral.signup_timestamp ? new Date(referral.signup_timestamp).toLocaleDateString() : "-"}
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                              <p className="text-xs sm:text-sm font-bold text-gray-900">
                                {formatCurrency(referral.earned_commission_cents / 100)}
                              </p>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                              <span
                                className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${referral.status === "converted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                              >
                                {referral.status === "converted" ? "Converted" : referral.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 gap-3">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Showing {referrals.length} referrals
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
