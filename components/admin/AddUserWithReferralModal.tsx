"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2, ChevronRight, ChevronLeft, Check, User, Users, CreditCard, Banknote, UserPlus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AddUserWithReferralModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialAffiliate?: Affiliate | null
}

interface Affiliate {
  id: number
  user_id: number
  referral_code: string
  full_name: string
  email: string
  profile_pic_url?: string
}

interface Plan {
  id: number
  title: string
  monthly_amount: number
  yearly_amount: number
  discounted_amount: number
  currency: string
  subscription_type: string
}

export function AddUserWithReferralModal({ isOpen, onClose, onSuccess, initialAffiliate }: AddUserWithReferralModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [affSearch, setAffSearch] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingAffiliates, setLoadingAffiliates] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    user: {
      full_name: "",
      email: "",
      contact: "",
      password: "",
      status: "active"
    },
    referral: {
      affiliate_id: "",
      referral_code: ""
    },
    package: {
      plan_id: "",
      subscription_type: "annual",
      amount_paid: 0
    },
    payment: {
      provider: "Manual",
      payment_status: "Paid",
      transaction_id: "",
      notes: ""
    }
  })

  useEffect(() => {
    if (isOpen) {
      fetchPlans()
      fetchAffiliates()
      if (initialAffiliate) {
        setFormData(prev => ({
          ...prev,
          referral: {
            affiliate_id: initialAffiliate.id.toString(),
            referral_code: initialAffiliate.referral_code
          }
        }))
      }
    } else {
      resetForm()
    }
  }, [isOpen, initialAffiliate])

  const resetForm = () => {
    setStep(1)
    setFormData({
      user: { full_name: "", email: "", contact: "", password: "", status: "active" },
      referral: { affiliate_id: "", referral_code: "" },
      package: { plan_id: "", subscription_type: "annual", amount_paid: 0 },
      payment: { provider: "Manual", payment_status: "Paid", transaction_id: "", notes: "" }
    })
  }

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get("/subscription-plans")
      if (res.data.success) {
        setPlans(res.data.items)
      }
    } catch (error) {
      console.error("Failed to fetch plans", error)
    }
  }

  const fetchAffiliates = async (query = "") => {
    setLoadingAffiliates(true)
    try {
      const res = await apiClient.get(`/admin/affiliates?q=${query}`)
      if (res.data.success) {
        setAffiliates(res.data.items)
      }
    } catch (error) {
      console.error("Failed to fetch affiliates", error)
    } finally {
      setLoadingAffiliates(false)
    }
  }

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === parseInt(planId))
    if (plan) {
      // Plan values are already in the correct unit (Rupees), no conversion needed
      const amount = plan.yearly_amount || 0
      setFormData(prev => ({
        ...prev,
        package: {
          ...prev.package,
          plan_id: planId,
          amount_paid: amount
        }
      }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Sending amount exactly as it is (no Rupee/Paisa conversion needed)
      const res = await apiClient.post("/admin/users/with-referral", formData)
      if (res.data.success) {
        toast({
          title: "Success",
          description: "User created successfully with referral and plan.",
        })
        onSuccess()
        onClose()
      } else {
        throw new Error(res.data.error || "Failed to create user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl font-heading font-bold text-[#150101]">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            Add User with Referral
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground ml-12">
            Complete the multi-step process to enroll a new user manually.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="relative flex items-center justify-between mt-6 px-8 py-4 bg-muted/30 rounded-2xl border border-muted">
          <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-0.5 bg-muted-foreground/20 z-0" />
          {[1, 2, 3, 4].map((i) => {
            const stepTitles = ["User Details", "Referrer", "Package", "Payment"];
            const isActive = step === i;
            const isCompleted = step > i;
            
            return (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${isActive ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20" : ""}
                  ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : ""}
                  ${!isActive && !isCompleted ? "bg-white border-muted-foreground/30 text-muted-foreground" : ""}
                `}>
                  {isCompleted ? <Check className="h-5 w-5" /> : i}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {stepTitles[i-1]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="py-6 min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#150101]">Step 1: User Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.user.full_name} 
                    onChange={(e) => setFormData({...formData, user: {...formData.user, full_name: e.target.value}})} 
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.user.email} 
                    onChange={(e) => setFormData({...formData, user: {...formData.user, email: e.target.value}})} 
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input 
                    value={formData.user.contact} 
                    onChange={(e) => setFormData({...formData, user: {...formData.user, contact: e.target.value}})} 
                    placeholder="+91 1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password"
                    value={formData.user.password} 
                    onChange={(e) => setFormData({...formData, user: {...formData.user, password: e.target.value}})} 
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#150101]">Step 2: Select Referrer</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9 h-11 bg-muted/20"
                  placeholder="Search affiliates by name, email or code..."
                  value={affSearch}
                  onChange={(e) => {
                    setAffSearch(e.target.value)
                    fetchAffiliates(e.target.value)
                  }}
                />
              </div>
              
              <div className="max-h-[320px] overflow-y-auto border rounded-xl bg-white divide-y shadow-inner">
                {loadingAffiliates ? (
                  <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                ) : affiliates.length > 0 ? (
                  affiliates.map((aff) => (
                    <div 
                      key={aff.id} 
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors ${formData.referral.affiliate_id === aff.id.toString() ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
                      onClick={() => setFormData({...formData, referral: { affiliate_id: aff.id.toString(), referral_code: aff.referral_code }})}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={aff.profile_pic_url} />
                          <AvatarFallback>{aff.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{aff.full_name}</p>
                          <p className="text-xs text-muted-foreground">{aff.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-mono">{aff.referral_code}</Badge>
                        {formData.referral.affiliate_id === aff.id.toString() && <Check className="h-4 w-4 text-primary ml-auto mt-1" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No affiliates found.</div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#150101]">Step 3: Package Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label>Select Plan</Label>
                  <Select onValueChange={handlePlanChange} value={formData.package.plan_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.title} - ₹{p.yearly_amount?.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount to be Paid (INR)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input 
                      className="pl-8 h-11"
                      type="number"
                      value={formData.package.amount_paid} 
                      onChange={(e) => setFormData({...formData, package: {...formData.package, amount_paid: parseFloat(e.target.value)}})} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="p-1.5 rounded-md bg-orange-50 text-orange-600">
                  <Banknote className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#150101]">Step 4: Payment Log</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Provider</Label>
                  <Select value={formData.payment.provider} onValueChange={(v) => setFormData({...formData, payment: {...formData.payment, provider: v}})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual Entry</SelectItem>
                      <SelectItem value="Razorpay">Razorpay</SelectItem>
                      <SelectItem value="BankTransfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={formData.payment.payment_status} onValueChange={(v) => setFormData({...formData, payment: {...formData.payment, payment_status: v}})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Transaction ID / Order ID</Label>
                  <Input 
                    value={formData.payment.transaction_id} 
                    onChange={(e) => setFormData({...formData, payment: {...formData.payment, transaction_id: e.target.value}})} 
                    placeholder="e.g. pay_N1x..."
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes (Internal)</Label>
                  <Input 
                    value={formData.payment.notes} 
                    onChange={(e) => setFormData({...formData, payment: {...formData.payment, notes: e.target.value}})} 
                    placeholder="Any additional info..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between items-center gap-4 pt-6 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={loading} className="mr-auto">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            {step < 4 ? (
              <Button onClick={handleNext}>Next <ChevronRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm & Create User
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
