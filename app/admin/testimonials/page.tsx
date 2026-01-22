"use client"

import { useState, useEffect, useRef } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, Upload, Star, MessageSquare, Quote, Eye } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface Testimonial {
    id: number
    name: string
    title: string | null
    testimony: string
    rating: number
    profile_pic_url: string | null
    is_featured: number
    created_at: string
}

export default function TestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        title: "",
        testimony: "",
        rating: 5,
        profile_pic_url: "",
        is_featured: false,
    })

    // File upload state
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        fetchTestimonials()
    }, [])

    useEffect(() => {
        if (editingTestimonial) {
            setFormData({
                name: editingTestimonial.name,
                title: editingTestimonial.title || "",
                testimony: editingTestimonial.testimony,
                rating: editingTestimonial.rating,
                profile_pic_url: editingTestimonial.profile_pic_url || "",
                is_featured: editingTestimonial.is_featured === 1,
            })
        } else {
            setFormData({
                name: "",
                title: "",
                testimony: "",
                rating: 5,
                profile_pic_url: "",
                is_featured: false,
            })
        }
    }, [editingTestimonial])

    const fetchTestimonials = async () => {
        setIsLoading(true)
        try {
            const response = await apiClient.get<{ items: Testimonial[] }>("/testimonials")
            if (response.success && response.data) {
                setTestimonials(response.data.items)
            } else {
                toast.error("Failed to load testimonials")
            }
        } catch (error) {
            toast.error("Error loading testimonials")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = () => {
        setEditingTestimonial(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (testimonial: Testimonial) => {
        setEditingTestimonial(testimonial)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this testimonial?")) return

        try {
            const response = await apiClient.delete(`/testimonials/${id}`)
            if (response.success) {
                toast.success("Testimonial deleted")
                fetchTestimonials()
            } else {
                toast.error("Failed to delete testimonial")
            }
        } catch (error) {
            toast.error("Error deleting testimonial")
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const filename = `student-feedback/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
            // changed from 'media' to 'static'
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://srv.digitalmadrasa.co.in'}/api/v1/static/objects?path=${filename}`, {
                method: 'POST',
                headers: {
                    'Content-Type': file.type,
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: file
            })

            const data = await response.json()

            if (data.success) {
                // Use CDN URL for static bucket
                const publicUrl = `https://cdn.digitalmadrasa.co.in/${data.key || filename}`
                setFormData(prev => ({ ...prev, profile_pic_url: publicUrl }))
                toast.success("Image uploaded successfully")
            } else {
                toast.error("Upload failed: " + (data.error || "Unknown error"))
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Error uploading image")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const payload = {
                ...formData,
                is_featured: formData.is_featured ? 1 : 0
            }

            if (editingTestimonial) {
                await apiClient.put(`/testimonials/${editingTestimonial.id}`, payload)
                toast.success("Testimonial updated")
            } else {
                await apiClient.post("/testimonials", payload)
                toast.success("Testimonial created")
            }
            setIsDialogOpen(false)
            fetchTestimonials()
        } catch (error) {
            toast.error("Failed to save testimonial")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredTestimonials = testimonials.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.testimony.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Calculate stats (unchanged)
    const totalTestimonials = testimonials.length;
    const featuredCount = testimonials.filter(t => t.is_featured === 1).length;
    const averageRating = totalTestimonials > 0
        ? (testimonials.reduce((acc, curr) => acc + curr.rating, 0) / totalTestimonials).toFixed(1)
        : "0.0";

    return (
        <div className="p-6 sm:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#150101]">Student Testimonials</h1>
                    <p className="text-[#4b4b4b] mt-1">Manage student feedback and reviews.</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-gradient-to-r from-[#0066ff] to-[#00aeef] hover:from-[#0052cc] hover:to-[#0099dd] text-white shadow-lg shadow-blue-500/20 rounded-full px-8 h-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-medium"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Testimonial
                </Button>
            </div>

            {/* Stats Cards (unchanged) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <MessageSquare className="w-5 h-5" />
                            <span className="font-medium">Total Reviews</span>
                        </div>
                        <div className="text-4xl font-heading font-bold">{totalTestimonials}</div>
                        <p className="text-sm mt-2 opacity-80">All time feedback</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Star className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Star className="w-5 h-5" />
                            <span className="font-medium">Average Rating</span>
                        </div>
                        <div className="text-4xl font-heading font-bold">{averageRating}</div>
                        <p className="text-sm mt-2 opacity-80">Based on reviews</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Quote className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Quote className="w-5 h-5" />
                            <span className="font-medium">Featured Reviews</span>
                        </div>
                        <div className="text-4xl font-heading font-bold">{featuredCount}</div>
                        <p className="text-sm mt-2 opacity-80">On landing page</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-white/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by name or content..."
                            className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                <TableHead className="w-[300px] pl-8 h-14 text-xs font-semibold uppercase tracking-wider text-gray-500">Student</TableHead>
                                <TableHead className="h-14 text-xs font-semibold uppercase tracking-wider text-gray-500">Testimony</TableHead>
                                <TableHead className="h-14 w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-500">Rating</TableHead>
                                <TableHead className="h-14 w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Featured</TableHead>
                                <TableHead className="h-14 w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
                                <TableHead className="text-right h-14 pr-8 w-[100px] text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex justify-center items-center gap-2 text-gray-500">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                            <span className="font-medium text-sm">Loading testimonials...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTestimonials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                <MessageSquare className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="font-medium">No testimonials found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTestimonials.map((item) => (
                                    <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50/50">
                                        <TableCell className="pl-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-2 ring-gray-50">
                                                    <AvatarImage src={item.profile_pic_url || ""} />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold text-sm">
                                                        {item.name.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="font-semibold text-[#150101] text-sm">{item.name}</div>
                                                {item.title && <div className="text-xs text-gray-400">{item.title}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="relative pl-3 border-l-2 border-gray-200">
                                                <p className="truncate text-gray-600 text-sm font-medium italic" title={item.testimony}>
                                                    "{item.testimony}"
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-0.5 bg-amber-50 w-fit px-2 py-1 rounded-md border border-amber-100/50">
                                                <span className="font-bold text-amber-700 mr-1.5 text-sm">{item.rating.toFixed(1)}</span>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "w-3.5 h-3.5",
                                                            i < item.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.is_featured === 1 ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-sm px-2.5 py-0.5">
                                                    Featured
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-300 text-xs font-medium px-2">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm font-medium">
                                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-full transition-all">
                                                        <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => handleEdit(item)} className="text-sm font-medium">
                                                        <Pencil className="w-4 h-4 mr-2 text-gray-500" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 text-sm font-medium" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="w-4 h-4 mr-2" />
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
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white border-gray-100 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl">
                    <DialogHeader className="p-6 pb-2 bg-gradient-to-b from-gray-50 to-white">
                        <DialogTitle className="text-xl font-bold text-[#150101]">
                            {editingTestimonial ? "Edit Testimonial" : "New Testimonial"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            {editingTestimonial ? "Update the details below." : "Add a student's feedback to the platform."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="p-6 pt-2 space-y-5">
                            {/* Profile Pic Upload - Centered */}
                            <div className="flex flex-col items-center justify-center gap-3 py-2">
                                <div
                                    className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-gray-100 group cursor-pointer hover:ring-blue-200 transition-all bg-gray-50"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {formData.profile_pic_url ? (
                                        <img src={formData.profile_pic_url} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                            <Upload className="w-8 h-8 mb-1" />
                                            <span className="text-[10px] font-semibold uppercase tracking-wide">Upload</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Pencil className="w-6 h-6 text-white" />
                                    </div>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <Input
                                    id="profile_pic"
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">Student Photo</p>
                                    <p className="text-xs text-gray-400">Click to upload (JPG, PNG)</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Student Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Sarah Johnson"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Title / Designation</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Graphic Designer"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rating" className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Rating</Label>
                                        <Select
                                            value={String(formData.rating)}
                                            onValueChange={(val) => setFormData({ ...formData, rating: Number(val) })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border-gray-200">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[5, 4, 3, 2, 1].map((r) => (
                                                    <SelectItem key={r} value={String(r)}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{r} Stars</span>
                                                            <div className="flex">
                                                                {Array.from({ length: r }).map((_, i) => (
                                                                    <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 flex flex-col justify-end">
                                        <div className="h-11 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between px-3">
                                            <Label htmlFor="featured" className="text-sm font-medium text-gray-700 cursor-pointer">Featured?</Label>
                                            <Switch
                                                id="featured"
                                                checked={formData.is_featured}
                                                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="testimony" className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Testimony</Label>
                                    <Textarea
                                        id="testimony"
                                        placeholder="Write the testimonial here..."
                                        value={formData.testimony}
                                        onChange={(e) => setFormData({ ...formData, testimony: e.target.value })}
                                        className="min-h-[120px] rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100 gap-3">
                            <Button type="button" variant="outline" className="rounded-xl border-gray-200 hover:bg-white" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#150101] hover:bg-[#2a0202] text-white rounded-xl px-6 min-w-[140px] shadow-lg shadow-black/10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    editingTestimonial ? "Save Changes" : "Create Testimonial"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
