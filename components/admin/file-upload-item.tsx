"use client"

import { File, FileText, ImageIcon, Video, Music, Trash2, CheckCircle } from "lucide-react"

interface FileUploadItemProps {
  file: {
    id: string
    name: string
    size: number
    type: string
    progress?: number
    uploading?: boolean
  }
  onDelete: () => void
}

const getFileIcon = (type: string) => {
  if (type.startsWith("video")) return <Video className="w-5 h-5 text-red-500" />
  if (type.startsWith("image")) return <ImageIcon className="w-5 h-5 text-blue-500" />
  if (type.startsWith("audio")) return <Music className="w-5 h-5 text-purple-500" />
  if (type === "application/pdf") return <FileText className="w-5 h-5 text-red-600" />
  return <File className="w-5 h-5 text-gray-500" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function FileUploadItem({ file, onDelete }: FileUploadItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
      <div className="flex-shrink-0">{getFileIcon(file.type)}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#150101] truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

        {file.uploading && file.progress !== undefined && (
          <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#0066ff] h-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {file.uploading ? (
          <span className="text-xs text-gray-600">{file.progress}%</span>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
