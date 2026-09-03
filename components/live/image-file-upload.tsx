"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { getAdminToken } from "@/lib/auth"

interface ImageFileUploadProps {
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  aspectRatio?: "16/9" | "square" | "any"
  folder?: string
  helperText?: string
}

export function ImageFileUpload({
  label,
  value,
  onChange,
  placeholder = "https://cdn.digitalmadrasa.co.in/...",
  aspectRatio = "16/9",
  folder = "thumbnails",
  helperText,
}: ImageFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WEBP, SVG)")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10 MB")
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const uploadPath = `live-classes/${folder}/${Date.now()}_${sanitizedName}`
      const contentType = file.type || "image/jpeg"
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://dm-api.copybykhan.workers.dev/api/v1"
      const uploadUrl = `${apiBase}/static/objects?path=${encodeURIComponent(uploadPath)}&contentType=${encodeURIComponent(contentType)}`

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      const uploadPromise = new Promise<boolean>((resolve) => {
        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
        xhr.onerror = () => resolve(false)
        xhr.onabort = () => resolve(false)
      })

      xhr.open("POST", uploadUrl)
      const token =
        getAdminToken() ||
        (typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("user_token")
          : null)
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      }

      xhr.send(file)

      const success = await uploadPromise
      if (success) {
        const cdnUrl = `https://cdn.digitalmadrasa.co.in/${uploadPath}`
        onChange(cdnUrl)
      } else {
        throw new Error("Upload failed")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>

      {/* Upload Drop Zone / Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        {/* Drop Box / Trigger */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`sm:col-span-7 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50"
          } ${uploading ? "pointer-events-none opacity-80" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadFile(e.target.files[0])
              }
            }}
          />

          {uploading ? (
            <div className="py-2 space-y-2 w-full max-w-xs">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-[11px] font-bold text-slate-700">Uploading to R2 ({progress}%)</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-1 space-y-1">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Click or drag & drop image to upload
              </p>
              <p className="text-[10px] text-slate-500">
                PNG, JPG, WEBP or SVG up to 10MB (stored in R2)
              </p>
            </div>
          )}
        </div>

        {/* Preview or URL Input */}
        <div className="sm:col-span-5 space-y-2">
          {value ? (
            <div
              className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-xs flex items-center justify-center ${
                aspectRatio === "16/9" ? "aspect-video" : aspectRatio === "square" ? "aspect-square w-28" : "h-24"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                Uploaded
              </div>
            </div>
          ) : (
            <div
              className={`rounded-xl border border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-3 text-center ${
                aspectRatio === "16/9" ? "aspect-video" : aspectRatio === "square" ? "aspect-square w-28" : "h-24"
              }`}
            >
              <ImageIcon className="w-5 h-5 mb-1 text-slate-300" />
              <span className="text-[10px] font-semibold">No Image Selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Manual URL Input Fallback */}
      <div className="pt-1">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        />
        {helperText && <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>}
        {error && (
          <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
