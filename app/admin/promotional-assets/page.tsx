"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "sonner"
import { Plus, Edit2, Trash2, CheckCircle, XCircle, ImageIcon, FileText, Video, ExternalLink, Loader2, UploadCloud } from "lucide-react"
import Image from "next/image"

interface PromotionalAsset {
    id: number;
    title: string;
    type: 'banner' | 'text' | 'video';
    content?: string;
    url?: string;
    thumbnail_url?: string;
    is_active: number;
}

export default function PromotionalAssetsAdminPage() {
    const { admin } = useAuth()
    const [assets, setAssets] = useState<PromotionalAsset[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentAsset, setCurrentAsset] = useState<Partial<PromotionalAsset>>({
        type: 'banner',
        is_active: 1
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingThumb, setIsUploadingThumb] = useState(false)

    // Filters
    const [activeTab, setActiveTab] = useState("banner")

    const uploadFile = async (file: File, type: 'url' | 'thumbnail_url') => {
        try {
            if (type === 'thumbnail_url') setIsUploadingThumb(true);
            else setIsUploading(true);

            const contentType = file.type || "application/octet-stream";
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://srv.digitalmadrasa.co.in";
            // Create a unique path
            const timestamp = Date.now();
            const cleanName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
            const path = `promotional-assets/${timestamp}-${cleanName}`;

            const uploadUrl = `${baseUrl}/api/v1/static/objects?path=${encodeURIComponent(path)}&contentType=${encodeURIComponent(contentType)}`;

            const response = await fetch(uploadUrl, {
                method: "POST",
                body: file,
            });

            if (!response.ok) throw new Error("Upload failed");

            const publicUrl = `https://cdn.digitalmadrasa.co.in/${path}`;

            setCurrentAsset(prev => ({ ...prev, [type]: publicUrl }));
            toast.success("File uploaded successfully");
        } catch (err) {
            console.error(err);
            toast.error("File upload failed");
        } finally {
            if (type === 'thumbnail_url') setIsUploadingThumb(false);
            else setIsUploading(false);
        }
    }

    const fetchAssets = async () => {
        setIsLoading(true)
        try {
            const res = await apiClient.get<any>('/promotional-assets')
            if (res.success && res.data) {
                // Handle variance in API response structure (items wrapper or direct array)
                const items = res.data.items || res.data || []
                setAssets(items)
            }
        } catch (err) {
            console.error(err)
            toast.error("Failed to load assets")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAssets()
    }, [])

    const handleSave = async () => {
        if (!currentAsset.title || !currentAsset.type) {
            toast.error("Title and Type are required")
            return
        }

        setIsSaving(true)
        try {
            if (isEditing && currentAsset.id) {
                await apiClient.put(`/promotional-assets/${currentAsset.id}`, currentAsset)
                toast.success("Asset updated")
            } else {
                await apiClient.post('/promotional-assets', currentAsset)
                toast.success("Asset created")
            }
            setIsDialogOpen(false)
            fetchAssets()
            resetForm()
        } catch (err) {
            console.error(err)
            toast.error("Failed to save asset")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this asset?")) return

        try {
            await apiClient.delete(`/promotional-assets/${id}`)
            toast.success("Asset deleted")
            setAssets(prev => prev.filter(a => a.id !== id))
        } catch (err) {
            console.error(err)
            toast.error("Failed to delete asset")
        }
    }

    const openCreateDialog = () => {
        // default type based on current tab if possible
        const defaultType = ['banner', 'text', 'video'].includes(activeTab) ? activeTab as any : 'banner';
        resetForm()
        setCurrentAsset({ type: defaultType, is_active: 1 })
        setIsEditing(false)
        setIsDialogOpen(true)
    }

    const openEditDialog = (asset: PromotionalAsset) => {
        setCurrentAsset({ ...asset })
        setIsEditing(true)
        setIsDialogOpen(true)
    }

    const resetForm = () => {
        setCurrentAsset({ type: 'banner', is_active: 1 })
        setIsEditing(false)
    }

    const filteredAssets = assets.filter(a => a.type === activeTab)

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promotional Assets</h1>
                    <p className="text-gray-500">Manage marketing materials for affiliates</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-[#0066ff] hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Asset
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-100 p-1">
                    <TabsTrigger value="banner" className="gap-2"><ImageIcon className="w-4 h-4" /> Banners</TabsTrigger>
                    <TabsTrigger value="text" className="gap-2"><FileText className="w-4 h-4" /> Text Templates</TabsTrigger>
                    <TabsTrigger value="video" className="gap-2"><Video className="w-4 h-4" /> Videos</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500">Loading assets...</div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-gray-500 mb-4">No assets found in this category.</p>
                            <Button variant="outline" onClick={openCreateDialog}>Create First Asset</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAssets.map(asset => (
                                <Card key={asset.id} className="overflow-hidden group hover:border-[#0066ff]/50 transition-colors">
                                    <div className="relative aspect-video bg-gray-100 border-b border-gray-100">
                                        {/* Preview Area */}
                                        {asset.type === 'banner' && asset.url && (
                                            <Image src={asset.url} alt={asset.title} fill className="object-cover" />
                                        )}
                                        {asset.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                                {asset.thumbnail_url ? (
                                                    <Image src={asset.thumbnail_url} alt={asset.title} fill className="object-cover opacity-50" />
                                                ) : null}
                                                <Video className="w-12 h-12 text-white/50" />
                                            </div>
                                        )}
                                        {asset.type === 'text' && (
                                            <div className="absolute inset-0 p-4 overflow-y-auto text-xs text-gray-600 bg-white">
                                                {asset.content}
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2">
                                            <Badge variant={asset.is_active ? "default" : "secondary"} className={asset.is_active ? "bg-green-500 hover:bg-green-600" : ""}>
                                                {asset.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="mb-4">
                                            <h3 className="font-semibold text-gray-900 truncate" title={asset.title}>{asset.title}</h3>
                                            <p className="text-xs text-gray-500 capitalize">{asset.type} Asset</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(asset)}>
                                                <Edit2 className="w-3 h-3 mr-2" /> Edit
                                            </Button>
                                            <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleDelete(asset.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Asset" : "Create New Asset"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g. Summer Sale Banner"
                                value={currentAsset.title || ''}
                                onChange={e => setCurrentAsset(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={currentAsset.type}
                                onValueChange={(val: any) => setCurrentAsset(prev => ({ ...prev, type: val }))}
                                disabled={isEditing} // Optional: prevent changing type on edit to verify logic simplicity
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="banner">Banner Image</SelectItem>
                                    <SelectItem value="text">Text Template</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fields based on type */}
                        {currentAsset.type === 'text' ? (
                            <div className="space-y-2">
                                <Label>Content</Label>
                                <Textarea
                                    placeholder="Enter the template text here..."
                                    className="min-h-[150px]"
                                    value={currentAsset.content || ''}
                                    onChange={e => setCurrentAsset(prev => ({ ...prev, content: e.target.value }))}
                                />
                            </div>
                        ) : (
                            // Banner or Video both need URL
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{currentAsset.type === 'banner' ? 'Image File' : 'Video File'}</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                placeholder={currentAsset.type === 'banner' ? "https://..." : "https://..."}
                                                value={currentAsset.url || ''}
                                                onChange={e => setCurrentAsset(prev => ({ ...prev, url: e.target.value }))}
                                                className="pr-10"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="relative shrink-0"
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <UploadCloud className="w-4 h-4" />
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept={currentAsset.type === 'banner' ? "image/*" : "video/*"}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) uploadFile(file, 'url');
                                                }}
                                                disabled={isUploading}
                                            />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">Upload a file or paste a direct link.</p>
                                </div>
                            </div>
                        )}

                        {currentAsset.type === 'video' && (
                            <div className="space-y-2">
                                <Label>Thumbnail Image</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://..."
                                        value={currentAsset.thumbnail_url || ''}
                                        onChange={e => setCurrentAsset(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="relative shrink-0"
                                        disabled={isUploadingThumb}
                                    >
                                        {isUploadingThumb ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <UploadCloud className="w-4 h-4" />
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) uploadFile(file, 'thumbnail_url');
                                            }}
                                            disabled={isUploadingThumb}
                                        />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                className="rounded border-gray-300"
                                checked={!!currentAsset.is_active}
                                onChange={e => setCurrentAsset(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                            />
                            <Label htmlFor="is_active">Active (Visible to affiliates)</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-[#0066ff]">
                            {isSaving ? "Saving..." : (isEditing ? "Update Asset" : "Create Asset")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
