"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CreditCard,
  Activity,
  DollarSign,
  Webhook,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { getAdminToken } from "@/lib/auth"

interface PaymentLog {
  id: number
  subscription_id: number | null
  order_id: string
  email: string
  contact_number: string
  amount_cents: number
  currency: string
  payment_method: string
  provider: string
  provider_transaction_id: string
  merchant_id: string
  status: string
  status_detail: string | null
  attempt: number
  receipt_url: string | null
  invoice_url: string | null
  refunded_amount_cents: number
  refund_status: string | null
  raw_response: string
  transaction_timestamp: string
  created_at: string
  updated_at: string
}

interface WebhookLog {
  id: number
  provider: string
  event_type: string
  endpoint: string
  payload: string
  headers: string
  signature_header: string
  order_id: string | null
  subscription_id: number | null
  payment_log_id: number | null
  received_at: string
  processed_at: string | null
  status: string
  attempt: number
  response_status: number | null
  response_body: string | null
  created_at: string
  updated_at: string
}

const ITEMS_PER_PAGE = 10

export default function LogsPage() {
  const { toast } = useToast()

  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(true)

  // Payment Logs State
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([])
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("")
  const [paymentProviderFilter, setPaymentProviderFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1)
  const [selectedPaymentLog, setSelectedPaymentLog] = useState<PaymentLog | null>(null)
  const [isPaymentViewOpen, setIsPaymentViewOpen] = useState(false)

  // Webhook Logs State
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [webhookSearchQuery, setWebhookSearchQuery] = useState("")
  const [webhookProviderFilter, setWebhookProviderFilter] = useState("all")
  const [webhookStatusFilter, setWebhookStatusFilter] = useState("all")
  const [webhookEventFilter, setWebhookEventFilter] = useState("all")
  const [webhookCurrentPage, setWebhookCurrentPage] = useState(1)
  const [selectedWebhookLog, setSelectedWebhookLog] = useState<WebhookLog | null>(null)
  const [isWebhookViewOpen, setIsWebhookViewOpen] = useState(false)

  const fetchPaymentLogs = async () => {
    setIsLoadingPayments(true)
    try {
      const token = getAdminToken()
      const response = await apiClient.get<{ success: boolean; items: PaymentLog[] }>("/payment-logs", token)

      if (response.success && response.data?.items) {
        setPaymentLogs(response.data.items)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch payment logs",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching payment logs:", error)
      toast({
        title: "Error",
        description: "Failed to load payment logs",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const fetchWebhookLogs = async () => {
    setIsLoadingWebhooks(true)
    try {
      const token = getAdminToken()
      const response = await apiClient.get<{ success: boolean; items: WebhookLog[] }>("/webhook-logs", token)

      if (response.success && response.data?.items) {
        setWebhookLogs(response.data.items)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch webhook logs",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching webhook logs:", error)
      toast({
        title: "Error",
        description: "Failed to load webhook logs",
        variant: "destructive",
      })
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  useEffect(() => {
    fetchPaymentLogs()
    fetchWebhookLogs()
  }, [])

  // Helper functions
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      success: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
      refunded: "bg-blue-100 text-blue-700",
    }
    return <Badge className={variants[status as keyof typeof variants] || ""}>{status.toUpperCase()}</Badge>
  }

  const getWebhookStatusBadge = (status: string) => {
    const variants = {
      processed: "bg-green-100 text-green-700",
      ignored: "bg-gray-100 text-gray-700",
      failed: "bg-red-100 text-red-700",
    }
    return <Badge className={variants[status as keyof typeof variants] || ""}>{status.toUpperCase()}</Badge>
  }

  // Filter payment logs
  const filteredPaymentLogs = paymentLogs.filter((log) => {
    const matchesSearch =
      log.email.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
      log.order_id.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
      log.provider_transaction_id.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
      log.contact_number.includes(paymentSearchQuery)

    const matchesProvider =
      paymentProviderFilter === "all" || log.provider.toLowerCase() === paymentProviderFilter.toLowerCase()
    const matchesStatus = paymentStatusFilter === "all" || log.status === paymentStatusFilter

    return matchesSearch && matchesProvider && matchesStatus
  })

  // Filter webhook logs
  const filteredWebhookLogs = webhookLogs.filter((log) => {
    const matchesSearch =
      log.event_type.toLowerCase().includes(webhookSearchQuery.toLowerCase()) ||
      log.provider.toLowerCase().includes(webhookSearchQuery.toLowerCase())

    const matchesProvider =
      webhookProviderFilter === "all" || log.provider.toLowerCase() === webhookProviderFilter.toLowerCase()
    const matchesStatus = webhookStatusFilter === "all" || log.status === webhookStatusFilter
    const matchesEvent = webhookEventFilter === "all" || log.event_type === webhookEventFilter

    return matchesSearch && matchesProvider && matchesStatus && matchesEvent
  })

  // Pagination for payment logs
  const paymentTotalPages = Math.ceil(filteredPaymentLogs.length / ITEMS_PER_PAGE)
  const paginatedPaymentLogs = filteredPaymentLogs.slice(
    (paymentCurrentPage - 1) * ITEMS_PER_PAGE,
    paymentCurrentPage * ITEMS_PER_PAGE,
  )

  // Pagination for webhook logs
  const webhookTotalPages = Math.ceil(filteredWebhookLogs.length / ITEMS_PER_PAGE)
  const paginatedWebhookLogs = filteredWebhookLogs.slice(
    (webhookCurrentPage - 1) * ITEMS_PER_PAGE,
    webhookCurrentPage * ITEMS_PER_PAGE,
  )

  // Export functions
  const exportPaymentLogs = () => {
    const csv = [
      [
        "ID",
        "Date",
        "Email",
        "Provider",
        "Payment Method",
        "Amount",
        "Currency",
        "Status",
        "Order ID",
        "Provider Txn ID",
      ],
      ...filteredPaymentLogs.map((log) => [
        log.id,
        log.transaction_timestamp,
        log.email,
        log.provider,
        log.payment_method,
        log.amount_cents / 100,
        log.currency,
        log.status,
        log.order_id,
        log.provider_transaction_id,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payment-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()

    toast({
      title: "Export Successful",
      description: `Exported ${filteredPaymentLogs.length} payment logs`,
    })
  }

  const exportWebhookLogs = () => {
    const csv = [
      ["ID", "Timestamp", "Provider", "Event Type", "Status", "Payment Log ID", "Attempt"],
      ...filteredWebhookLogs.map((log) => [
        log.id,
        log.received_at,
        log.provider,
        log.event_type,
        log.status,
        log.payment_log_id || "N/A",
        log.attempt,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `webhook-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()

    toast({
      title: "Export Successful",
      description: `Exported ${filteredWebhookLogs.length} webhook logs`,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-6 lg:p-8 text-white mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">System Logs</h1>
              <p className="text-white/80 text-sm mt-1">Monitor payment transactions and webhook events</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchPaymentLogs}
              variant="secondary"
              size="sm"
              disabled={isLoadingPayments}
              className="gap-2"
            >
              {isLoadingPayments ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-3xl font-bold">{paymentLogs.length}</div>
            <div className="text-sm text-white/80">Total Payments</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{paymentLogs.filter((log) => log.status === "success").length}</div>
            <div className="text-sm text-white/80">Successful</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{webhookLogs.length}</div>
            <div className="text-sm text-white/80">Total Webhooks</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{webhookLogs.filter((log) => log.status === "processed").length}</div>
            <div className="text-sm text-white/80">Processed</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1">
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Payment Logs
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="w-4 h-4" />
            Webhook Logs
          </TabsTrigger>
        </TabsList>

        {/* Payment Logs Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by email, order ID..."
                  className="pl-10 h-11"
                  value={paymentSearchQuery}
                  onChange={(e) => setPaymentSearchQuery(e.target.value)}
                />
              </div>

              <Select value={paymentProviderFilter} onValueChange={setPaymentProviderFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportPaymentLogs} className="bg-[#0066ff] hover:bg-[#0052cc] gap-2 h-11">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {isLoadingPayments ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#0066ff]" />
                <p className="text-gray-500">Loading payment logs...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Logs Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Email / Contact</TableHead>
                        <TableHead className="font-semibold">Provider</TableHead>
                        <TableHead className="font-semibold">Payment Method</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Order ID</TableHead>
                        <TableHead className="font-semibold">Provider Txn ID</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPaymentLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                            No payment logs found matching your filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPaymentLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">#{log.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatDate(log.transaction_timestamp)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{log.email}</span>
                                <span className="text-xs text-gray-500">{log.contact_number}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {log.provider}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                {log.payment_method}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(log.amount_cents, log.currency)}
                              </span>
                            </TableCell>
                            <TableCell>{getPaymentStatusBadge(log.status)}</TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-gray-600">{log.order_id}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-gray-600">{log.provider_transaction_id}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPaymentLog(log)
                                  setIsPaymentViewOpen(true)
                                }}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {paymentTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(paymentCurrentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(paymentCurrentPage * ITEMS_PER_PAGE, filteredPaymentLogs.length)} of{" "}
                    {filteredPaymentLogs.length} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={paymentCurrentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentCurrentPage((prev) => Math.min(paymentTotalPages, prev + 1))}
                      disabled={paymentCurrentPage === paymentTotalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Webhook Logs Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search webhooks..."
                  className="pl-10 h-11"
                  value={webhookSearchQuery}
                  onChange={(e) => setWebhookSearchQuery(e.target.value)}
                />
              </div>

              <Select value={webhookProviderFilter} onValueChange={setWebhookProviderFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                </SelectContent>
              </Select>

              <Select value={webhookStatusFilter} onValueChange={setWebhookStatusFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>

              <Select value={webhookEventFilter} onValueChange={setWebhookEventFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="payment.captured">Payment Captured</SelectItem>
                  <SelectItem value="payment.failed">Payment Failed</SelectItem>
                  <SelectItem value="refund.completed">Refund Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportWebhookLogs} className="bg-[#0066ff] hover:bg-[#0052cc] gap-2 h-11">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {isLoadingWebhooks ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#0066ff]" />
                <p className="text-gray-500">Loading webhook logs...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Webhook Logs Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Timestamp</TableHead>
                        <TableHead className="font-semibold">Provider</TableHead>
                        <TableHead className="font-semibold">Event Type</TableHead>
                        <TableHead className="font-semibold">Endpoint</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Attempt</TableHead>
                        <TableHead className="font-semibold">Response Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedWebhookLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                            No webhook logs found matching your filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedWebhookLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">#{log.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatDate(log.received_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {log.provider}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono text-gray-700">{log.event_type}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-gray-600">{log.endpoint}</span>
                            </TableCell>
                            <TableCell>{getWebhookStatusBadge(log.status)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                Attempt {log.attempt}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.response_status && (
                                <Badge
                                  className={
                                    log.response_status >= 200 && log.response_status < 300
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }
                                >
                                  {log.response_status}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedWebhookLog(log)
                                  setIsWebhookViewOpen(true)
                                }}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {webhookTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(webhookCurrentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(webhookCurrentPage * ITEMS_PER_PAGE, filteredWebhookLogs.length)} of{" "}
                    {filteredWebhookLogs.length} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWebhookCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={webhookCurrentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWebhookCurrentPage((prev) => Math.min(webhookTotalPages, prev + 1))}
                      disabled={webhookCurrentPage === webhookTotalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Log Detail Dialog */}
      <Dialog open={isPaymentViewOpen} onOpenChange={setIsPaymentViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Log Details</DialogTitle>
            <DialogDescription>Complete information for payment #{selectedPaymentLog?.id}</DialogDescription>
          </DialogHeader>

          {selectedPaymentLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Order ID</Label>
                  <p className="font-mono text-sm">{selectedPaymentLog.order_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Provider Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedPaymentLog.provider_transaction_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="text-sm">{selectedPaymentLog.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Contact</Label>
                  <p className="text-sm">{selectedPaymentLog.contact_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <p className="text-sm font-semibold">
                    {formatCurrency(selectedPaymentLog.amount_cents, selectedPaymentLog.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedPaymentLog.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Provider</Label>
                  <p className="text-sm">{selectedPaymentLog.provider}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Payment Method</Label>
                  <p className="text-sm">{selectedPaymentLog.payment_method}</p>
                </div>
                {selectedPaymentLog.invoice_url && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Invoice URL</Label>
                    <a
                      href={selectedPaymentLog.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block truncate"
                    >
                      {selectedPaymentLog.invoice_url}
                    </a>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Raw Response</Label>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedPaymentLog.raw_response || "{}"), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Webhook Log Detail Dialog */}
      <Dialog open={isWebhookViewOpen} onOpenChange={setIsWebhookViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Log Details</DialogTitle>
            <DialogDescription>Complete information for webhook #{selectedWebhookLog?.id}</DialogDescription>
          </DialogHeader>

          {selectedWebhookLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Provider</Label>
                  <p className="text-sm">{selectedWebhookLog.provider}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Event Type</Label>
                  <p className="text-sm font-mono">{selectedWebhookLog.event_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Endpoint</Label>
                  <p className="text-sm">{selectedWebhookLog.endpoint}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">{getWebhookStatusBadge(selectedWebhookLog.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Received At</Label>
                  <p className="text-sm">{formatDate(selectedWebhookLog.received_at)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Processed At</Label>
                  <p className="text-sm">
                    {selectedWebhookLog.processed_at ? formatDate(selectedWebhookLog.processed_at) : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Attempt</Label>
                  <p className="text-sm">{selectedWebhookLog.attempt}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Response Status</Label>
                  <p className="text-sm">{selectedWebhookLog.response_status || "N/A"}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Headers</Label>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedWebhookLog.headers || "{}"), null, 2)}
                </pre>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Payload</Label>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedWebhookLog.payload || "{}"), null, 2)}
                </pre>
              </div>

              {selectedWebhookLog.response_body && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Response Body</Label>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedWebhookLog.response_body), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
