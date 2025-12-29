"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Mail, Clock, Send } from "lucide-react"
import apiClient from "@/lib/api-client"
import { getCurrentUser, getUserToken } from "@/lib/user-auth"
import { useToast } from "@/hooks/use-toast"

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const faqs = [
    {
      category: "account",
      question: "How do I reset my password?",
      answer:
        'Go to Settings > Security and click on "Change Password". You\'ll receive a verification email to confirm the change.',
    },
    {
      category: "account",
      question: "Can I change my email address?",
      answer:
        "Yes, you can update your email in Settings > Profile. You'll need to verify the new email address before it becomes active.",
    },
    {
      category: "billing",
      question: "What payment methods do you accept?",
      answer:
        "We accept UPI, Credit Cards (Visa, Mastercard), Debit Cards, and PhonePe. All payments are processed securely.",
    },
    {
      category: "billing",
      question: "Is there a monthly payment option?",
      answer:
        "Currently, we offer yearly enrollment at ₹5,988 (just ₹499/month). This gives you access to all current and future skills.",
    },
    {
      category: "courses",
      question: "How do I access my enrolled courses?",
      answer:
        'Navigate to "My Skills" from the sidebar to see all your enrolled courses. Click on any course to resume learning.',
    },
    {
      category: "courses",
      question: "Are courses updated regularly?",
      answer:
        "Yes! All courses are regularly updated with the latest content and industry practices. You get lifetime access to all updates.",
    },
    {
      category: "courses",
      question: "Can I download course materials?",
      answer:
        "Course videos are available for streaming only, but you can download PDFs, resources, and project files from each lesson.",
    },
    {
      category: "technical",
      question: "The video player is not working",
      answer:
        "Try clearing your browser cache or switching to a different browser. If the issue persists, contact support with details about your device and browser.",
    },
    {
      category: "technical",
      question: "Can I access courses on mobile?",
      answer: "Yes! Our platform is fully mobile-responsive. You can learn on any device - phone, tablet, or computer.",
    },
    {
      category: "certificates",
      question: "How do I get my course certificate?",
      answer:
        'Complete all lessons in a course to unlock your certificate. Visit the "Certificates" section to view and download them.',
    },
    {
      category: "certificates",
      question: "Are certificates recognized?",
      answer:
        "Our certificates are industry-recognized and showcase your skills. They include verification codes that employers can validate.",
    },
  ]

  const categories = [
    { id: "all", label: "All Questions", count: faqs.length },
    { id: "account", label: "Account", count: faqs.filter((f) => f.category === "account").length },
    { id: "billing", label: "Billing", count: faqs.filter((f) => f.category === "billing").length },
    { id: "courses", label: "Courses", count: faqs.filter((f) => f.category === "courses").length },
    { id: "technical", label: "Technical", count: faqs.filter((f) => f.category === "technical").length },
    { id: "certificates", label: "Certificates", count: faqs.filter((f) => f.category === "certificates").length },
  ]

  const filteredFaqs = selectedCategory === "all" ? faqs : faqs.filter((faq) => faq.category === selectedCategory)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)

    try {
      const user = getCurrentUser()
      const token = getUserToken()

      // In dev mode, use a dummy user_id if no user is logged in
      const userId = user?.id || 1

      const response = await apiClient.post(
        "/support-requests",
        {
          user_id: userId,
          subject: formData.subject,
          message: formData.message,
          status: "open",
        },
        token || undefined,
      )

      if (response.success) {
        toast({
          title: "Support request submitted",
          description: "We'll get back to you within 24 hours.",
        })

        // Reset form
        setFormData({ subject: "", message: "" })
      } else {
        toast({
          title: "Failed to submit request",
          description: response.message || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Support request error:", error)
      toast({
        title: "Error",
        description: "Failed to submit support request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="p-4 lg:p-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-heading font-bold text-4xl lg:text-5xl text-gray-900 mb-4">How can we help you?</h1>
        <p className="text-gray-600 text-base lg:text-lg">
          Get answers to common questions or reach out to our support team
        </p>
      </div>

      {/* Email Support Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 lg:p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-[#0066ff] rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-xl lg:text-2xl text-gray-900 mb-1">Email Support</h3>
            <p className="text-gray-600 mb-2">Get help via email - we respond within 24 hours</p>
            <a
              href="mailto:support@digitalmadarsa.com"
              className="text-[#0066ff] font-semibold hover:underline inline-flex items-center gap-2"
            >
              support@digitalmadarsa.com
              <Mail className="w-4 h-4" />
            </a>
          </div>
          <Button className="bg-[#0066ff] hover:bg-[#0052cc] text-white px-6 w-full lg:w-auto">
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      {/* FAQs Section */}
      <div>
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-gray-900 mb-3">Frequently Asked Questions</h2>
          <p className="text-gray-600 text-base lg:text-lg">Find quick answers to common questions</p>
        </div>

        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? "bg-[#0066ff] text-white shadow-lg shadow-blue-200"
                  : "bg-white text-gray-600 border-2 border-gray-200 hover:border-[#0066ff]/50 hover:shadow-md"
              }`}
            >
              {category.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  selectedCategory === category.id ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-[#0066ff]/50 hover:shadow-lg transition-all"
            >
              <AccordionTrigger className="px-6 py-5 font-semibold text-gray-900 hover:text-[#0066ff] text-left hover:no-underline">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#0066ff]">{index + 1}</span>
                  </div>
                  <span className="text-base">{faq.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 pl-[4.5rem]">
                <p className="text-gray-600 leading-relaxed text-[15px]">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-2xl p-6 lg:p-10 border-2 border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-2xl lg:text-3xl text-gray-900 mb-3">Still need help?</h2>
            <p className="text-gray-600">Send us a message and we'll get back to you within 24 hours</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <Input
                placeholder="What do you need help with?"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full h-12 text-base"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <Textarea
                placeholder="Describe your issue or question in detail..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full min-h-[180px] text-base"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0066ff] hover:bg-[#0052cc] gap-2 py-6 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-[#0066ff] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Response Time</p>
                <p className="text-sm text-gray-600">We typically respond within 24 hours on business days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
