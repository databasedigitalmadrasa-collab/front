"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, ArrowLeft } from "lucide-react"
import Image from "next/image"

interface InvoicePageProps {
  params: Promise<{ id: string }>
}

interface User {
  id: number
  full_name: string
  email: string
  contact: string
  country: string
  state: string
}

interface Plan {
  title: string
  description: string
  monthly_amount: number
  yearly_amount: number
  currency: string
}

interface Subscription {
  id: number
  user_id: number
  plan_id: number
  start_date: string
  renewal_date: string
  subscription_type: string
  subscription_amount_paid: number
  subscription_status: string
  order_id: string
  transaction_status: string
  created_at: string
  user: User | null
  plan: Plan | null
}

// Helper to convert number to words (Indian numbering system)
const numberToWords = (num: number): string => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  if ((num = num.toString().length > 9 ? parseFloat(num.toString().slice(0, 9)) : num) === 0) return "Zero"

  const n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
  if (!n) return ""

  let str = ""
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + " " + a[Number(n[1][1])]) + "Crore " : ""
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + " " + a[Number(n[2][1])]) + "Lakh " : ""
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + " " + a[Number(n[3][1])]) + "Thousand " : ""
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + " " + a[Number(n[4][1])]) + "Hundred " : ""
  str +=
    Number(n[5]) !== 0
      ? (str !== "" ? "and " : "") + (a[Number(n[5])] || b[Number(n[5][0])] + " " + a[Number(n[5][1])]) + "Rupees Only"
      : "Rupees Only"

  return str
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const router = useRouter()
  // Unwrap params using React.use()
  const { id } = use(params)

  const { user: currentUser, isLoading: isAuthLoading } = useUserAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchInvoice = async () => {
      if (isAuthLoading) return

      try {
        const token = getAuthToken()
        // If no token, maybe redirect to login? For now we assume protected route or public if allowed
        
        const response = await apiClient.get<{ data: Subscription }>(`/subscriptions/${id}`, token || undefined)

        if (response.success && response.data) {
          // The API returns { success: true, data: Subscription }
          // response.data is the JSON body, so we need to access .data from it
          const subscriptionData = (response.data as any).data
          setSubscription(subscriptionData)
        } else {
          setError("Invoice not found")
        }
      } catch (err) {
        setError("Failed to load invoice")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [id, isAuthLoading])

  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-gray-600 mb-4">{error || "Invoice not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // --- GST Calculations ---
  const amountPaid = subscription.subscription_amount_paid
  const amountPaidInRupees = amountPaid / 100 // Database stores in paise
  const gstRate = 0.18
  const taxableValue = amountPaidInRupees / (1 + gstRate)
  const totalGST = amountPaidInRupees - taxableValue
  const cgst = totalGST / 2
  const sgst = totalGST / 2
  const amountInWords = numberToWords(Math.round(amountPaidInRupees))

  // --- Format Dates ---
  const invoiceDate = new Date(subscription.created_at).toLocaleDateString("en-IN")
  const startDate = new Date(subscription.start_date).toLocaleDateString("en-IN")
  const endDate = new Date(subscription.renewal_date).toLocaleDateString("en-IN")

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Toolbar - Hide on Print */}
        <div className="bg-gray-800 text-white p-4 flex justify-end items-center print:hidden">
          <div className="flex gap-2">
            <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Print / Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 md:p-12 print:p-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-200 pb-8 mb-8">
            <div className="space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo/logo_icon.png"
                    alt="Digital Madrasa"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-blue-600 leading-none">DIGITAL MADRASA</h1>
                  <p className="text-xs text-gray-500 mt-1">Transforming Education</p>
                </div>
              </div>
              
              <div className="space-y-1 pt-2">
                <p className="text-sm text-gray-600 max-w-[250px]">
                  384 B’ Block, Panki, Kanpur, Uttar Pradesh 208020
                </p>
              <p className="text-sm text-gray-600">support@digitalmadrasa.in</p>
              <p className="text-sm text-gray-600">8115220516</p>
              <p className="text-sm font-semibold mt-2">GSTIN: 09EYYPK7326H1ZL</p>
            </div>
          </div>
            <div className="text-left md:text-right mt-6 md:mt-0">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">TAX INVOICE</h1>
              <p className="text-sm text-gray-600">Invoice #: <span className="font-mono font-medium">{subscription.order_id || `INV-${subscription.id}`}</span></p>
              <p className="text-sm text-gray-600">Date: {invoiceDate}</p>
              <p className="text-sm text-gray-600">Status: <span className="uppercase font-semibold">{subscription.subscription_status}</span></p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Bill To</h2>
            <div className="text-gray-800">
              <p className="font-semibold">{subscription.user?.full_name}</p>
              <p>{subscription.user?.email}</p>
              <p>{subscription.user?.contact}</p>
              {subscription.user?.state && <p>{subscription.user?.state}, {subscription.user?.country}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4">
                    <p className="font-medium text-gray-900">{subscription.plan?.title || "Subscription"}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Period: {startDate} - {endDate}
                    </p>
                    <p className="text-sm text-gray-500">
                      HSN/SAC: 999293 (Commercial training and coaching services)
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right align-top">
                    ₹{taxableValue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxable Amount</span>
                <span>₹{taxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>CGST (9%)</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>SGST (9%)</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>₹{amountPaidInRupees.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 text-right mt-1">
                (Inclusive of GST)
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <p className="text-sm text-gray-600">Amount in Words:</p>
            <p className="font-semibold text-gray-900 italic">{amountInWords}</p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-12 print:mt-auto">
            <p>
              This is system generated invoice. System developed and maintained by{" "}
              <a href="https://wemstudios.in/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                WEM Studios
              </a>
            </p>
            <p className="mt-1">Thank you for your business!</p>
          </div>

        </div>
      </div>
    </div>
  )
}
