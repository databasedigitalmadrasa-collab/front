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
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    FileText,
    MapPin
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { getAdminToken } from "@/lib/auth"

interface AffiliateKyc {
    id: number
    user_id: number
    full_name: string
    aadhaar_card_file_url: string | null
    pan_card_file_url: string | null
    full_address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    kyc_status: "pending" | "approved" | "rejected"
    note: string | null
    timestamp: string
    updated_at: string
}

const ITEMS_PER_PAGE = 10

export default function ManageKycPage() {
    const { toast } = useToast()
    const [requests, setRequests] = useState<AffiliateKyc[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<AffiliateKyc | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const token = getAdminToken()
            const response = await apiClient.get<{ items: AffiliateKyc[] }>("/affiliate-kyc", token)

            if (response.success && response.data) {
                setRequests(response.data.items || [])
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to fetch KYC requests",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching KYC requests:", error)
            toast({
                title: "Error",
                description: "Failed to load KYC requests",
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
            request.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(request.user_id).includes(searchQuery)

        const matchesStatus = statusFilter === "all" || request.kyc_status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Pagination
    const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    // Status badge
    const getStatusBadge = (status: AffiliateKyc["kyc_status"]) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                    </Badge>
                )
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                    </Badge>
                )
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                        <XCircle className="w-3 h-3" />
                        Rejected
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    }

    const handleChangeStatus = async (requestId: number, newStatus: AffiliateKyc["kyc_status"]) => {
        setIsSaving(true)
        try {
            const token = getAdminToken()
            const response = await apiClient.put(
                `/affiliate-kyc/${requestId}`,
                {
                    kyc_status: newStatus,
                },
                token,
            )

            if (response.success) {
                toast({
                    title: "Status Updated",
                    description: `KYC status changed to ${newStatus}`,
                })
                fetchRequests()
                if (selectedRequest && selectedRequest.id === requestId) {
                    setSelectedRequest({ ...selectedRequest, kyc_status: newStatus })
                }
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

    // Stats
    const stats = {
        total: requests.length,
        pending: requests.filter((r) => r.kyc_status === "pending").length,
        approved: requests.filter((r) => r.kyc_status === "approved").length,
        rejected: requests.filter((r) => r.kyc_status === "rejected").length,
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0066ff] mx-auto mb-4" />
                    <p className="text-gray-600">Loading KYC requests...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-3xl p-8 md:p-12 mb-6 text-white shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold font-heading">Manage KYC</h1>
                        </div>
                        <p className="text-blue-100 text-lg">Review and approve affiliate KYC documents</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-blue-100 text-sm mb-1">Total</p>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-blue-100 text-sm mb-1">Pending</p>
                        <p className="text-3xl font-bold">{stats.pending}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-blue-100 text-sm mb-1">Approved</p>
                        <p className="text-3xl font-bold">{stats.approved}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-blue-100 text-sm mb-1">Rejected</p>
                        <p className="text-3xl font-bold">{stats.rejected}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search by name or User ID..."
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
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">ID</TableHead>
                                <TableHead className="font-semibold">User</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">State/City</TableHead>
                                <TableHead className="font-semibold">Submitted</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No KYC requests found
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
                                                        {request.full_name ? request.full_name.charAt(0).toUpperCase() : "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{request.full_name}</p>
                                                    <p className="text-xs text-gray-500">User ID: {request.user_id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(request.kyc_status)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <span className="block text-gray-900">{request.city || "-"}</span>
                                                <span className="block text-gray-500 text-xs">{request.state || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-gray-700">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                {formatDate(request.timestamp)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
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
                                                Review
                                            </Button>
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

            {/* View Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-heading">KYC Details</DialogTitle>
                        <DialogDescription>Review documents and approve/reject request</DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <Label className="text-xs text-gray-500">Applicant</Label>
                                    <p className="font-semibold text-gray-900">{selectedRequest.full_name}</p>
                                    <p className="text-sm text-gray-600">User ID: {selectedRequest.user_id}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <Label className="text-xs text-gray-500">Address</Label>
                                    <p className="text-sm text-gray-900">{selectedRequest.full_address}</p>
                                    <p className="text-sm text-gray-600">{selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pincode}</p>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-4">
                                <Label className="font-semibold text-gray-900">Submitted Documents</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="border rounded-lg p-2">
                                        <p className="text-xs font-semibold mb-2 text-center text-gray-600">Aadhaar Card</p>
                                        {selectedRequest.aadhaar_card_file_url ? (
                                            <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                                                <a href={selectedRequest.aadhaar_card_file_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                    <img src={selectedRequest.aadhaar_card_file_url} alt="Aadhaar" className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="h-32 flex items-center justify-center bg-gray-100 text-gray-400">Not Uploaded</div>
                                        )}
                                    </div>
                                    <div className="border rounded-lg p-2">
                                        <p className="text-xs font-semibold mb-2 text-center text-gray-600">PAN Card</p>
                                        {selectedRequest.pan_card_file_url ? (
                                            <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                                                <a href={selectedRequest.pan_card_file_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                    <img src={selectedRequest.pan_card_file_url} alt="PAN" className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="h-32 flex items-center justify-center bg-gray-100 text-gray-400">Not Uploaded</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4 border-t">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleChangeStatus(selectedRequest.id, "approved")}
                                    disabled={isSaving || selectedRequest.kyc_status === "approved"}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve KYC"}
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    variant="destructive"
                                    onClick={() => handleChangeStatus(selectedRequest.id, "rejected")}
                                    disabled={isSaving || selectedRequest.kyc_status === "rejected"}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject KYC"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
