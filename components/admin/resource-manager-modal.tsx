"use client"

import type React from "react"

import { useState } from "react"
import { X, Upload, FileText, ImageIcon, Video, File, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Resource {
  id: string
  name: string
  type: string
  size: string
  url: string
}

interface ResourceManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onResourcesUpdate: (resources: Resource[]) => void
  currentResources: Resource[]
}

export function ResourceManagerModal({
  isOpen,
  onClose,
  onResourcesUpdate,
  currentResources,
}: ResourceManagerModalProps) {
  const [resources, setResources] = useState<Resource[]>(currentResources)
  const [isDragging, setIsDragging] = useState(false)

  if (!isOpen) return null

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const newResources: Resource[] = Array.from(files).map((file, index) => ({
      id: `resource-${Date.now()}-${index}`,
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      url: URL.createObjectURL(file),
    }))

    setResources([...resources, ...newResources])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDelete = (id: string) => {
    setResources(resources.filter((r) => r.id !== id))
  }

  const handleSave = () => {
    onResourcesUpdate(resources)
    onClose()
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    if (type.startsWith("video/")) return Video
    if (type.includes("pdf")) return FileText
    return File
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-gray-900">Resource Manager</h2>
            <p className="text-sm text-gray-600 mt-1">Upload and manage lesson resources</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
              isDragging ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-gray-500 mb-4">Support: PDF, DOC, PPT, Images, Videos (Max 100MB)</p>
            <Label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </span>
              </Button>
            </Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {/* Resources List */}
          {resources.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Resources ({resources.length})</h3>
              <div className="space-y-2">
                {resources.map((resource) => {
                  const Icon = getFileIcon(resource.type)
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{resource.name}</p>
                        <p className="text-xs text-gray-500">{resource.size}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Save Resources
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
