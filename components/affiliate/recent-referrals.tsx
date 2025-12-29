import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"


export interface RecentReferralsProps {
  referrals?: any[]
}

export function RecentReferrals({ referrals = [] }: RecentReferralsProps) {
  // If referrals is empty, we handle it
  if (referrals.length === 0) {
    return (
      <Card className="bg-white border-gray-200 rounded-xl sm:rounded-2xl shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-heading font-bold text-gray-900">Recent Referrals</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-gray-600">
            Latest users who signed up through your link
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-6 text-center text-gray-500 text-sm">
          No referrals yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-gray-200 rounded-xl sm:rounded-2xl shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg font-heading font-bold text-gray-900">Recent Referrals</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-gray-600">
          Latest users who signed up through your link
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {referrals.map((referral, index) => {
            // Mapping backend fields
            // referred_user_id, referred_user_email, referral_code, plan_id, referral_amount_cents, earned_commission_cents, status, signup_timestamp, conversion_timestamp, created_at
            const name = referral.referred_user_email || `User ${referral.referred_user_id}`
            // Mask email if needed, but for now display
            const earnings = referral.earned_commission_cents ? `₹${(referral.earned_commission_cents / 100).toFixed(0)}` : "₹0"
            const dateStr = referral.created_at || referral.click_timestamp

            // Format time ago or date
            let dateDisplay = ""
            if (dateStr) {
              const d = new Date(dateStr)
              dateDisplay = d.toLocaleDateString()
            }

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                    <AvatarFallback className="bg-[#0066ff]/10 text-[#0066ff] font-medium text-xs sm:text-sm">
                      {name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{name}</p>
                    {/* Don't show full email here if we used it as name */}
                    {referral.plan_id ? <p className="text-[10px] text-gray-500">Plan #{referral.plan_id}</p> : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 sm:gap-1 flex-shrink-0">
                  <Badge
                    className={
                      referral.status === "converted"
                        ? "bg-green-100 text-green-700 border-0 text-[10px] sm:text-xs"
                        : "bg-orange-100 text-orange-700 border-0 text-[10px] sm:text-xs"
                    }
                  >
                    {referral.status}
                  </Badge>
                  <p className="text-[10px] sm:text-xs text-gray-500">{dateDisplay}</p>
                  {referral.earned_commission_cents > 0 && <p className="text-[10px] font-bold text-green-600">{earnings}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
