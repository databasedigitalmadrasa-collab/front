"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client" // Adjust path if needed
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Become an Affiliate</DialogTitle>
                    <DialogDescription>
                        Tell us why you want to join our affiliate program and how you plan to promote our courses.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="request_reason">Why do you want to join? (Optional)</Label>
                        <Textarea
                            id="request_reason"
                            name="request_reason"
                            placeholder="I love Digital Madrasa and want to share it..."
                            value={formData.request_reason}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promotion_strategy">Promotion Strategy (Optional)</Label>
                        <Textarea
                            id="promotion_strategy"
                            name="promotion_strategy"
                            placeholder="I run a blog/YouTube channel about Islamic studies..."
                            value={formData.promotion_strategy}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="social_media_links">Social Media Links <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="social_media_links"
                            name="social_media_links"
                            placeholder="Instagram, Twitter, LinkedIn profile links..."
                            value={formData.social_media_links}
                            onChange={handleChange}
                            className="min-h-[60px]"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website_url">Website URL (Optional)</Label>
                        <Input
                            id="website_url"
                            name="website_url"
                            placeholder="https://yourwebsite.com"
                            value={formData.website_url}
                            onChange={handleChange}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
