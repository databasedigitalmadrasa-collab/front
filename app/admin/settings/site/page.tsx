"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FooterLink {
    label: string
    url: string
    section: string // 'Platform', 'Legal', 'Support' etc
}

interface SiteSettings {
    footer_logo_text: string
    maintenance_mode: number
    footer_links: FooterLink[]
}

const DEFAULT_LINKS: FooterLink[] = [

    { label: "Terms of Service", url: "/legal/terms", section: "Legal" },
    { label: "Privacy Policy", url: "/legal/privacy", section: "Legal" },
    { label: "Refund Policy", url: "/legal/refunds", section: "Legal" },
    { label: "Shipping Policy", url: "/legal/shipping", section: "Legal" },
    { label: "Contact Us", url: "/contact", section: "Legal" }
]

export default function SiteSettingsPage() {
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState<SiteSettings>({
        footer_logo_text: "Digital Madrasa",
        maintenance_mode: 0,
        footer_links: DEFAULT_LINKS
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const res = await apiClient.get<any>("/admin-settings/current")
            if (res.success && res.data) {
                setSettings({
                    footer_logo_text: res.data.footer_logo_text || "Digital Madrasa",
                    maintenance_mode: res.data.maintenance_mode || 0,
                    footer_links: Array.isArray(res.data.footer_links) && res.data.footer_links.length > 0
                        ? res.data.footer_links
                        : DEFAULT_LINKS
                })
            }
        } catch (error) {
            console.error("Error fetching settings:", error)
            toast.error("Failed to load settings")
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        try {
            setLoading(true)
            const res = await apiClient.put("/admin-settings/section/site", settings)
            if (res.success) {
                toast.success("Site settings updated successfully")
            } else {
                toast.error(res.message || "Failed to update settings")
            }
        } catch (error) {
            console.error("Error saving settings:", error)
            toast.error("An error occurred while saving")
        } finally {
            setLoading(false)
        }
    }

    const addLink = () => {
        setSettings(prev => ({
            ...prev,
            footer_links: [...prev.footer_links, { label: "", url: "", section: "Platform" }]
        }))
    }

    const updateLink = (index: number, field: keyof FooterLink, value: string) => {
        const newLinks = [...settings.footer_links]
        newLinks[index] = { ...newLinks[index], [field]: value }
        setSettings(prev => ({ ...prev, footer_links: newLinks }))
    }

    const removeLink = (index: number) => {
        const newLinks = [...settings.footer_links]
        newLinks.splice(index, 1)
        setSettings(prev => ({ ...prev, footer_links: newLinks }))
    }

    const moveLink = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === settings.footer_links.length - 1) return

        const newLinks = [...settings.footer_links]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
        const temp = newLinks[swapIndex]
        newLinks[swapIndex] = newLinks[index]
        newLinks[index] = temp
        setSettings(prev => ({ ...prev, footer_links: newLinks }))
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
                <Button onClick={saveSettings} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid gap-6">

                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between border p-4 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base">Maintenance Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable to show a maintenance page to all non-admin users.
                                </p>
                            </div>
                            <Switch
                                checked={settings.maintenance_mode === 1}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked ? 1 : 0 }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Footer Logo Text</Label>
                            <Input
                                value={settings.footer_logo_text}
                                onChange={(e) => setSettings(prev => ({ ...prev, footer_logo_text: e.target.value }))}
                                placeholder="Digital Madrasa"
                            />
                            <p className="text-sm text-muted-foreground">Text displayed next to the logo in the footer.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Links */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Footer Links</CardTitle>
                        <Button size="sm" variant="outline" onClick={addLink}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Link
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {settings.footer_links.map((link, index) => (
                                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                    <div className="flex flex-col gap-1 pt-2">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLink(index, 'up')} disabled={index === 0}>
                                            <ArrowUp className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLink(index, 'down')} disabled={index === settings.footer_links.length - 1}>
                                            <ArrowDown className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Label</Label>
                                            <Input
                                                value={link.label}
                                                onChange={(e) => updateLink(index, 'label', e.target.value)}
                                                placeholder="Link Name"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">URL</Label>
                                            <Input
                                                value={link.url}
                                                onChange={(e) => updateLink(index, 'url', e.target.value)}
                                                placeholder="/example"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Section</Label>
                                            <Select
                                                value={link.section}
                                                onValueChange={(val) => updateLink(index, 'section', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Section" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Platform">Platform</SelectItem>
                                                    <SelectItem value="Legal">Legal</SelectItem>
                                                    <SelectItem value="Resources">Resources</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeLink(index)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            {settings.footer_links.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No footer links configured.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
