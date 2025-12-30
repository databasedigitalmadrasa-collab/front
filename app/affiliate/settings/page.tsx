"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Eye, EyeOff, AlertTriangle, User, Lock, Loader2, Upload } from "lucide-react"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"

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

interface UserSettings {
  profile: {
    full_name: string
    contact: string
    country: string
    state: string
    profile_pic_url: string
  }
  account: {
    email: string
    is_student: number
    is_affiliate: number
    is_subscribed: number
    subscription_id: string | null
    plan_id: number | null
    platform_id: string | null
    created_at: string
    updated_at: string
  }
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useUserAuth()
  const [activeTab, setActiveTab] = useState<"profile" | "account">("profile")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    contact: "",
    country: "India",
    state: "",
    profile_pic_url: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const response = await apiClient.get(`/users/${user.id}/settings`)

        if (response.success && response.data?.settings) {
          const settings: UserSettings = response.data.settings
          setProfileData({
            full_name: settings.profile.full_name || "",
            email: settings.account.email || "",
            contact: settings.profile.contact || "",
            country: settings.profile.country || "India",
            state: settings.profile.state || "",
            profile_pic_url: settings.profile.profile_pic_url || "",
          })
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
        setMessage({ type: "error", text: "Failed to load settings" })
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchSettings()
    }
  }, [user, authLoading])

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)" })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" })
      return
    }

    try {
      setUploading(true)
      setMessage(null)

      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const uploadPath = `user-profiles/user-${timestamp}-${sanitizedFileName}`
      const contentType = file.type || "image/jpeg"

      const endpoint = "https://srv.digitalmadrasa.co.in/api/v1"
      const uploadUrl = `${endpoint}/static/objects?path=${encodeURIComponent(uploadPath)}&contentType=${encodeURIComponent(contentType)}`

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const imageUrl = `https://cdn.digitalmadrasa.co.in/${uploadPath}`
      setProfileData({ ...profileData, profile_pic_url: imageUrl })
      setMessage({ type: "success", text: "Profile picture uploaded successfully" })
    } catch (error) {
      console.error("Upload error:", error)
      setMessage({ type: "error", text: "Failed to upload image" })
    } finally {
      setUploading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setSaving(true)
      setMessage(null)

      const response = await apiClient.put(`/users/${user.id}/settings/profile`, {
        full_name: profileData.full_name,
        contact: profileData.contact,
        country: profileData.country,
        state: profileData.state,
        profile_pic_url: profileData.profile_pic_url,
      })

      if (response.success) {
        setMessage({ type: "success", text: "Profile updated successfully" })
      } else {
        setMessage({ type: "error", text: response.error || "Failed to update profile" })
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match!" })
      return
    }

    if (passwordData.newPassword && passwordData.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const payload: { password?: string } = {}

      if (passwordData.newPassword) {
        payload.password = passwordData.newPassword
      }

      if (Object.keys(payload).length === 0) {
        setMessage({ type: "error", text: "No changes to save" })
        setSaving(false)
        return
      }

      const response = await apiClient.put(`/users/${user.id}/settings/account`, payload)

      if (response.success) {
        setMessage({ type: "success", text: "Account settings updated successfully" })
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage({ type: "error", text: response.error || "Failed to update account settings" })
      }
    } catch (error) {
      console.error("Failed to update account:", error)
      setMessage({ type: "error", text: "Failed to update account settings" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      console.log("Account deleted")
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const getUserInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066ff]" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#150101] mb-2">Settings</h1>
          <p className="text-gray-600">Manage your profile and account preferences</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-full w-fit">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              activeTab === "profile" ? "bg-white text-[#0066ff] shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              activeTab === "account" ? "bg-white text-[#0066ff] shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Lock className="w-4 h-4" />
            Account
          </button>
        </div>

        {/* Profile Settings Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-[#150101] mb-6">Profile Photo</h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-gray-50">
                    {profileData.profile_pic_url ? (
                      <AvatarImage src={profileData.profile_pic_url || "/placeholder.svg"} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white text-2xl font-bold">
                      {getUserInitials(profileData.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#0066ff] rounded-full flex items-center justify-center text-white hover:bg-[#0052cc] transition-colors shadow-lg disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-gray-600 mb-4">Upload a clear photo. JPG, PNG (Max 5MB)</p>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-[#0066ff] hover:bg-[#0052cc] rounded-xl"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Change Photo
                        </>
                      )}
                    </Button>
                    {profileData.profile_pic_url && (
                      <Button
                        variant="outline"
                        onClick={() => setProfileData({ ...profileData, profile_pic_url: "" })}
                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl bg-transparent"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-[#150101] mb-6">Personal Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="h-12 rounded-xl border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="h-12 rounded-xl bg-gray-50 border-gray-200 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">Email can be changed in Account settings</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-sm font-semibold text-gray-700">
                    Contact Number
                  </Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={profileData.contact}
                    onChange={(e) => setProfileData({ ...profileData, contact: e.target.value })}
                    className="h-12 rounded-xl border-gray-200"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-semibold text-gray-700">
                      Country
                    </Label>
                    <Input
                      id="country"
                      type="text"
                      value={profileData.country}
                      disabled
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
                      State
                    </Label>
                    <Select
                      value={profileData.state}
                      onValueChange={(value) => setProfileData({ ...profileData, state: value })}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
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

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="bg-[#0066ff] hover:bg-[#0052cc] px-8 rounded-xl">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Settings Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-[#150101] mb-6">Email Address</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Current Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-[#150101] mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="h-12 rounded-xl border-gray-200 pr-12"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="h-12 rounded-xl border-gray-200 pr-12"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="bg-[#0066ff] hover:bg-[#0052cc] px-8 rounded-xl">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Account"
                    )}
                  </Button>
                </div>
              </form>
            </div>

            
          </div>
        )}
      </div>
    </div>
  )
}
