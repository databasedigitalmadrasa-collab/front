"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Folder, ChevronRight, Home, Video, ImageIcon, FileText, FileArchive, Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

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

interface MediaSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (fileUrl: string, fileKey: string) => void
  filterType?: "video" | "image" | "all"
  bucket?: "static" | "media"
}

export function MediaSelectorModal({
  isOpen,
  onClose,
  onSelect,
  filterType = "all",
  bucket = "media",
}: MediaSelectorModalProps) {
  const [currentPrefix, setCurrentPrefix] = useState<string>("")
  const [folders, setFolders] = useState<string[]>([])
  const [files, setFiles] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [publicUrl, setPublicUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<MediaItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const fetchMediaItems = async () => {
    setIsLoading(true)
    try {
      const prefixParam = currentPrefix ? `?prefix=${encodeURIComponent(currentPrefix)}` : ""
      const response = await fetch(`${API_BASE_URL}/${bucket}/objects/list${prefixParam}`)

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

        // Filter files based on filterType
        let filteredFiles = fileList
        if (filterType === "video") {
          filteredFiles = fileList.filter((file) => isVideoFile(file.key))
        } else if (filterType === "image") {
          filteredFiles = fileList.filter((file) => isImageFile(file.key))
        }

        setFiles(filteredFiles)
      }
    } catch (error) {
      console.error("[v0] Error fetching media:", error)
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
    if (isOpen) {
      fetchMediaItems()
    }
  }, [isOpen, currentPrefix, bucket])

  const isVideoFile = (fileName: string): boolean => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    return ["mp4", "avi", "mov", "webm", "mkv"].includes(ext || "")
  }

  const isImageFile = (fileName: string): boolean => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")
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

  const handleFolderClick = (folderName: string) => {
    setCurrentPrefix(currentPrefix + folderName + "/")
    setSelectedFile(null)
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPrefix("")
    } else {
      const parts = currentPrefix.split("/").filter(Boolean)
      setCurrentPrefix(parts.slice(0, index + 1).join("/") + "/")
    }
    setSelectedFile(null)
  }

  const handleSelectFile = () => {
    if (selectedFile) {
      onSelect(selectedFile.accessUrl, selectedFile.key)
      onClose()
      setSelectedFile(null)
      setCurrentPrefix("")
    }
  }

  const breadcrumbParts = currentPrefix.split("/").filter(Boolean)

  const filteredFiles = files.filter((file) => {
    const fileName = file.key.split("/").pop() || ""
    return fileName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Media File</DialogTitle>
          <DialogDescription>Browse and select a file from your media library</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 border-b">
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-10"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {/* Folders */}
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900">{folder}</span>
                  </button>
                ))}

                {/* Files */}
                {filteredFiles.map((file) => {
                  const fileName = file.key.split("/").pop() || file.key
                  const isSelected = selectedFile?.key === file.key

                  return (
                    <button
                      key={file.key}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      {getFileIcon(fileName)}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}

                {folders.length === 0 && filteredFiles.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No {filterType !== "all" ? filterType : ""} files found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelectFile} disabled={!selectedFile} className="bg-blue-600 hover:bg-blue-700">
            Select File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MediaSelectorModal
