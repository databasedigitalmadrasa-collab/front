"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Lock, BookOpen, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)
    const [email, setEmail] = useState<string | null>(null)
    const [validatingToken, setValidatingToken] = useState(true)

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setValidatingToken(false)
                setIsTokenValid(false)
                return
            }

            try {
                const response = await apiClient.get<{ success: boolean; email?: string; error?: string }>(`/reset-password?token=${token}`)

                if (response.success && response.data?.success) {
                    setIsTokenValid(true)
                    setEmail(response.data.email || null)
                } else {
                    setIsTokenValid(false)
                    setError(response.message || response.data?.error || "Invalid or expired token.")
                }
            } catch (err) {
                setIsTokenValid(false)
                setError("Failed to validate token. Please try again.")
            } finally {
                setValidatingToken(false)
            }
        }

        validateToken()
    }, [token])

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields")
            setIsLoading(false)
            return
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long")
            setIsLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            const response = await apiClient.post<{ success: boolean; error?: string; message?: string }>("/reset-password", {
                token,
                password: newPassword,
            })

            if (response.success && response.data?.success) {
                setSuccess(true)
            } else {
                setError(response.message || response.data?.error || response.data?.message || "Failed to reset password. Please try again.")
            }
        } catch (err) {
            setError("An error occurred. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    if (validatingToken) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-md">
                <Loader2 className="w-8 h-8 text-[#0066ff] animate-spin mb-4" />
                <p className="text-[#4b4b4b]">Validating your request...</p>
            </div>
        )
    }

    if (!token || isTokenValid === false) {
        return (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center space-y-6 w-full max-w-md">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="text-red-600" size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-[#150101] mb-2">Invalid or Expired Link</h3>
                    <p className="text-[#4b4b4b]">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                </div>
                <Link
                    href="/forgot-password"
                    className="block w-full py-3 px-4 bg-[#0066ff] text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                    Request New Link
                </Link>
            </div>
        )
    }

    if (success) {
        return (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center space-y-6 w-full max-w-md">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-[#150101] mb-2">Password Reset Successful!</h3>
                    <p className="text-[#4b4b4b]">Your password has been updated successfully.</p>
                </div>
                <button
                    onClick={() => router.push("/login")}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#0066ff] to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition"
                >
                    Go to Login
                </button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="mb-8">
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
                        Create New Password
                    </h2>
                    <p className="text-[#4b4b4b]">
                        Enter your new password for <span className="font-semibold text-[#0066ff]">{email}</span>
                    </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-[#150101] mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-[#4b4b4b]" size={20} />
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-[#150101] placeholder-[#4b4b4b] focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#150101] mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-[#4b4b4b]" size={20} />
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
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
                                Resetting Password...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full grid-background flex items-center justify-center p-4">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center p-8 text-center bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-md">
                    <Loader2 className="w-8 h-8 text-[#0066ff] animate-spin mb-4" />
                    <p className="text-[#4b4b4b]">Loading...</p>
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
