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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  RotateCw,
  Plus,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"

const ITEMS_PER_PAGE = 10

interface User {
  id: number
  full_name: string
  email: string
  contact: string
  country: string
  state: string
  profile_pic_url: string | null
}

interface Plan {
  id: number
  title: string
  description: string
  monthly_amount: number
  yearly_amount: number
  discounted_amount: number
  currency: string
  subscription_type: string
  gst_tax: number
  whats_included: string
}

interface Subscription {
  id: number
  user_id: number
  plan_id: number
  start_date: string
  renewal_date: string | null
  subscription_type: string
  subscription_amount_paid: number
  subscription_status: string
  order_id: string
  merchant_id: string
  transaction_status: string
  transaction_timestamp: string
  created_at: string
  updated_at: string
  user: User
  plan: Plan
}

interface UserOption {
  id: number
  name: string
  email: string
}

interface PlanOption {
  id: number
  title: string
  monthly_amount: number
  yearly_amount: number
}

export default function ManageSubscriptionsPage() {
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [txStatusFilter, setTxStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [editForm, setEditForm] = useState<Partial<Subscription>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
    fetchUsers()
    fetchPlans()
  }, [])

  const fetchSubscriptions = async () => {
    setLoading(true)
    const token = getAuthToken()
    const response = await apiClient.get<{ items: Subscription[] }>("/subscriptions", token)

    console.log("Subscriptions API response:", response)

    if (response.success && response.data?.items) {
      setSubscriptions(response.data.items)
      console.log("Subscriptions loaded:", response.data.items.length)
    } else {
      console.log("Failed to load subscriptions:", response)
      toast({
        title: "Error",
        description: response.message || "Failed to fetch subscriptions",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    const token = getAuthToken()
    const response = await apiClient.get<{ items: UserOption[] }>("/users", token)

    if (response.success && response.data) {
      setUsers(response.data.items || [])
    }
  }

  const fetchPlans = async () => {
    const token = getAuthToken()
    const response = await apiClient.get<{ items: PlanOption[] }>("/subscription-plans", token)

    if (response.success && response.data) {
      setPlans(response.data.items || [])
    }
  }

  const handleCreateSubscription = async () => {
    if (!editForm.user_id || !editForm.plan_id) {
      toast({
        title: "Validation Error",
        description: "Please select user and plan",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const token = getAuthToken()

    const requestBody = {
      user_id: editForm.user_id,
      plan_id: editForm.plan_id,
      start_date: editForm.start_date || null,
      renewal_date: editForm.renewal_date || null,
      subscription_type: editForm.subscription_type || null,
      subscription_amount_paid:
        typeof editForm.subscription_amount_paid !== "undefined" ? Number(editForm.subscription_amount_paid) : null,
      subscription_status: editForm.subscription_status || "active",
      order_id: editForm.order_id || null,
      merchant_id: editForm.merchant_id || null,
      transaction_status: editForm.transaction_status || null,
      transaction_timestamp: editForm.transaction_timestamp || null,
    }

    const response = await apiClient.post("/subscriptions", requestBody, token)

    if (response.success) {
      toast({
        title: "Success",
        description: "Subscription created successfully",
      })
      setIsCreateDialogOpen(false)
      setEditForm({})
      fetchSubscriptions()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to create subscription",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const handleUpdateSubscription = async () => {
    if (!selectedSubscription) return

    setIsSubmitting(true)
    const token = getAuthToken()

    const requestBody = {
      user_id: editForm.user_id,
      plan_id: editForm.plan_id,
      start_date: editForm.start_date || null,
      renewal_date: editForm.renewal_date || null,
      subscription_type: editForm.subscription_type || null,
      subscription_amount_paid:
        typeof editForm.subscription_amount_paid !== "undefined" ? Number(editForm.subscription_amount_paid) : null,
      subscription_status: editForm.subscription_status || "active",
      order_id: editForm.order_id || null,
      merchant_id: editForm.merchant_id || null,
      transaction_status: editForm.transaction_status || null,
      transaction_timestamp: editForm.transaction_timestamp || null,
    }

    const response = await apiClient.put(`/subscriptions/${selectedSubscription.id}`, requestBody, token)

    if (response.success) {
      toast({
        title: "Success",
        description: "Subscription updated successfully",
      })
      setIsEditDialogOpen(false)
      setEditForm({})
      setSelectedSubscription(null)
      fetchSubscriptions()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to update subscription",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteSubscription = async () => {
    if (!selectedSubscription) return

    setIsSubmitting(true)
    const token = getAuthToken()
    const response = await apiClient.delete(`/subscriptions/${selectedSubscription.id}`, token)

    if (response.success) {
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedSubscription(null)
      fetchSubscriptions()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to delete subscription",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.order_id?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || sub.subscription_status === statusFilter
    const matchesType = typeFilter === "all" || sub.subscription_type === typeFilter
    const matchesTxStatus = txStatusFilter === "all" || sub.transaction_status === txStatusFilter

    let matchesDateRange = true
    if (startDate && endDate) {
      const subDate = new Date(sub.start_date)
      matchesDateRange = subDate >= new Date(startDate) && subDate <= new Date(endDate)
    }

    return matchesSearch && matchesStatus && matchesType && matchesTxStatus && matchesDateRange
  })

  // Pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / ITEMS_PER_PAGE)
  const paginatedSubs = filteredSubscriptions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Format currency
  const formatCurrency = (amount: number) => {
    return "₹" + (amount / 100).toFixed(2)
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN")
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      past_due: "bg-orange-100 text-orange-700",
      cancelled: "bg-red-100 text-red-700",
    }
    return (
      <Badge className={badges[status] || "bg-gray-100 text-gray-700"}>
        {status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Get transaction status badge
  const getTxStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      success: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
    }
    return (
      <Badge className={badges[status] || "bg-gray-100 text-gray-700"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(paginatedSubs.map((s) => s.id))
    } else {
      setSelectedSubscriptions([])
    }
  }

  // Handle select subscription
  const handleSelectSubscription = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions([...selectedSubscriptions, id])
    } else {
      setSelectedSubscriptions(selectedSubscriptions.filter((s) => s !== id))
    }
  }

  // Handle export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "User Name",
      "Email",
      "Plan",
      "Type",
      "Status",
      "Start Date",
      "Renewal Date",
      "Amount (₹)",
      "Order ID",
      "Txn Status",
    ]
    const rows = filteredSubscriptions.map((sub) => [
      sub.id,
      sub.user?.full_name || "",
      sub.user?.email || "",
      sub.plan?.title || "",
      sub.subscription_type,
      sub.subscription_status,
      formatDate(sub.start_date),
      formatDate(sub.renewal_date),
      (sub.subscription_amount_paid / 100).toFixed(2),
      sub.order_id,
      sub.transaction_status,
    ])

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "subscriptions.csv"
    a.click()
    window.URL.revokeObjectURL(url)
    toast({ title: "Exported", description: "Subscriptions exported as CSV" })
  }

  // Calculate statistics
  const activeCount = subscriptions.filter((s) => s.subscription_status === "active").length
  const totalRevenue = subscriptions
    .filter((s) => s.transaction_status === "success")
    .reduce((sum, s) => sum + s.subscription_amount_paid, 0)
  const pastDueCount = subscriptions.filter((s) => s.subscription_status === "past_due").length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0066ff] mb-4" />
          <p className="text-gray-600">Loading subscriptions...</p>
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
              <h1 className="text-2xl lg:text-3xl font-bold font-heading">Subscriptions</h1>
              <p className="text-white/80 text-sm mt-1">Manage user subscriptions and recurring payments</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="gap-2 bg-white text-[#0066ff] hover:bg-white/90"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                variant="secondary"
                className="gap-2 bg-white text-[#0066ff] hover:bg-white/90"
                onClick={() => {
                  setEditForm({
                    subscription_status: "active",
                    transaction_status: "success",
                  })
                  setIsCreateDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4" />
                Create Subscription
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold">{subscriptions.length}</div>
              <div className="text-sm text-white/80">Total Subscriptions</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{activeCount}</div>
              <div className="text-sm text-white/80">Active</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{pastDueCount}</div>
              <div className="text-sm text-white/80">Past Due</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="text-sm text-white/80">Total Revenue</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, order ID..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={txStatusFilter} onValueChange={setTxStatusFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Txn status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Txn Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              placeholder="Start date"
              className="h-11"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="End date"
              className="h-11"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSubscriptions.length === paginatedSubs.length && paginatedSubs.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Start Date</TableHead>
                  <TableHead className="font-semibold">Renewal Date</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Txn Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                      No subscriptions found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubs.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedSubscriptions.includes(sub.id)}
                          onCheckedChange={(checked) => handleSelectSubscription(sub.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">#{sub.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{sub.user?.full_name || "N/A"}</span>
                          <span className="text-xs text-gray-500">{sub.user?.email || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{sub.plan?.title || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700">{sub.subscription_type || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.subscription_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(sub.start_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <RotateCw className="w-4 h-4 text-gray-400" />
                          {formatDate(sub.renewal_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(sub.subscription_amount_paid)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{sub.order_id}</code>
                      </TableCell>
                      <TableCell>{getTxStatusBadge(sub.transaction_status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubscription(sub)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubscription(sub)
                                setEditForm(sub)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubscription(sub)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredSubscriptions.length)} of {filteredSubscriptions.length}{" "}
                results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "bg-[#0066ff]" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Subscription</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user">User *</Label>
                <Select
                  value={editForm.user_id?.toString()}
                  onValueChange={(value) => setEditForm({ ...editForm, user_id: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan">Plan *</Label>
                <Select
                  value={editForm.plan_id?.toString()}
                  onValueChange={(value) => setEditForm({ ...editForm, plan_id: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={editForm.start_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="renewal_date">Renewal Date</Label>
                  <Input
                    id="renewal_date"
                    type="date"
                    value={editForm.renewal_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, renewal_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subscription_type">Subscription Type</Label>
                  <Select
                    value={editForm.subscription_type}
                    onValueChange={(value) => setEditForm({ ...editForm, subscription_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount Paid (in paise)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="49900"
                    value={editForm.subscription_amount_paid || ""}
                    onChange={(e) => setEditForm({ ...editForm, subscription_amount_paid: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Subscription Status</Label>
                  <Select
                    value={editForm.subscription_status}
                    onValueChange={(value) => setEditForm({ ...editForm, subscription_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tx_status">Transaction Status</Label>
                  <Select
                    value={editForm.transaction_status}
                    onValueChange={(value) => setEditForm({ ...editForm, transaction_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order_id">Order ID</Label>
                <Input
                  id="order_id"
                  placeholder="ORD-001"
                  value={editForm.order_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, order_id: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="merchant_id">Merchant ID</Label>
                <Input
                  id="merchant_id"
                  placeholder="MID-001"
                  value={editForm.merchant_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, merchant_id: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tx_timestamp">Transaction Timestamp</Label>
                <Input
                  id="tx_timestamp"
                  type="datetime-local"
                  value={editForm.transaction_timestamp || ""}
                  onChange={(e) => setEditForm({ ...editForm, transaction_timestamp: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubscription}
                disabled={isSubmitting}
                className="bg-[#0066ff] hover:bg-[#0052cc]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Subscription"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_user">User *</Label>
                <Select
                  value={editForm.user_id?.toString()}
                  onValueChange={(value) => setEditForm({ ...editForm, user_id: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_plan">Plan *</Label>
                <Select
                  value={editForm.plan_id?.toString()}
                  onValueChange={(value) => setEditForm({ ...editForm, plan_id: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_start_date">Start Date</Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={editForm.start_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_renewal_date">Renewal Date</Label>
                  <Input
                    id="edit_renewal_date"
                    type="date"
                    value={editForm.renewal_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, renewal_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_subscription_type">Subscription Type</Label>
                  <Select
                    value={editForm.subscription_type}
                    onValueChange={(value) => setEditForm({ ...editForm, subscription_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_amount">Amount Paid (in paise)</Label>
                  <Input
                    id="edit_amount"
                    type="number"
                    placeholder="49900"
                    value={editForm.subscription_amount_paid || ""}
                    onChange={(e) => setEditForm({ ...editForm, subscription_amount_paid: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_status">Subscription Status</Label>
                  <Select
                    value={editForm.subscription_status}
                    onValueChange={(value) => setEditForm({ ...editForm, subscription_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_tx_status">Transaction Status</Label>
                  <Select
                    value={editForm.transaction_status}
                    onValueChange={(value) => setEditForm({ ...editForm, transaction_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_order_id">Order ID</Label>
                <Input
                  id="edit_order_id"
                  placeholder="ORD-001"
                  value={editForm.order_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, order_id: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_merchant_id">Merchant ID</Label>
                <Input
                  id="edit_merchant_id"
                  placeholder="MID-001"
                  value={editForm.merchant_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, merchant_id: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_tx_timestamp">Transaction Timestamp</Label>
                <Input
                  id="edit_tx_timestamp"
                  type="datetime-local"
                  value={editForm.transaction_timestamp || ""}
                  onChange={(e) => setEditForm({ ...editForm, transaction_timestamp: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSubscription}
                disabled={isSubmitting}
                className="bg-[#0066ff] hover:bg-[#0052cc]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Subscription"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Subscription Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
            </DialogHeader>
            {selectedSubscription && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Subscription ID</Label>
                    <p className="font-medium">#{selectedSubscription.id}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedSubscription.subscription_status)}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-gray-600 text-lg font-semibold mb-3 block">User Information</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Full Name</Label>
                      <p className="font-medium">{selectedSubscription.user?.full_name || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p className="font-medium">{selectedSubscription.user?.email || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Contact</Label>
                      <p className="font-medium">{selectedSubscription.user?.contact || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Location</Label>
                      <p className="font-medium">
                        {selectedSubscription.user?.state}, {selectedSubscription.user?.country}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-gray-600 text-lg font-semibold mb-3 block">Plan Information</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Plan Name</Label>
                      <p className="font-medium">{selectedSubscription.plan?.title || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Description</Label>
                      <p className="font-medium">{selectedSubscription.plan?.description || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Subscription Type</Label>
                      <Badge className="bg-blue-100 text-blue-700">{selectedSubscription.subscription_type}</Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600">Amount Paid</Label>
                      <p className="font-medium text-lg">
                        {formatCurrency(selectedSubscription.subscription_amount_paid)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-gray-600 text-lg font-semibold mb-3 block">Payment Information</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Order ID</Label>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        {selectedSubscription.order_id}
                      </code>
                    </div>
                    <div>
                      <Label className="text-gray-600">Merchant ID</Label>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        {selectedSubscription.merchant_id}
                      </code>
                    </div>
                    <div>
                      <Label className="text-gray-600">Transaction Status</Label>
                      <div className="mt-1">{getTxStatusBadge(selectedSubscription.transaction_status)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Transaction Time</Label>
                      <p className="font-medium">{formatDate(selectedSubscription.transaction_timestamp)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-gray-600 text-lg font-semibold mb-3 block">Subscription Dates</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Start Date</Label>
                      <p className="font-medium">{formatDate(selectedSubscription.start_date)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Renewal Date</Label>
                      <p className="font-medium">{formatDate(selectedSubscription.renewal_date)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Created At</Label>
                      <p className="font-medium">{formatDate(selectedSubscription.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Updated At</Label>
                      <p className="font-medium">{formatDate(selectedSubscription.updated_at)}</p>
                    </div>
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

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this subscription? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSubscription}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
