"use client"
import { Award, Edit, Trash2, Upload, ImageIcon, X, Eye } from "lucide-react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"

const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"
const CDN_URL = "https://cdn.digitalmadrasa.co.in"

declare const fabric: any

interface CertificateTemplate {
  id: number
  name: string
  vars: string[]
  template_json: any
  created_at: string
  updated_at: string
}

export default function CertificateManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null)
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      const response = await apiClient.get("/certificate-templates", token)

      if (response.success && response.data) {
        setTemplates(response.data.items || [])
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load templates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    setDeletingId(id)
    try {
      const token = getAuthToken()
      const response = await apiClient.delete(`/certificate-templates/${id}`, token)

      if (response.success) {
        toast({
          title: "Template Deleted",
          description: "Certificate template deleted successfully",
        })
        fetchTemplates()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete template",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleBackgroundSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      setBackgroundImage(file)
      const previewUrl = URL.createObjectURL(file)
      setBackgroundPreview(previewUrl)
    }
  }

  const handleRemoveBackground = () => {
    setBackgroundImage(null)
    if (backgroundPreview) {
      URL.revokeObjectURL(backgroundPreview)
      setBackgroundPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadBackgroundImage = async (file: File): Promise<string | null> => {
    const fileName = `certificate-res/${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const fileSize = file.size
    const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024

    return new Promise((resolve, reject) => {
      if (fileSize > LARGE_FILE_THRESHOLD) {
        fetch(`${API_BASE_URL}/r2/static-bucket/presign?key=${encodeURIComponent(fileName)}`)
          .then((res) => res.json())
          .then((data) => {
            if (!data.success || !data.url) {
              throw new Error("Failed to get presigned URL")
            }

            const xhr = new XMLHttpRequest()
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100)
                setUploadProgress(progress)
              }
            }
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(`${CDN_URL}/${fileName}`)
              } else {
                reject(new Error("Upload failed"))
              }
            }
            xhr.onerror = () => reject(new Error("Upload failed"))
            xhr.open("PUT", data.url, true)
            xhr.send(file)
          })
          .catch(reject)
      } else {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(progress)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(`${CDN_URL}/${fileName}`)
          } else {
            reject(new Error("Upload failed"))
          }
        }
        xhr.onerror = () => reject(new Error("Upload failed"))
        xhr.open(
          "POST",
          `${API_BASE_URL}/static/objects?path=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(file.type)}`,
          true,
        )
        xhr.send(file)
      }
    })
  }

  const handleCreateCertificate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Template Name Required",
        description: "Please enter a name for your certificate template",
        variant: "destructive",
      })
      return
    }

    if (!backgroundImage) {
      toast({
        title: "Background Required",
        description: "Please upload a background image for the certificate",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const backgroundUrl = await uploadBackgroundImage(backgroundImage)

      if (!backgroundUrl) {
        throw new Error("Failed to upload background image")
      }

      toast({
        title: "Background Uploaded",
        description: "Opening certificate editor...",
      })

      router.push(
        `/admin/certificates/editor/new?name=${encodeURIComponent(templateName)}&bg=${encodeURIComponent(backgroundUrl)}`,
      )
    } catch (error) {
      console.error("Error uploading background:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload background image. Please try again.",
        variant: "destructive",
      })
      setIsCreating(false)
      setIsUploading(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setTemplateName("")
      handleRemoveBackground()
      setUploadProgress(0)
      setIsUploading(false)
      setIsCreating(false)
    }
    setShowCreateDialog(open)
  }

  const handlePreviewCertificate = (template: CertificateTemplate) => {
    router.push(`/admin/certificates/preview/${template.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/6.9.0/fabric.min.js" />

      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">Certificate Templates</h1>
              <p className="text-white/80 text-sm mt-1">Create and manage certificate templates for your courses</p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 w-full lg:w-auto shadow-lg"
          >
            <Award className="w-4 h-4" />
            Create Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066ff] mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading templates...</p>
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0066ff]/10 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#0066ff]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-500">
                      {template.vars?.length || 0} variable{template.vars?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handlePreviewCertificate(template)}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  onClick={() => router.push(`/admin/certificates/editor/${template.id}`)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDeleteTemplate(template.id)}
                  variant="outline"
                  size="sm"
                  disabled={deletingId === template.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingId === template.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
          <Award className="w-20 h-20 text-[#0066ff] mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Templates Yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
            Create your first certificate template to start issuing certificates to your students.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#0066ff] hover:bg-[#0052cc] gap-2" size="lg">
            <Award className="w-5 h-5" />
            Create First Template
          </Button>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create Certificate Template</DialogTitle>
            <DialogDescription>
              Enter a name and upload a background image for your certificate template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Course Completion Certificate"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label>Background Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundSelect}
                className="hidden"
                disabled={isCreating}
              />

              {!backgroundPreview ? (
                <div
                  onClick={() => !isCreating && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#0066ff] hover:bg-[#0066ff]/5 transition-colors ${isCreating ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Click to upload background image</p>
                  <p className="text-gray-400 text-sm">JPG, PNG or WebP (Recommended: 1920x1080)</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={backgroundPreview || "/placeholder.svg"}
                    alt="Background preview"
                    className="w-full h-48 object-cover"
                  />
                  {!isCreating && (
                    <button
                      onClick={handleRemoveBackground}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="flex items-center gap-2 text-white">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm truncate">{backgroundImage?.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isUploading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading background...</span>
                  <span className="font-medium text-[#0066ff]">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0066ff] to-[#0052cc] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleDialogClose(false)} disabled={isCreating} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreateCertificate}
              disabled={isCreating || !backgroundImage}
              className="flex-1 bg-[#0066ff] hover:bg-[#0052cc]"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isUploading ? "Uploading..." : "Creating..."}
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
