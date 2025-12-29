import { Skeleton } from "@/components/ui/skeleton"

export default function SupportRequestsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-3xl p-8 md:p-12 mb-6">
        <Skeleton className="h-12 w-80 bg-white/20 mb-3" />
        <Skeleton className="h-6 w-96 bg-white/20 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Skeleton className="h-4 w-24 bg-white/20 mb-2" />
              <Skeleton className="h-8 w-16 bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
