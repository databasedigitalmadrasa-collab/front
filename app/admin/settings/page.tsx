"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  RotateCcw,
  Rocket,
  DollarSign,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { getAdminToken } from "@/lib/auth"
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PlatformSettings {
  id?: number
  commission_percentage: number // Now stores flat amount in paise
  minimum_payment_threshold: number // Now stores amount in paise
  phonepe_client_id: string
  phonepe_client_secret: string
  privacy_policy_page_content: string
  terms_condition_page_content: string
  refund_returns_page_content: string
  shipping_delivery_page_content: string
  created_at?: string
  updated_at?: string
}

const defaultSettings: PlatformSettings = {
  commission_percentage: 0,
  minimum_payment_threshold: 0,
  phonepe_client_id: "",
  phonepe_client_secret: "",
  privacy_policy_page_content: "",
  terms_condition_page_content: "",
  refund_returns_page_content: "",
  shipping_delivery_page_content: "",
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(defaultSettings)
  const [tabChanges, setTabChanges] = useState({
    payout: false,
    payment: false,
    policies: false,
  })
  const [showSecret, setShowSecret] = useState(false)
  const [activeTab, setActiveTab] = useState("payout")
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [savingTab, setSavingTab] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const token = getAdminToken() || undefined
      const response = await apiClient.get<any>("/admin-settings/current", token)

      if (response.success && response.data) {
        const settingsData = response.data.data || response.data
        const fetchedSettings = {
          ...defaultSettings,
          ...settingsData,
        }
        setSettings(fetchedSettings)
        setOriginalSettings(fetchedSettings)
        toast({
          title: "Settings Loaded",
          description: "Platform settings loaded successfully.",
        })
      } else {
        toast({
          title: "Error Loading Settings",
          description: response.message || "Failed to load settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const payoutChanged =
      settings.commission_percentage !== originalSettings.commission_percentage ||
      settings.minimum_payment_threshold !== originalSettings.minimum_payment_threshold

    const paymentChanged =
      settings.phonepe_client_id !== originalSettings.phonepe_client_id ||
      settings.phonepe_client_secret !== originalSettings.phonepe_client_secret

    const policiesChanged =
      settings.privacy_policy_page_content !== originalSettings.privacy_policy_page_content ||
      settings.terms_condition_page_content !== originalSettings.terms_condition_page_content ||
      settings.refund_returns_page_content !== originalSettings.refund_returns_page_content ||
      settings.shipping_delivery_page_content !== originalSettings.shipping_delivery_page_content

    setTabChanges({
      payout: payoutChanged,
      payment: paymentChanged,
      policies: policiesChanged,
    })
  }, [settings, originalSettings])

  const handleSaveTab = async (tab: string) => {
    if (tab === "payout") {
      if (settings.commission_percentage < 0) {
        toast({
          title: "Validation Error",
          description: "Commission must be positive.",
          variant: "destructive",
        })
        return
      }

      if (settings.minimum_payment_threshold < 0) {
        toast({
          title: "Validation Error",
          description: "Minimum payment threshold must be positive.",
          variant: "destructive",
        })
        return
      }
    }

    setSavingTab(tab)

    try {
      const token = getAdminToken() || undefined

      let dataToSave: Partial<PlatformSettings> = {}
      let sectionName = ""

      if (tab === "payout") {
        sectionName = "affiliate"
        dataToSave = {
          commission_percentage: settings.commission_percentage,
          minimum_payment_threshold: settings.minimum_payment_threshold,
        }
      } else if (tab === "payment") {
        sectionName = "payment"
        dataToSave = {
          phonepe_client_id: settings.phonepe_client_id,
          phonepe_client_secret: settings.phonepe_client_secret,
          minimum_payment_threshold: settings.minimum_payment_threshold,
          commission_percentage: settings.commission_percentage,
        }
      } else if (tab === "policies") {
        sectionName = "pages"
        dataToSave = {
          privacy_policy_page_content: settings.privacy_policy_page_content,
          terms_condition_page_content: settings.terms_condition_page_content,
          refund_returns_page_content: settings.refund_returns_page_content,
          shipping_delivery_page_content: settings.shipping_delivery_page_content,
        }
      }

      const response = await apiClient.put<any>(`/admin-settings/section/${sectionName}`, dataToSave, token)

      if (response.success) {
        const updatedData = response.data?.data || response.data
        const updatedSettings = { ...originalSettings, ...updatedData }
        setOriginalSettings(updatedSettings)
        setSettings(updatedSettings)

        toast({
          title: "Settings Saved",
          description: `${tab.charAt(0).toUpperCase() + tab.slice(1)} settings have been saved successfully.`,
        })
      } else {
        toast({
          title: "Error Saving Settings",
          description: response.message || "Failed to save settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSavingTab(null)
    }
  }

  const handleReset = () => {
    setShowResetDialog(false)
    setSettings(defaultSettings)
    toast({
      title: "Reset Complete",
      description: "All settings have been reset to defaults. Don't forget to save.",
    })
  }

  const calculateCommissionPreview = () => {
    const saleAmount = 1000000 // Example: ₹10,000 sale (in paise)
    const commission = settings.commission_percentage // Commission is already in paise
    return { saleAmount: saleAmount / 100, commission: commission / 100 }
  }

  const preview = calculateCommissionPreview()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#0066ff]" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8 text-white shadow-xl sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold">Platform Settings</h1>
            <p className="text-sm text-white/80 mt-1">Configure payouts, payment gateways, policies, and more</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 flex-1 lg:flex-none"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto">
          <TabsTrigger value="payout" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Payout & Affiliate</span>
            <span className="sm:hidden">Payout</span>
            {tabChanges.payout && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Payment Gateway</span>
            <span className="sm:hidden">Payment</span>
            {tabChanges.payment && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Platform Policies</span>
            <span className="sm:hidden">Policies</span>
            {tabChanges.policies && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payout" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Payout & Affiliate Settings</h2>
              <Button
                onClick={() => handleSaveTab("payout")}
                disabled={!tabChanges.payout || savingTab === "payout"}
                className="bg-[#0066ff] hover:bg-[#0052cc]"
              >
                {savingTab === "payout" ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Save Payout Settings
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="commission">Flat Commission (₹)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={(settings.commission_percentage / 100).toFixed(2)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      commission_percentage: Math.round(Number.parseFloat(e.target.value) * 100) || 0,
                    })
                  }
                  placeholder="100.00"
                />
                <p className="text-sm text-gray-500">
                  The flat amount (in rupees) that affiliates earn on each successful sale. Currently: ₹
                  {(settings.commission_percentage / 100).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Minimum Payment Threshold (₹)</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={(settings.minimum_payment_threshold / 100).toFixed(2)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minimum_payment_threshold: Math.round(Number.parseFloat(e.target.value) * 100) || 0,
                    })
                  }
                  placeholder="1000.00"
                />
                <p className="text-sm text-gray-500">
                  Minimum amount an affiliate must earn before they can request a payout. Currently: ₹
                  {(settings.minimum_payment_threshold / 100).toFixed(2)}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-blue-900 mb-2">Commission Preview</h3>
                <p className="text-sm text-blue-700">
                  Affiliate earns flat ₹{preview.commission.toFixed(2)} per sale (on a ₹{preview.saleAmount.toFixed(2)}{" "}
                  product).
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Payment Gateway (PhonePe)</h2>
              <Button
                onClick={() => handleSaveTab("payment")}
                disabled={!tabChanges.payment || savingTab === "payment"}
                className="bg-[#0066ff] hover:bg-[#0052cc]"
              >
                {savingTab === "payment" ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Save Payment Settings
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clientId">PhonePe Client ID</Label>
                <Input
                  id="clientId"
                  type="text"
                  value={settings.phonepe_client_id}
                  onChange={(e) => setSettings({ ...settings, phonepe_client_id: e.target.value })}
                  placeholder="Enter your PhonePe Client ID"
                />
                <p className="text-sm text-gray-500">Your PhonePe merchant client ID for payment processing.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">PhonePe Client Secret</Label>
                <div className="relative">
                  <Input
                    id="clientSecret"
                    type={showSecret ? "text" : "password"}
                    value={settings.phonepe_client_secret}
                    onChange={(e) => setSettings({ ...settings, phonepe_client_secret: e.target.value })}
                    placeholder="Enter your PhonePe Client Secret"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Your PhonePe client secret. This is stored securely and encrypted.
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-orange-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Security Notice
                </h3>
                <p className="text-sm text-orange-700">
                  Client secrets are encrypted on the server. Any changes to credentials are logged in the activity
                  history for audit purposes.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => handleSaveTab("policies")}
              disabled={!tabChanges.policies || savingTab === "policies"}
              className="bg-[#0066ff] hover:bg-[#0052cc]"
            >
              {savingTab === "policies" ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Save Policy Settings
                </>
              )}
            </Button>
          </div>

          {[
            {
              key: "privacy_policy_page_content",
              label: "Privacy Policy",
              placeholder: "Enter your privacy policy...",
            },
            {
              key: "terms_condition_page_content",
              label: "Terms & Conditions",
              placeholder: "Enter your terms and conditions...",
            },
            {
              key: "refund_returns_page_content",
              label: "Refund & Returns Policy",
              placeholder: "Enter your refund policy...",
            },
            {
              key: "shipping_delivery_page_content",
              label: "Shipping & Delivery Policy",
              placeholder: "Enter shipping policy...",
            },
          ].map((policy) => (
            <Card key={policy.key} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-bold">{policy.label}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {settings[policy.key as keyof PlatformSettings]?.toString().split(" ").length || 0} words
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div data-color-mode="light">
                  <MDEditor
                    value={settings[policy.key as keyof PlatformSettings] as string}
                    onChange={(val) => setSettings({ ...settings, [policy.key]: val || "" })}
                    height={400}
                  />
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to Default Settings?</DialogTitle>
            <DialogDescription>
              This will reset all platform settings to their default values. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset All Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
