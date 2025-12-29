"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Mail, Clock, Send, Loader2 } from "lucide-react"
import apiClient from "@/lib/api-client"
import { getUser } from "@/lib/user-auth"
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
      category: "payments",
      question: "How do I get paid?",
      answer:
        "Payments are processed automatically on the 15th of each month. You can choose between PayPal, bank transfer, or UPI for receiving your earnings.",
    },
    {
      category: "payments",
      question: "What is the minimum payout threshold?",
      answer:
        "The minimum payout threshold is ₹1,000. Once you reach this amount, your earnings will be automatically transferred on the next payment cycle.",
    },
    {
      category: "commissions",
      question: "What is the commission rate?",
      answer:
        "You earn 25% commission on all sales from your referrals for the first 12 months. This includes both new enrollments and renewals.",
    },
    {
      category: "commissions",
      question: "Do I earn recurring commissions?",
      answer:
        "Yes! You continue to earn 25% commission on your referrals for their entire first year, including any renewals or upgrades they make.",
    },
    {
      category: "referrals",
      question: "How can I track my referrals?",
      answer:
        'Visit the "Referrals" page to see all users who signed up through your link, their status, and earnings generated from each referral.',
    },
    {
      category: "referrals",
      question: "How long does a referral cookie last?",
      answer:
        "Our referral cookies last for 90 days. If someone clicks your link and signs up within 90 days, you'll get credit for the referral.",
    },
    {
      category: "links",
      question: "Can I customize my referral link?",
      answer:
        'Yes! Go to Settings to customize your referral link URL. You can create a memorable vanity URL like "digitalmadarsa.com/ref/yourname".',
    },
    {
      category: "links",
      question: "Can I create multiple referral links?",
      answer:
        "You can create campaign-specific tracking parameters, but all referrals will be credited to your main affiliate account.",
    },
    {
      category: "account",
      question: "How do I update my payment details?",
      answer:
        "Go to Settings > Payment Information to update your PayPal email, bank account details, or UPI ID. Changes take effect from the next payment cycle.",
    },
    {
      category: "account",
      question: "Can I see my payment history?",
      answer:
        'Yes! Visit the "My Earnings" page to see a complete history of all your payments, pending earnings, and transaction details.',
    },
    {
      category: "performance",
      question: "How is my leaderboard ranking calculated?",
      answer:
        "Leaderboard rankings are based on total earnings for the current month. Rankings update in real-time as you generate more referrals.",
    },
    {
      category: "performance",
      question: "Are there bonuses for top performers?",
      answer:
        "Yes! Top 10 affiliates each month receive bonus rewards ranging from ₹5,000 to ₹25,000. Check the Leaderboard page for current standings.",
    },
  ]

  const categories = [
    { id: "all", label: "All Questions", count: faqs.length },
    { id: "payments", label: "Payments", count: faqs.filter((f) => f.category === "payments").length },
    { id: "commissions", label: "Commissions", count: faqs.filter((f) => f.category === "commissions").length },
    { id: "referrals", label: "Referrals", count: faqs.filter((f) => f.category === "referrals").length },
    { id: "links", label: "Links", count: faqs.filter((f) => f.category === "links").length },
    { id: "account", label: "Account", count: faqs.filter((f) => f.category === "account").length },
    { id: "performance", label: "Performance", count: faqs.filter((f) => f.category === "performance").length },
  ]

  const filteredFaqs = selectedCategory === "all" ? faqs : faqs.filter((faq) => faq.category === selectedCategory)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get user data
      const user = getUser()

      // Create support request payload
      const payload = {
        user_id: user?.id || 1, // Use actual user ID or fallback
        subject: formData.subject,
        message: formData.message,
        status: "open",
      }

      // Call API
      const response = await apiClient.post("/support-requests", payload)

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
        description: "Something went wrong. Please try again.",
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
          Get answers to common affiliate questions or reach out to our support team
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
            <h3 className="font-heading font-bold text-xl lg:text-2xl text-gray-900 mb-1">Affiliate Support</h3>
            <p className="text-gray-600 mb-2">Get help with your affiliate account - we respond within 24 hours</p>
            <a
              href="mailto:affiliate@digitalmadarsa.com"
              className="text-[#0066ff] font-semibold hover:underline inline-flex items-center gap-2"
            >
              affiliate@digitalmadarsa.com
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
          <p className="text-gray-600 text-base lg:text-lg">Find quick answers to common affiliate questions</p>
        </div>

        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          {categories
            .filter((category) => category && category.label)
            .map((category) => (
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
                  <Loader2 className="w-5 h-5 animate-spin" />
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
