"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Download,
  Settings,
  Eye,
  Check,
  X,
  Clock,
  FileText,
  User,
  Wallet,
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayoutRequest {
  id: number
  user_id: number
  wallet_id: number
  amount_cents: number
  status: "pending" | "approved" | "rejected" | "paid"
  transaction_reference_no: string | null
  payment_method_of_settlement: string | null
  proof_of_settlement: string | null
  note: string | null
  requested_at: string
  processed_at: string | null
  created_at: string
  updated_at: string
  user_full_name?: string
  user_email?: string
  user_phone_number?: string
}

const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

export default function PayoutRequestsPage() {
  const { toast } = useToast()
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [dateRange, setDateRange] = useState("all") // This filter is no longer used in the updates

  // Drawer & Dialogs
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null)

  // Form states
  const [adminNote, setAdminNote] = useState("")
  const [transactionRefNo, setTransactionRefNo] = useState("")
  const [settlementMethod, setSettlementMethod] = useState("")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [userBankDetails, setUserBankDetails] = useState<any>(null)

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (isMarkPaidDialogOpen && selectedPayout?.user_id) {
        try {
          const res = await fetch(`${API_BASE_URL}/affiliate-bank/user/${selectedPayout.user_id}`);
          const data = await res.json();
          if (data.success && data.data) {
            setUserBankDetails(data.data.data || data.data); // Handle potential wrapping which sometimes happens
          } else {
            setUserBankDetails(null);
          }
        } catch (e) {
          console.error("Error fetching bank details", e);
          setUserBankDetails(null);
        }
      }
    }
    fetchBankDetails();
  }, [isMarkPaidDialogOpen, selectedPayout]);

  const fetchPayouts = async () => {
    setIsLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      params.append("limit", "100")
      params.append("offset", "0")

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (paymentMethodFilter !== "all") {
        params.append("payment_method_of_settlement", paymentMethodFilter)
      }

      const response = await fetch(`${API_BASE_URL}/payout-requests?${params.toString()}`)
      const data = await response.json()

      console.log("Payout requests fetched:", data)

      if (data.success && data.items) {
        setPayouts(data.items)
      } else {
        throw new Error(data.error || "Failed to fetch payout requests")
      }
    } catch (error) {
      console.error("Error fetching payouts:", error)
      toast({
        title: "Error",
        description: "Failed to load payout requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter, paymentMethodFilter]) // Removed dateRange from dependencies as it's not used

  // Filter payouts
  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      payout.user_id.toString().includes(searchQuery) ||
      payout.id.toString().includes(searchQuery) ||
      payout.transaction_reference_no?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesMinAmount = !minAmount || payout.amount_cents >= Number.parseFloat(minAmount) * 100
    const matchesMaxAmount = !maxAmount || payout.amount_cents <= Number.parseFloat(maxAmount) * 100

    // Filter by status and payment method are handled by fetchPayouts now via API calls
    // The filter logic below only applies local filtering for search and amount
    return matchesSearch && matchesMinAmount && matchesMaxAmount
  })

  // Actions
  const handleViewDetails = (payout: PayoutRequest) => {
    setSelectedPayout(payout)
    setIsDetailModalOpen(true)
  }

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const contentType = file.type || "application/octet-stream"
      const baseUrl = API_BASE_URL.replace("/api/v1", "") // API_BASE_URL includes /api/v1, but upload endpoint is ...wait. 
      // API_BASE_URL is "https://srv.digitalmadrasa.co.in/api/v1"
      // Endpoint is "/api/v1/static/objects"
      // So `${API_BASE_URL}/static/objects` works.

      const uploadUrl = `${API_BASE_URL}/static/objects?path=${encodeURIComponent(path)}&contentType=${encodeURIComponent(contentType)}`

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          // If auth is required for static upload, add headers?
          // Usually static upload endpoint in dm-backend seems open or token based?
          // Wallet page didn't add headers in fetch call above (viewed file).
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      return `https://cdn.digitalmadrasa.co.in/${path}`
    } catch (e) {
      console.error("Upload error:", e)
      return null
    }
  }

  const handleApprove = async (payout: PayoutRequest) => {
    try {
      // Handle file upload if proof file exists
      let proofUrl = null
      if (proofFile) {
        setIsUploading(true)
        const timestamp = Date.now()
        const filename = proofFile.name.replace(/[^a-zA-Z0-9.]/g, "_")
        const path = `settlement-proofs/${payout.id}_${timestamp}_${filename}`

        proofUrl = await uploadFile(proofFile, path)
        setIsUploading(false)

        if (!proofUrl) {
          toast({
            title: "Error",
            description: "Failed to upload proof of settlement.",
            variant: "destructive",
          })
          return
        }
      }

      const response = await fetch(`${API_BASE_URL}/payout-requests/${payout.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "approved",
          processed_at: new Date().toISOString(),
          note: adminNote || "Approved for payment",
          transaction_reference_no: transactionRefNo || null,
          payment_method_of_settlement: settlementMethod || null,
          proof_of_settlement: proofUrl || null,
        }),
      })

      const data = await response.json()
      console.log("Approve response:", data)

      if (data.success) {
        await fetchPayouts() // Refresh list
        setIsApproveDialogOpen(false)
        setAdminNote("")
        setTransactionRefNo("")
        setSettlementMethod("")
        setProofFile(null)
        toast({
          title: "Payout Approved",
          description: `Request #${payout.id} has been approved and is ready for payment.`,
        })
      } else {
        throw new Error(data.error || "Failed to approve payout")
      }
    } catch (error) {
      console.error("Error approving payout:", error)
      toast({
        title: "Error",
        description: "Failed to approve payout. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (payout: PayoutRequest) => {
    if (!adminNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payout-requests/${payout.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
          processed_at: new Date().toISOString(),
          note: adminNote,
        }),
      })

      const data = await response.json()
      console.log("Reject response:", data)

      if (data.success) {
        await fetchPayouts() // Refresh list
        setIsRejectDialogOpen(false)
        setAdminNote("")
        toast({
          title: "Payout Rejected",
          description: `Request #${payout.id} has been rejected.`,
          variant: "destructive",
        })
      } else {
        throw new Error(data.error || "Failed to reject payout")
      }
    } catch (error) {
      console.error("Error rejecting payout:", error)
      toast({
        title: "Error",
        description: "Failed to reject payout. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkPaid = async (payout: PayoutRequest) => {
    if (!transactionRefNo.trim() || !settlementMethod) {
      toast({
        title: "Error",
        description: "Please provide transaction reference and payment method.",
        variant: "destructive",
      })
      return
    }

    try {
      // Handle file upload if proof file exists
      let proofUrl = null
      if (proofFile) {
        setIsUploading(true)
        const timestamp = Date.now()
        const filename = proofFile.name.replace(/[^a-zA-Z0-9.]/g, "_")
        const path = `settlement-proofs/${payout.id}_${timestamp}_${filename}`

        proofUrl = await uploadFile(proofFile, path)
        setIsUploading(false)

        if (!proofUrl) {
          toast({
            title: "Error",
            description: "Failed to upload proof of settlement.",
            variant: "destructive",
          })
          return
        }
      }

      const response = await fetch(`${API_BASE_URL}/payout-requests/${payout.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "paid",
          processed_at: new Date().toISOString(),
          transaction_reference_no: transactionRefNo,
          payment_method_of_settlement: settlementMethod,
          proof_of_settlement: proofUrl || null,
          note: adminNote || "Payment processed",
        }),
      })

      const data = await response.json()
      console.log("Mark paid response:", data)

      if (data.success) {
        await fetchPayouts() // Refresh list
        setIsMarkPaidDialogOpen(false)
        setTransactionRefNo("")
        setSettlementMethod("")
        setProofFile(null)
        setAdminNote("")
        toast({
          title: "Payment Settled",
          description: `Payout #${payout.id} has been marked as paid.`,
        })
      } else {
        throw new Error(data.error || "Failed to mark payout as paid")
      }
    } catch (error) {
      console.error("Error marking payout as paid:", error)
      toast({
        title: "Error",
        description: "Failed to mark payout as paid. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A" // Handle cases where dateString might be null/undefined
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending", icon: Clock },
      approved: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Approved", icon: CheckCircle },
      paid: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Paid", icon: Check },
      rejected: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Rejected", icon: XCircle },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 font-medium px-2.5 py-0.5`} variant="outline">
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </Badge>
    )
  }

  // Statistics
  const totalRequests = payouts.length
  const pendingRequests = payouts.filter((p) => p.status === "pending").length
  const approvedRequests = payouts.filter((p) => p.status === "approved").length
  const totalPaidAmount = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount_cents, 0)
  const minThreshold = 20000 // ₹200

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payout requests...</p>
        </div>
      </div>
    )
  }

  const handleExportCSV = () => {
    if (filteredPayouts.length === 0) {
      toast({
        title: "No Data",
        description: "There are no payout requests to export.",
        variant: "default",
      })
      return
    }

    const headers = ["ID,User ID,Amount (INR),Status,Created At,Processed At,Transaction Ref,Payment Method"]
    const rows = filteredPayouts.map(p => {
      const amount = (p.amount_cents / 100).toFixed(2);
      const createdAt = p.created_at ? new Date(p.created_at).toLocaleString().replace(/,/g, ' ') : "";
      const processedAt = p.processed_at ? new Date(p.processed_at).toLocaleString().replace(/,/g, ' ') : "N/A";
      const ref = p.transaction_reference_no || "N/A";
      const method = p.payment_method_of_settlement || "N/A";

      return `${p.id},${p.user_id},${amount},${p.status},${createdAt},${processedAt},${ref},${method}`;
    });

    const csvContent = headers.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payouts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-none sm:rounded-2xl sm:m-4 sm:mb-6 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading">Payout Requests</h1>
            <p className="text-white/90 text-sm mt-1">Manage affiliate payout requests and process settlements</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              className="gap-2 bg-white text-[#0066ff] hover:bg-white/90 text-sm sm:text-base"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{pendingRequests}</div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">Pending Requests</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{approvedRequests}</div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">Approved</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              {payouts.filter((p) => p.status === "paid").length}
            </div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">Completed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold mb-1">{formatCurrency(totalPaidAmount)}</div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">Total Paid</div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Filters & Search</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, user ID, txn ref..."
                className="pl-10 h-11 border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="h-11 border-gray-300">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="razorpayx">RazorpayX</SelectItem>
                <SelectItem value="manual">Manual Cash</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min Amount (₹)"
              className="h-11 border-gray-300"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />

            <Input
              type="number"
              placeholder="Max Amount (₹)"
              className="h-11 border-gray-300"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Mobile: Card view */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No payout requests found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filteredPayouts.map((payout) => (
                <div key={payout.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-mono text-sm font-semibold text-gray-900 block">#{payout.id}</span>
                        <span className="text-xs text-gray-500">User #{payout.user_id}</span>
                      </div>
                    </div>
                    {getStatusBadge(payout.status)}
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(payout.amount_cents)}</span>
                    </div>
                    {payout.transaction_reference_no && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Txn Ref:</span>
                        <span className="font-mono text-xs text-gray-700">{payout.transaction_reference_no}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(payout)}
                      className="gap-1.5 text-gray-600 flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    {payout.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayout(payout)
                            setIsApproveDialogOpen(true)
                          }}
                          className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayout(payout)
                            setIsRejectDialogOpen(true)
                          }}
                          className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    {payout.status === "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPayout(payout)
                          setIsMarkPaidDialogOpen(true)
                        }}
                        className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
                      >
                        <CreditCard className="w-4 h-4" />
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium">No payout requests found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-mono text-sm font-medium text-gray-900">#{payout.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 text-sm">
                              {payout.user_full_name || `User #${payout.user_id}`}
                            </span>
                          </div>
                          {payout.user_email && (
                            <p className="text-xs text-gray-500 mt-0.5">{payout.user_email}</p>
                          )}
                          {!payout.user_email && (
                            <p className="text-xs text-gray-500 mt-0.5">Wallet #{payout.wallet_id}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{formatCurrency(payout.amount_cents)}</div>
                      </td>
                      <td className="p-4">{getStatusBadge(payout.status)}</td>
                      <td className="p-4">
                        {payout.payment_method_of_settlement ? (
                          <Badge variant="outline" className="capitalize border-gray-300">
                            {payout.payment_method_of_settlement.replace("_", " ")}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(payout)}
                            className="gap-1.5 text-gray-600 hover:text-gray-900"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          {payout.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayout(payout)
                                  setIsApproveDialogOpen(true)
                                }}
                                className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayout(payout)
                                  setIsRejectDialogOpen(true)
                                }}
                                className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {payout.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayout(payout)
                                setIsMarkPaidDialogOpen(true)
                              }}
                              className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <CreditCard className="w-4 h-4" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Payout Request Details</DialogTitle>
            <DialogDescription>Complete information about this payout request</DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="mt-4 space-y-4">
              {/* User Info Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  User Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-medium text-gray-900">#{selectedPayout.user_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wallet ID:</span>
                    <span className="font-medium text-gray-900">#{selectedPayout.wallet_id}</span>
                  </div>
                </div>
              </div>

              {/* Payout Info Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Payout Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Request ID:</span>
                    <span className="font-mono font-medium text-gray-900">#{selectedPayout.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    {getStatusBadge(selectedPayout.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-emerald-600 text-lg">
                      {formatCurrency(selectedPayout.amount_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requested At:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedPayout.requested_at)}</span>
                  </div>
                  {selectedPayout.processed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processed At:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedPayout.processed_at)}</span>
                    </div>
                  )}
                  {selectedPayout.note && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 block mb-1">Note:</span>
                      <p className="text-gray-900">{selectedPayout.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Info (if paid) */}
              {selectedPayout.status === "paid" && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <h4 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Settlement Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedPayout.transaction_reference_no && (
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Transaction Ref:</span>
                        <span className="font-mono font-medium text-emerald-900">
                          {selectedPayout.transaction_reference_no}
                        </span>
                      </div>
                    )}
                    {selectedPayout.payment_method_of_settlement && (
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Payment Method:</span>
                        <Badge variant="outline" className="capitalize border-emerald-300 text-emerald-800">
                          {selectedPayout.payment_method_of_settlement.replace("_", " ")}
                        </Badge>
                      </div>
                    )}
                    {selectedPayout.proof_of_settlement && (
                      <div>
                        <span className="text-emerald-700 block mb-2">Proof of Settlement:</span>
                        <a
                          href={selectedPayout.proof_of_settlement}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View/Download Proof
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settlement Info (if approved but not paid) */}
              {selectedPayout.status === "approved" && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Awaiting Payment Settlement</p>
                    <p className="text-xs text-amber-700 mt-1">
                      This payout is approved but payment has not been settled yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Approve Payout Request
            </DialogTitle>
            <DialogDescription>
              Confirm approval of this payout request. It will be moved to the payment queue.
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Affiliate:</span>
                  <span className="font-medium text-emerald-900">User #{selectedPayout.user_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Net Amount:</span>
                  <span className="font-bold text-emerald-900 text-lg">
                    {formatCurrency(selectedPayout.amount_cents)}
                  </span>
                </div>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false)
                setAdminNote("")
                setTransactionRefNo("")
                setSettlementMethod("")
                setProofFile(null)
              }}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedPayout && handleApprove(selectedPayout)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject Payout Request
            </DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this payout. The affiliate will be notified.
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="bg-rose-50 rounded-lg p-4 border border-rose-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-rose-700">Affiliate:</span>
                  <span className="font-medium text-rose-900">User #{selectedPayout.user_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-rose-700">Amount:</span>
                  <span className="font-semibold text-rose-900">{formatCurrency(selectedPayout.amount_cents)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reject-note" className="text-sm font-medium">
                  Rejection Reason *
                </Label>
                <Textarea
                  id="reject-note"
                  placeholder="Please provide a detailed reason for rejection..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={4}
                  className="border-rose-300 focus:border-rose-400"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false)
                setAdminNote("")
              }}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedPayout && handleReject(selectedPayout)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={isMarkPaidDialogOpen} onOpenChange={setIsMarkPaidDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Settle Payout Request
            </DialogTitle>
            <DialogDescription>Enter payment settlement details to complete this payout.</DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Affiliate:</span>
                  <span className="font-medium text-indigo-900">User #{selectedPayout.user_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Net Amount:</span>
                  <span className="font-bold text-indigo-900 text-lg">
                    {formatCurrency(selectedPayout.amount_cents)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Payout Method:</span>
                  <span className="font-medium text-indigo-900">
                    {selectedPayout.payment_method_of_settlement?.replace("_", " ") || "N/A"}
                  </span>
                </div>
                {userBankDetails && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-800 uppercase mb-2">Bank Details</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-indigo-600 block text-xs">Bank Name</span>
                        <span className="font-medium text-indigo-900">{userBankDetails.bank_name || "-"}</span>
                      </div>
                      <div>
                        <span className="text-indigo-600 block text-xs">Account No</span>
                        <span className="font-medium text-indigo-900">{userBankDetails.bank_account_number || "-"}</span>
                      </div>
                      <div>
                        <span className="text-indigo-600 block text-xs">IFSC</span>
                        <span className="font-medium text-indigo-900">{userBankDetails.ifsc_code || "-"}</span>
                      </div>
                      <div>
                        <span className="text-indigo-600 block text-xs">Holder Name</span>
                        <span className="font-medium text-indigo-900">{userBankDetails.account_holder_name || "-"}</span>
                      </div>
                      {userBankDetails.upi_id && (
                        <div className="col-span-2">
                          <span className="text-indigo-600 block text-xs">UPI ID</span>
                          <span className="font-medium text-indigo-900">{userBankDetails.upi_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Payout details are not directly available in the updated interface, so removed */}
              </div>

              <div className="space-y-2">
                <Label htmlFor="settlement-method" className="text-sm font-medium">
                  Payment Method *
                </Label>
                <Select value={settlementMethod} onValueChange={setSettlementMethod}>
                  <SelectTrigger id="settlement-method" className="border-slate-300">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="razorpayx">RazorpayX</SelectItem>
                    <SelectItem value="manual">Manual Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tx-ref" className="text-sm font-medium">
                  Transaction Reference No *
                </Label>
                <Input
                  id="tx-ref"
                  placeholder="Enter transaction/reference ID"
                  value={transactionRefNo}
                  onChange={(e) => setTransactionRefNo(e.target.value)}
                  className="border-slate-300 font-mono"
                />
                <p className="text-xs text-slate-500">Transaction ID from your payment provider or bank</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof-upload" className="text-sm font-medium">
                  Proof of Settlement (Optional)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="proof-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="border-slate-300"
                  />
                  {proofFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProofFile(null)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500">Upload payment receipt, screenshot, or PDF proof</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paid-note" className="text-sm font-medium">
                  Admin Note (Optional)
                </Label>
                <Textarea
                  id="paid-note"
                  placeholder="Add any notes about this settlement..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="border-slate-300"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMarkPaidDialogOpen(false)
                setTransactionRefNo("")
                setSettlementMethod("")
                setProofFile(null)
                setAdminNote("")
              }}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedPayout && handleMarkPaid(selectedPayout)}
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
