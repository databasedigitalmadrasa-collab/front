"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Eye,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { getUserToken } from "@/lib/user-auth"
import { useUserAuth } from "@/hooks/use-user-auth"

interface PayoutRequest {
  id: number
  user_id: number
  wallet_id: number
  amount_cents: number
  status: string
  note: string | null
  transaction_reference_no: string | null
  payment_method_of_settlement: string | null
  proof_of_settlement: string | null
  created_at: string
  updated_at: string
  requested_at: string
  processed_at: string | null
}

export default function WalletPage() {
  const { toast } = useToast()
  const { user: currentUser } = useUserAuth()
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")

  const [isKycModalOpen, setIsKycModalOpen] = useState(false)
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [kycSubmitting, setKycSubmitting] = useState(false)
  const [bankSubmitting, setBankSubmitting] = useState(false)

  const [kycForm, setKycForm] = useState({
    fullName: "",
    panNumber: "",
    aadharNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  })

  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    upiId: "",
  })

  // Wallet Stats State
  const [walletStats, setWalletStats] = useState({
    balance: 0,
    paidOut: 0,
    pending: 0,
    threshold: 0,
    kycStatus: "pending",
    walletId: 0
  })

  // Derived Values
  const currentBalance = walletStats.balance / 100
  const payoutThreshold = walletStats.threshold / 100
  const totalPaidOut = walletStats.paidOut / 100
  const totalPending = walletStats.pending / 100

  const kycStatus = walletStats.kycStatus
  // Simplified check: assume no bank account unless fetched (backend getWalletByUser didn't return it yet, but handled in future)
  const [hasBankAccount, setHasBankAccount] = useState(false)

  const canGetPaid = currentBalance >= payoutThreshold && hasBankAccount && kycStatus === "approved"

  const fetchAllData = async () => {
    if (!currentUser?.id) return
    setLoading(true)
    try {
      const token = getUserToken()
      if (!token) return

      // 1. Payouts
      const payoutRes = await apiClient.get<{ success: boolean; items: PayoutRequest[] }>(
        `/payout-requests?user_id=${currentUser.id}`,
        token
      )
      if (payoutRes.success && payoutRes.data?.items) {
        setPayouts(payoutRes.data.items)
      }

      // 2. Wallet Stats
      const walletRes = await apiClient.get<any>(`/wallet/user/${currentUser.id}`, token)

      if (walletRes.success && walletRes.data) {
        // Handle potential double wrapping if backend sends { success: true, data: ... }
        // and apiClient wraps it in another layer.
        const responseBody = walletRes.data
        const d = responseBody.data || responseBody

        console.log("Wallet Data Update:", d)
        setWalletStats({
          balance: d.wallet?.balance_amount_cents || 0,
          paidOut: d.total_paid_out_cents || 0,
          pending: d.total_pending_payouts_cents || 0,
          threshold: d.minimum_payout_threshold || 0,
          kycStatus: d.kyc_status || "not_submitted",
          walletId: d.wallet?.id || 0
        })

        const isBankAdded = d.is_bank_added === 1
        setHasBankAccount(isBankAdded)

        if (isBankAdded) {
          // 3. Bank Account - Only fetch if added
          const bankRes = await apiClient.get<any>(`/affiliate-bank/user/${currentUser.id}`, token)
          if (bankRes.success && bankRes.data && bankRes.data.data) {
            const bank = bankRes.data.data
            setBankForm({
              accountHolderName: bank.account_holder_name || "",
              accountNumber: bank.bank_account_number || "",
              ifscCode: bank.ifsc_code || "",
              bankName: bank.bank_name || "",
              branchName: bank.branch_name || "",
              upiId: bank.upi_id || ""
            })
          }
        } else {
          // Reset form if no bank added (optional)
          setBankForm({
            accountHolderName: "",
            accountNumber: "",
            ifscCode: "",
            bankName: "",
            branchName: "",
            upiId: ""
          })
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      fetchAllData()
    }
  }, [currentUser?.id])

  // Alias for Refresh button
  const fetchPayouts = fetchAllData

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please login to request a payout",
        variant: "destructive",
      })
      return
    }

    const amountCents = Math.round(Number.parseFloat(amount) * 100)

    if (isNaN(amountCents) || amountCents <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (amountCents > currentBalance * 100) {
      toast({
        title: "Error",
        description: "Amount exceeds available balance",
        variant: "destructive",
      })
      return
    }

    if (!walletStats.walletId) {
      toast({
        title: "Error",
        description: "Wallet not found. Please refresh page.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const token = getUserToken()

      const response = await apiClient.post<any>(
        "/payout-requests",
        {
          user_id: currentUser.id,
          wallet_id: walletStats.walletId,
          amount_cents: amountCents,
          status: "pending",
          note: note || null,
        },
        token || undefined,
      )

      if (response.success) {
        toast({
          title: "Success",
          description: "Payout request submitted successfully",
        })
        setAmount("")
        setNote("")
        setIsModalOpen(false)
        fetchAllData()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to submit payout request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting payout:", error)
      toast({
        title: "Error",
        description: "Failed to submit payout request",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [panFile, setPanFile] = useState<File | null>(null)

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const contentType = file.type || "application/octet-stream"
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://srv.digitalmadrasa.co.in"
      const uploadUrl = `${baseUrl}/api/v1/static/objects?path=${encodeURIComponent(path)}&contentType=${encodeURIComponent(contentType)}`

      // Use fetch for simplicity, Mentors page used XHR for progress but here we just need success
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      // Success. Public URL construction
      return `https://cdn.digitalmadrasa.co.in/${path}`
    } catch (e) {
      console.error("Upload error:", e)
      return null
    }
  }

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please login to submit KYC",
        variant: "destructive",
      })
      return
    }

    if (!aadhaarFile || !panFile) {
      toast({
        title: "Error",
        description: "Please upload both Aadhaar and PAN cards",
        variant: "destructive"
      })
      return
    }

    try {
      setKycSubmitting(true)

      // Upload Files
      // Using a timestamp to avoid collisions
      const ts = Date.now()
      const aadhaarPath = `kyc-documents/${currentUser.id}/aadhaar_${ts}_${aadhaarFile.name.replace(/\s+/g, "-")}`
      const panPath = `kyc-documents/${currentUser.id}/pan_${ts}_${panFile.name.replace(/\s+/g, "-")}`

      const aadhaarUrl = await uploadFile(aadhaarFile, aadhaarPath)
      const panUrl = await uploadFile(panFile, panPath)

      if (!aadhaarUrl || !panUrl) {
        throw new Error("File upload failed")
      }

      const response = await apiClient.post("/affiliate-kyc", {
        user_id: currentUser.id,
        full_name: kycForm.fullName,
        aadhaar_card_file_url: aadhaarUrl,
        pan_card_file_url: panUrl,
        full_address: kycForm.address,
        city: kycForm.city,
        state: kycForm.state,
        pincode: kycForm.pincode,
        kyc_status: "in_progress",
        note: `PAN Number: ${kycForm.panNumber}, Aadhaar Number: ${kycForm.aadharNumber}`
      }, getUserToken() || undefined)

      if (response.success) {
        toast({
          title: "Success",
          description: "KYC documents submitted successfully. We'll review them shortly.",
        })
        setIsKycModalOpen(false)
        setKycForm({
          fullName: "",
          panNumber: "",
          aadharNumber: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
        })
        setAadhaarFile(null)
        setPanFile(null)
        fetchAllData()
      } else {
        throw new Error(response.message || "Failed to submit")
      }

    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to submit KYC documents",
        variant: "destructive",
      })
    } finally {
      setKycSubmitting(false)
    }
  }

  // Render Form (Updated)
  // ...
  // Added File Inputs
  // ...

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please login to add bank account",
        variant: "destructive",
      })
      return
    }

    try {
      setBankSubmitting(true)

      const payload = {
        user_id: currentUser.id,
        account_holder_name: bankForm.accountHolderName,
        bank_account_number: bankForm.accountNumber,
        ifsc_code: bankForm.ifscCode,
        branch_name: bankForm.branchName,
        bank_name: bankForm.bankName,
        upi_id: bankForm.upiId
      }

      const response = await apiClient.post<any>("/affiliate-bank", payload, getUserToken() || undefined)

      if (response.success) {
        toast({
          title: "Success",
          description: "Bank account saved successfully",
        })
        setHasBankAccount(true)
        setIsBankModalOpen(false)
        fetchAllData()
      } else {
        throw new Error(response.message || "Failed to save bank details")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bank account",
        variant: "destructive",
      })
    } finally {
      setBankSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-200"
      case "approved":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle2 className="w-3 h-3" />
      case "approved":
        return <CheckCircle2 className="w-3 h-3" />
      case "pending":
        return <Clock className="w-3 h-3" />
      case "rejected":
        return <XCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getKycStatusBadge = () => {
    switch (kycStatus) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            KYC Verified
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
            <Clock className="w-3 h-3" />
            KYC In Progress
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
            <AlertCircle className="w-3 h-3" />
            KYC Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
            <XCircle className="w-3 h-3" />
            KYC Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 gap-1">
            <AlertCircle className="w-3 h-3" />
            Not Verified
          </Badge>
        )
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-2">Wallet & Payouts</h1>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Manage your earnings and withdrawal requests
              </p>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={!canGetPaid}
                  className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 shadow-lg w-full sm:w-auto"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Request Payout</DialogTitle>
                  <DialogDescription>Enter the amount you want to withdraw from your wallet</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRequestPayout} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={currentBalance}
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Available balance: ₹{currentBalance.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note (optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note for this payout request"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-[#0066ff] hover:bg-[#0052cc]">
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-white" />
                  <span className="font-semibold text-white">Account Verification</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {getKycStatusBadge()}
                  {hasBankAccount ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                      <Building2 className="w-3 h-3" />
                      Bank Account Added
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
                      <Building2 className="w-3 h-3" />
                      No Bank Account
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {(kycStatus === "not_submitted" || kycStatus === "rejected" || kycStatus === "pending") && (
                  <Dialog open={isKycModalOpen} onOpenChange={setIsKycModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white/20 border-white/40 text-white hover:bg-white/30 gap-2 w-full sm:w-auto"
                      >
                        <FileText className="w-4 h-4" />
                        {kycStatus === "rejected" ? "Resubmit KYC" : "Submit KYC"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Submit KYC Documents</DialogTitle>
                        <DialogDescription>Please provide your details for identity verification</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleKycSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              placeholder="As per official documents"
                              value={kycForm.fullName}
                              onChange={(e) => setKycForm({ ...kycForm, fullName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="panNumber">PAN Number</Label>
                            <Input
                              id="panNumber"
                              placeholder="ABCDE1234F"
                              value={kycForm.panNumber}
                              onChange={(e) => setKycForm({ ...kycForm, panNumber: e.target.value.toUpperCase() })}
                              required
                            />
                          </div>
                          <div className="space-y-4 pt-2">
                            <Label className="text-base font-semibold">Identity Proof (PAN Card)</Label>
                            <div className="relative group">
                              <Input
                                id="panFile"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                                className="hidden"
                              />
                              <Label
                                htmlFor="panFile"
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${panFile
                                  ? "border-[#0066ff] bg-blue-50/50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                              >
                                {panFile ? (
                                  <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0066ff]">
                                      <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
                                        {panFile.name}
                                      </p>
                                      <p className="text-xs text-blue-600 mt-1">Click to change</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-center text-gray-500">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                      <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-700 text-sm">Upload PAN Card</p>
                                      <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or PDF</p>
                                    </div>
                                  </div>
                                )}
                              </Label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="aadharNumber">Aadhar Number</Label>
                            <Input
                              id="aadharNumber"
                              placeholder="1234 5678 9012"
                              value={kycForm.aadharNumber}
                              onChange={(e) => setKycForm({ ...kycForm, aadharNumber: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-4 pt-2">
                            <Label className="text-base font-semibold">Address Proof (Aadhaar Card)</Label>
                            <div className="relative group">
                              <Input
                                id="aadhaarFile"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                                className="hidden"
                              />
                              <Label
                                htmlFor="aadhaarFile"
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${aadhaarFile
                                  ? "border-[#0066ff] bg-blue-50/50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                              >
                                {aadhaarFile ? (
                                  <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0066ff]">
                                      <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
                                        {aadhaarFile.name}
                                      </p>
                                      <p className="text-xs text-blue-600 mt-1">Click to change</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-center text-gray-500">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-700 text-sm">Upload Aadhaar Card</p>
                                      <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or PDF</p>
                                    </div>
                                  </div>
                                )}
                              </Label>
                            </div>
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                              id="address"
                              placeholder="Complete address"
                              value={kycForm.address}
                              onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })}
                              rows={2}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              placeholder="City name"
                              value={kycForm.city}
                              onChange={(e) => setKycForm({ ...kycForm, city: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              placeholder="State name"
                              value={kycForm.state}
                              onChange={(e) => setKycForm({ ...kycForm, state: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                              id="pincode"
                              placeholder="123456"
                              value={kycForm.pincode}
                              onChange={(e) => setKycForm({ ...kycForm, pincode: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsKycModalOpen(false)}
                            disabled={kycSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={kycSubmitting} className="bg-[#0066ff] hover:bg-[#0052cc]">
                            {kycSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit KYC"
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/20 border-white/40 text-white hover:bg-white/30 gap-2 w-full sm:w-auto"
                    >
                      <Building2 className="w-4 h-4" />
                      {hasBankAccount ? "Manage Bank Account" : "Add Bank Account"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add Bank Account</DialogTitle>
                      <DialogDescription>Add your bank account details for payout transfers</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBankSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolderName">Account Holder Name</Label>
                        <Input
                          id="accountHolderName"
                          placeholder="As per bank records"
                          value={bankForm.accountHolderName}
                          onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                          required
                          className="bg-gray-50/50"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            type="text"
                            placeholder="1234567890"
                            value={bankForm.accountNumber}
                            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                            required
                            className="bg-gray-50/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ifscCode">IFSC Code</Label>
                          <Input
                            id="ifscCode"
                            placeholder="ABCD0123456"
                            value={bankForm.ifscCode}
                            onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                            required
                            className="bg-gray-50/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            placeholder="Bank name"
                            value={bankForm.bankName}
                            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                            required
                            className="bg-gray-50/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branchName">Branch Name</Label>
                          <Input
                            id="branchName"
                            placeholder="Branch name"
                            value={bankForm.branchName}
                            onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                            required
                            className="bg-gray-50/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID (Optional)</Label>
                        <Input
                          id="upiId"
                          placeholder="username@upi"
                          value={bankForm.upiId}
                          onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                          className="bg-gray-50/50"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsBankModalOpen(false)}
                          disabled={bankSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={bankSubmitting} className="bg-[#0066ff] hover:bg-[#0052cc]">
                          {bankSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Add Account"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/80">Current Balance</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold">₹{currentBalance.toLocaleString("en-IN")}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/80">Total Paid Out</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold">₹{totalPaidOut.toLocaleString("en-IN")}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/80">Pending Requests</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold">₹{totalPending.toLocaleString("en-IN")}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/80">Min. Threshold</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold">₹{payoutThreshold.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Payout Requests</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">View and track your withdrawal requests</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPayouts}
                disabled={loading}
                className="w-full sm:w-auto bg-transparent"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#0066ff]" />
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-1">No payout requests yet</p>
                <p className="text-sm text-gray-500">Your payout requests will appear here</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                          Created At
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-mono text-gray-900">#{payout.id}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-semibold text-gray-900">
                              ₹{(payout.amount_cents / 100).toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={`${getStatusColor(payout.status)} gap-1`}>
                              {getStatusIcon(payout.status)}
                              <span className="capitalize">{payout.status}</span>
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(payout.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayout(payout)}
                              className="text-[#0066ff] hover:text-[#0052cc] hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#0066ff] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-mono text-gray-500">#{payout.id}</span>
                          <div className="text-lg font-bold text-gray-900 mt-1">
                            ₹{(payout.amount_cents / 100).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(payout.status)} gap-1`}>
                          {getStatusIcon(payout.status)}
                          <span className="capitalize">{payout.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(payout.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayout(payout)}
                          className="h-8 text-[#0066ff] hover:text-[#0052cc] hover:bg-blue-50 -mr-2"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payout Details Modal */}
      <Dialog open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600">Request ID</span>
                <span className="font-mono font-medium">#{selectedPayout.id}</span>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                <span className="text-blue-900 font-medium">Amount Requested</span>
                <span className="text-xl font-bold text-[#0066ff]">
                  ₹{(selectedPayout.amount_cents / 100).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <Badge className={`${getStatusColor(selectedPayout!.status)} gap-1`}>
                    {getStatusIcon(selectedPayout!.status)}
                    <span className="capitalize">{selectedPayout!.status}</span>
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Requested Date</span>
                  <span className="font-medium">
                    {new Date(selectedPayout!.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>

                {selectedPayout!.processed_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Processed Date</span>
                    <span className="font-medium">
                      {new Date(selectedPayout!.processed_at!).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                )}

                {selectedPayout!.payment_method_of_settlement && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="font-medium capitalize">
                      {selectedPayout!.payment_method_of_settlement!.replace(/_/g, " ")}
                    </span>
                  </div>
                )}

                {selectedPayout!.transaction_reference_no && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reference No</span>
                    <span className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {selectedPayout!.transaction_reference_no}
                    </span>
                  </div>
                )}

                {selectedPayout!.proof_of_settlement && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                    <span className="text-xs text-gray-500 block mb-2">Proof of Settlement</span>
                    <a
                      href={selectedPayout!.proof_of_settlement!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#0066ff] hover:underline flex items-center gap-1"
                    >
                      View Proof Document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {selectedPayout!.note && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                    <span className="text-xs text-gray-500 block mb-1">Admin Note / Reason</span>
                    <p className="text-sm text-gray-700">{selectedPayout!.note}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayout(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
