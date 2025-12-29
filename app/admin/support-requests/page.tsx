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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Calendar,
  Mail,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { getAdminToken } from "@/lib/auth"

interface SupportRequest {
  id: number
  user_id?: number
  user_name?: string
  email?: string
  contact?: string
  subject: string
  message: string
  status: "pending" | "in-progress" | "resolved" | "closed" | "open"
  priority?: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
  resolved_at?: string
}

const ITEMS_PER_PAGE = 10

export default function SupportRequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const token = getAdminToken()
      const response = await apiClient.get<{ items: SupportRequest[] }>("/support-requests", token)

      if (response.success && response.data) {
        setRequests(response.data.items || [])
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch support requests",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching support requests:", error)
      toast({
        title: "Error",
        description: "Failed to load support requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Status badge
  const getStatusBadge = (status: SupportRequest["status"]) => {
    switch (status) {
      case "pending":
      case "open":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 text-xs gap-1">
            <AlertCircle className="w-3 h-3" />
            {status === "open" ? "Open" : "Pending"}
          </Badge>
        )
      case "in-progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 text-xs gap-1">
            <Clock className="w-3 h-3" />
            In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-700 text-xs gap-1">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge className="bg-gray-100 text-gray-700 text-xs gap-1">
            <XCircle className="w-3 h-3" />
            Closed
          </Badge>
        )
    }
  }

  // Priority badge
  const getPriorityBadge = (priority?: SupportRequest["priority"]) => {
    if (!priority) return null
    switch (priority) {
      case "low":
        return (
          <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
            Low
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Medium
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            High
          </Badge>
        )
      case "urgent":
        return (
          <Badge variant="outline" className="text-xs text-red-600 border-red-300">
            Urgent
          </Badge>
        )
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Get time ago
  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleChangeStatus = async (requestId: number, newStatus: SupportRequest["status"]) => {
    setIsSaving(true)
    try {
      const token = getAdminToken()
      const response = await apiClient.put(
        `/support-requests/${requestId}`,
        {
          status: newStatus,
          resolved_at: newStatus === "resolved" || newStatus === "closed" ? new Date().toISOString() : undefined,
        },
        token,
      )

      if (response.success) {
        toast({
          title: "Status Updated",
          description: `Support request status changed to ${newStatus}`,
        })
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return
    setIsSaving(true)
    try {
      const token = getAdminToken()
      const response = await apiClient.delete(`/support-requests/${selectedRequest.id}`, token)

      if (response.success) {
        toast({
          title: "Request Deleted",
          description: "Support request has been successfully deleted",
        })
        setIsDeleteDialogOpen(false)
        setSelectedRequest(null)
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting request:", error)
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending" || r.status === "open").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    resolved: requests.filter((r) => r.status === "resolved").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0066ff] mx-auto mb-4" />
          <p className="text-gray-600">Loading support requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-3xl p-8 md:p-12 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading">Support Requests</h1>
            </div>
            <p className="text-blue-100 text-lg">Manage and respond to user support tickets</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-blue-100 text-sm mb-1">Total Requests</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-blue-100 text-sm mb-1">Pending</p>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-blue-100 text-sm mb-1">In Progress</p>
            <p className="text-3xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-blue-100 text-sm mb-1">Resolved</p>
            <p className="text-3xl font-bold">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, subject, or message..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">User</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Updated</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No support requests found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">#{request.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white text-sm">
                            {request.user_name ? request.user_name.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {request.user_name || `User #${request.user_id || "N/A"}`}
                          </p>
                          {request.email && <p className="text-xs text-gray-500">{request.email}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900 text-sm max-w-xs truncate">{request.subject}</p>
                      <p className="text-xs text-gray-500 max-w-xs truncate">{request.message}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(request.created_at)}
                      </div>
                      <span className="text-xs text-gray-500">{getTimeAgo(request.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{getTimeAgo(request.updated_at)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsViewDialogOpen(true)
                          }}
                          className="gap-1 h-8"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="gap-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredRequests.length)} of{" "}
              {filteredRequests.length} requests
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Support Request Details</DialogTitle>
            <DialogDescription>Complete information about this support ticket</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <p className="font-medium">{selectedRequest.user_name || `User #${selectedRequest.user_id}`}</p>
                  </div>
                  {selectedRequest.email && (
                    <div>
                      <Label className="text-xs text-gray-500">Email</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {selectedRequest.email}
                      </p>
                    </div>
                  )}
                  {selectedRequest.contact && (
                    <div>
                      <Label className="text-xs text-gray-500">Contact</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {selectedRequest.contact}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500 mb-2">Subject</Label>
                  <p className="font-semibold text-lg">{selectedRequest.subject}</p>
                </div>

                <div>
                  <Label className="text-sm text-gray-500 mb-2">Message</Label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedRequest.message}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 mb-2">Status</Label>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  {selectedRequest.priority && (
                    <div>
                      <Label className="text-sm text-gray-500 mb-2">Priority</Label>
                      <div>{getPriorityBadge(selectedRequest.priority)}</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Created</Label>
                    <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Last Updated</Label>
                    <p className="font-medium">{formatDate(selectedRequest.updated_at)}</p>
                  </div>
                </div>

                {selectedRequest.resolved_at && (
                  <div>
                    <Label className="text-xs text-gray-500">Resolved</Label>
                    <p className="font-medium">{formatDate(selectedRequest.resolved_at)}</p>
                  </div>
                )}
              </div>

              {/* Change Status */}
              <div>
                <Label className="text-sm text-gray-500 mb-2">Change Status</Label>
                <Select
                  value={selectedRequest.status}
                  onValueChange={(value) => handleChangeStatus(selectedRequest.id, value as SupportRequest["status"])}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Support Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this support request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
  )
}
