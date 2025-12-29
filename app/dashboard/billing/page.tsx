"use client"

import { useState, useEffect } from "react"
import { Download, Clock, Check, Calendar, DollarSign, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"

interface Plan {
  id: number
  title: string
  description: string
  monthly_amount: number | null
  yearly_amount: number | null
  discounted_amount: number | null
  currency: string
  subscription_type: string
  gst_tax: number | null
  whats_included: string | null
}

interface Subscription {
  id: number
  user_id: number
  plan_id: number
  start_date: string
  renewal_date: string
  subscription_type: string
  subscription_amount_paid: number
  subscription_status: string
  order_id: string
  merchant_id: string
  transaction_status: string
  transaction_timestamp: string
  created_at: string
  updated_at: string
  user?: {
    id: number
    full_name: string
    email: string
  }
  plan?: Plan
}

export default function BillingPage() {
  const { user, isLoading: authLoading } = useUserAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Fetch all subscriptions for billing history
        const response = await apiClient.get<{ items: Subscription[] }>(`/users/${user.id}/subscriptions`)
        if (response.success && response.data) {
          const items = (response.data as any).items || []
          setSubscriptions(items)

          // Find active subscription for current subscription card
          const activeSubscription = items.find((sub: Subscription) => sub.subscription_status === "active")
          setCurrentSubscription(activeSubscription || null)
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchSubscriptions()
    }
  }, [user, authLoading])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatAmount = (amountInPaise: number) => {
    return (amountInPaise / 100).toLocaleString("en-IN")
  }

  const getDaysRemaining = (renewalDate: string) => {
    if (!renewalDate) return 0
    const renewal = new Date(renewalDate)
    const now = new Date()
    const diffTime = renewal.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066ff]"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage your subscription, billing history, and payment methods.
        </p>
      </div>

      {/* Current Subscription Card */}
      {currentSubscription ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden mb-6 sm:mb-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <div>
                  <Badge className="bg-green-500 text-white mb-2 sm:mb-3 border-0 text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-heading font-bold mb-1">
                    {currentSubscription.plan?.title || "Subscription Plan"}
                  </h2>
                  <p className="text-blue-100 text-sm capitalize">
                    {currentSubscription.subscription_type} Subscription
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl sm:text-4xl font-bold">
                    ₹{formatAmount(currentSubscription.subscription_amount_paid)}
                  </div>
                  <p className="text-blue-100 text-sm">
                    /{currentSubscription.subscription_type === "annual" ? "year" : "month"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 pt-4 sm:pt-6 border-t border-white/20">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 text-xs sm:text-sm mb-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    Start Date
                  </div>
                  <div className="font-semibold text-sm sm:text-base">{formatDate(currentSubscription.start_date)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-blue-100 text-xs sm:text-sm mb-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    Renewal Date
                  </div>
                  <div className="font-semibold text-sm sm:text-base">
                    {formatDate(currentSubscription.renewal_date)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-blue-100 text-xs sm:text-sm mb-1">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                    Days Remaining
                  </div>
                  <div className="font-semibold text-sm sm:text-base">
                    {getDaysRemaining(currentSubscription.renewal_date)} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Active Subscription - Enrollment Prompt */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden mb-6 sm:mb-8 shadow-lg">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <div className="relative z-10 text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 mb-2">No Active Subscription</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You don't have an active subscription. Enroll now to access all courses and features.
              </p>
              <Link href="/pricing">
                <Button className="bg-[#0066ff] hover:bg-[#0052cc] text-white px-8">View Plans & Enroll</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">Billing History</h2>
          
        </div>

        <div className="space-y-3 sm:space-y-4">
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No billing history available</p>
            </div>
          ) : (
            subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#0066ff]/30 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 sm:gap-3 mb-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#0066ff] flex-shrink-0 mt-0.5" />
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {subscription.plan?.title || "Subscription"} - {subscription.subscription_type}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        {formatDate(subscription.created_at)}
                      </span>
                      <span>Order #{subscription.order_id}</span>
                      <Badge
                        className={
                          subscription.subscription_status === "active"
                            ? "bg-green-100 text-green-700 text-xs"
                            : "bg-yellow-100 text-yellow-700 text-xs"
                        }
                      >
                        {subscription.subscription_status === "active" ? "Active" : subscription.subscription_status}
                      </Badge>
                      <Badge
                        className={
                          subscription.transaction_status === "success"
                            ? "bg-blue-100 text-blue-700 text-xs"
                            : "bg-red-100 text-red-700 text-xs"
                        }
                      >
                        {subscription.transaction_status === "success" ? "Paid" : subscription.transaction_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      ₹{formatAmount(subscription.subscription_amount_paid)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Merchant: {subscription.merchant_id}</div>
                  </div>
                </div>

                
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
