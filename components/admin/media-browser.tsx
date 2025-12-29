"use client"

import { useState } from "react"
import type { File } from "lucide-react"
import { UploadArea } from "@/components/admin/upload-area"
import { FileUploadItem } from "@/components/admin/file-upload-item"

interface MediaFile {
  id: string
  name: string
  size: number
  type: string
  progress?: number
  uploading?: boolean
}

export function MediaBrowser({ currentPath }: { currentPath: string[] }) {
  const [files, setFiles] = useState<MediaFile[]>([
    { id: "1", name: "intro-video.mp4", size: 524288000, type: "video" },
    { id: "2", name: "course-guide.pdf", size: 2097152, type: "pdf" },
    { id: "3", name: "thumbnail.jpg", size: 1048576, type: "image" },
  ])
  const [uploading, setUploading] = useState<Map<string, number>>(new Map())

  const handleFilesSelected = async (selectedFiles: File[]) => {
    for (const file of selectedFiles) {
      const fileId = Date.now().toString() + Math.random()
      const newFile: MediaFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploading: true,
        progress: 0,
      }
      setFiles((prev) => [...prev, newFile])

      // Simulate presigned URL upload
      try {
        const presignedUrl = await getPresignedUrl(file.name)
        await uploadToS3(file, presignedUrl, fileId)
      } catch (error) {
        console.error("Upload failed:", error)
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
      }
    }
  }

  const getPresignedUrl = async (fileName: string) => {
    const response = await fetch("/api/admin/media/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, path: currentPath.join("/") }),
    })

    if (!response.ok) throw new Error("Failed to get presigned URL")
    const data = await response.json()
    return data.url
  }

  const uploadToS3 = async (file: File, presignedUrl: string, fileId: string) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          uploading.set(fileId, progress)
          setUploading(new Map(uploading))
          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, uploading: false, progress: 100 } : f)))
          resolve(true)
        } else {
          reject(new Error("Upload failed"))
        }
      })

      xhr.addEventListener("error", () => reject(new Error("Upload error")))

      xhr.open("PUT", presignedUrl)
      xhr.setRequestHeader("Content-Type", file.type)
      xhr.send(file)
    })
  }

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <UploadArea onFilesSelected={handleFilesSelected} />

      {/* Files List */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-heading font-bold text-[#150101] mb-4">Files</h3>
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <FileUploadItem key={file.id} file={file} onDelete={() => handleDeleteFile(file.id)} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No files uploaded yet</p>
        )}
      </div>
    </div>
  )
}
