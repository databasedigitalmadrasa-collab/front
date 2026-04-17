"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending" | "enrollment_failed">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [supportDetails, setSupportDetails] = useState<{
    orderId?: string
    email?: string
    transactionId?: string
    paymentState?: string
    amount?: number
  }>({})

  useEffect(() => {
    const processPayment = async () => {
      const paymentStatus = searchParams.get("status")
      const orderId = searchParams.get("orderId")

      console.log("Payment callback parameters:", {
        paymentStatus,
        orderId,
      })

      const enrollmentDataStr = sessionStorage.getItem("enrollmentData")

      if (!enrollmentDataStr) {
        console.error("Enrollment data not found in sessionStorage")
        setStatus("failed")
        setErrorMessage("Enrollment data not found. Please try again.")
        return
      }

      const enrollmentData = JSON.parse(enrollmentDataStr)
      console.log("Enrollment data retrieved:", enrollmentData)

      if (paymentStatus === "cancelled") {
        // User cancelled the payment
        console.log("User cancelled payment")
        setStatus("failed")
        setErrorMessage("Payment cancelled by user")
        sessionStorage.removeItem("enrollmentData")
        return
      }

      try {
        // Detect Razorpay parameters
        const razorpay_order_id = searchParams.get("razorpay_order_id")
        const razorpay_payment_id = searchParams.get("razorpay_payment_id")
        const razorpay_signature = searchParams.get("razorpay_signature")
        const uuid = searchParams.get("uuid")

        if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
          console.log("Razorpay verification parameters detected. Verifying callback...")
          const verifyResponse = await fetch("https://srv.digitalmadrasa.co.in/api/v1/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              uuid
            }),
          })

          const verifyResult = await verifyResponse.json()
          console.log("Verification API response:", verifyResult)

          if (verifyResponse.ok && verifyResult.success) {
            // VERIFIED - Proceed to enrollment
            console.log("Payment verified! Enrolling user...")
            const enrollResponse = await fetch("https://srv.digitalmadrasa.co.in/api/v1/users/enroll", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...enrollmentData,
                transaction_status: "success",
                subscription_status: "active",
                razorpay_payment_id,
                razorpay_order_id
              }),
            })

            const enrollResult = await enrollResponse.json()
            if (enrollResponse.ok && enrollResult.success) {
              sessionStorage.removeItem("enrollmentData")
              setStatus("success")
              return
            } else {
              setStatus("enrollment_failed")
              setErrorMessage(enrollResult.message || "Enrollment failed after successful payment.")
              setSupportDetails({
                orderId: razorpay_order_id,
                email: enrollmentData.email,
                transactionId: razorpay_payment_id,
                paymentState: "PAID",
                amount: enrollmentData.subscription_amount_paid,
              })
              return
            }
          } else {
            setStatus("failed")
            setErrorMessage(verifyResult.error || "Payment verification failed. Please contact support.")
            return
          }
        }

        // Fallback for non-Razorpay or missing params
        console.warn("No valid Razorpay parameters found in callback.")
        setStatus("failed")
        setErrorMessage("Invalid payment callback. Please contact support.")
      } catch (error) {
        console.error("Payment verification error:", error)
        setStatus("failed")
        setErrorMessage("Failed to verify payment status. Please contact support.")
      }
    }

    processPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment</h1>
            <p className="text-slate-600">Please wait while we process your payment and complete your enrollment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-600 mb-6">
              Your enrollment is confirmed and your subscription is now active. Welcome to Digital Madarsa!
            </p>
            <Link href="/dashboard">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                Go to Dashboard
              </Button>
            </Link>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Processing</h1>
            <p className="text-slate-600 mb-6">
              Your payment is being processed. Your account has been created, but your subscription will be activated
              once the payment is confirmed.
            </p>
            <Link href="/dashboard">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                Go to Dashboard
              </Button>
            </Link>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-600 mb-6">
              {errorMessage || "There was an issue processing your payment. Please try again."}
            </p>
            <Link href="/enroll/1">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                Try Again
              </Button>
            </Link>
          </>
        )}

        {status === "enrollment_failed" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful - Enrollment Issue</h1>
            <p className="text-slate-600 mb-4">
              Your payment was successful but we encountered an issue creating your account. Please contact support with
              the details below.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-slate-500 mb-3 text-center font-semibold">
                📸 Please take a screenshot of these details
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-700">Order ID:</span>
                  <span className="text-slate-900 font-mono text-xs">{supportDetails.orderId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-700">Transaction ID:</span>
                  <span className="text-slate-900 font-mono text-xs">{supportDetails.transactionId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-700">Payment Status:</span>
                  <span className="text-green-600 font-semibold">{supportDetails.paymentState}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-700">Email:</span>
                  <span className="text-slate-900">{supportDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Amount Paid:</span>
                  <span className="text-slate-900">
                    ₹{supportDetails.amount ? (supportDetails.amount / 100).toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Your payment has been received. Our support team will manually activate your account within 24 hours.
            </p>

            <div className="space-y-3">
              <Link href="/dashboard/support">
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                  Contact Support
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full h-12 border-slate-300 text-slate-700 font-semibold rounded-xl bg-transparent"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
