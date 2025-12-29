import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlatformSettingsLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-white/20" />
            <Skeleton className="h-4 w-96 bg-white/20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-white/20" />
            <Skeleton className="h-10 w-32 bg-white/20" />
            <Skeleton className="h-10 w-40 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      </div>
    </div>
  )
}
