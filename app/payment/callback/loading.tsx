import { Loader2 } from "lucide-react"

export default function PaymentCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto text-[#0066ff] animate-spin mb-4" />
        <p className="text-[#4b4b4b]">Loading payment status...</p>
      </div>
    </div>
  )
}
