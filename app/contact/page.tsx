"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { apiClient } from "@/lib/api-client"
import { Loader2, Send } from "lucide-react"

export default function ContactPage() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Since backend Support Requests table might not have name/email columns for guests,
            // we prepend them to the message body.
            const fullMessage = `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`

            const payload = {
                subject: formData.subject,
                message: fullMessage,
                status: 'open'
            }

            const res = await apiClient.post("/support-requests", payload)

            if (res.success) {
                toast.success("Message sent successfully! We will get back to you soon.")
                setFormData({ name: "", email: "", subject: "", message: "" })
            } else {
                toast.error(res.message || "Failed to send message. Please try again.")
            }
        } catch (error) {
            console.error("Contact form error:", error)
            toast.error("An error occurred. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 py-16 px-6 flex items-center justify-center">
                <div className="max-w-xl w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                            Get in Touch
                        </h1>
                        <p className="text-slate-400">
                            Have questions or need assistance? Fill out the form below and our team will help you.
                        </p>
                    </div>

                    <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Contact Us</CardTitle>
                            <CardDescription>We usually respond within 24 hours.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="bg-slate-950/50 border-white/10 focus-visible:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            className="bg-slate-950/50 border-white/10 focus-visible:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                        className="bg-slate-950/50 border-white/10 focus-visible:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Tell us more about your inquiry..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        rows={5}
                                        className="bg-slate-950/50 border-white/10 focus-visible:ring-blue-500"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    )
}
