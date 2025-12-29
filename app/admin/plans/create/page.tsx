"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Eye, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PlanForm {
  title: string
  short_description: string
  description: string
  currency: string
  monthly_amount: string
  yearly_amount: string
  discounted_amount: string
  subscription_type: "monthly" | "annual" | "both"
  gst_tax: string
  is_tax_included: boolean
  is_active: boolean
  features: string[]
  trial_days: string
}

export default function CreatePlanPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [form, setForm] = useState<PlanForm>({
    title: "",
    short_description: "",
    description: "",
    currency: "INR",
    monthly_amount: "",
    yearly_amount: "",
    discounted_amount: "",
    subscription_type: "both",
    gst_tax: "18",
    is_tax_included: false,
    is_active: true,
    features: [],
    trial_days: "0",
  })
  const [newFeature, setNewFeature] = useState("")

  // Add feature
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setForm({ ...form, features: [...form.features, newFeature.trim()] })
      setNewFeature("")
    }
  }

  // Remove feature
  const handleRemoveFeature = (index: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== index) })
  }

  // Calculate savings
  const calculateSavings = () => {
    const monthly = Number.parseFloat(form.monthly_amount) || 0
    const yearly = Number.parseFloat(form.yearly_amount) || 0
    const monthlyTotal = monthly * 12
    if (monthlyTotal > yearly && yearly > 0) {
      const savings = monthlyTotal - yearly
      const percentage = ((savings / monthlyTotal) * 100).toFixed(0)
      return { savings, percentage }
    }
    return null
  }

  // Save plan
  const handleSavePlan = (publish: boolean) => {
    // Validation
    if (!form.title || !form.short_description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Create new plan
    const newPlan = {
      id: Date.now(),
      title: form.title,
      short_description: form.short_description,
      description: form.description,
      currency: form.currency,
      monthly_amount: Number.parseFloat(form.monthly_amount) || 0,
      yearly_amount: Number.parseFloat(form.yearly_amount) || 0,
      discounted_amount: form.discounted_amount ? Number.parseFloat(form.discounted_amount) : undefined,
      discount_percentage: form.discounted_amount
        ? Math.round(
            ((Number.parseFloat(form.monthly_amount) - Number.parseFloat(form.discounted_amount)) /
              Number.parseFloat(form.monthly_amount)) *
              100,
          )
        : undefined,
      subscription_type: form.subscription_type,
      gst_tax: Number.parseFloat(form.gst_tax) || 0,
      is_tax_included: form.is_tax_included,
      is_active: publish ? true : form.is_active,
      subscribers_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Save to localStorage
    const stored = localStorage.getItem("digital_madarsa_plans")
    const plans = stored ? JSON.parse(stored) : []
    plans.push(newPlan)
    localStorage.setItem("digital_madarsa_plans", JSON.stringify(plans))

    toast({
      title: publish ? "Plan published" : "Plan saved as draft",
      description: `${form.title} has been successfully ${publish ? "published" : "saved"}`,
    })

    router.push("/admin/plans")
  }

  const savings = calculateSavings()

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </Button>

        <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Create New Plan</h1>
          <p className="text-white/80 text-sm mt-1">
            Define pricing, features, and settings for a new subscription plan
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Plan Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Pro Plan"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">
                    Short Description <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="short_description"
                    placeholder="One-line description for cards and listings"
                    value={form.short_description}
                    onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of what this plan includes..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set monthly and yearly pricing with optional discounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_amount">Monthly Amount ({form.currency === "INR" ? "₹" : "$"})</Label>
                    <Input
                      id="monthly_amount"
                      type="number"
                      placeholder="499"
                      value={form.monthly_amount}
                      onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearly_amount">Yearly Amount ({form.currency === "INR" ? "₹" : "$"})</Label>
                    <Input
                      id="yearly_amount"
                      type="number"
                      placeholder="4990"
                      value={form.yearly_amount}
                      onChange={(e) => setForm({ ...form, yearly_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discounted_amount">Discounted Amount (Optional)</Label>
                  <Input
                    id="discounted_amount"
                    type="number"
                    placeholder="399"
                    value={form.discounted_amount}
                    onChange={(e) => setForm({ ...form, discounted_amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subscription Type</Label>
                  <Select
                    value={form.subscription_type}
                    onValueChange={(value: "monthly" | "annual" | "both") =>
                      setForm({ ...form, subscription_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Only</SelectItem>
                      <SelectItem value="annual">Annual Only</SelectItem>
                      <SelectItem value="both">Both Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {savings && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900">Annual Savings</p>
                    <p className="text-2xl font-bold text-green-700">
                      {form.currency === "INR" ? "₹" : "$"}
                      {savings.savings.toFixed(0)} ({savings.percentage}% off)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax & Billing */}
            <Card>
              <CardHeader>
                <CardTitle>Tax & Billing</CardTitle>
                <CardDescription>GST and tax configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gst_tax">GST Tax (%)</Label>
                  <Input
                    id="gst_tax"
                    type="number"
                    placeholder="18"
                    value={form.gst_tax}
                    onChange={(e) => setForm({ ...form, gst_tax: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_tax_included">Tax Included in Price</Label>
                  <Switch
                    id="is_tax_included"
                    checked={form.is_tax_included}
                    onCheckedChange={(checked) => setForm({ ...form, is_tax_included: checked })}
                  />
                </div>

                
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
                <CardDescription>List what's included in this plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddFeature()}
                  />
                  <Button onClick={handleAddFeature} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {form.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm">{feature}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveFeature(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {form.features.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No features added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                
                <Button onClick={() => handleSavePlan(true)} className="w-full gap-2 bg-[#0066ff] hover:bg-[#0052cc]">
                  <Eye className="w-4 h-4" />
                  Save & Publish
                </Button>
                <Button variant="ghost" onClick={() => router.back()} className="w-full">
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Visibility */}
            <Card>
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Plan Active</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-medium">{form.title || "Not set"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Monthly</p>
                  <p className="font-medium">
                    {form.currency === "INR" ? "₹" : "$"}
                    {form.monthly_amount || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Yearly</p>
                  <p className="font-medium">
                    {form.currency === "INR" ? "₹" : "$"}
                    {form.yearly_amount || "0"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Features</p>
                  <p className="font-medium">{form.features.length} added</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
