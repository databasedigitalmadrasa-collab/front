"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle, ExternalLink, User, Mail, Globe, Share2, Info, Eye, Target } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface AffiliateRequest {
    id: number
    user_id: number
    full_name: string
    email: string
    status: 'pending' | 'approved' | 'rejected'
    request_reason: string
    promotion_strategy: string
    social_media_links: string
    website_url: string
    rejection_reason: string
    created_at: string
}

export default function AdminAffiliateRequestsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState<AffiliateRequest[]>([])

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get<any>("/affiliate-requests")
            if (res.success && res.data && res.data.items) {
                setRequests(res.data.items)
            } else {
                setRequests([])
            }
        } catch (e) {
            console.error("Failed to fetch requests", e)
            toast({
                title: "Error",
                description: "Failed to fetch affiliate requests",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const [selectedRequest, setSelectedRequest] = useState<AffiliateRequest | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected', userId: number) => {
        try {
            const res = await apiClient.put(`/affiliate-requests/${id}`, { status })

            if (res.success) {
                if (status === 'approved') {
                    const convertRes = await apiClient.put(`/users/to-affiliate/${userId}`, {})
                    if (!convertRes.success) {
                        toast({
                            title: "Warning",
                            description: "Request approved but failed to update user role.",
                            variant: "destructive"
                        })
                    } else {
                        toast({
                            title: "Success",
                            description: "Request approved and user converted to affiliate.",
                        })
                    }
                } else {
                    toast({
                        title: "Rejected",
                        description: "Request has been rejected.",
                    })
                }

                setIsDetailsOpen(false)
                fetchRequests()
            } else {
                toast({
                    title: "Error",
                    description: res.message || "Failed to update status",
                    variant: "destructive"
                })
            }
        } catch (e) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Affiliate Requests</h1>
                    <p className="text-muted-foreground">Manage applications for the affiliate program.</p>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Application Queue</CardTitle>
                                <CardDescription>Manage incoming affiliate partner requests.</CardDescription>
                            </div>
                            <div className="h-10 w-10 bg-blue-50 text-[#0066ff] rounded-xl flex items-center justify-center">
                                <Info className="w-5 h-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-[#0066ff]" />
                                <p className="text-gray-500 font-medium">Loading requests...</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <User className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500">No affiliate requests found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="w-[80px]">ID</TableHead>
                                            <TableHead>Applicant</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Links</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((req) => (
                                            <TableRow key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="font-medium text-gray-500">#{req.id}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{req.full_name || 'N/A'}</span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {req.email || 'N/A'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            req.status === 'approved' ? 'bg-green-100 text-green-700 border-none px-3 py-1 shadow-none capitalize' :
                                                                req.status === 'rejected' ? 'bg-red-100 text-red-700 border-none px-3 py-1 shadow-none capitalize' :
                                                                    'bg-blue-100 text-blue-700 border-none px-3 py-1 shadow-none capitalize'
                                                        }
                                                    >
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-3">
                                                        {req.website_url && (
                                                            <a href={req.website_url} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:text-[#0066ff] hover:bg-blue-50 transition-all" title="Website">
                                                                <Globe className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        {req.social_media_links && (
                                                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600 cursor-help" title={req.social_media_links}>
                                                                <Share2 className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {new Date(req.created_at).toLocaleDateString(undefined, {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[#0066ff] hover:bg-blue-50 hover:text-blue-700 gap-2 font-semibold"
                                                        onClick={() => {
                                                            setSelectedRequest(req)
                                                            setIsDetailsOpen(true)
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" /> View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
                    {selectedRequest && (
                        <>
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
                                <DialogHeader>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                            <User className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-2xl font-bold text-white leading-tight">
                                                {selectedRequest.full_name}
                                            </DialogTitle>
                                            <DialogDescription className="text-gray-400 flex items-center gap-2 mt-1">
                                                <Mail className="w-4 h-4" /> {selectedRequest.email}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-500 text-white border-none px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black shadow-lg shadow-blue-500/20">
                                        APPLICATION #{selectedRequest.id}
                                    </Badge>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-4 h-4" /> Motivation
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {selectedRequest.request_reason || "No reason provided."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Strategy
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {selectedRequest.promotion_strategy || "No strategy provided."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pb-4">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Share2 className="w-4 h-4" /> Social Links
                                        </h4>
                                        <div className="text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 break-words">
                                            {selectedRequest.social_media_links || "N/A"}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Globe className="w-4 h-4" /> Website
                                        </h4>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 overflow-hidden">
                                            {selectedRequest.website_url ? (
                                                <a href={selectedRequest.website_url} target="_blank" rel="noreferrer" className="text-[#0066ff] hover:underline flex items-center gap-2 font-semibold">
                                                    Visit <ExternalLink className="w-4 h-4" />
                                                </a>
                                            ) : "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex gap-3 w-full">
                                    {selectedRequest.status === 'pending' ? (
                                        <>
                                            <Button
                                                onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected', selectedRequest.user_id)}
                                                variant="outline"
                                                className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                                            >
                                                <XCircle className="w-5 h-5 mr-2" /> Reject
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate(selectedRequest.id, 'approved', selectedRequest.user_id)}
                                                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" /> Approve
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            disabled
                                            className="w-full h-12 bg-gray-100 text-gray-400 font-bold capitalize"
                                        >
                                            Status: {selectedRequest.status}
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
