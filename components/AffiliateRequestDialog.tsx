"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client" // Adjust path if needed
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Globe, Share2, Target, MessageSquare } from "lucide-react"

interface AffiliateRequestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    userId: number
}

export function AffiliateRequestDialog({ open, onOpenChange, onSuccess, userId }: AffiliateRequestDialogProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        request_reason: "",
        promotion_strategy: "",
        social_media_links: "",
        website_url: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await apiClient.post("/affiliate-requests", {
                user_id: userId,
                ...formData
            })

            if (res.success) {
                toast({
                    title: "Request Submitted",
                    description: "Your affiliate request has been submitted successfully awaiting approval.",
                    variant: "default"
                })
                onSuccess()
                onOpenChange(false)
            } else {
                toast({
                    title: "Submission Failed",
                    description: res.message || "Something went wrong.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-br from-[#0066ff] to-blue-700 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                            <Send className="w-6 h-6" /> Become an Affiliate
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 text-base">
                            Partner with Digital Madrasa and earn while sharing high-quality Islamic education.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="request_reason" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <MessageSquare className="w-4 h-4 text-[#0066ff]" /> Why do you want to join?
                            </Label>
                            <Textarea
                                id="request_reason"
                                name="request_reason"
                                placeholder="I love Digital Madrasa and want to share it with my audience..."
                                value={formData.request_reason}
                                onChange={handleChange}
                                className="min-h-[100px] bg-gray-50 border-gray-200 focus:border-[#0066ff] focus:ring-[#0066ff] transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="promotion_strategy" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Target className="w-4 h-4 text-[#0066ff]" /> Promotion Strategy
                            </Label>
                            <Textarea
                                id="promotion_strategy"
                                name="promotion_strategy"
                                placeholder="I plan to share on my blog, YouTube, or social media..."
                                value={formData.promotion_strategy}
                                onChange={handleChange}
                                className="min-h-[100px] bg-gray-50 border-gray-200 focus:border-[#0066ff] focus:ring-[#0066ff] transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label htmlFor="social_media_links" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Share2 className="w-4 h-4 text-[#0066ff]" /> Social Links <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="social_media_links"
                                    name="social_media_links"
                                    placeholder="Instagram, Twitter, etc."
                                    value={formData.social_media_links}
                                    onChange={handleChange}
                                    required
                                    className="bg-gray-50 border-gray-200 focus:border-[#0066ff] focus:ring-[#0066ff] transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="website_url" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Globe className="w-4 h-4 text-[#0066ff]" /> Website (Optional)
                                </Label>
                                <Input
                                    id="website_url"
                                    name="website_url"
                                    placeholder="https://yourwebsite.com"
                                    value={formData.website_url}
                                    onChange={handleChange}
                                    className="bg-gray-50 border-gray-200 focus:border-[#0066ff] focus:ring-[#0066ff] transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-gray-100 flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#0066ff] hover:bg-blue-700 text-white px-8 h-12 rounded-xl transition-all shadow-lg shadow-blue-200"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                            ) : (
                                "Submit Application"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
