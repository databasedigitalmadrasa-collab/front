"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Calendar,
  MoreHorizontal,
  Loader2,
  Upload,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"

interface Mentor {
  id: number
  name: string
  title: string
  bio: string
  profile_picture?: string
  created_at: string
  updated_at: string
}

const ITEMS_PER_PAGE = 10
const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

export default function MentorsAdminPage() {
  const { toast } = useToast()
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addForm, setAddForm] = useState<Partial<Mentor>>({
    name: "",
    title: "",
    bio: "",
    profile_picture: "",
  })
  const [editForm, setEditForm] = useState<Partial<Mentor>>({
    name: "",
    title: "",
    bio: "",
    profile_picture: "",
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    fetchMentors()
  }, [])

  const fetchMentors = async () => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      const response = await apiClient.get<{ success: boolean; items: Mentor[] }>("/mentors", token)

      if (response.success && response.data) {
        setMentors(response.data.items)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch mentors",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching mentors:", error)
      toast({
        title: "Error",
        description: "Failed to load mentors. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const totalPages = Math.ceil(filteredMentors.length / ITEMS_PER_PAGE)
  const paginatedMentors = filteredMentors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalMentors = mentors.length

  const handleAddMentor = async () => {
    if (!addForm.name || !addForm.title || !addForm.bio) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Title, Bio).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = getAuthToken()
      const response = await apiClient.post<{ success: boolean; mentor: Mentor }>(
        "/mentors",
        {
          name: addForm.name,
          title: addForm.title,
          bio: addForm.bio,
          profile_picture: addForm.profile_picture || "",
        },
        token,
      )

      if (response.success) {
        toast({
          title: "Mentor Added",
          description: "New mentor has been added successfully.",
        })
        setIsAddDialogOpen(false)
        setAddForm({
          name: "",
          title: "",
          bio: "",
          profile_picture: "",
        })
        fetchMentors()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add mentor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding mentor:", error)
      toast({
        title: "Error",
        description: "Failed to add mentor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMentor = async () => {
    if (!selectedMentor || !editForm.name || !editForm.title || !editForm.bio) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Title, Bio).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = getAuthToken()
      const response = await apiClient.put<{ success: boolean; mentor: Mentor }>(
        `/mentors/${selectedMentor.id}`,
        {
          name: editForm.name,
          title: editForm.title,
          bio: editForm.bio,
          profile_picture: editForm.profile_picture || "",
        },
        token,
      )

      if (response.success) {
        toast({
          title: "Mentor Updated",
          description: "Mentor has been updated successfully.",
        })
        setIsEditDialogOpen(false)
        setSelectedMentor(null)
        setEditForm({
          name: "",
          title: "",
          bio: "",
          profile_picture: "",
        })
        fetchMentors()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update mentor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating mentor:", error)
      toast({
        title: "Error",
        description: "Failed to update mentor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMentor = async () => {
    if (!selectedMentor) return

    setIsSubmitting(true)
    try {
      const token = getAuthToken()
      const response = await apiClient.delete<{ success: boolean }>(`/mentors/${selectedMentor.id}`, token)

      if (response.success) {
        toast({
          title: "Mentor Deleted",
          description: "Mentor has been deleted successfully.",
        })
        setIsDeleteDialogOpen(false)
        setSelectedMentor(null)
        fetchMentors()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete mentor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting mentor:", error)
      toast({
        title: "Error",
        description: "Failed to delete mentor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (mentor: Mentor) => {
    setSelectedMentor(mentor)
    setEditForm({
      name: mentor.name,
      title: mentor.title,
      bio: mentor.bio,
      profile_picture: mentor.profile_picture,
    })
    setIsEditDialogOpen(true)
  }

  const handleImageUpload = async (file: File, isEdit = false) => {
    setIsUploadingImage(true)
    setUploadProgress(0)

    try {
      const fileName = `mentor-${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const uploadPath = `mentor-res/${fileName}`
      const contentType = file.type || "image/jpeg"

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      }

      const uploadPromise = new Promise<boolean>((resolve) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true)
          } else {
            resolve(false)
          }
        }

        xhr.onerror = () => resolve(false)
        xhr.onabort = () => resolve(false)

        const uploadUrl = `${API_BASE_URL}/static/objects?path=${encodeURIComponent(uploadPath)}&contentType=${encodeURIComponent(contentType)}`
        xhr.open("POST", uploadUrl)
        xhr.send(file)
      })

      const success = await uploadPromise

      if (success) {
        const imageUrl = `https://cdn.digitalmadrasa.co.in/${uploadPath}`

        if (isEdit) {
          setEditForm({ ...editForm, profile_picture: imageUrl })
        } else {
          setAddForm({ ...addForm, profile_picture: imageUrl })
        }

        toast({
          title: "Success",
          description: "Profile picture uploaded successfully",
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 mb-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold">Mentors</h1>
            <p className="text-white/80 text-sm mt-1">Manage course instructors and teaching staff</p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Mentor
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-3xl font-bold">{totalMentors}</div>
            <div className="text-sm text-white/80">Total Mentors</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{filteredMentors.length}</div>
            <div className="text-sm text-white/80">Filtered Results</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name, title, or bio..."
            className="pl-10 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Mentors Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Mentor Details</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Bio</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066ff]" />
                    <p className="text-gray-500 mt-2">Loading mentors...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedMentors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No mentors found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMentors.map((mentor) => (
                  <TableRow key={mentor.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={mentor.profile_picture || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white">
                            {mentor.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{mentor.name}</p>
                          <p className="text-xs text-gray-500">{getTimeAgo(mentor.updated_at)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{mentor.title}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">{mentor.bio}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(mentor.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(mentor)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Mentor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMentor(mentor)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Mentor
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredMentors.length)} of {filteredMentors.length} mentors
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Mentor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Add New Mentor</DialogTitle>
            <DialogDescription>Fill in the details to add a new mentor to your platform</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Dr. Ahmed Hassan"
                value={addForm.name || ""}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Senior Full Stack Developer"
                value={addForm.title || ""}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">
                Bio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="bio"
                placeholder="Brief description about the mentor..."
                value={addForm.bio || ""}
                onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile_picture">Profile Picture</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="profile_picture"
                    placeholder="Image URL or upload below"
                    value={addForm.profile_picture || ""}
                    onChange={(e) => setAddForm({ ...addForm, profile_picture: e.target.value })}
                    className="flex-1"
                  />
                  <label htmlFor="add-mentor-image-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                      disabled={isUploadingImage}
                      asChild
                    >
                      <span>
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </span>
                    </Button>
                    <input
                      id="add-mentor-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, false)
                        }
                        e.target.value = ""
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {addForm.profile_picture && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={addForm.profile_picture || "/placeholder.svg"}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddMentor} disabled={isSubmitting} className="bg-[#0066ff] hover:bg-[#0052cc]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Mentor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mentor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Edit Mentor</DialogTitle>
            <DialogDescription>Update the mentor information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., Dr. Ahmed Hassan"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                placeholder="e.g., Senior Full Stack Developer"
                value={editForm.title || ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-bio">
                Bio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-bio"
                placeholder="Brief description about the mentor..."
                value={editForm.bio || ""}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-profile_picture">Profile Picture</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="edit-profile_picture"
                    placeholder="Image URL or upload below"
                    value={editForm.profile_picture || ""}
                    onChange={(e) => setEditForm({ ...editForm, profile_picture: e.target.value })}
                    className="flex-1"
                  />
                  <label htmlFor="edit-mentor-image-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                      disabled={isUploadingImage}
                      asChild
                    >
                      <span>
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </span>
                    </Button>
                    <input
                      id="edit-mentor-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, true)
                        }
                        e.target.value = ""
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {editForm.profile_picture && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={editForm.profile_picture || "/placeholder.svg"}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEditMentor} disabled={isSubmitting} className="bg-[#0066ff] hover:bg-[#0052cc]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Mentor"
              )}
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
              This will permanently delete the mentor <strong>{selectedMentor?.name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMentor}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
