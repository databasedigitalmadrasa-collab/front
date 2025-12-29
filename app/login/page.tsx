"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, LogIn, BookOpen, AlertCircle } from "lucide-react"
import { loginUser } from "@/lib/user-auth"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    const result = await loginUser(email, password)

    if (result.success && result.user) {
      toast({
        title: "Success!",
        description: "Welcome back! Redirecting...",
      })

      const hasBothRoles = result.user.is_student === 1 && result.user.is_affiliate === 1
      const isStudent = result.user.is_student === 1
      const isAffiliate = result.user.is_affiliate === 1

      if (hasBothRoles) {
        // User has both roles - default to dashboard
        router.push("/dashboard")
      } else if (isStudent) {
        // Only student access
        router.push("/dashboard")
      } else if (isAffiliate) {
        // Only affiliate access
        router.push("/affiliate")
      } else {
        setError("Your account does not have access to any portal.")
        setIsLoading(false)
      }
    } else {
      setError(result.error || "Login failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="hidden md:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-3 mb-8 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 w-fit">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden">
                  <Image
                    src="/logo/logo_icon.png"
                    alt="Digital Madrasa Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-[#150101]" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  Digital Madrasa
                </span>
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold text-[#150101] leading-tight mb-6"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Welcome Back to Your Learning Journey
              </h1>

              <p className="text-lg text-[#4b4b4b] leading-relaxed">
                Access your personalized courses, track your progress, and continue mastering industry-leading skills
                with expert mentors.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0066ff]/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#0066ff]" />
                </div>
                <div>
                  <p className="font-semibold text-[#150101]">Learn from Experts</p>
                  <p className="text-sm text-[#4b4b4b]">
                    Study with experienced mentors who have worked internationally
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0066ff]/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#0066ff]" />
                </div>
                <div>
                  <p className="font-semibold text-[#150101]">Real-World Skills</p>
                  <p className="text-sm text-[#4b4b4b]">Master client acquisition and industry-standard tools</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0066ff]/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#0066ff]" />
                </div>
                <div>
                  <p className="font-semibold text-[#150101]">Track Progress</p>
                  <p className="text-sm text-[#4b4b4b]">
                    Monitor your learning with detailed analytics and certificates
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="w-full">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 lg:p-10 shadow-2xl">
              {/* Form Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#150101] mb-2" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  Sign In
                </h2>
                <p className="text-[#4b4b4b]">Access your learning dashboard and continue your courses</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#150101] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-[#150101] placeholder-[#4b4b4b] focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#150101] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-[#150101] placeholder-[#4b4b4b] focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#4b4b4b] hover:text-[#150101] transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
                )}

                {/* Remember Me & Forgot Password */}
                {/* Forgot Password */}
                <div className="flex items-center justify-end text-sm">
                  <Link href="/forgot-password" className="text-[#0066ff] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                {/* Session Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Note: Logging in will automatically sign you out from any other active sessions on other devices.</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#0066ff] to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-[#4b4b4b]">NEW HERE?</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-[#4b4b4b] mb-4">
                Don't have an account?{" "}
                <Link href="/enroll/complete" className="text-[#0066ff] hover:underline font-semibold">
                  Enroll Now
                </Link>
              </p>

              {/* Footer Info */}
              <p className="text-center text-xs text-[#4b4b4b] pt-4 border-t border-gray-200">
                By signing in, you agree to our{" "}
                <Link href="/legal/terms" className="text-[#0066ff] hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="text-[#0066ff] hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
