"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, Lock, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, isLoading: authLoading } = useAuth()
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
      setError("Please enter a valid admin email")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Admin password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      const result = await login(email, password)

      if (!result.success) {
        setError(result.error || "Invalid email or password")
      }
      // On success, the login function will handle redirect
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f7f3ef] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,102,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,102,255,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fff7e0] rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0066ff]/10 rounded-full blur-3xl opacity-40" />

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content - Admin Info */}
          <div className="hidden md:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-3 mb-8 p-3 rounded-xl bg-white border border-gray-200 w-fit shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-[#0066ff] flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#150101]" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  Digital Madrasa Admin
                </span>
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold text-[#150101] leading-tight mb-6"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Admin Portal Access
              </h1>

              <p className="text-lg text-[#4b4b4b] leading-relaxed">
                Secure access to manage courses, users, content, and platform analytics. Monitor and control all aspects
                of the Digital Madrasa learning platform.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0066ff]/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#0066ff]" />
                </div>
                <div>
                  <p className="font-semibold text-[#150101]">User Management</p>
                  <p className="text-sm text-[#4b4b4b]">Manage student accounts, permissions, and enrollments</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0066ff]/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#0066ff]" />
                </div>
                <div>
                  <p className="font-semibold text-[#150101]">Content Control</p>
                  <p className="text-sm text-[#4b4b4b]">Upload, edit, and organize course materials and videos</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0066ff]/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#0066ff]" />
                </div>
                <div>
                  <p className="font-semibold text-[#150101]">Analytics & Reports</p>
                  <p className="text-sm text-[#4b4b4b]">Track engagement, progress, and platform performance metrics</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0066ff]/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#0066ff]" />
                </div>
                <div>
                  <p className="font-semibold text-[#150101]">Security Settings</p>
                  <p className="text-sm text-[#4b4b4b]">Configure security policies and access controls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form - Admin Login */}
          <div className="w-full">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-10 shadow-xl">
              {/* Form Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0066ff] flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#150101]" style={{ fontFamily: "Plus Jakarta Sans" }}>
                      Admin Sign In
                    </h2>
                    <p className="text-sm text-[#4b4b4b]">Secure administrative access</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-3 bg-[#0066ff]/5 border border-[#0066ff]/20 rounded-lg flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#0066ff] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#0066ff]">
                  This is a secure admin area. All login attempts are monitored and logged.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-semibold text-[#150101] mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    id="admin-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@digitalmadrasa.com"
                    disabled={isLoading || authLoading}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-[#f7f3ef] text-[#150101] placeholder-[#4b4b4b] focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="admin-password" className="block text-sm font-semibold text-[#150101] mb-2">
                    Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="admin-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secure password"
                      disabled={isLoading || authLoading}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-[#f7f3ef] text-[#150101] placeholder-[#4b4b4b] focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || authLoading}
                      className="absolute right-3 top-3 text-[#4b4b4b] hover:text-[#150101] transition disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full py-3 px-4 bg-[#0066ff] text-white font-semibold rounded-xl hover:bg-[#0052cc] hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading || authLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield size={20} />
                      Access Admin Portal
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
