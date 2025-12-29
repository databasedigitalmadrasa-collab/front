"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Undo,
  Redo,
  Type,
  ImageIcon,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  LinkIcon,
  Menu,
  Save,
  Lock,
  Unlock,
  Braces,
  Loader2,
  RectangleHorizontal,
} from "lucide-react"
import * as fabric from "fabric"
import apiClient from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9", width: 900, height: 506 },
  { label: "4:3", value: "4:3", width: 900, height: 675 },
  { label: "3:2", value: "3:2", width: 900, height: 600 },
  { label: "1:1", value: "1:1", width: 900, height: 900 },
  { label: "A4 Landscape", value: "a4-landscape", width: 900, height: 636 },
  { label: "A4 Portrait", value: "a4-portrait", width: 636, height: 900 },
]

const DEFAULT_RATIO = ASPECT_RATIOS[0]

const CERTIFICATE_BG = "/certificate-bg.png"
const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

const GOOGLE_FONTS = [
  { name: "Arial", value: "Arial", isSystem: true },
  { name: "Times New Roman", value: "Times New Roman", isSystem: true },
  { name: "Georgia", value: "Georgia", isSystem: true },
  { name: "Courier New", value: "Courier New", isSystem: true },
  { name: "Verdana", value: "Verdana", isSystem: true },
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Lato", value: "Lato" },
  { name: "Montserrat", value: "Montserrat" },
  { name: "Playfair Display", value: "Playfair Display" },
  { name: "Merriweather", value: "Merriweather" },
  { name: "Raleway", value: "Raleway" },
  { name: "PT Sans", value: "PT Sans" },
  { name: "Oswald", value: "Oswald" },
  { name: "Poppins", value: "Poppins" },
  { name: "Inter", value: "Inter" },
  { name: "Bebas Neue", value: "Bebas Neue" },
  { name: "Dancing Script", value: "Dancing Script" },
  { name: "Pacifico", value: "Pacifico" },
  { name: "Great Vibes", value: "Great Vibes" },
  { name: "Cinzel", value: "Cinzel" },
  { name: "Cormorant Garamond", value: "Cormorant Garamond" },
  { name: "Crimson Text", value: "Crimson Text" },
  { name: "Libre Baskerville", value: "Libre Baskerville" },
]

const CERTIFICATE_VARIABLES = [
  { label: "Student Name", value: "{{student_name}}" },
  { label: "Date of Issue", value: "{{dateofIssue}}" },
  { label: "Certificate ID", value: "{{certificateID}}" },
  { label: "Course Title", value: "{{course_title}}" },
  { label: "Instructor Name", value: "{{instructor_name}}" },
]



export default function CertificateEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [mounted, setMounted] = useState(false)

  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUploadTab, setImageUploadTab] = useState("upload")
  const [imageUrl, setImageUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadProgress, setImageUploadProgress] = useState(0)

  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Removed showBackgroundSidebar and backgroundTab, backgroundUrl, backgroundFileInputRef
  const [showInsertVariableDialog, setShowInsertVariableDialog] = useState(false) // Renamed from showVariableDialog
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [isLocked, setIsLocked] = useState(false)

  // Changed templateId to string | null
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState(searchParams.get("name") || "Certificate Template")
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const [selectedRatio, setSelectedRatio] = useState(DEFAULT_RATIO)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: DEFAULT_RATIO.width, height: DEFAULT_RATIO.height })

  const [templateVars, setTemplateVars] = useState<string[]>([])

  const loadGoogleFont = (fontName: string) => {
    if (loadedFonts.has(fontName) || GOOGLE_FONTS.find((f) => f.value === fontName)?.isSystem) {
      return
    }

    const link = document.createElement("link")
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;700&display=swap`
    link.rel = "stylesheet"
    document.head.appendChild(link)

    setLoadedFonts((prev) => new Set(prev).add(fontName))
  }

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || mounted) return

    console.log("Initializing Fabric.js canvas")

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: DEFAULT_RATIO.width,
      height: DEFAULT_RATIO.height,
      backgroundColor: "#ffffff",
    })

    fabricCanvasRef.current = canvas

    const isEditingExisting = params.id && params.id !== "new"

    if (!isEditingExisting) {
      // Only initialize with default background and elements for new templates
      const urlParams = new URLSearchParams(window.location.search)
      const bgUrl = urlParams.get("bg")
      const templateNameFromUrl = urlParams.get("name")

      const backgroundImageUrl = bgUrl || CERTIFICATE_BG

      if (templateNameFromUrl) {
        console.log("Template name from URL:", templateNameFromUrl)
        setTemplateName(templateNameFromUrl)
      }

      console.log("Initializing new template with background:", backgroundImageUrl)

      // Load background image for new templates
      fabric.FabricImage.fromURL(backgroundImageUrl, { crossOrigin: "anonymous" })
        .then((img) => {
          console.log("Background image loaded successfully")
          if (img && img.width && img.height) {
            const scaleX = DEFAULT_RATIO.width / img.width
            const scaleY = DEFAULT_RATIO.height / img.height
            img.set({
              originX: "left",
              originY: "top",
              scaleX: scaleX,
              scaleY: scaleY,
            })
            // Fabric.js v6: assign directly to backgroundImage property
            canvas.backgroundImage = img
            canvas.renderAll()
            console.log("Background image set successfully")

            // Add default text elements after background is loaded
            addDefaultElements(canvas)
            saveHistory(canvas)
          } else {
            console.error("Background image loaded but invalid dimensions")
            // Add default elements even if background fails
            addDefaultElements(canvas)
            saveHistory(canvas)
          }
        })
        .catch((error) => {
          console.error("Failed to load background image:", error)
          // Add default elements even if background fails
          addDefaultElements(canvas)
          saveHistory(canvas)
        })
    } else {
      console.log("Editing existing template, waiting for template data to load")
    }

    // Handle object selection
    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })

    canvas.on("selection:cleared", () => {
      setSelectedObject(null)
    })

    // Handle object modification for history
    canvas.on("object:modified", () => {
      saveHistory(canvas)
    })

    setMounted(true)

    return () => {
      canvas.dispose()
    }
  }, [])

  useEffect(() => {
    if (params.id && params.id !== "new" && mounted && fabricCanvasRef.current) {
      console.log("Canvas mounted, loading template:", params.id)
      loadTemplate(params.id)
    }
  }, [params.id, mounted])

  const loadTemplate = async (id: string) => {
    try {
      const token = getAuthToken()
      const response = await apiClient.get(`/certificate-templates/${id}`, token)

      console.log("Template response:", response)

      if (response.success && response.data?.data) {
        const templateData = response.data.data

        console.log("Template data:", templateData)

        setTemplateId(id)
        setTemplateName(templateData.name)
        setTemplateVars(templateData.vars || [])

        if (templateData.template_json && fabricCanvasRef.current) {
          // Parse template_json - it may be a string or object
          const templateJson =
            typeof templateData.template_json === "string"
              ? JSON.parse(templateData.template_json)
              : templateData.template_json

          console.log("Loading template JSON into canvas")
          console.log("Template JSON has", templateJson.objects?.length || 0, "objects")

          const canvas = fabricCanvasRef.current

          // Set dimensions first
          if (templateJson.width && templateJson.height) {
            canvas.setDimensions({
              width: templateJson.width,
              height: templateJson.height,
            })
            setCanvasDimensions({ width: templateJson.width, height: templateJson.height })

            const ratio = ASPECT_RATIOS.find((r) => r.width === templateJson.width && r.height === templateJson.height)
            setSelectedRatio(ratio || DEFAULT_RATIO)
          }

          // Use await with loadFromJSON (Fabric v6 returns a Promise)
          await canvas.loadFromJSON(templateJson)
          canvas.renderAll()

          console.log("Template loaded successfully, objects:", canvas.getObjects().length)

          saveHistory(canvas) // Save initial state after loading
        }

        toast({
          title: "Template Loaded",
          description: "Certificate template loaded successfully",
        })
      } else {
        console.error("Invalid response structure:", response)
        toast({
          title: "Error",
          description: "Invalid template data received",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load template:", error)
      toast({
        title: "Error",
        description: "Failed to load certificate template",
        variant: "destructive",
      })
    }
  }

  // Changed bringToFront and sendToBack to use Fabric.js v6 API
  const bringToFront = () => {
    if (!selectedObject || !fabricCanvasRef.current) return
    fabricCanvasRef.current.bringObjectToFront(selectedObject)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)
    toast({
      title: "Brought to front",
      description: "Element moved to the top layer",
    })
  }

  const sendToBack = () => {
    if (!selectedObject || !fabricCanvasRef.current) return
    fabricCanvasRef.current.sendObjectToBack(selectedObject)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)
    toast({
      title: "Sent to back",
      description: "Element moved to the bottom layer",
    })
  }

  const bringForward = () => {
    if (!selectedObject || !fabricCanvasRef.current) return
    fabricCanvasRef.current.bringForward(selectedObject)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)
  }

  const sendBackward = () => {
    if (!selectedObject || !fabricCanvasRef.current) return
    fabricCanvasRef.current.sendBackward(selectedObject)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)
  }

  const toggleLock = () => {
    if (!selectedObject || !fabricCanvasRef.current) return

    const newLockState = !isLocked

    // Lock or unlock movement and scaling
    selectedObject.set({
      lockMovementX: newLockState,
      lockMovementY: newLockState,
      lockScalingX: newLockState,
      lockScalingY: newLockState,
      lockRotation: newLockState,
      hasControls: !newLockState, // Hide controls when locked
      selectable: true, // Keep selectable to show properties
    })

    setIsLocked(newLockState)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)

    toast({
      title: newLockState ? "Element locked" : "Element unlocked",
      description: newLockState ? "Position and size are now locked" : "You can now move and resize this element",
    })
  }

  // Add default text elements
  const addDefaultElements = (canvas: fabric.Canvas) => {
    const nameText = new fabric.Textbox("{{student_name}}", {
      left: 350,
      top: 350,
      width: 500,
      fontSize: 48,
      fontFamily: "Arial",
      fill: "#000000",
      fontWeight: "bold",
      textAlign: "center",
    })
    canvas.add(nameText)

    const dateText = new fabric.Textbox("{{dateofIssue}}", {
      left: 100,
      top: 750,
      width: 300,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
      textAlign: "left",
    })
    canvas.add(dateText)

    canvas.renderAll()
  }

  // History management
  const saveHistory = (canvas: fabric.Canvas) => {
    const json = JSON.stringify(canvas.toJSON())
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(json)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  // Renamed to saveToHistory to avoid confusion with object:modified event handler
  const saveToHistory = () => {
    if (!fabricCanvasRef.current) return
    const json = JSON.stringify(fabricCanvasRef.current.toJSON())
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(json)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyStep > 0 && fabricCanvasRef.current) {
      const newStep = historyStep - 1
      setHistoryStep(newStep)
      fabricCanvasRef.current.loadFromJSON(history[newStep], () => {
        fabricCanvasRef.current?.renderAll()
      })
    }
  }

  const handleRedo = () => {
    if (historyStep < history.length - 1 && fabricCanvasRef.current) {
      const newStep = historyStep + 1
      setHistoryStep(newStep)
      fabricCanvasRef.current.loadFromJSON(history[newStep], () => {
        fabricCanvasRef.current?.renderAll()
      })
    }
  }

  // Add elements
  const handleAddText = () => {
    if (!fabricCanvasRef.current) return

    const text = new fabric.Textbox("New Text", {
      left: 100,
      top: 100,
      width: 300,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
    })

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)

    toast({
      title: "Text added",
      description: "Double-click to edit the text, or use properties panel",
    })
  }

  const handleAddImage = () => {
    setShowImageDialog(true)
    setImageUrl("")
    setImageUploadTab("upload")
    // Reset upload states
    setImageUploading(false)
    setImageUploadProgress(0)
  }

  const handleImageUpload = async (file: File) => {
    if (!fabricCanvasRef.current) return

    console.log("Uploading image file to certificate-res:", file.name)
    setImageUploading(true)
    setImageUploadProgress(0)

    try {
      const filePath = `certificate-res/${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const contentType = file.type || "application/octet-stream"

      // Check if file is large (> 50MB) - use presigned URL
      const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024

      if (file.size > LARGE_FILE_THRESHOLD) {
        // Use presigned URL for large files
        const presignResponse = await fetch(
          `${API_BASE_URL}/r2/static-bucket/presign?key=${encodeURIComponent(filePath)}`,
        )
        const presignData = await presignResponse.json()

        if (!presignData.success) {
          throw new Error(presignData.error || "Failed to get presigned URL")
        }

        // Upload to presigned URL
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100)
              setImageUploadProgress(percent)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error("Upload failed"))

          xhr.open("PUT", presignData.url)
          xhr.send(file)
        })
      } else {
        // Direct upload for smaller files
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100)
              setImageUploadProgress(percent)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error("Upload failed"))

          xhr.open(
            "POST",
            `${API_BASE_URL}/static/objects?path=${encodeURIComponent(filePath)}&contentType=${encodeURIComponent(contentType)}`,
          )
          xhr.send(file)
        })
      }

      // Construct the CDN URL
      const uploadedImageUrl = `https://cdn.digitalmadrasa.co.in/${filePath}`
      console.log("Image uploaded successfully:", uploadedImageUrl)

      // Add image to canvas using the uploaded URL
      addImageToCanvas(uploadedImageUrl)
      setShowImageDialog(false)

      toast({
        title: "Image uploaded",
        description: "Image has been added to the certificate",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setImageUploading(false)
      setImageUploadProgress(0)
    }
  }

  const handleImageUrl = () => {
    if (!imageUrl || !fabricCanvasRef.current) {
      toast({
        title: "Error",
        description: "Please enter a valid image URL",
        variant: "destructive",
      })
      return
    }
    console.log("Adding image from URL:", imageUrl)
    addImageToCanvas(imageUrl)
    setShowImageDialog(false)
    setImageUrl("")
  }

  const addImageToCanvas = (imgUrl: string) => {
    if (!fabricCanvasRef.current) return

    console.log("Loading image into canvas:", imgUrl)

    fabric.FabricImage.fromURL(imgUrl, { crossOrigin: "anonymous" })
      .then((img) => {
        if (!img || !img.width || !img.height) {
          console.error("Failed to load image - invalid dimensions")
          toast({
            title: "Error",
            description: "Failed to load image. Please check the URL or try a different image.",
            variant: "destructive",
          })
          return
        }

        console.log("Image loaded successfully, dimensions:", img.width, "x", img.height)

        // Scale image to fit better on canvas
        const maxWidth = 400
        const maxHeight = 400
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

        img.scale(scale)
        img.set({
          left: 100,
          top: 100,
        })
        fabricCanvasRef.current?.add(img)
        fabricCanvasRef.current?.setActiveObject(img)
        fabricCanvasRef.current?.renderAll()
        saveHistory(fabricCanvasRef.current!)

        toast({
          title: "Image added",
          description: "Image added to certificate",
        })
      })
      .catch((error) => {
        console.error("Failed to load image:", error)
        toast({
          title: "Error",
          description: "Failed to load image. Please check the URL or try a different image.",
          variant: "destructive",
        })
      })
  }

  // Removed handleEditBackground, handleBackgroundUpload, handleBackgroundUrl, setBackgroundImage

  const extractVariables = (): string[] => {
    if (!fabricCanvasRef.current) return []

    const vars = new Set<string>()
    const objects = fabricCanvasRef.current.getObjects()

    objects.forEach((obj: any) => {
      if (obj.type === "textbox" && obj.text) {
        const matches = obj.text.match(/\{\{([^}]+)\}\}/g)
        if (matches) {
          matches.forEach((match: string) => {
            vars.add(match)
          })
        }
      }
    })

    return Array.from(vars)
  }

  const handleRatioChange = (ratioValue: string) => {
    const ratio = ASPECT_RATIOS.find((r) => r.value === ratioValue)
    if (!ratio || !fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    const oldWidth = canvasDimensions.width
    const oldHeight = canvasDimensions.height

    // Calculate scale factors
    const scaleX = ratio.width / oldWidth
    const scaleY = ratio.height / oldHeight

    // Update canvas dimensions
    canvas.setWidth(ratio.width)
    canvas.setHeight(ratio.height)

    // Scale and reposition all objects
    const objects = canvas.getObjects()
    objects.forEach((obj) => {
      obj.set({
        left: (obj.left || 0) * scaleX,
        top: (obj.top || 0) * scaleY,
        scaleX: (obj.scaleX || 1) * scaleX,
        scaleY: (obj.scaleY || 1) * scaleY,
      })
      obj.setCoords()
    })

    // Scale background image if exists
    if (canvas.backgroundImage) {
      const bgImg = canvas.backgroundImage as fabric.FabricImage
      bgImg.set({
        scaleX: ratio.width / (bgImg.width || ratio.width),
        scaleY: ratio.height / (bgImg.height || ratio.height),
      })
    }

    canvas.renderAll()
    setSelectedRatio(ratio)
    setCanvasDimensions({ width: ratio.width, height: ratio.height })
    saveToHistory()
  }

  const handleSave = async () => {
    // Check if templateId is not null
    if (!fabricCanvasRef.current || !templateId) {
      toast({
        title: "Cannot Save",
        description: "Template must be published first",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const token = getAuthToken()
      const templateJson = fabricCanvasRef.current.toJSON()
      const vars = extractVariables()

      // Add width and height to template_json
      const response = await apiClient.put(
        `/certificate-templates/${templateId}`,
        {
          name: templateName,
          vars,
          template_json: { ...templateJson, width: canvasDimensions.width, height: canvasDimensions.height },
        },
        token,
      )

      if (response.success) {
        toast({
          title: "Template Saved",
          description: "Your certificate template has been updated",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save template",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!fabricCanvasRef.current) {
      toast({
        title: "Cannot Publish",
        description: "Please design your certificate first",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)
    try {
      const token = getAuthToken()
      const templateJson = fabricCanvasRef.current.toJSON()
      const vars = extractVariables()

      const canvas = fabricCanvasRef.current
      const backgroundImage = canvas.backgroundImage as fabric.FabricImage | undefined
      const templateThumbnail = backgroundImage?.getSrc?.() || backgroundImage?.src || null

      // Add width and height to template_json
      const response = await apiClient.post(
        "/certificate-templates",
        {
          name: templateName,
          vars,
          template_json: { ...templateJson, width: canvasDimensions.width, height: canvasDimensions.height },
          template_thumbnail: templateThumbnail, // Pass background URL as thumbnail
        },
        token,
      )

      if (response.success && response.data) {
        setTemplateId(response.data.id)
        toast({
          title: "Template Published",
          description: "Your certificate template is now available",
        })
        router.push("/admin/certificates")
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to publish template",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error publishing template:", error)
      toast({
        title: "Error",
        description: "Failed to publish template",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Delete selected object
  const handleDelete = () => {
    if (!fabricCanvasRef.current || !selectedObject) return

    fabricCanvasRef.current.remove(selectedObject)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)
    setSelectedObject(null)
  }

  // Download certificate
  const handleDownload = () => {
    if (!fabricCanvasRef.current) return

    // Deselect all objects before export
    fabricCanvasRef.current.discardActiveObject()
    fabricCanvasRef.current.renderAll()

    const dataUrl = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // Higher resolution
    })

    const link = document.createElement("a")
    link.download = `certificate-${Date.now()}.png`
    link.href = dataUrl
    link.click()

    toast({
      title: "Certificate downloaded",
      description: "Your certificate has been saved",
    })
  }

  // Update selected object properties
  const updateProperty = (property: string, value: any) => {
    if (!selectedObject || !fabricCanvasRef.current) return

    if (property === "fontFamily") {
      loadGoogleFont(value)
    }

    selectedObject.set(property as any, value)
    fabricCanvasRef.current.renderAll()
    saveHistory(fabricCanvasRef.current)
  }

  // Text formatting
  const toggleBold = () => {
    if (!selectedObject || selectedObject.type !== "textbox") return
    const current = (selectedObject as fabric.Textbox).fontWeight
    updateProperty("fontWeight", current === "bold" ? "normal" : "bold")
  }

  const toggleItalic = () => {
    if (!selectedObject || selectedObject.type !== "textbox") return
    const current = (selectedObject as fabric.Textbox).fontStyle
    updateProperty("fontStyle", current === "italic" ? "normal" : "italic")
  }

  const toggleUnderline = () => {
    if (!selectedObject || selectedObject.type !== "textbox") return
    const current = (selectedObject as fabric.Textbox).underline
    updateProperty("underline", !current)
  }

  // Renamed handleInsertVariable to match the new state name
  const handleInsertVariable = (variable: string) => {
    if (!selectedObject || selectedObject.type !== "textbox" || !fabricCanvasRef.current) {
      toast({
        title: "No text selected",
        description: "Please select a text element first",
        variant: "destructive",
      })
      return
    }

    const textObj = selectedObject as fabric.Textbox
    const currentText = textObj.text || ""
    const newText = currentText + " " + variable

    updateProperty("text", newText)
    setShowInsertVariableDialog(false) // Use the new state name

    toast({
      title: "Variable inserted",
      description: `${variable} has been added to the text`,
    })
  }

  // Get selected object properties
  const getTextProperty = (property: string, defaultValue: any = "") => {
    if (!selectedObject || selectedObject.type !== "textbox") return defaultValue
    return (selectedObject as any)[property] || defaultValue
  }

  // Updated handleSelectionCreated and handleSelectionUpdated to also set the lock state
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    const handleSelectionCreated = (e: any) => {
      const obj = e.selected?.[0]
      setSelectedObject(obj || null)
      if (obj) {
        setIsLocked(obj.lockMovementX === true && obj.lockMovementY === true)
      }
    }

    const handleSelectionUpdated = (e: any) => {
      const obj = e.selected?.[0]
      setSelectedObject(obj || null)
      if (obj) {
        setIsLocked(obj.lockMovementX === true && obj.lockMovementY === true)
      }
    }

    const handleSelectionCleared = () => {
      setSelectedObject(null)
      setIsLocked(false)
    }

    canvas.on("selection:created", handleSelectionCreated)
    canvas.on("selection:updated", handleSelectionUpdated)
    canvas.on("selection:cleared", handleSelectionCleared)

    return () => {
      canvas.off("selection:created", handleSelectionCreated)
      canvas.off("selection:updated", handleSelectionUpdated)
      canvas.off("selection:cleared", handleSelectionCleared)
    }
  }, [])

  return (
    // Use h-screen and overflow-hidden for main container
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top Bar - Responsive */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] text-white px-4 md:px-6 py-3 md:py-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/certificates")}
              className="gap-2 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/30 hidden md:block" />
            {/* <h1 className="text-base md:text-lg font-heading font-semibold">Certificate Editor</h1> */}
            {/* Updated title to show template name */}
            <div>
              <h1 className="text-base md:text-lg font-heading font-bold">{templateName}</h1>
              <p className="text-xs text-white/80">Certificate Editor</p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Select value={selectedRatio.value} onValueChange={handleRatioChange}>
              <SelectTrigger className="w-[140px] h-8 bg-white/10 border-white/30 text-white text-sm">
                <RectangleHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ratio" />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label} ({ratio.width}x{ratio.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Separator orientation="vertical" className="h-6 bg-white/30" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyStep <= 0}
              className="gap-1 text-white hover:bg-white/20"
            >
              <Undo className="w-4 h-4" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              className="gap-1 text-white hover:bg-white/20"
            >
              <Redo className="w-4 h-4" />
              Redo
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/30" />
            {/* <Button onClick={handleSave} size="sm" variant="ghost" className="gap-2 text-white hover:bg-white/20">
              <Save className="w-4 h-4" />
              Save
            </Button> */}
            {templateId ? (
              <Button
                onClick={handleSave}
                size="sm"
                variant="ghost"
                className="gap-2 text-white hover:bg-white/20"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                size="sm"
                className="gap-2 bg-white text-[#0066ff] hover:bg-gray-100"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0066ff]"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            )}
            <Button onClick={handleDownload} size="sm" className="gap-2 bg-white text-[#0066ff] hover:bg-gray-100">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-white hover:bg-white/20"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0052cc] border-t border-white/20 p-4 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-white text-sm">Aspect Ratio:</Label>
                <Select value={selectedRatio.value} onValueChange={handleRatioChange}>
                  <SelectTrigger className="flex-1 h-8 bg-white/10 border-white/30 text-white text-sm">
                    <SelectValue placeholder="Ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={historyStep <= 0}
                className="gap-1 text-white hover:bg-white/20 flex-1"
              >
                <Undo className="w-4 h-4" />
                Undo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                className="gap-1 text-white hover:bg-white/20 flex-1"
              >
                <Redo className="w-4 h-4" />
                Redo
              </Button>
              {/* <Button onClick={handleSave} size="sm" className="gap-2 bg-white/20 text-white hover:bg-white/30 w-full">
                <Save className="w-4 h-4" />
                Save Template
              </Button> */}
              {templateId ? (
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gap-2 bg-white/20 text-white hover:bg-white/30 w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Template"}
                </Button>
              ) : (
                <Button
                  onClick={handlePublish}
                  size="sm"
                  className="gap-2 bg-white text-[#0066ff] hover:bg-gray-100 w-full"
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0066ff]"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isPublishing ? "Publishing..." : "Publish Template"}
                </Button>
              )}
              <Button
                onClick={handleDownload}
                size="sm"
                className="gap-2 bg-white text-[#0066ff] hover:bg-gray-100 w-full"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas Area - Responsive with centered canvas */}
        <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
          <div
            className="bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
              maxWidth: "100%",
            }}
          >
            <canvas ref={canvasRef} />
          </div>

          {/* Floating Toolbar - Responsive */}
          {/* Changed to absolute positioning and added Braces icon */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 flex items-center gap-2 z-10">
            <Button onClick={handleAddText} variant="outline" size="sm" className="gap-2 bg-transparent">
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Add Text</span>
            </Button>
            <Button onClick={() => setShowImageDialog(true)} variant="outline" size="sm" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Add Image</span>
            </Button>
            <Button onClick={() => setShowInsertVariableDialog(true)} variant="outline" size="sm" className="gap-2">
              <Braces className="w-4 h-4" />
              <span className="hidden sm:inline">Insert Variable</span>
            </Button>
          </div>
        </div>

        {/* Right Panel - Properties - Responsive */}
        {selectedObject && (
          <div className="w-full lg:w-80 bg-white border-t lg:border-l lg:border-t-0 border-gray-200 p-4 md:p-6 overflow-auto max-h-[400px] lg:max-h-none">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-heading font-semibold">
                {selectedObject.type === "textbox" && "Text Properties"}
                {selectedObject.type === "image" && "Image Properties"}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLock}
                  className={`gap-2 ${isLocked ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100" : "hover:bg-gray-50"}`}
                  title={isLocked ? "Unlock element" : "Lock element"}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isLocked ? "Locked" : "Unlocked"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLocked && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  This element is locked. Position and size cannot be changed on canvas.
                </p>
              </div>
            )}

            <div className="space-y-4 md:space-y-6">
              {/* Position */}
              <div className="space-y-3 md:space-y-4">
                <Label className="text-sm font-semibold text-gray-700">Position</Label>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">X Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedObject.left || 0)}
                      onChange={(e) => updateProperty("left", Number.parseFloat(e.target.value))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Y Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedObject.top || 0)}
                      onChange={(e) => updateProperty("top", Number.parseFloat(e.target.value))}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Text Properties */}
              {selectedObject.type === "textbox" && (
                <>
                  <Separator />
                  <div className="space-y-3 md:space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">Text Content</Label>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Text (or double-click on canvas)</Label>
                      <Input
                        value={getTextProperty("text")}
                        onChange={(e) => updateProperty("text", e.target.value)}
                        className="h-9"
                        placeholder="Use {{variable_name}} for placeholders"
                      />
                      <p className="text-xs text-gray-500">
                        Tip: Use variables like {"{{student_name}}"} for dynamic content
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Font Size: {getTextProperty("fontSize", 20)}px</Label>
                      <Slider
                        value={[getTextProperty("fontSize", 20)]}
                        onValueChange={([value]) => updateProperty("fontSize", value)}
                        min={8}
                        max={120}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Font Family</Label>
                      <Select
                        value={getTextProperty("fontFamily", "Arial")}
                        onValueChange={(value) => updateProperty("fontFamily", value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {GOOGLE_FONTS.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              <span style={{ fontFamily: font.value }}>{font.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Includes Google Fonts and system fonts</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Text Style</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleBold}
                          className={`flex-1 ${getTextProperty("fontWeight") === "bold" ? "bg-[#0066ff] text-white" : ""}`}
                        >
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleItalic}
                          className={`flex-1 ${getTextProperty("fontStyle") === "italic" ? "bg-[#0066ff] text-white" : ""}`}
                        >
                          <Italic className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleUnderline}
                          className={`flex-1 ${getTextProperty("underline") ? "bg-[#0066ff] text-white" : ""}`}
                        >
                          <Underline className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Text Alignment</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${getTextProperty("textAlign") === "left" ? "bg-[#0066ff] text-white" : ""}`}
                          onClick={() => updateProperty("textAlign", "left")}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${getTextProperty("textAlign") === "center" ? "bg-[#0066ff] text-white" : ""}`}
                          onClick={() => updateProperty("textAlign", "center")}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${getTextProperty("textAlign") === "right" ? "bg-[#0066ff] text-white" : ""}`}
                          onClick={() => updateProperty("textAlign", "right")}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={getTextProperty("fill", "#000000")}
                          onChange={(e) => updateProperty("fill", e.target.value)}
                          className="h-10 w-20"
                        />
                        <Input
                          value={getTextProperty("fill", "#000000")}
                          onChange={(e) => updateProperty("fill", e.target.value)}
                          className="h-10 flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Letter Spacing: {Math.round(getTextProperty("charSpacing", 0))}
                      </Label>
                      <Slider
                        value={[getTextProperty("charSpacing", 0)]}
                        onValueChange={([value]) => updateProperty("charSpacing", value)}
                        min={-50}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Line Height: {getTextProperty("lineHeight", 1).toFixed(2)}
                      </Label>
                      <Slider
                        value={[getTextProperty("lineHeight", 1)]}
                        onValueChange={([value]) => updateProperty("lineHeight", value)}
                        min={0.5}
                        max={3}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Text Width: {Math.round(getTextProperty("width", 200))}px
                      </Label>
                      <Slider
                        value={[getTextProperty("width", 200)]}
                        onValueChange={([value]) => updateProperty("width", value)}
                        min={50}
                        max={1000}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Opacity: {Math.round(getTextProperty("opacity", 1) * 100)}%
                      </Label>
                      <Slider
                        value={[getTextProperty("opacity", 1) * 100]}
                        onValueChange={([value]) => updateProperty("opacity", value / 100)}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Image Properties */}
              {selectedObject.type === "image" && (
                <>
                  <Separator />
                  <div className="space-y-3 md:space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">Image Scale</Label>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Scale: {Math.round((selectedObject.scaleX || 1) * 100)}%
                      </Label>
                      <Slider
                        value={[(selectedObject.scaleX || 1) * 100]}
                        onValueChange={([value]) => {
                          const scale = value / 100
                          updateProperty("scaleX", scale)
                          updateProperty("scaleY", scale)
                        }}
                        min={10}
                        max={200}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Opacity: {Math.round((selectedObject.opacity || 1) * 100)}%
                      </Label>
                      <Slider
                        value={[(selectedObject.opacity || 1) * 100]}
                        onValueChange={([value]) => updateProperty("opacity", value / 100)}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Removed Edit Background Sidebar */}
      </div>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>

          <Tabs value={imageUploadTab} onValueChange={setImageUploadTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${imageUploading
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-300 hover:border-[#0066ff] cursor-pointer"
                  }`}
                onClick={() => !imageUploading && fileInputRef.current?.click()}
              >
                {imageUploading ? (
                  <div className="space-y-3">
                    <Loader2 className="w-10 h-10 mx-auto text-blue-500 animate-spin" />
                    <p className="text-sm text-blue-600 font-medium">Uploading... {imageUploadProgress}%</p>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${imageUploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 50MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={imageUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImageDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImageUrl} className="bg-[#0066ff] hover:bg-[#0052cc]">
                  Add Image
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Updated Dialog for Insert Variable */}
      <Dialog open={showInsertVariableDialog} onOpenChange={setShowInsertVariableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Variable</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Select a variable to insert into your text. Variables will be replaced with actual data when certificates
              are generated.
            </p>

            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-auto">
              {/* Use templateVars state here instead of hardcoded CERTIFICATE_VARIABLES */}
              {/* Always show Default Variables first */}
              {CERTIFICATE_VARIABLES.map((variable) => (
                <Button
                  key={variable.value}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 bg-transparent"
                  onClick={() => handleInsertVariable(variable.value)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{variable.label}</span>
                    <span className="text-xs text-gray-500 font-mono">{variable.value}</span>
                  </div>
                </Button>
              ))}

              {/* Show Custom Variables found in template that are not in defaults */}
              {templateVars
                .filter((v) => !CERTIFICATE_VARIABLES.some((cv) => cv.value === v))
                .map((variable) => (
                  <Button
                    key={variable}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 bg-transparent"
                    onClick={() => handleInsertVariable(variable)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{variable.replace(/[{}]/g, "")}</span>
                      <span className="text-xs text-gray-500 font-mono">{variable}</span>
                    </div>
                  </Button>
                ))}
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                You can also manually type variables in the format: {"{{variable_name}}"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
