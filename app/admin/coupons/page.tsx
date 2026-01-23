"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Ticket } from "lucide-react"
import { format } from "date-fns"

interface Coupon {
    id: number;
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    plan_id?: number | null;
    max_uses?: number | null;
    used_count: number;
    start_date?: string | null;
    end_date?: string | null;
    is_active: number;
}

interface SubscriptionPlan {
    id: number;
    title: string;
}

export default function CouponsAdminPage() {
    const { admin } = useAuth()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({
        discount_type: 'percentage',
        is_active: 1
    })
    const [isSaving, setIsSaving] = useState(false)

    const fetchCoupons = async () => {
        setIsLoading(true)
        try {
            const res = await apiClient.get<any>('/coupons')
            if (res.success && res.data) {
                const items = res.data.items || res.data || []
                setCoupons(items)
            }
        } catch (err) {
            console.error(err)
            toast.error("Failed to load coupons")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchPlans = async () => {
        try {
            const res = await apiClient.get<any>('/subscription-plans')
            if (res.success && res.data) {
                // Adjust per your actual response structure for subscription plans
                const items = res.data.items || res.data || []
                setPlans(items)
            }
        } catch (err) {
            console.error(err)
            // Optional: don't block main page if plans fail
        }
    }

    useEffect(() => {
        fetchCoupons()
        fetchPlans()
    }, [])

    const handleSave = async () => {
        if (!currentCoupon.code || !currentCoupon.discount_value) {
            toast.error("Code and Discount Value are required")
            return
        }

        setIsSaving(true)
        try {
            const payload = { ...currentCoupon }

            // Format for API
            if (payload.plan_id === 0 || payload.plan_id === '0' as any) payload.plan_id = null;
            if (payload.max_uses === 0 || payload.max_uses === '0' as any) payload.max_uses = null;

            if (isEditing && currentCoupon.id) {
                await apiClient.put(`/coupons/${currentCoupon.id}`, payload)
                toast.success("Coupon updated")
            } else {
                await apiClient.post('/coupons', payload)
                toast.success("Coupon created")
            }
            setIsDialogOpen(false)
            fetchCoupons()
            resetForm()
        } catch (err) {
            console.error(err)
            toast.error("Failed to save coupon")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return

        try {
            await apiClient.delete(`/coupons/${id}`)
            toast.success("Coupon deleted")
            setCoupons(prev => prev.filter(c => c.id !== id))
        } catch (err) {
            console.error(err)
            toast.error("Failed to delete coupon")
        }
    }

    const openCreateDialog = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    const openEditDialog = (coupon: Coupon) => {
        setCurrentCoupon({ ...coupon })
        setIsEditing(true)
        setIsDialogOpen(true)
    }

    const resetForm = () => {
        setCurrentCoupon({
            code: '',
            discount_type: 'percentage',
            discount_value: 0,
            is_active: 1,
            plan_id: null,
            max_uses: null
        })
        setIsEditing(false)
    }

    const getPlanName = (id: number | null | undefined) => {
        if (!id) return "All Plans";
        const plan = plans.find(p => p.id === id);
        return plan ? plan.title : "Unknown Plan";
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Coupons</h1>
                    <p className="text-gray-500">Create discount codes for subscription plans</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-[#0066ff] hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Applicable To</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Validity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">No coupons found.</TableCell>
                                </TableRow>
                            ) : (
                                coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Badge variant="outline" className="font-mono bg-gray-50 w-fit">{coupon.code}</Badge>
                                                {coupon.description && <span className="text-xs text-gray-500 mt-1">{coupon.description}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                                        </TableCell>
                                        <TableCell className="text-gray-600 font-medium text-sm">
                                            {getPlanName(coupon.plan_id)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {coupon.used_count} / {coupon.max_uses ? coupon.max_uses : '∞'}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">
                                            {coupon.start_date ? format(new Date(coupon.start_date), 'MMM d, yyyy') : 'Any'}
                                            {' - '}
                                            {coupon.end_date ? format(new Date(coupon.end_date), 'MMM d, yyyy') : 'Any'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={coupon.is_active ? "default" : "secondary"} className={coupon.is_active ? "bg-green-500" : ""}>
                                                {coupon.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(coupon)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(coupon.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Coupon Code</Label>
                                <Input
                                    placeholder="e.g. SAVE20"
                                    value={currentCoupon.code || ''}
                                    onChange={e => setCurrentCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                    disabled={isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Plan (Optional)</Label>
                                <Select
                                    value={currentCoupon.plan_id ? String(currentCoupon.plan_id) : "0"}
                                    onValueChange={(val) => setCurrentCoupon(prev => ({ ...prev, plan_id: val === "0" ? null : Number(val) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Plans" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Plans</SelectItem>
                                        {plans.map(plan => (
                                            <SelectItem key={plan.id} value={String(plan.id)}>{plan.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select
                                    value={currentCoupon.discount_type}
                                    onValueChange={(val: 'percentage' | 'fixed') => setCurrentCoupon(prev => ({ ...prev, discount_type: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                    type="number"
                                    placeholder="20"
                                    value={currentCoupon.discount_value || ''}
                                    onChange={e => setCurrentCoupon(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Input
                                placeholder="Summer Sale Discount"
                                value={currentCoupon.description || ''}
                                onChange={e => setCurrentCoupon(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Uses (Optional)</Label>
                                <Input
                                    type="number"
                                    placeholder="Unlimited"
                                    value={currentCoupon.max_uses || ''}
                                    onChange={e => setCurrentCoupon(prev => ({ ...prev, max_uses: e.target.value ? Number(e.target.value) : null }))}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="rounded border-gray-300"
                                    checked={!!currentCoupon.is_active}
                                    onChange={e => setCurrentCoupon(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                                />
                                <Label htmlFor="is_active">Is Active</Label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={currentCoupon.start_date ? currentCoupon.start_date.split('T')[0] : ''}
                                    onChange={e => setCurrentCoupon(prev => ({ ...prev, start_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={currentCoupon.end_date ? currentCoupon.end_date.split('T')[0] : ''}
                                    onChange={e => setCurrentCoupon(prev => ({ ...prev, end_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-[#0066ff]">
                            {isSaving ? "Saving..." : (isEditing ? "Update Coupon" : "Create Coupon")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
