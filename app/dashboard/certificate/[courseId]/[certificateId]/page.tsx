"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getUser, getUserToken } from "@/lib/user-auth"
import { Loader2, Download, AlertCircle, CheckCircle2, ChevronLeft, FileImage, FileText } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://srv.digitalmadrasa.co.in/api/v1"

export default function CertificatePage() {
    const params = useParams()
    const courseId = params.courseId as string
    const certificateId = params.certificateId as string

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricRef = useRef<any>(null) // Fabric Canvas Instance

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [course, setCourse] = useState<any>(null)
    const [certificate, setCertificate] = useState<any>(null)
    const [template, setTemplate] = useState<any>(null)
    const [studentName, setStudentName] = useState<string>("")
    const [generated, setGenerated] = useState(false)

    const currentUser = getUser()

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const token = getUserToken()
                const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}

                // 1. Fetch Certificate
                const certRes = await fetch(`${API_BASE_URL}/learner-certificates/${certificateId}`, { headers })
                const certJson = await certRes.json()
                if (!certJson.success) throw new Error("Certificate not found")
                // Need to handle if certJson.data is empty or mismatched
                const certData = certJson.data;
                setCertificate(certData)

                // 2. Fetch Course Details
                // Use courseId from params or certData
                const cid = certData.course_id || courseId;
                const courseRes = await fetch(`${API_BASE_URL}/courses/${cid}`, { headers })
                const courseJson = await courseRes.json()
                if (!courseJson.success) throw new Error("Failed to load course")
                setCourse(courseJson.data)

                // 3. Determine Student Name
                if (certData.user_id) {
                    if (currentUser && currentUser.id === certData.user_id) {
                        setStudentName((currentUser as any).name || (currentUser as any).full_name || "Student Name")
                    } else {
                        // Try to fetch user details
                        try {
                            const userRes = await fetch(`${API_BASE_URL}/users/${certData.user_id}`, { headers })
                            const userJson = await userRes.json()
                            if (userJson.success) {
                                setStudentName(userJson.data.name || userJson.data.full_name)
                            }
                        } catch (e) { console.warn("Could not fetch user info"); }
                    }
                }

                // 4. Fetch Template
                const tplId = certData.certificate_template_id || courseJson.data.certificate_template_id;
                if (tplId) {
                    const tplRes = await fetch(`${API_BASE_URL}/certificate-templates/${tplId}`, { headers })
                    const tplJson = await tplRes.json()
                    if (tplJson.success) setTemplate(tplJson.data)
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load certificate data")
            } finally {
                setLoading(false)
            }
        }

        if (certificateId) {
            fetchData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, certificateId, currentUser?.id])

    // Draw Certificate using Fabric.js
    useEffect(() => {
        if (!course || !canvasRef.current || loading) return

        async function initFabric() {
            try {
                const fabric = await import('fabric');

                if (fabricRef.current) {
                    fabricRef.current.dispose();
                }

                if (!canvasRef.current) return;

                // Determine dimensions
                let width = 2000;
                let height = 1414;
                let tJson = template?.template_json;
                if (tJson && (typeof tJson === 'string')) {
                    try { tJson = JSON.parse(tJson); } catch (e) { }
                }

                if (tJson && tJson.width) width = tJson.width;
                if (tJson && tJson.height) height = tJson.height;

                // Use StaticCanvas for Readonly Mode
                const canvas = new fabric.StaticCanvas(canvasRef.current, {
                    width: width,
                    height: height,
                    backgroundColor: "#ffffff",
                    renderOnAddRemove: false // Optimize
                });
                fabricRef.current = canvas;

                if (tJson) {
                    await canvas.loadFromJSON(tJson);
                }

                // Prepare Data
                // Use actual certificate ID from DB or fallback
                const displayCertId = certificate?.id ? `CERT-${certificate.id}` : certificateId;

                const dateStr = certificate?.issue_timestamp
                    ? new Date(certificate.issue_timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : new Date().toLocaleDateString();

                // Replace Variables
                const objects = canvas.getObjects();

                objects.forEach((obj: any) => {
                    if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
                        if (obj.text) {
                            let text = obj.text;
                            text = text.replace(/{{certificate_id}}/g, displayCertId);
                            text = text.replace(/{{student_name}}/g, studentName || "Student Name");
                            text = text.replace(/{{course_name}}/g, course.title);
                            text = text.replace(/{{course_title}}/g, course.title);
                            text = text.replace(/{{instructor_name}}/g, course.instructor || "");
                            text = text.replace(/{{date}}/g, dateStr);
                            text = text.replace(/{{certificateID}}/g, displayCertId);
                            text = text.replace(/{{dateofIssue}}/g, dateStr);
                            obj.set('text', text);
                        }
                    }
                });

                // Fallback if empty
                if (objects.length === 0) {
                    // Programmatic Layout
                    const rect = new fabric.Rect({
                        left: 40, top: 40, width: width - 80, height: height - 80,
                        fill: 'transparent', stroke: '#0066ff', strokeWidth: 40, rx: 20, ry: 20
                    });
                    canvas.add(rect);

                    const title = new fabric.Text("Certificate of Completion", {
                        left: width / 2, top: 300, fontSize: 100, originX: 'center', fontFamily: 'serif', fontWeight: 'bold'
                    });
                    canvas.add(title);

                    const nameText = new fabric.Text(studentName || "Student Name", {
                        left: width / 2, top: 600, fontSize: 80, originX: 'center', fontFamily: 'sans-serif', fontWeight: 'bold', fill: '#000000'
                    });
                    canvas.add(nameText);

                    const courseText = new fabric.Text(course.title, {
                        left: width / 2, top: 800, fontSize: 70, originX: 'center', fontFamily: 'sans-serif', fill: '#0066ff'
                    });
                    canvas.add(courseText);

                    const idText = new fabric.Text(`ID: ${displayCertId}`, {
                        left: 100, top: height - 100, fontSize: 30, fill: '#9ca3af'
                    });
                    canvas.add(idText);
                }

                canvas.renderAll();
                setGenerated(true);

            } catch (e) {
                console.error(e);
                setError("Failed to render certificate");
            }
        }

        initFabric();

        return () => { }

    }, [course, template, certificate, loading, studentName, certificateId])

    const handleDownload = async (format: 'png' | 'pdf') => {
        if (!fabricRef.current) return

        // 1. High Quality Image Data (Multiplier 2)
        const dataURL = fabricRef.current.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
        });

        const filename = `Certificate - ${course?.title || 'Course'}`;

        if (format === 'png') {
            const link = document.createElement('a')
            link.download = `${filename}.png`
            link.href = dataURL
            link.click()
        } else {
            // PDF Logic
            try {
                const jsPDFModule = await import('jspdf');
                const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;

                // Dynamic Page Size: Set PDF size to match Image dimensions exactly
                const srcWidth = fabricRef.current.width;
                const srcHeight = fabricRef.current.height;
                const orientation = srcWidth > srcHeight ? 'landscape' : 'portrait';

                const doc = new jsPDF({
                    orientation: orientation,
                    unit: 'px',
                    format: [srcWidth, srcHeight] // Custom format
                });

                // Add image filling the entire PDF page
                doc.addImage(dataURL, 'PNG', 0, 0, srcWidth, srcHeight);
                doc.save(`${filename}.pdf`);
            } catch (e) {
                console.error("PDF Error", e);
                alert("Failed to generate PDF");
            }
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/dashboard" className="px-4 py-2 bg-gray-200 rounded-lg">Back</Link>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/skills/${courseId}`} className="text-gray-500 hover:text-gray-900 transition">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900 hidden md:block">
                        Certificate: {course?.title}
                    </h1>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={!generated} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Download className="w-4 h-4" /> Download Certificate
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload('png')}>
                            <FileImage className="w-4 h-4 mr-2" /> Download PNG (Image)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                            <FileText className="w-4 h-4 mr-2" /> Download PDF (Document)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto bg-gray-100">
                <style jsx global>{`
              .canvas-container {
                  max-width: 100% !important;
                  height: auto !important;
              }
              .canvas-container canvas {
                  width: 100% !important;
                  height: auto !important;
              }
           `}</style>
                <div className="bg-white p-2 shadow-2xl rounded-xl relative max-w-full">
                    <canvas
                        ref={canvasRef}
                        className="max-w-full h-auto border border-gray-200 block"
                    />
                </div>
            </div>
        </div>
    )
}
