"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Shield, ArrowLeft, Tag, X, Loader2, Lock, Sparkles, ShieldCheck } from "lucide-react"
import Link from "next/link"

declare global {
  interface Window {
    PhonePeCheckout?: {
      transact: (config: { tokenUrl: string; callback: (response: any) => void; type: string }) => void
    }
  }
}

interface SubscriptionPlan {
  id: number
  title: string
  description: string
  monthly_amount: number
  yearly_amount: number
  discounted_amount: number | null
  currency: string
  subscription_type: string
  gst_tax: number
  whats_included: string
  created_at: string
  updated_at: string
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
]

const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

export default function EnrollPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const planId = params.planId as string

  const refFromUrl = searchParams.get("ref")

  const [planData, setPlanData] = useState<SubscriptionPlan | null>(null)
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([])
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planId)

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    contactNumber: "",
    country: "India",
    state: "",
    couponCode: "DM-2026",
    password: "",
    referralCode: refFromUrl || "",
  })

  const [referralStatus, setReferralStatus] = useState<"idle" | "verifying" | "valid" | "invalid">(
    refFromUrl ? "valid" : "idle",
  )
  const [isFormValid, setIsFormValid] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [verifyingReferral, setVerifyingReferral] = useState(false)

  useEffect(() => {
    const fetchPlanData = async () => {
      setIsLoadingPlan(true)
      setPlanError(null)

      if (!planId || planId === "select") {
        // No plan ID provided, show plan selection
        try {
          const allPlansResponse = await fetch(`${API_BASE_URL}/subscription-plans`)
          const allPlansResult = await allPlansResponse.json()

          if (allPlansResult.success && allPlansResult.items) {
            console.log("All plans fetched for selection:", allPlansResult.items)
            setAllPlans(allPlansResult.items)
            setPlanError("selection") // Special flag to show selection UI
          }
        } catch (error) {
          console.error("Error fetching all plans:", error)
          setPlanError("Error loading plans. Please try again.")
        }
        setIsLoadingPlan(false)
        return
      }

      try {
        console.log("Fetching plan data for ID:", planId)

        // Try to fetch specific plan
        const planResponse = await fetch(`${API_BASE_URL}/subscription-plans/${planId}`)

        if (planResponse.ok) {
          const planResult = await planResponse.json()
          console.log("Plan API response:", planResult)

          if (planResult.success && planResult.data) {
            setPlanData(planResult.data)
            setPlanError(null)
            console.log("Plan data set successfully:", planResult.data)
          } else {
            throw new Error("Plan not found")
          }
        } else {
          throw new Error("Plan not found")
        }
      } catch (error) {
        console.error("Error fetching plan:", error)
        setPlanError("Invalid plan ID. Please select a plan below.")

        // Fetch all plans if specific plan fails
        try {
          const allPlansResponse = await fetch(`${API_BASE_URL}/subscription-plans`)
          const allPlansResult = await allPlansResponse.json()

          if (allPlansResult.success && allPlansResult.items) {
            console.log("All plans fetched:", allPlansResult.items)
            setAllPlans(allPlansResult.items)
          }
        } catch (allPlansError) {
          console.error("Error fetching all plans:", allPlansError)
        }
      } finally {
        setIsLoadingPlan(false)
      }
    }

    fetchPlanData()
  }, [planId])

  const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
    try {
      return JSON.parse(plan.whats_included)
    } catch {
      return []
    }
  }

  const getPlanPricing = (plan: SubscriptionPlan) => {
    const isYearly = plan.subscription_type === "annual"
    const baseAmount = isYearly ? plan.yearly_amount : plan.monthly_amount
    const discountedAmount = plan.discounted_amount || baseAmount
    const savings = baseAmount - discountedAmount

    return {
      originalPrice: baseAmount,
      discountedPrice: discountedAmount,
      savings: savings,
      monthlyPrice: isYearly ? Math.round(discountedAmount / 12) : discountedAmount,
      isYearly,
    }
  }

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)

    if (field === "referralCode" && referralStatus !== "idle") {
      setReferralStatus("idle")
    }

    // Check if all required fields are filled
    const isValid =
      updatedData.email &&
      updatedData.fullName &&
      updatedData.contactNumber &&
      updatedData.state &&
      updatedData.password

    setIsFormValid(!!isValid)
  }

  const handleVerifyReferral = async () => {
    if (!formData.referralCode.trim()) {
      setReferralStatus("idle")
      return
    }

    setVerifyingReferral(true)
    setReferralStatus("idle")

    try {
      const response = await fetch("https://srv.digitalmadrasa.co.in/api/v1/verify-referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referral_code: formData.referralCode,
        }),
      })

      const result = await response.json()

      if (result.valid === true) {
        setReferralStatus("valid")
      } else {
        setReferralStatus("invalid")
      }
    } catch (error) {
      console.error("Error verifying referral code:", error)
      setReferralStatus("invalid")
    } finally {
      setVerifyingReferral(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!planData) {
      alert("Please select a valid plan first.")
      return
    }

    setIsProcessingPayment(true)

    try {
      const pricing = getPlanPricing(planData)

      // Generate unique merchant order ID
      const merchantOrderId = `order_${Date.now()}`

      const amount = pricing.discountedPrice * 100

      const enrollmentData = {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        contact: formData.contactNumber,
        country: formData.country,
        state: formData.state,
        profile_pic_url: "",
        plan_id: planData.id,
        subscription_type: planData.subscription_type,
        subscription_amount_paid: amount, // in paisa
        order_id: merchantOrderId,
        merchant_id: "M233ADH6GR4O2",
        ...(referralStatus === "valid" && formData.referralCode ? { referral_code: formData.referralCode } : {}),
      }

      sessionStorage.setItem("enrollmentData", JSON.stringify(enrollmentData))
      console.log("Enrollment data stored:", enrollmentData)

      const paymentLogData = {
        provider: "PhonePe",
        order_id: merchantOrderId,
        subscription_id: planData.id,
        provider_transaction_id: "", // Will be updated in callback
        email: formData.email,
        contact_number: formData.contactNumber,
        amount_cents: amount,
        currency: "INR",
        payment_method: "PG_CHECKOUT",
        status: "pending",
        status_detail: "Payment gateway loading",
        attempt: 1,
        receipt_url: null,
        invoice_url: null,
        refunded_amount_cents: 0,
        refund_status: null,
        merchant_id: "M233ADH6GR4O2",
        transaction_timestamp: new Date().toISOString(),
      }

      console.log("Logging initial payment:", paymentLogData)

      // Submit initial payment log
      await fetch("https://srv.digitalmadrasa.co.in/api/v1/payment-logs/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentLogData),
      }).catch((err) => console.error("Failed to log payment:", err))

      // Prepare payment payload as per reference
      const paymentPayload = {
        merchantOrderId,
        amount,
        expireAfter: 1200, // 20 minutes
        paymentFlow: {
          type: "PG_CHECKOUT",
          merchantUrls: {
            redirectUrl: window.location.origin + "/payment/callback",
          },
        },
      }

      console.log("Creating payment with payload:", paymentPayload)

      // Call the payment API endpoint
      const res = await fetch("https://srv.digitalmadrasa.co.in/api/v1/checkout/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      })

      const responseText = await res.text()
      console.log("Payment API response:", responseText)

      const json = JSON.parse(responseText)

      const tokenUrl = json.redirectUrl || json.tokenUrl || json.url

      if (!tokenUrl) {
        console.error("No payment URL in response:", json)
        alert("Payment initialization failed. Please try again.")
        setIsProcessingPayment(false)
        return
      }

      console.log("Token URL:", tokenUrl)

      // Check if PhonePe Checkout SDK is available for iframe mode
      if (window.PhonePeCheckout && typeof window.PhonePeCheckout.transact === "function") {
        console.log("Opening PhonePe checkout iframe")

        // Open PhonePe checkout iframe
        window.PhonePeCheckout.transact({
          tokenUrl,
          callback: (response) => {
            console.log("PhonePe callback response:", response)
            setIsProcessingPayment(false)

            // Redirect to callback page with status
            if (response === "SUCCESS") {
              window.location.href = `/payment/callback?status=success&orderId=${merchantOrderId}`
            } else if (response === "USER_CANCEL") {
              // User cancelled the payment
              console.log("User cancelled payment")
              window.location.href = `/payment/callback?status=cancelled&orderId=${merchantOrderId}`
            } else if (response === "CONCLUDED") {
              // Transaction is in terminal state - redirect to callback for verification
              console.log("Transaction concluded, verifying status")
              window.location.href = `/payment/callback?status=concluded&orderId=${merchantOrderId}`
            } else {
              window.location.href = `/payment/callback?status=failed&orderId=${merchantOrderId}`
            }
          },
          type: "IFRAME",
        })
      } else {
        // Fallback: redirect directly to payment URL
        console.log("PhonePe SDK not available, redirecting to payment URL")
        window.location.href = tokenUrl
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
      setIsProcessingPayment(false)
    }
  }

  const handlePlanSelection = (newPlanId: string) => {
    setSelectedPlanId(newPlanId)
    window.location.href = `/enroll/${newPlanId}${refFromUrl ? `?ref=${refFromUrl}` : ""}`
  }

  if (isLoadingPlan) {
    return (
      <div className="min-h-screen grid-background bg-[#fafafa] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0066ff] animate-spin mx-auto mb-4" />
          <p className="text-lg text-[#4b4b4b]">Loading plan details...</p>
        </div>
      </div>
    )
  }

  if (planError === "selection" || (planError && allPlans.length > 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header - Made fully responsive with better mobile spacing */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-1.5 sm:gap-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">Back</span>
              </Link>
              <div className="font-heading text-lg sm:text-2xl md:text-5xl lg:text-6xl font-bold text-slate-900">
                Digital Madrasa
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Secure</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Improved mobile padding and spacing */}
        <main className="pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Title - Responsive text sizes and spacing */}
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Choose Your Plan
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-3 sm:mb-4 lg:mb-6 px-4">
                Start Your Learning Journey
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                Select the perfect plan for your goals and unlock your potential today
              </p>
            </div>

            {/* Plans Grid - Responsive grid with single column on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
              {allPlans.map((plan) => {
                const planPricing = getPlanPricing(plan)
                const planFeatures = getPlanFeatures(plan)

                return (
                  <div
                    key={plan.id}
                    className="group bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 flex flex-col relative overflow-hidden"
                  >
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Plan Header */}
                    <div className="mb-4 sm:mb-6 relative">
                      <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2">{plan.title}</h3>
                      <p className="text-slate-600 text-sm">{plan.description}</p>
                    </div>

                    {/* Pricing - Responsive text sizes */}
                    <div className="mb-6 sm:mb-8">
                      {planPricing.savings > 0 && (
                        <div className="mb-3">
                          <span className="text-base sm:text-lg text-slate-400 line-through">
                            ₹{planPricing.originalPrice}
                          </span>
                          <span className="ml-2 sm:ml-3 inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold">
                            SAVE {Math.round((planPricing.savings / planPricing.originalPrice) * 100)}%
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-4xl sm:text-5xl font-bold text-slate-900">
                          ₹{planPricing.discountedPrice}
                        </span>
                        <span className="text-sm sm:text-base text-slate-600">
                          /{planPricing.isYearly ? "year" : "month"}
                        </span>
                      </div>
                      {planPricing.isYearly && (
                        <p className="text-sm text-slate-600 mt-2">That's just ₹{planPricing.monthlyPrice}/month</p>
                      )}
                      {plan.gst_tax > 0 && (
                        <p className="text-xs text-slate-500 mt-1">Inclusive of {plan.gst_tax}% GST</p>
                      )}
                    </div>

                    {/* Features */}
                    {planFeatures.length > 0 && (
                      <div className="mb-6 sm:mb-8 flex-grow">
                        <div className="space-y-3">
                          {planFeatures.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2 sm:gap-3">
                              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                              </div>
                              <span className="text-sm text-slate-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      onClick={() => handlePlanSelection(plan.id.toString())}
                      className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-slate-900/10 hover:shadow-blue-500/30 text-sm sm:text-base"
                    >
                      Get Started
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Trust Indicators - Stack on mobile, responsive spacing */}
            <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span>Data Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const pricing = planData ? getPlanPricing(planData) : null
  const features = planData ? getPlanFeatures(planData) : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header - Made fully responsive */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Back</span>
            </Link>
            <div className="font-heading text-lg sm:text-2xl font-bold text-slate-900">Digital Madrasa</div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
              <span className="hidden sm:inline font-medium">Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Improved mobile padding */}
      <main className="pt-6 sm:pt-8 lg:pt-12 pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Indicator - Responsive sizing and spacing */}
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <span className="font-medium text-slate-900 hidden xs:inline">Your Information</span>
              </div>
              <div className="w-8 sm:w-12 h-0.5 bg-slate-200" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <span className="text-slate-500 hidden xs:inline">Payment</span>
              </div>
            </div>
          </div>

          {planData && pricing && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
              {/* Left Column - Form - Full width on mobile */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
                    Complete Your Enrollment
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        required
                        className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber" className="text-sm font-medium text-slate-700">
                        Contact Number *
                      </Label>
                      <Input
                        id="contactNumber"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.contactNumber}
                        onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                        required
                        className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Country & State - Stack on mobile, side-by-side on larger screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                          Country
                        </Label>
                        <Input
                          id="country"
                          type="text"
                          value={formData.country}
                          disabled
                          className="h-10 sm:h-11 border-slate-200 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium text-slate-700">
                          State *
                        </Label>
                        <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                          <SelectTrigger className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Create Password *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                        className="h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Referral Code - Responsive button layout */}
                    <div className="space-y-2">
                      <Label htmlFor="referralCode" className="text-sm font-medium text-slate-700">
                        Referral Code (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            id="referralCode"
                            type="text"
                            placeholder="Enter code"
                            value={formData.referralCode}
                            onChange={(e) => handleInputChange("referralCode", e.target.value.toUpperCase())}
                            readOnly={!!refFromUrl}
                            className={`h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${referralStatus === "valid"
                              ? "border-green-200 bg-green-50"
                              : referralStatus === "invalid"
                                ? "border-red-200 bg-red-50"
                                : ""
                              } ${refFromUrl ? "bg-slate-50" : ""}`}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleVerifyReferral}
                          disabled={!formData.referralCode.trim() || verifyingReferral || referralStatus === "valid"}
                          variant="outline"
                          className="h-10 sm:h-11 px-4 sm:px-5 border-slate-200 hover:bg-slate-50 bg-transparent text-sm"
                        >
                          {verifyingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                      {referralStatus === "valid" && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Valid referral code applied
                        </p>
                      )}
                      {referralStatus === "invalid" && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          Invalid referral code
                        </p>
                      )}
                    </div>

                    {/* Coupon Code */}
                    <div className="space-y-2">
                      <Label htmlFor="couponCode" className="text-sm font-medium text-slate-700">
                        Coupon Code
                      </Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                        <Input
                          id="couponCode"
                          type="text"
                          value={formData.couponCode}
                          readOnly
                          className="h-10 sm:h-11 pl-10 border-green-200 bg-green-50"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                            <Check className="w-3 h-3" />
                            Applied
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Button - Responsive height and text */}
                    <Button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="w-full h-12 sm:h-13 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 mt-6"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Complete Secure Payment
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-500 mt-4">
                      By continuing, you agree to our <Link href="/legal/terms" className="underline hover:text-slate-800">Terms of Service</Link> and <Link href="/legal/privacy" className="underline hover:text-slate-800">Privacy Policy</Link>
                    </p>
                  </form>
                </div>
              </div>

              {/* Right Column - Order Summary - Full width on mobile, appears first */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="lg:sticky lg:top-24">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 text-white">
                    <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 sm:mb-6">Order Summary</h2>

                    <div className="space-y-4 sm:space-y-6">
                      {/* Plan Details */}
                      <div className="pb-4 sm:pb-6 border-b border-slate-700">
                        <h3 className="font-semibold text-base sm:text-lg mb-1">{planData.title}</h3>
                        <p className="text-sm text-slate-400">{planData.description}</p>
                        {pricing.savings > 0 && (
                          <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold mt-3">
                            🎉 {Math.round((pricing.savings / pricing.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>

                      {/* Price Breakdown */}
                      <div className="space-y-3">
                        {pricing.savings > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Original Price</span>
                              <span className="text-slate-400 line-through">₹{pricing.originalPrice}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-400 font-medium">Discount (DM-2026)</span>
                              <span className="text-green-400 font-medium">-₹{pricing.savings}</span>
                            </div>
                          </>
                        )}

                        <div className="pt-3 sm:pt-4 border-t border-slate-700">
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-xs sm:text-sm text-slate-400 mb-1">Total Amount</div>
                              <div className="font-heading text-3xl sm:text-4xl font-bold">
                                ₹{pricing.discountedPrice}
                              </div>
                            </div>
                            <div className="text-right text-xs sm:text-sm text-slate-400">
                              /{pricing.isYearly ? "year" : "month"}
                            </div>
                          </div>
                          {pricing.isYearly && (
                            <p className="text-sm text-slate-400 mt-2">Only ₹{pricing.monthlyPrice}/month</p>
                          )}
                          {planData.gst_tax > 0 && (
                            <p className="text-xs text-slate-500 mt-2">Includes {planData.gst_tax}% GST</p>
                          )}
                        </div>
                      </div>

                      {/* Features Included */}
                      {features.length > 0 && (
                        <div className="pt-4 sm:pt-6 border-t border-slate-700">
                          <h4 className="text-sm font-semibold mb-3 text-slate-300">What's Included</h4>
                          <div className="space-y-2">
                            {features.slice(0, 4).map((feature, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-300">{feature}</span>
                              </div>
                            ))}
                            {features.length > 4 && (
                              <p className="text-xs text-slate-400 mt-2">+{features.length - 4} more features</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trust Badge */}
                    {/* Payment Trust Badge */}
                    <div className="mt-6 w-full flex flex-col items-center relative z-10 pt-6 border-t border-slate-700">
                      <div className="flex items-center gap-1.5 mb-3">
                        <ShieldCheck size={14} className="text-green-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">100% Secure Payment By</span>
                      </div>
                      <div className="flex items-center gap-3 opacity-90 justify-center flex-wrap">
                        <div className="h-8 px-3 bg-white rounded flex items-center justify-center shadow-sm">
                          <img src="https://cdn.simpleicons.org/visa/1A1F71" alt="Visa" className="h-5 w-auto" />
                        </div>
                        <div className="h-8 px-3 bg-white rounded flex items-center justify-center shadow-sm">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4" />
                        </div>
                        <div className="h-8 px-3 bg-white rounded flex items-center justify-center shadow-sm">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" className="h-6 object-contain" />
                        </div>
                        <div className="h-8 px-3 bg-white rounded flex items-center justify-center shadow-sm">
                          <img src="https://cdn.simpleicons.org/phonepe/5f259f" alt="PhonePe" className="h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Money Back Guarantee */}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
