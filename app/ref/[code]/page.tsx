"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { API_BASE_URL as DM_API_BASE_URL } from "@/lib/dm-api"

// Base URL resolution lives in lib/dm-api.ts, so pointing the portal at a
// different backend is one environment variable rather than an edit per file.
const API_BASE_URL = DM_API_BASE_URL

export default function ReferralRedirect() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // `?plan=` picks which plan's checkout the visitor lands on (the per-plan
    // links on Marketing Tools); anything but a plain id falls back to plan 1.
    const plan = new URLSearchParams(window.location.search).get("plan")
    const enrollPath = `/enroll/${plan && /^\d+$/.test(plan) ? plan : "1"}`

    const verifyRecordAndRedirect = async () => {
      if (!code) {
        router.push(enrollPath)
        return
      }

      try {
        console.log("Verifying referral code:", code)

        const verifyResponse = await fetch(`${API_BASE_URL}/verify-referral`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referral_code: code,
          }),
        })

        const verifyData = await verifyResponse.json()
        console.log("Verification response:", verifyData)

        // Check if the code is valid
        if (!verifyData.valid) {
          console.log("Invalid referral code, redirecting without ref parameter")
          setError("Invalid referral code")
          // Redirect without the ref parameter after 2 seconds
          setTimeout(() => {
            router.push(enrollPath)
          }, 2000)
          return
        }

        console.log("Valid referral code, recording click")

        await fetch(`${API_BASE_URL}/reffral-link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referral_code: code,
          }),
        })

        console.log("Referral click recorded, redirecting with ref parameter...")

        // Redirect to enrollment page with referral code
        router.push(`${enrollPath}?ref=${encodeURIComponent(code)}`)
      } catch (error) {
        console.error("Error processing referral:", error)
        setError("Error processing referral link")
        // Redirect without ref parameter after 2 seconds
        setTimeout(() => {
          router.push(enrollPath)
        }, 2000)
      }
    }

    verifyRecordAndRedirect()
  }, [code, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-lg text-red-600 font-medium">{error}</p>
            <p className="text-sm text-slate-600">Redirecting to enrollment...</p>
          </div>
        ) : (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg text-slate-600">Verifying referral code...</p>
          </>
        )}
      </div>
    </div>
  )
}
