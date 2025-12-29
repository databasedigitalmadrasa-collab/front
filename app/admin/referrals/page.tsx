"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { getAdminToken } from "@/lib/auth"

const ITEMS_PER_PAGE = 10

interface Referral {
  id: number
  referrer_user_id: number
  referred_user_id: number
  referred_user_email: string
  referral_code: string
  referral_link: string
  plan_id: number
  referral_amount_cents: number
  earned_commission_cents: number
  click_timestamp: string
  signup_timestamp?: string
  conversion_timestamp?: string
  joining_date?: string
  ip_address: string
  user_agent: string
  status: "clicked" | "signed_up" | "converted" | "pending"
  created_at: string
  updated_at: string
}

export default function ManageReferralsPage() {
  const { toast } = useToast()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [selectedReferrals, setSelectedReferrals] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchReferrals()
  }, [])

  const fetchReferrals = async () => {
    setIsLoading(true)
    try {
      const token = getAdminToken()
      const response = await apiClient.get<{ success: boolean; items: Referral[] }>("/referrals", token)

      console.log("Referrals API response:", response)

      if (response.success && response.data) {
        setReferrals(response.data.items || [])
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch referrals",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching referrals:", error)
      toast({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter referrals
  const filteredReferrals = referrals.filter((ref) => {
    const matchesSearch =
      ref.referred_user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referral_link.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ref.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredReferrals.length / ITEMS_PER_PAGE)
  const paginatedReferrals = filteredReferrals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Format currency
  const formatCurrency = (amount: number) => {
    return "₹" + (amount / 100).toFixed(2)
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-IN")
    } catch (error) {
      console.error("Error formatting date:", dateString, error)
      return "Invalid Date"
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      clicked: "bg-blue-100 text-blue-700",
      signed_up: "bg-purple-100 text-purple-700",
      converted: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
    }
    // Ensure status is one of the expected values before accessing badges
    const normalizedStatus = status as keyof typeof badges
    return (
      <Badge className={badges[normalizedStatus] || "bg-gray-100 text-gray-700"}>
        {status === "signed_up" ? "Signed Up" : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Calculate statistics
  const clicksToday = referrals.filter((r) => {
    const today = new Date()
    const clickDate = new Date(r.click_timestamp)
    return clickDate.toDateString() === today.toDateString()
  }).length

  const signupsThisWeek = referrals.filter((r) => {
    if (!r.signup_timestamp) return false
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return new Date(r.signup_timestamp) >= weekAgo
  }).length

  const convertedLast30 = referrals.filter(
    (r) =>
      r.status === "converted" &&
      new Date(r.conversion_timestamp || "") >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  ).length

  const totalCommissions = referrals
    .filter((r) => r.status === "converted")
    .reduce((sum, r) => sum + r.earned_commission_cents, 0)

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReferrals(paginatedReferrals.map((r) => r.id))
    } else {
      setSelectedReferrals([])
    }
  }

  // Handle select referral
  const handleSelectReferral = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedReferrals([...selectedReferrals, id])
    } else {
      setSelectedReferrals(selectedReferrals.filter((s) => s !== id))
    }
  }

  // Handle export CSV
  const handleExportCSV = () => {
    const headers = [
      "Referral ID",
      "Referral Code",
      "Referred Email",
      "Plan ID",
      "Amount (₹)",
      "Commission (₹)",
      "Status",
      "Clicked At",
      "Signed Up At",
      "Converted At",
      "IP Address",
    ]
    const rows = filteredReferrals.map((ref) => [
      ref.id,
      ref.referral_code,
      ref.referred_user_email,
      ref.plan_id,
      (ref.referral_amount_cents / 100).toFixed(2),
      (ref.earned_commission_cents / 100).toFixed(2),
      ref.status,
      formatDate(ref.click_timestamp),
      ref.signup_timestamp ? formatDate(ref.signup_timestamp) : "N/A",
      ref.conversion_timestamp ? formatDate(ref.conversion_timestamp) : "N/A",
      ref.ip_address,
    ])

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "referrals.csv"
    a.click()
    window.URL.revokeObjectURL(url)
    toast({ title: "Exported", description: "Referrals exported as CSV" })
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
            <p className="text-gray-500">Loading referrals...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-full mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 mb-6 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-heading">Referrals</h1>
              <p className="text-white/80 text-sm mt-1">Track and manage referral program activity</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="gap-2 bg-white text-[#0066ff] hover:bg-white/90"
                onClick={fetchReferrals}
              >
                <TrendingUp className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="secondary"
                className="gap-2 bg-white text-[#0066ff] hover:bg-white/90"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-6 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold">{referrals.length}</div>
              <div className="text-sm text-white/80">Total Referrals</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{clicksToday}</div>
              <div className="text-sm text-white/80">Clicks Today</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{signupsThisWeek}</div>
              <div className="text-sm text-white/80">Signups (7d)</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{convertedLast30}</div>
              <div className="text-sm text-white/80">Converted (30d)</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{formatCurrency(totalCommissions)}</div>
              <div className="text-sm text-white/80">Total Commission</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by email, referral code, or link..."
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="signed_up">Signed Up</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedReferrals.length === paginatedReferrals.length && paginatedReferrals.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Referral Code</TableHead>
                  <TableHead className="font-semibold">Referred Email</TableHead>
                  <TableHead className="font-semibold">Plan ID</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Commission</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Clicked</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No referrals found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReferrals.map((ref) => (
                    <TableRow key={ref.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedReferrals.includes(ref.id)}
                          onCheckedChange={(checked) => handleSelectReferral(ref.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{ref.id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{ref.referral_code}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{ref.referred_user_email}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{ref.plan_id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">{formatCurrency(ref.referral_amount_cents)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(ref.earned_commission_cents)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(ref.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(ref.click_timestamp)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReferral(ref)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {/* Removed Mark Converted/Invalid actions as they are no longer applicable */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredReferrals.length)} of {filteredReferrals.length}{" "}
                referrals
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Referral Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-sm">Referral ID</Label>
                  <div className="font-medium mt-1">{selectedReferral.id}</div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Referral Code</Label>
                  <div className="font-medium mt-1">{selectedReferral.referral_code}</div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Referred Email</Label>
                  <div className="font-medium mt-1">{selectedReferral.referred_user_email}</div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReferral.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Referral Amount</Label>
                  <div className="font-semibold text-gray-900 mt-1">
                    {formatCurrency(selectedReferral.referral_amount_cents)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Commission Earned</Label>
                  <div className="font-semibold text-green-600 mt-1">
                    {formatCurrency(selectedReferral.earned_commission_cents)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Click Timestamp</Label>
                  <div className="font-medium mt-1">{formatDate(selectedReferral.click_timestamp)}</div>
                </div>
                {selectedReferral.signup_timestamp && (
                  <div>
                    <Label className="text-gray-500 text-sm">Signup Timestamp</Label>
                    <div className="font-medium mt-1">{formatDate(selectedReferral.signup_timestamp)}</div>
                  </div>
                )}
                {selectedReferral.conversion_timestamp && (
                  <div>
                    <Label className="text-gray-500 text-sm">Conversion Timestamp</Label>
                    <div className="font-medium mt-1">{formatDate(selectedReferral.conversion_timestamp)}</div>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500 text-sm">IP Address</Label>
                  <div className="font-medium mt-1">{selectedReferral.ip_address}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500 text-sm">Referral Link</Label>
                  <div className="font-medium mt-1 text-blue-600 break-all">{selectedReferral.referral_link}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500 text-sm">User Agent</Label>
                  <div className="font-medium mt-1 text-sm break-all">{selectedReferral.user_agent}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
