"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface AffiliateRequest {
    id: number
    user_id: number
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

    const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected', userId: number) => {
        try {
            // 1. Update Request Status
            const res = await apiClient.put(`/affiliate-requests/${id}`, { status })

            if (res.success) {
                if (status === 'approved') {
                    // 2. Convert User to Affiliate
                    const convertRes = await apiClient.put(`/users/to-affiliate/${userId}`, {})
                    if (!convertRes.success) {
                        toast({
                            title: "Warning",
                            description: "Request approved but failed to update user role. Please manually update user role.",
                            variant: "destructive"
                        })
                    } else {
                        toast({
                            title: "Success",
                            description: "Request approved and user converted to affiliate.",
                            variant: "default"
                        })
                    }
                } else {
                    toast({
                        title: "Rejected",
                        description: "Request has been rejected.",
                        variant: "default"
                    })
                }

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

                <Card>
                    <CardHeader>
                        <CardTitle>Requests</CardTitle>
                        <CardDescription>Review and manage affiliate applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No affiliate requests found.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Strategy / Reason</TableHead>
                                        <TableHead>Links</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell>{req.id}</TableCell>
                                            <TableCell>{req.user_id}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        req.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                            req.status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                                                'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                    }
                                                >
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={req.promotion_strategy || req.request_reason}>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-xs">Reason: {req.request_reason || '-'}</span>
                                                    <span className="text-xs text-muted-foreground">Strategy: {req.promotion_strategy || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {req.website_url && <a href={req.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block text-xs truncate">{req.website_url}</a>}
                                                {req.social_media_links && <span className="text-xs text-gray-500 block truncate" title={req.social_media_links}>{req.social_media_links}</span>}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-xs text-gray-500">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {req.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                                            onClick={() => handleStatusUpdate(req.id, 'approved', req.user_id)}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                                            onClick={() => handleStatusUpdate(req.id, 'rejected', req.user_id)}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
