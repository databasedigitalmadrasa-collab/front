"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Download } from "lucide-react"
import apiClient from "@/lib/api-client"
import * as fabric from "fabric"

interface CertificateTemplate {
  id: number
  name: string
  vars: string[]
  template_json: any
  template_thumbnail: string | null
  created_at: string
  updated_at: string
}

export default function CertificatePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)

  const [template, setTemplate] = useState<CertificateTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTemplateDetails()
    }
  }, [params.id])

  useEffect(() => {
    if (!template?.template_json || !canvasRef.current) return

    const initCanvas = async () => {
      // Parse template_json - it may be a string or object
      const templateJson =
        typeof template.template_json === "string" ? JSON.parse(template.template_json) : template.template_json

      console.log("Initializing canvas with dimensions:", templateJson.width, "x", templateJson.height)
      console.log("Template JSON objects count:", templateJson.objects?.length)

      // Dispose existing canvas if any
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }

      // Create new canvas with dimensions from template
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: templateJson.width || 900,
        height: templateJson.height || 506,
        selection: false,
      })

      fabricCanvasRef.current = canvas

      console.log("Loading template JSON into canvas using Promise-based approach")

      try {
        // Use Promise-based loadFromJSON for Fabric.js v6
        await canvas.loadFromJSON(templateJson)

        console.log("Template JSON loaded successfully")
        console.log("Canvas objects after load:", canvas.getObjects().length)

        // Replace variables with sample data for preview
        canvas.getObjects().forEach((obj: any) => {
          // Fix types later if needed (obj as FabricObject)
          if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
            if (obj.text) {
              let text = obj.text;
              text = text.replace(/{{student_name}}/g, "John Doe");
              text = text.replace(/{{course_name}}/g, "Sample Course Title");
              text = text.replace(/{{course_title}}/g, "Sample Course Title");
              text = text.replace(/{{instructor_name}}/g, "Dr. Instructor Name");
              const dateStr = new Date().toLocaleDateString();
              text = text.replace(/{{date}}/g, dateStr);
              text = text.replace(/{{dateofIssue}}/g, dateStr);
              text = text.replace(/{{certificate_id}}/g, "CERT-PREVIEW-001");
              text = text.replace(/{{certificateID}}/g, "CERT-PREVIEW-001");
              obj.set('text', text);
            }
          }

          obj.selectable = false
          obj.evented = false
          obj.hasControls = false
          obj.hasBorders = false
        })

        // Disable all interactions
        canvas.selection = false
        canvas.hoverCursor = "default"
        canvas.defaultCursor = "default"

        canvas.renderAll()
        setCanvasReady(true)
        console.log("Canvas rendered with", canvas.getObjects().length, "objects")
      } catch (error) {
        console.error("Error loading template JSON:", error)
        toast({
          title: "Error",
          description: "Failed to load certificate template into canvas",
          variant: "destructive",
        })
      }
    }

    initCanvas()

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [template])

  const fetchTemplateDetails = async () => {
    try {
      setLoading(true)
      console.log("Fetching template details for ID:", params.id)

      const response = await apiClient.get(`/certificate-templates/${params.id}`)

      console.log("Template response:", response)

      if (response.success && response.data?.data) {
        console.log("Template data:", response.data.data)
        setTemplate(response.data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load certificate template",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching template:", error)
      toast({
        title: "Error",
        description: "Failed to load certificate template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!fabricCanvasRef.current) {
      toast({
        title: "Error",
        description: "Canvas not ready",
        variant: "destructive",
      })
      return
    }

    console.log("Downloading certificate")

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // Higher resolution
    })

    const link = document.createElement("a")
    link.href = dataURL
    link.download = `${template?.name || "certificate"}.png`
    link.click()

    toast({
      title: "Certificate Downloaded",
      description: "Certificate has been saved to your device",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Certificate not found</p>
          <Button onClick={() => router.push("/admin/certificates")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Certificates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/certificates")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-sm text-gray-600">Certificate Preview</p>
            </div>
          </div>
          <Button onClick={handleDownload} className="gap-2" disabled={!canvasReady}>
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>

        {/* Canvas Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center">
            <div className="border border-gray-300 shadow-md">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Template Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Template Name</p>
              <p className="font-medium">{template.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Variables</p>
              <p className="font-medium">{template.vars?.join(", ") || "None"}</p>
            </div>
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-medium">
                {template.created_at ? new Date(template.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-medium">
                {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
