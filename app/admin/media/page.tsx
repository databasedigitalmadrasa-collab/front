"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Folder,
  ChevronRight,
  ImageIcon,
  Loader2,
  Home,
  Video,
  FileText,
  FileArchive,
  Download,
  Upload,
  FolderPlus,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

const PRESIGN_THRESHOLD_BYTES = 50 * 1024 * 1024

interface PresignedUrlResponse {
  success: boolean
  url: string
  method: string
  expires: number
  signedHeaders: string[]
  note: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  error?: string
  speed?: string
  startTime?: number
}

interface MediaFolder {
  id: number
  folder_name: string
  folder_path: string
  folder_key_in_r2: string
  created_at: string
  updated_at: string
}

interface MediaItem {
  key: string
  size: number
  etag: string
  accessUrl: string
}

interface MediaListResponse {
  success: boolean
  bucket: string
  prefix: string
  publicUrl: string
  items: MediaItem[]
}

export default function MediaManagementPage() {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [files, setFiles] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [publicUrl, setPublicUrl] = useState<string>("")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<MediaFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderPath, setNewFolderPath] = useState("")
  const [newFolderKeyInR2, setNewFolderKeyInR2] = useState("")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [previewFile, setPreviewFile] = useState<MediaItem | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { toast } = useToast()

  const [selectedBucket, setSelectedBucket] = useState<"static" | "media">("static")
  const [currentPrefix, setCurrentPrefix] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const uploadInProgressRef = useRef(false)
  const completedUploadsRef = useRef(0)
  const totalUploadsRef = useRef(0)

  const activeXhrRef = useRef<XMLHttpRequest[]>([])

  const getR2BucketName = (bucket: string): string => {
    return `${bucket}-bucket`
  }

  const fetchMediaItems = async () => {
    setIsLoading(true)
    try {
      const prefixParam = currentPrefix ? `?prefix=${encodeURIComponent(currentPrefix)}` : ""
      const response = await fetch(`${API_BASE_URL}/${selectedBucket}/objects/list${prefixParam}`)

      if (!response.ok) {
        throw new Error("Failed to fetch media items")
      }

      const data: MediaListResponse = await response.json()

      if (data.success) {
        setPublicUrl(data.publicUrl)

        const folderSet = new Set<string>()
        const fileList: MediaItem[] = []

        data.items.forEach((item) => {
          const relativePath = item.key.substring(currentPrefix.length)

          if (relativePath.endsWith("/")) {
            const folderName = relativePath.slice(0, -1)
            if (folderName && !folderName.includes("/")) {
              folderSet.add(folderName)
            }
          } else if (!relativePath.includes("/")) {
            fileList.push(item)
          } else {
            const folderName = relativePath.split("/")[0]
            if (folderName) {
              folderSet.add(folderName)
            }
          }
        })

        setFolders(Array.from(folderSet))
        setFiles(fileList)
      } else {
        toast({
          title: "Error",
          description: "Failed to load media items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching media:", error)
      toast({
        title: "Error",
        description: "Failed to load media items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (uploadInProgressRef.current) {
      return
    }
    fetchMediaItems()
  }, [selectedBucket, currentPrefix])

  const getPresignedUrl = async (bucket: string, key: string): Promise<PresignedUrlResponse | null> => {
    try {
      const r2Bucket = getR2BucketName(bucket)
      const response = await fetch(`${API_BASE_URL}/r2/${r2Bucket}/presign?key=${encodeURIComponent(key)}`)

      if (!response.ok) {
        throw new Error("Failed to get presigned URL")
      }

      const data = await response.json()

      if (data.success) {
        return data
      }
      return null
    } catch (error) {
      console.error("Error getting presigned URL:", error)
      return null
    }
  }

  const uploadWithPresignedUrl = (
    file: File,
    presignedUrl: string,
    uploadId: string,
    onProgress: (progress: number, speed: string) => void,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      activeXhrRef.current.push(xhr)

      const startTime = Date.now()
      let lastLoaded = 0
      let lastTime = startTime

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)

          // Calculate upload speed
          const currentTime = Date.now()
          const timeDiff = (currentTime - lastTime) / 1000
          if (timeDiff > 0.5) {
            const bytesDiff = event.loaded - lastLoaded
            const speedBps = bytesDiff / timeDiff
            const speedFormatted = formatSpeed(speedBps)
            lastLoaded = event.loaded
            lastTime = currentTime
            onProgress(progress, speedFormatted)
          } else {
            onProgress(progress, "")
          }
        }
      }

      xhr.onload = () => {
        activeXhrRef.current = activeXhrRef.current.filter((x) => x !== xhr)
        if (xhr.status === 200 || xhr.status === 204) {
          resolve(true)
        } else {
          resolve(false)
        }
      }

      xhr.onerror = () => {
        activeXhrRef.current = activeXhrRef.current.filter((x) => x !== xhr)
        resolve(false)
      }

      xhr.onabort = () => {
        activeXhrRef.current = activeXhrRef.current.filter((x) => x !== xhr)
        resolve(false)
      }

      xhr.open("PUT", presignedUrl)
      // Note: Do NOT send Content-Type as per API response note
      xhr.send(file)
    })
  }

  const uploadDirectToApi = (
    file: File,
    bucket: string,
    path: string,
    uploadId: string,
    onProgress: (progress: number, speed: string) => void,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      activeXhrRef.current.push(xhr)

      const startTime = Date.now()
      let lastLoaded = 0
      let lastTime = startTime

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)

          const currentTime = Date.now()
          const timeDiff = (currentTime - lastTime) / 1000
          if (timeDiff > 0.5) {
            const bytesDiff = event.loaded - lastLoaded
            const speedBps = bytesDiff / timeDiff
            const speedFormatted = formatSpeed(speedBps)
            lastLoaded = event.loaded
            lastTime = currentTime
            onProgress(progress, speedFormatted)
          } else {
            onProgress(progress, "")
          }
        }
      }

      xhr.onload = () => {
        activeXhrRef.current = activeXhrRef.current.filter((x) => x !== xhr)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true)
        } else {
          resolve(false)
        }
      }

      xhr.onerror = () => {
        activeXhrRef.current = activeXhrRef.current.filter((x) => x !== xhr)
        resolve(false)
      }

      xhr.onabort = () => {
        activeXhrRef.current = activeXhrRef.current.filter((x) => x !== xhr)
        resolve(false)
      }

      const contentType = file.type || "application/octet-stream"
      const uploadUrl = `${API_BASE_URL}/${bucket}/objects?path=${encodeURIComponent(path)}&contentType=${encodeURIComponent(contentType)}`

      xhr.open("POST", uploadUrl)
      xhr.send(file)
    })
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(0)} B/s`
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
    }
  }

  const handleFileUpload = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return

    uploadInProgressRef.current = true
    completedUploadsRef.current = 0
    totalUploadsRef.current = filesToUpload.length

    const newUploadingFiles: UploadingFile[] = filesToUpload.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      progress: 0,
      status: "uploading" as const,
      speed: "",
      startTime: Date.now(),
    }))

    setUploadingFiles(newUploadingFiles)
    setShowUploadDialog(true)

    // Process uploads sequentially for better progress tracking
    for (const uploadingFile of newUploadingFiles) {
      const fileName = uploadingFile.file.name
      const uploadPath = currentPrefix + fileName
      const fileSize = uploadingFile.file.size

      // Determine upload method based on file size
      const usePresigned = fileSize > PRESIGN_THRESHOLD_BYTES

      let success = false

      const updateProgress = (progress: number, speed: string) => {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress, speed: speed || f.speed } : f)),
        )
      }

      if (usePresigned) {
        // Large file - use presigned URL
        const presignedData = await getPresignedUrl(selectedBucket, uploadPath)

        if (presignedData) {
          success = await uploadWithPresignedUrl(
            uploadingFile.file,
            presignedData.url,
            uploadingFile.id,
            updateProgress,
          )
        }
      } else {
        // Small file - direct API upload
        success = await uploadDirectToApi(
          uploadingFile.file,
          selectedBucket,
          uploadPath,
          uploadingFile.id,
          updateProgress,
        )
      }

      completedUploadsRef.current++

      if (success) {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadingFile.id ? { ...f, status: "success", progress: 100 } : f)),
        )
        toast({
          title: "Success",
          description: `${fileName} uploaded successfully`,
        })
      } else {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadingFile.id ? { ...f, status: "error", error: "Upload failed" } : f)),
        )
        toast({
          title: "Error",
          description: `Failed to upload ${fileName}`,
          variant: "destructive",
        })
      }
    }

    uploadInProgressRef.current = false
    await fetchMediaItems()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      handleFileUpload(files)
    }
    // Reset input so same file can be selected again
    event.target.value = ""
  }

  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim().replace(/\s+/g, "-")

    if (!trimmedName) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive",
      })
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      toast({
        title: "Error",
        description: "Folder name can only contain letters, numbers, hyphens, and underscores",
        variant: "destructive",
      })
      return
    }

    setIsCreatingFolder(true)

    try {
      const folderPath = currentPrefix + trimmedName + "/"

      // Create an empty placeholder file to represent the folder
      const emptyBlob = new Blob([""], { type: "application/x-directory" })

      const response = await fetch(
        `${API_BASE_URL}/${selectedBucket}/objects?path=${encodeURIComponent(folderPath + ".keep")}&contentType=application/x-directory`,
        {
          method: "POST",
          body: emptyBlob,
        },
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: `Folder "${trimmedName}" created successfully`,
        })
        setNewFolderName("")
        setShowNewFolderDialog(false)
        fetchMediaItems()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create folder")
      }
    } catch (error) {
      console.error("Create folder error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      })
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleBucketChange = (bucket: "static" | "media") => {
    setSelectedBucket(bucket)
    setCurrentPrefix("")
  }

  const handleFolderClick = (folderName: string) => {
    setCurrentPrefix(currentPrefix + folderName + "/")
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPrefix("")
    } else {
      const parts = currentPrefix.split("/").filter(Boolean)
      setCurrentPrefix(parts.slice(0, index + 1).join("/") + "/")
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />
    } else if (["mp4", "avi", "mov", "webm", "mkv"].includes(ext || "")) {
      return <Video className="w-5 h-5 text-purple-500" />
    } else if (["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      return <FileText className="w-5 h-5 text-red-500" />
    } else if (["zip", "rar", "7z", "tar"].includes(ext || "")) {
      return <FileArchive className="w-5 h-5 text-orange-500" />
    }
    return <ImageIcon className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const isViewableFile = (fileName: string): boolean => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "avi", "mov", "webm", "mkv"].includes(ext || "")
  }

  const isImageFile = (fileName: string): boolean => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")
  }

  const isVideoFile = (fileName: string): boolean => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    return ["mp4", "avi", "mov", "webm", "mkv"].includes(ext || "")
  }

  const handleViewFile = (file: MediaItem) => {
    setPreviewFile(file)
    setShowPreviewModal(true)
  }

  const handleDeleteFile = async (file: MediaItem) => {
    const fileName = file.key.split("/").pop() || file.key

    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(file.key)

    try {
      const response = await fetch(`${API_BASE_URL}/${selectedBucket}/objects?path=${encodeURIComponent(file.key)}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${fileName} deleted successfully`,
        })
        fetchMediaItems()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const breadcrumbParts = currentPrefix.split("/").filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 text-white shadow-lg">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-2">Media Manager</h1>
          <p className="text-sm sm:text-base text-white/90">Browse and manage your CDN files</p>
        </div>

        {/* Bucket Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <Tabs value={selectedBucket} onValueChange={(v) => handleBucketChange(v as "static" | "media")}>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="static" className="data-[state=active]:bg-white">
                  Static Files
                </TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:bg-white">
                  Media Files
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm overflow-x-auto flex-1">
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
                >
                  <Home className="w-4 h-4" />
                  <span>Root</span>
                </button>
                {breadcrumbParts.map((part, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className="text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
                    >
                      {part}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area with Drag and Drop */}
          <div
            className={`p-6 transition-colors ${isDragging ? "bg-blue-50 border-2 border-dashed border-blue-400" : ""}`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 z-10 rounded-xl">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-700 font-medium">Drop files here to upload</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Folders */}
                {folders.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Folders</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {folders.map((folder) => (
                        <button
                          key={folder}
                          onClick={() => handleFolderClick(folder)}
                          className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border border-yellow-200 rounded-xl transition-all hover:shadow-md text-center group"
                        >
                          <Folder className="w-12 h-12 text-yellow-600 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium text-gray-900 truncate w-full group-hover:text-yellow-700">
                            {folder}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {files.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Files</h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Size
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {files.map((file) => {
                              const fileName = file.key.split("/").pop() || file.key
                              return (
                                <tr key={file.key} className="hover:bg-blue-50/50 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-shrink-0">{getFileIcon(fileName)}</div>
                                      <span className="text-sm font-medium text-gray-900 truncate max-w-md group-hover:text-blue-600">
                                        {fileName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-sm text-gray-600 font-medium">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                      {isViewableFile(fileName) && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleViewFile(file)}
                                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                        >
                                          <Eye className="w-4 h-4 mr-1.5" />
                                          <span className="hidden lg:inline">View</span>
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(file.accessUrl, "_blank")}
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                                      >
                                        <Download className="w-4 h-4 mr-1.5" />
                                        <span className="hidden lg:inline">Download</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteFile(file)}
                                        disabled={isDeleting === file.key}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                                      >
                                        {isDeleting === file.key ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <>
                                            <Trash2 className="w-4 h-4 mr-1.5" />
                                            <span className="hidden lg:inline">Delete</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden divide-y divide-gray-100">
                        {files.map((file) => {
                          const fileName = file.key.split("/").pop() || file.key
                          return (
                            <div key={file.key} className="p-4 hover:bg-blue-50/50 transition-colors">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="flex-shrink-0 mt-1">{getFileIcon(fileName)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate mb-1">{fileName}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {isViewableFile(fileName) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewFile(file)}
                                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1.5" />
                                    View
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(file.accessUrl, "_blank")}
                                  className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Download className="w-4 h-4 mr-1.5" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteFile(file)}
                                  disabled={isDeleting === file.key}
                                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {isDeleting === file.key ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="w-4 h-4 mr-1.5" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {folders.length === 0 && files.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No files or folders found in this directory</p>
                    <label htmlFor="file-upload-empty" className="cursor-pointer">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Your First File
                        </span>
                      </Button>
                      <input
                        id="file-upload-empty"
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="*/*"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {uploadingFiles.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold text-sm">
                  Uploading {uploadingFiles.filter((f) => f.status === "uploading").length}/{uploadingFiles.length}
                </h3>
              </div>
              {uploadingFiles.every((f) => f.status !== "uploading") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                  onClick={() => setUploadingFiles([])}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Upload List */}
            <div className="max-h-60 overflow-y-auto p-3 space-y-3">
              {uploadingFiles.map((file) => (
                <div key={file.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : file.status === "error" ? (
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium text-gray-900 truncate">{file.file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.speed && file.status === "uploading" && (
                        <span className="text-[10px] text-gray-500">{file.speed}</span>
                      )}
                      <span
                        className={`text-xs font-bold ${
                          file.status === "success"
                            ? "text-green-600"
                            : file.status === "error"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {file.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        file.status === "success"
                          ? "bg-green-500"
                          : file.status === "error"
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-blue-500 to-indigo-500"
                      }`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  {file.status === "error" && file.error && <p className="text-[10px] text-red-600">{file.error}</p>}
                </div>
              ))}
            </div>

            {/* Footer */}
            {uploadingFiles.every((f) => f.status !== "uploading") && (
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {uploadingFiles.filter((f) => f.status === "success").length} done,{" "}
                  {uploadingFiles.filter((f) => f.status === "error").length} failed
                </span>
                <Button
                  size="sm"
                  onClick={() => setUploadingFiles([])}
                  className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Create Folder Dialog */}
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for the new folder. Spaces will be replaced with hyphens.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="my-folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value.replace(/\s+/g, "-"))}
                />
                <p className="text-xs text-gray-500">Only letters, numbers, hyphens, and underscores are allowed</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingFolder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Folder"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            {previewFile && (
              <>
                <DialogHeader className="p-4 border-b bg-gray-50">
                  <DialogTitle className="flex items-center gap-2 text-base">
                    {getFileIcon(previewFile.key.split("/").pop() || "")}
                    <span className="truncate">{previewFile.key.split("/").pop()}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs">Size: {formatFileSize(previewFile.size)}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4 min-h-[300px] max-h-[60vh]">
                  {isImageFile(previewFile.key) && (
                    <img
                      src={previewFile.accessUrl || "/placeholder.svg"}
                      alt={previewFile.key.split("/").pop() || "Preview"}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  )}
                  {isVideoFile(previewFile.key) && (
                    <video
                      src={previewFile.accessUrl}
                      controls
                      autoPlay
                      className="max-w-full max-h-full rounded"
                      controlsList="nodownload"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                <DialogFooter className="p-4 border-t bg-gray-50">
                  <Button
                    variant="outline"
                    onClick={() => window.open(previewFile.accessUrl, "_blank")}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download
                  </Button>
                  <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
