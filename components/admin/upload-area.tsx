"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Cloud } from "lucide-react"

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
}

export function UploadArea({ onFilesSelected }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    onFilesSelected(files)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onFilesSelected(files)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
        isDragging ? "border-[#0066ff] bg-blue-50" : "border-gray-300 bg-gray-50"
      }`}
    >
      <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <h3 className="text-lg font-heading font-bold text-[#150101] mb-1">Drop files here to upload</h3>
      <p className="text-sm text-gray-600 mb-4">or click to browse from your computer</p>
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-white rounded-lg transition"
      >
        <Upload className="w-4 h-4" />
        Choose Files
      </button>
    </div>
  )
}
