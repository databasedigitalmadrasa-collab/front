"use client"

import type React from "react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Eye, EyeOff, AlertTriangle, User, Lock, Wallet } from "lucide-react"

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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"payment" | "profile" | "account">("profile")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [paymentData, setPaymentData] = useState({
    fullAddress: "",
    city: "",
    state: "",
    pincode: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    branchName: "",
    upiAddress: "",
  })

  const [profileData, setProfileData] = useState({
    fullName: "Ayaan Ahmed",
    email: "ayaan@example.com",
    contactNumber: "+91 9876543210",
    country: "India",
    state: "Maharashtra",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handlePaymentUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Payment details updated:", paymentData)
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Profile updated:", profileData)
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!")
      return
    }
    console.log("Password changed")
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      console.log("Account deleted")
    } else {
      setShowDeleteConfirm(true)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-[#150101] mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your affiliate account settings</p>
        </div>

        <div className="mb-6 sm:mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-full w-fit min-w-full sm:min-w-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === "profile" ? "bg-white text-[#0066ff] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("payment")}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === "payment" ? "bg-white text-[#0066ff] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Payment
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === "account" ? "bg-white text-[#0066ff] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Account
            </button>
          </div>
        </div>

        {/* Profile Settings Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#150101] mb-4 sm:mb-6">Profile Photo</h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-gray-50">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white text-xl sm:text-2xl font-bold">
                      AA
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 bg-[#0066ff] rounded-full flex items-center justify-center text-white hover:bg-[#0052cc] transition-colors shadow-lg">
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Upload a clear photo. JPG, PNG (Max 2MB)
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button className="bg-[#0066ff] hover:bg-[#0052cc] rounded-xl text-sm h-10 sm:h-11">
                      Change Photo
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl bg-transparent text-sm h-10 sm:h-11"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#150101] mb-4 sm:mb-6">
                Personal Information
              </h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="h-11 sm:h-12 rounded-xl bg-gray-50 border-gray-200 cursor-not-allowed text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Contact Number
                  </Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={profileData.contactNumber}
                    onChange={(e) => setProfileData({ ...profileData, contactNumber: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-xs sm:text-sm font-semibold text-gray-700">
                      Country
                    </Label>
                    <Input
                      id="country"
                      type="text"
                      value={profileData.country}
                      disabled
                      className="h-11 sm:h-12 rounded-xl bg-gray-50 border-gray-200 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-xs sm:text-sm font-semibold text-gray-700">
                      State
                    </Label>
                    <Select
                      value={profileData.state}
                      onValueChange={(value) => setProfileData({ ...profileData, state: value })}
                    >
                      <SelectTrigger className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base">
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

                <div className="flex justify-end pt-2 sm:pt-4">
                  <Button
                    type="submit"
                    className="bg-[#0066ff] hover:bg-[#0052cc] px-6 sm:px-8 rounded-xl text-sm h-10 sm:h-11 w-full sm:w-auto"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#150101] mb-4 sm:mb-6">KYC Details</h2>
              <form onSubmit={handlePaymentUpdate} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullAddress" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Full Address
                  </Label>
                  <Input
                    id="fullAddress"
                    type="text"
                    value={paymentData.fullAddress}
                    onChange={(e) => setPaymentData({ ...paymentData, fullAddress: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                    placeholder="House/Flat No, Building Name, Street"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs sm:text-sm font-semibold text-gray-700">
                      City
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={paymentData.city}
                      onChange={(e) => setPaymentData({ ...paymentData, city: e.target.value })}
                      className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentState" className="text-xs sm:text-sm font-semibold text-gray-700">
                      State
                    </Label>
                    <Select
                      value={paymentData.state}
                      onValueChange={(value) => setPaymentData({ ...paymentData, state: value })}
                    >
                      <SelectTrigger className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base">
                        <SelectValue placeholder="Enter state" />
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

                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Pincode
                  </Label>
                  <Input
                    id="pincode"
                    type="text"
                    value={paymentData.pincode}
                    onChange={(e) => setPaymentData({ ...paymentData, pincode: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                  />
                </div>

                <div className="flex justify-end pt-2 sm:pt-4">
                  <Button
                    type="submit"
                    className="bg-[#0066ff] hover:bg-[#0052cc] px-6 sm:px-8 rounded-xl text-sm h-10 sm:h-11 w-full sm:w-auto"
                  >
                    Save KYC Details
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#150101] mb-2">Payout Details</h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                Enter your bank account details to receive payments. Processing time: 3-5 business days.
              </p>
              <form onSubmit={handlePaymentUpdate} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Account Holder Name
                  </Label>
                  <Input
                    id="accountHolderName"
                    type="text"
                    value={paymentData.accountHolderName}
                    onChange={(e) => setPaymentData({ ...paymentData, accountHolderName: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                    placeholder="Enter full name as per bank account"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Account Number
                  </Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    value={paymentData.accountNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, accountNumber: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                    placeholder="Enter account number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmAccountNumber" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Confirm Account Number
                  </Label>
                  <Input
                    id="confirmAccountNumber"
                    type="text"
                    value={paymentData.confirmAccountNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, confirmAccountNumber: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                    placeholder="Re-enter account number"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode" className="text-xs sm:text-sm font-semibold text-gray-700">
                      IFSC Code
                    </Label>
                    <Input
                      id="ifscCode"
                      type="text"
                      value={paymentData.ifscCode}
                      onChange={(e) => setPaymentData({ ...paymentData, ifscCode: e.target.value })}
                      className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                      placeholder="e.g., SBIN0001234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchName" className="text-xs sm:text-sm font-semibold text-gray-700">
                      Branch Name
                    </Label>
                    <Input
                      id="branchName"
                      type="text"
                      value={paymentData.branchName}
                      onChange={(e) => setPaymentData({ ...paymentData, branchName: e.target.value })}
                      className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upiAddress" className="text-xs sm:text-sm font-semibold text-gray-700">
                    UPI / VPA Address (Optional)
                  </Label>
                  <Input
                    id="upiAddress"
                    type="text"
                    value={paymentData.upiAddress}
                    onChange={(e) => setPaymentData({ ...paymentData, upiAddress: e.target.value })}
                    className="h-11 sm:h-12 rounded-xl border-gray-200 text-sm sm:text-base"
                    placeholder="yourname@upi"
                  />
                  <p className="text-xs text-gray-500">For faster payments via UPI</p>
                </div>

                <div className="flex justify-end pt-2 sm:pt-4">
                  <Button
                    type="submit"
                    className="bg-[#0066ff] hover:bg-[#0052cc] px-6 sm:px-8 rounded-xl text-sm h-10 sm:h-11 w-full sm:w-auto"
                  >
                    Save Payout Details
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Settings Tab */}
        {activeTab === "account" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#150101] mb-4 sm:mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="h-11 sm:h-12 rounded-xl border-gray-200 pr-12 text-sm sm:text-base"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="h-11 sm:h-12 rounded-xl border-gray-200 pr-12 text-sm sm:text-base"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 8 characters with letters and numbers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="h-11 sm:h-12 rounded-xl border-gray-200 pr-12 text-sm sm:text-base"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 sm:pt-4">
                  <Button
                    type="submit"
                    className="bg-[#0066ff] hover:bg-[#0052cc] px-6 sm:px-8 rounded-xl text-sm h-10 sm:h-11 w-full sm:w-auto"
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-red-100 shadow-sm">
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-heading font-bold text-red-600 mb-2">Delete Account</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Once you delete your account, there is no going back. All your data, earnings, and referrals will be
                    permanently removed.
                  </p>
                </div>
              </div>

              {showDeleteConfirm && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs sm:text-sm text-red-800 font-semibold">
                    Are you absolutely sure? This action cannot be undone.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  variant="outline"
                  className="bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white rounded-xl text-sm h-10 sm:h-11 w-full sm:w-auto"
                >
                  {showDeleteConfirm ? "Confirm Delete Account" : "Delete My Account"}
                </Button>
                {showDeleteConfirm && (
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="rounded-xl text-sm h-10 sm:h-11 w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
