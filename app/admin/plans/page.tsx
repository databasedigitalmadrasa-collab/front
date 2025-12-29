"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  MoreHorizontal,
  CreditCard,
  Loader2,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"

interface Plan {
  id: number
  title: string
  description: string
  currency: string
  monthly_amount: number
  yearly_amount: number
  discounted_amount?: number
  offer_title?: string
  subscription_type: "monthly" | "annual" | "both"
  gst_tax: number
  whats_included?: string[]
  created_at: string
  updated_at: string
}

const ITEMS_PER_PAGE = 10

export default function ManagePlansPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currencyFilter, setCurrencyFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    monthly_amount: "",
    yearly_amount: "",
    discounted_amount: "",
    offer_title: "",
    currency: "INR",
    subscription_type: "both" as "monthly" | "annual" | "both",
    gst_tax: "18",
    whats_included: [""],
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setIsLoading(true)
    const token = getAuthToken()
    const response = await apiClient.get<{ items: Plan[] }>("/subscription-plans", token)

    console.log("Fetch plans response:", response)

    if (response.success && response.data) {
      setPlans(response.data.items || [])
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to fetch plans",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const handleCreatePlan = async () => {
    if (!formData.title || !formData.monthly_amount || !formData.yearly_amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const token = getAuthToken()

    const payload = {
      title: formData.title,
      description: formData.description,
      monthly_amount: Number.parseFloat(formData.monthly_amount),
      yearly_amount: Number.parseFloat(formData.yearly_amount),
      discounted_amount: formData.discounted_amount ? Number.parseFloat(formData.discounted_amount) : undefined,
      offer_title: formData.offer_title || undefined,
      currency: formData.currency,
      subscription_type: formData.subscription_type,
      gst_tax: Number.parseFloat(formData.gst_tax),
      whats_included: formData.whats_included.filter((item) => item.trim() !== ""),
    }

    console.log("Creating plan with payload:", payload)

    const response = await apiClient.post("/subscription-plans", payload, token)

    console.log("Create plan response:", response)

    if (response.success) {
      toast({
        title: "Success",
        description: "Plan created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchPlans()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to create plan",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const handleUpdatePlan = async () => {
    if (!selectedPlan || !formData.title || !formData.monthly_amount || !formData.yearly_amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const token = getAuthToken()

    const payload = {
      title: formData.title,
      description: formData.description,
      monthly_amount: Number.parseFloat(formData.monthly_amount),
      yearly_amount: Number.parseFloat(formData.yearly_amount),
      discounted_amount: formData.discounted_amount ? Number.parseFloat(formData.discounted_amount) : undefined,
      offer_title: formData.offer_title || undefined,
      currency: formData.currency,
      subscription_type: formData.subscription_type,
      gst_tax: Number.parseFloat(formData.gst_tax),
      whats_included: formData.whats_included.filter((item) => item.trim() !== ""),
    }

    console.log("Updating plan with payload:", payload)

    const response = await apiClient.put(`/subscription-plans/${selectedPlan.id}`, payload, token)

    console.log("Update plan response:", response)

    if (response.success) {
      toast({
        title: "Success",
        description: "Plan updated successfully",
      })
      setIsEditDialogOpen(false)
      setSelectedPlan(null)
      resetForm()
      fetchPlans()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to update plan",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return

    setIsSubmitting(true)
    const token = getAuthToken()

    console.log("Deleting plan:", selectedPlan.id)

    const response = await apiClient.delete(`/subscription-plans/${selectedPlan.id}`, token)

    console.log("Delete plan response:", response)

    if (response.success) {
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedPlan(null)
      fetchPlans()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to delete plan",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      monthly_amount: "",
      yearly_amount: "",
      discounted_amount: "",
      offer_title: "",
      currency: "INR",
      subscription_type: "both",
      gst_tax: "18",
      whats_included: [""],
    })
  }

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan)
    setFormData({
      title: plan.title,
      description: plan.description,
      monthly_amount: plan.monthly_amount.toString(),
      yearly_amount: plan.yearly_amount.toString(),
      discounted_amount: plan.discounted_amount?.toString() || "",
      offer_title: plan.offer_title || "",
      currency: plan.currency,
      subscription_type: plan.subscription_type,
      gst_tax: plan.gst_tax.toString(),
      whats_included: plan.whats_included && plan.whats_included.length > 0 ? plan.whats_included : [""],
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsDeleteDialogOpen(true)
  }

  const addIncludedItem = () => {
    setFormData({
      ...formData,
      whats_included: [...(Array.isArray(formData.whats_included) ? formData.whats_included : [""]), ""],
    })
  }

  const removeIncludedItem = (index: number) => {
    const currentItems = Array.isArray(formData.whats_included) ? formData.whats_included : [""]
    const newItems = currentItems.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      whats_included: newItems.length > 0 ? newItems : [""],
    })
  }

  const updateIncludedItem = (index: number, value: string) => {
    const currentItems = Array.isArray(formData.whats_included) ? formData.whats_included : [""]
    const newItems = [...currentItems]
    newItems[index] = value
    setFormData({
      ...formData,
      whats_included: newItems,
    })
  }

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      typeFilter === "all" || plan.subscription_type === typeFilter || plan.subscription_type === "both"

    const matchesCurrency = currencyFilter === "all" || plan.currency === currencyFilter

    return matchesSearch && matchesType && matchesCurrency
  })

  // Pagination
  const totalPages = Math.ceil(filteredPlans.length / ITEMS_PER_PAGE)
  const paginatedPlans = filteredPlans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlans(paginatedPlans.map((p) => p.id))
    } else {
      setSelectedPlans([])
    }
  }

  // Handle select plan
  const handleSelectPlan = (planId: number, checked: boolean) => {
    if (checked) {
      setSelectedPlans([...selectedPlans, planId])
    } else {
      setSelectedPlans(selectedPlans.filter((id) => id !== planId))
    }
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "INR") {
      return `₹${amount.toLocaleString("en-IN")}`
    }
    return `$${amount.toLocaleString()}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }

  // Calculate stats
  const activePlans = plans.length

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">Subscription Plans</h1>
              <p className="text-white/80 text-sm mt-1">Create and manage pricing plans for your platform</p>
            </div>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 flex-1 lg:flex-none shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-3xl font-bold">{plans.length}</div>
            <div className="text-sm text-white/80">Total Plans</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{activePlans}</div>
            <div className="text-sm text-white/80">Active Plans</div>
          </div>
          <div>
            <div className="text-3xl font-bold">INR</div>
            <div className="text-sm text-white/80">Primary Currency</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search plans..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="monthly">Monthly Only</SelectItem>
              <SelectItem value="annual">Annual Only</SelectItem>
              <SelectItem value="both">Both Available</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filter by currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedPlans.length === paginatedPlans.length && paginatedPlans.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold">Plan Details</TableHead>
                <TableHead className="font-semibold">Pricing</TableHead>
                <TableHead className="font-semibold">Discount</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">GST</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066ff]" />
                    <p className="text-sm text-gray-500 mt-2">Loading plans...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No plans found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPlans.map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedPlans.includes(plan.id)}
                        onCheckedChange={(checked) => handleSelectPlan(plan.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{plan.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{plan.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Monthly:</span>{" "}
                          {formatCurrency(plan.monthly_amount, plan.currency)}
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Yearly:</span>{" "}
                          {formatCurrency(plan.yearly_amount, plan.currency)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.discounted_amount ? (
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-green-100 text-green-700">
                            {formatCurrency(plan.discounted_amount, plan.currency)}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No discount</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {plan.subscription_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{plan.gst_tax}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{formatDate(plan.created_at)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(plan)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
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
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlans.length)} of {filteredPlans.length} plans
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            setSelectedPlan(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the plan details below."
                : "Fill in the details to create a new subscription plan."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Plan Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Premium Plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer_title">Offer Title (Optional)</Label>
              <Input
                id="offer_title"
                value={formData.offer_title}
                onChange={(e) => setFormData({ ...formData, offer_title: e.target.value })}
                placeholder="e.g., Limited Time Offer - Save 20%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's included in this plan"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_amount">Monthly Amount *</Label>
                <Input
                  id="monthly_amount"
                  type="number"
                  value={formData.monthly_amount}
                  onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                  placeholder="499"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearly_amount">Yearly Amount *</Label>
                <Input
                  id="yearly_amount"
                  type="number"
                  value={formData.yearly_amount}
                  onChange={(e) => setFormData({ ...formData, yearly_amount: e.target.value })}
                  placeholder="4999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discounted_amount">Discounted Amount (Optional)</Label>
                <Input
                  id="discounted_amount"
                  type="number"
                  value={formData.discounted_amount}
                  onChange={(e) => setFormData({ ...formData, discounted_amount: e.target.value })}
                  placeholder="3999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_tax">GST Tax (%)</Label>
                <Input
                  id="gst_tax"
                  type="number"
                  value={formData.gst_tax}
                  onChange={(e) => setFormData({ ...formData, gst_tax: e.target.value })}
                  placeholder="18"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_type">Subscription Type</Label>
                <Select
                  value={formData.subscription_type}
                  onValueChange={(value: "monthly" | "annual" | "both") =>
                    setFormData({ ...formData, subscription_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>What's Included</Label>
              {(Array.isArray(formData.whats_included) ? formData.whats_included : [""]).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateIncludedItem(index, e.target.value)}
                    placeholder="e.g., Unlimited access"
                  />
                  {(Array.isArray(formData.whats_included) ? formData.whats_included : [""]).length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeIncludedItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIncludedItem}
                className="w-full bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
                setSelectedPlan(null)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdatePlan : handleCreatePlan} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditDialogOpen ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plan "{selectedPlan?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
