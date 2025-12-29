import { Skeleton } from "@/components/ui/skeleton"

export default function ManageSubscriptionsLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-full mx-auto">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 mb-6">
        <Skeleton className="h-10 w-48 bg-white/20 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/20">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 bg-white/20" />
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-6 space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
