"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Shield, ArrowLeft, Tag, X, Loader2, Lock, ShieldCheck } from "lucide-react"
import Link from "next/link"

declare global {
  interface Window {
    Razorpay?: any
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
  is_featured: number | string | boolean
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
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    contactNumber: "",
    country: "India",
    state: "",
    couponCode: "",
    password: "",
    referralCode: refFromUrl || "",
  })

  const [referralStatus, setReferralStatus] = useState<"idle" | "verifying" | "valid" | "invalid">(
    refFromUrl ? "valid" : "idle",
  )
  const [couponStatus, setCouponStatus] = useState<"idle" | "verifying" | "valid" | "invalid">("idle")
  const [couponMessage, setCouponMessage] = useState<string>("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  } | null>(null)

  const [isFormValid, setIsFormValid] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [verifyingReferral, setVerifyingReferral] = useState(false)

  useEffect(() => {
    const fetchPlanData = async () => {
      setIsLoadingPlan(true)
      setPlanError(null)

      // Only the featured plan is sold publicly. It is resolved from the list
      // rather than trusted from the URL, so stale links (/enroll/1), unknown ids
      // and ids of non-featured plans all land on the featured checkout instead
      // of exposing the rest of the price list.
      try {
        const response = await fetch(`${API_BASE_URL}/subscription-plans`)
        const result = await response.json()
        const featured: SubscriptionPlan | undefined = result.success
          ? result.items?.find((plan: SubscriptionPlan) => Number(plan.is_featured) === 1)
          : undefined

        if (featured) {
          setPlanData(featured)
        } else {
          setPlanData(null)
          setPlanError("Enrollment is not open right now. Please check back soon.")
        }
      } catch (error) {
        console.error("Error fetching featured plan:", error)
        setPlanError("Error loading plan. Please try again.")
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
    let discountedAmount = plan.discounted_amount || baseAmount

    // Apply Coupon Discount
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discountedAmount = discountedAmount - (discountedAmount * (appliedCoupon.discount_value / 100));
      } else {
        discountedAmount = discountedAmount - appliedCoupon.discount_value;
      }
      discountedAmount = Math.max(0, discountedAmount); // Ensure no negative price
    }

    const savings = baseAmount - discountedAmount

    return {
      originalPrice: baseAmount,
      discountedPrice: Math.round(discountedAmount), // Return rounded integer for display/payment
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

    if (field === "couponCode" && couponStatus !== "idle" && couponStatus !== "valid") {
      setCouponStatus("idle");
      setCouponMessage("");
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

  const handleVerifyCoupon = async () => {
    const code = formData.couponCode.trim();
    if (!code) return;
    if (!planData) return;

    setCouponStatus("verifying");
    setCouponMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, planId: planData.id })
      });
      const data = await res.json();

      if (data.success && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponStatus("valid");
        setCouponMessage("Coupon applied successfully!");
      } else {
        setAppliedCoupon(null);
        setCouponStatus("invalid");
        setCouponMessage(data.message || "Invalid coupon code");
      }
    } catch (err) {
      console.error(err);
      setCouponStatus("invalid");
      setCouponMessage("Failed to validate coupon");
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponStatus("idle");
    setCouponMessage("");
    handleInputChange("couponCode", "");
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

      // 1. Store temporary enrollment data
      sessionStorage.setItem("enrollmentData", JSON.stringify(enrollmentData))
      console.log("Enrollment data stored:", enrollmentData)

      // 2. Create Razorpay Order on Backend
      const orderRes = await fetch(`${API_BASE_URL}/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount, // in paisa
          currency: "INR",
          receipt: merchantOrderId
        })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || "Failed to create order");

      // 3. Create initial payment log
      const logRes = await fetch(`${API_BASE_URL}/payment/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: null,
          package_id: planData.id,
          amount_cents: amount,
          currency: "INR",
          razorpay_order_id: orderData.order_id,
          email: formData.email,
          contact_number: formData.contactNumber,
          referral_code: referralStatus === "valid" ? formData.referralCode : null
        })
      });
      const logData = await logRes.json();
      if (!logData.success) throw new Error("Failed to log transaction");
      const paymentLogUuid = logData.uuid;

      // 4. Initialize Razorpay Checkout
      if (!window.Razorpay) {
        alert("Payment gateway failed to load. Please refresh.");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Digital Madrasa",
        description: `Enrollment for ${planData.title}`,
        order_id: orderData.order_id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.contactNumber,
        },
        theme: { color: "#2563eb" },
        handler: async (response: any) => {
          setIsProcessingPayment(true);
          try {
            // Update log with success
            await fetch(`${API_BASE_URL}/payment/log/${paymentLogUuid}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: 'success',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            window.location.href = `/payment/callback?status=success&razorpay_order_id=${response.razorpay_order_id}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_signature=${response.razorpay_signature}&uuid=${paymentLogUuid}`;
          } catch (err) {
            console.error("Success handling failed:", err);
            window.location.href = `/payment/callback?status=failed&orderId=${merchantOrderId}`;
          }
        },
        modal: {
          ondismiss: async () => {
            setIsProcessingPayment(false);
            // Update log with user cancellation
            await fetch(`${API_BASE_URL}/payment/log/${paymentLogUuid}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: 'failed',
                error_description: 'User dismissed the payment modal'
              })
            }).catch(console.error);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response: any) => {
        console.error("Payment failed:", response.error);
        await fetch(`${API_BASE_URL}/payment/log/${paymentLogUuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: 'failed',
            error_code: response.error.code,
            error_description: response.error.description
          })
        }).catch(console.error);
      });
      rzp.open();

    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
      setIsProcessingPayment(false)
    }
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
                        Coupon Code (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${couponStatus === 'valid' ? 'text-green-600' : 'text-slate-400'}`} />
                          <Input
                            id="couponCode"
                            type="text"
                            placeholder="Enter coupon code"
                            value={formData.couponCode}
                            onChange={(e) => handleInputChange("couponCode", e.target.value.toUpperCase())}
                            readOnly={couponStatus === 'valid' || couponStatus === 'verifying'}
                            className={`h-10 sm:h-11 pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${couponStatus === 'valid' ? "border-green-200 bg-green-50" :
                              couponStatus === 'invalid' ? "border-red-200 bg-red-50" : ""
                              }`}
                          />
                        </div>
                        {couponStatus === 'valid' ? (
                          <Button
                            type="button"
                            onClick={removeCoupon}
                            variant="outline"
                            className="h-10 sm:h-11 px-3 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={handleVerifyCoupon}
                            disabled={!formData.couponCode || couponStatus === 'verifying'}
                            variant="outline"
                            className="h-10 sm:h-11 px-4 sm:px-5 border-slate-200 hover:bg-slate-50 bg-transparent text-sm"
                          >
                            {couponStatus === 'verifying' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                          </Button>
                        )}
                      </div>

                      {couponStatus === 'valid' && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          {couponMessage}
                        </p>
                      )}
                      {couponStatus === 'invalid' && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {couponMessage}
                        </p>
                      )}
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
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Money Back Guarantee */}
                </div>
              </div>
            </div>
          )}

          {!planData && planError && (
            <div className="max-w-md mx-auto text-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <p className="text-slate-700 mb-6">{planError}</p>
              <Link href="/" className="text-blue-600 hover:underline font-medium">
                Back to home
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
