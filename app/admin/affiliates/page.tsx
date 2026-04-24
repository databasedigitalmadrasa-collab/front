"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpDown,
    Download,
    Wallet,
    Users,
    TrendingUp,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink,
    UserPlus
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { AddUserWithReferralModal } from "@/components/admin/AddUserWithReferralModal"

interface AffiliateUser {
    id: number
    user_id: number
    full_name: string
    email: string
    profile_pic_url: string | null
    referral_code: string
    total_referrals: number
    total_earnings_cents: number
    wallet_balance_cents?: number
    rank?: number
    created_at: string
}

export default function AffiliatesPage() {
    const [affiliates, setAffiliates] = useState<AffiliateUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateUser | null>(null)
    const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false)
    const [walletAmount, setWalletAmount] = useState("")
    const [walletAction, setWalletAction] = useState<"credit" | "debit">("credit")
    const [walletNote, setWalletNote] = useState("")
    const [isAdjustingWallet, setIsAdjustingWallet] = useState(false)
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
    const [affiliateForUserCreation, setAffiliateForUserCreation] = useState<AffiliateUser | null>(null)

    useEffect(() => {
        fetchAffiliates()
    }, [])

    const fetchAffiliates = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get<any>("/admin/affiliate-stats")
            if (response.success && response.data?.items) {
                setAffiliates(response.data.items)
            }
        } catch (error) {
            console.error("Failed to fetch affiliates", error)
            toast.error("Failed to load affiliates")
        } finally {
            setLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!selectedAffiliate) return

        try {
            const response = await apiClient.put(`/users/${selectedAffiliate.user_id}/roles`, {
                role: "affiliate",
                action: "remove"
            })

            if (response.success) {
                toast.success("Affiliate deactivated successfully")
                setAffiliates(affiliates.filter(a => a.id !== selectedAffiliate.id))
                setIsDeactivateDialogOpen(false)
            } else {
                toast.error(response.message || "Failed to deactivate affiliate")
            }
        } catch (error) {
            toast.error("An error occurred while deactivating")
        }
    }

    const handleAdjustWallet = async () => {
        if (!selectedAffiliate) return
        if (!walletAmount || isNaN(Number(walletAmount)) || Number(walletAmount) <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        try {
            setIsAdjustingWallet(true)
            const amountCents = Math.round(Number(walletAmount) * 100)
            const response = await apiClient.post("/wallet/adjust", {
                user_id: selectedAffiliate.user_id,
                amount_cents: amountCents,
                action: walletAction,
                note: walletNote
            })

            if (response.success) {
                toast.success(`Wallet ${walletAction === "credit" ? "credited" : "debited"} successfully`)
                setIsWalletDialogOpen(false)
                setWalletAmount("")
                setWalletNote("")
                fetchAffiliates()
            } else {
                toast.error((response as any).error || `Failed to ${walletAction} wallet`)
            }
        } catch (error) {
            toast.error("An error occurred while adjusting wallet")
        } finally {
            setIsAdjustingWallet(false)
        }
    }

    const filteredAffiliates = affiliates.filter(
        (aff) =>
            aff.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            aff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            aff.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied to clipboard`)
    }

    return (
        <div className="p-6 sm:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#150101]">Affiliate Management</h1>
                    <p className="text-[#4b4b4b] mt-1">Monitor performance and manage affiliate partners</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Users className="w-5 h-5" />
                            <span className="font-medium">Total Affiliates</span>
                        </div>
                        <div className="text-4xl font-heading font-bold">{affiliates.length}</div>
                        <p className="text-sm mt-2 opacity-80">Active partners</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-medium">Total Referrals</span>
                        </div>
                        <div className="text-4xl font-heading font-bold">
                            {affiliates.reduce((acc, curr) => acc + (curr.total_referrals || 0), 0)}
                        </div>
                        <p className="text-sm mt-2 opacity-80">Successful conversions</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Wallet className="w-5 h-5" />
                            <span className="font-medium">Total Commission</span>
                        </div>
                        <div className="text-4xl font-heading font-bold">
                            {formatCurrency(affiliates.reduce((acc, curr) => acc + (curr.total_earnings_cents || 0), 0) / 100)}
                        </div>
                        <p className="text-sm mt-2 opacity-80">Paid out to affiliates</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-white/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, email, or code..."
                            className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="gap-2 rounded-xl border-dashed">
                        <Filter className="w-4 h-4" />
                        Filters
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead className="w-[350px] pl-6 h-12">Affiliate Partner</TableHead>
                                <TableHead className="h-12">Referral Code</TableHead>
                                <TableHead className="text-right h-12">
                                    <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent px-0">
                                        Referral Link Visits
                                        <ArrowUpDown className="w-3 h-3" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right h-12">Total Earnings</TableHead>
                                <TableHead className="text-right h-12">Wallet Balance</TableHead>
                                <TableHead className="text-right h-12 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
                                            <span className="text-muted-foreground animate-pulse">Loading affiliates data...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAffiliates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Users className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p>No affiliates found matching your criteria.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAffiliates.map((affiliate) => (
                                    <TableRow key={affiliate.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                    <AvatarImage src={affiliate.profile_pic_url || ""} />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold">
                                                        {getInitials(affiliate.full_name || "Unknown")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-[#150101]">{affiliate.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">{affiliate.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-mono bg-gray-100 text-gray-700 border-gray-200 shadow-sm rounded-lg px-2 py-1">
                                                    {affiliate.referral_code || "N/A"}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => copyToClipboard(affiliate.referral_code, "Referral Code")}
                                                >
                                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                                                {affiliate.total_referrals}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-medium text-[#150101]">
                                                {formatCurrency((affiliate.total_earnings_cents || 0) / 100)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                                {formatCurrency((affiliate.wallet_balance_cents || 0) / 100)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full">
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => copyToClipboard(affiliate.email, "Email")}>
                                                        <Copy className="w-4 h-4 mr-2" />
                                                        Copy Email
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedAffiliate(affiliate)
                                                        setIsWalletDialogOpen(true)
                                                        setWalletAmount("")
                                                        setWalletAction("credit")
                                                        setWalletNote("")
                                                    }}>
                                                        <Wallet className="w-4 h-4 mr-2" />
                                                        Manage Wallet
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        View Full Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setAffiliateForUserCreation(affiliate)
                                                        setIsAddUserModalOpen(true)
                                                    }}>
                                                        <UserPlus className="w-4 h-4 mr-2" />
                                                        Create Referral User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                        onClick={() => {
                                                            setSelectedAffiliate(affiliate)
                                                            setIsDeactivateDialogOpen(true)
                                                        }}
                                                    >
                                                        <ShieldAlert className="w-4 h-4 mr-2" />
                                                        Deactivate Affiliate
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
            </div>

            {/* Wallet Adjustment Dialog */}
            <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-blue-600" />
                            Adjust Affiliate Wallet
                        </DialogTitle>
                        <DialogDescription>
                            Manually credit or debit funds for <span className="font-bold text-[#150101]">{selectedAffiliate?.full_name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
                            <button
                                onClick={() => setWalletAction("credit")}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                                    walletAction === "credit"
                                        ? "bg-white text-green-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Credit Funds
                            </button>
                            <button
                                onClick={() => setWalletAction("debit")}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                                    walletAction === "debit"
                                        ? "bg-white text-red-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <XCircle className="w-4 h-4" />
                                Debit Funds
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Amount (INR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-7 bg-white border-gray-200 focus:ring-blue-500/20"
                                    value={walletAmount}
                                    onChange={(e) => setWalletAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Reason / Description</label>
                            <Input
                                placeholder="e.g. Performance bonus, Adjustment correction..."
                                className="bg-white border-gray-200 focus:ring-blue-500/20"
                                value={walletNote}
                                onChange={(e) => setWalletNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl">Cancel</Button>
                        </DialogClose>
                        <Button
                            className={cn(
                                "rounded-xl px-8",
                                walletAction === "credit"
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            )}
                            disabled={isAdjustingWallet}
                            onClick={handleAdjustWallet}
                        >
                            {isAdjustingWallet ? "Processing..." : `Confirm ${walletAction === "credit" ? "Credit" : "Debit"}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <ShieldAlert className="w-5 h-5" />
                            Deactivate Affiliate
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to deactivate <span className="font-bold text-[#150101]">{selectedAffiliate?.full_name}</span>?
                            <br /><br />
                            This action will revoke their affiliate privileges. They will no longer earn commissions, but their user account will remain active.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeactivate}>
                            Confirm Deactivation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddUserWithReferralModal
                isOpen={isAddUserModalOpen}
                onClose={() => {
                    setIsAddUserModalOpen(false)
                    setAffiliateForUserCreation(null)
                }}
                onSuccess={() => fetchAffiliates()}
                initialAffiliate={affiliateForUserCreation ? {
                    id: affiliateForUserCreation.id,
                    user_id: affiliateForUserCreation.user_id,
                    full_name: affiliateForUserCreation.full_name,
                    email: affiliateForUserCreation.email,
                    referral_code: affiliateForUserCreation.referral_code,
                    profile_pic_url: affiliateForUserCreation.profile_pic_url || undefined
                } : null}
            />
        </div>
    )
}
