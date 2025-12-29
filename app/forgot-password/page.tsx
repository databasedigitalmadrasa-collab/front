"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Mail, BookOpen, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>("/users/forgot-password", { email })

      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.message || "Failed to send reset link. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen w-full grid-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#150101] mb-2">Check your inbox</h3>
              <p className="text-[#4b4b4b]">
                If an account exists for <span className="font-semibold text-[#0066ff]">{email}</span>, you will receive password reset instructions.
              </p>
            </div>

            <Link
              href="/login"
              className="block w-full py-3 px-4 bg-gradient-to-r from-[#0066ff] to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition"
            >
              Back to Login
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="block w-full text-sm text-[#0066ff] hover:underline"
            >
              Try another email?
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full grid-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[#0066ff] hover:underline mb-6 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden">
                <Image
                  src="/logo/logo_icon.png"
                  alt="Digital Madrasa Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-semibold text-[#150101]" style={{ fontFamily: "Plus Jakarta Sans" }}>
                Digital Madarsa
              </span>
            </div>

            <h2 className="text-3xl font-bold text-[#150101] mb-2" style={{ fontFamily: "Plus Jakarta Sans" }}>
              Forgot Password?
            </h2>
            <p className="text-[#4b4b4b]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#150101] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#4b4b4b]" size={20} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-[#150101] placeholder-[#4b4b4b] focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#0066ff] to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
