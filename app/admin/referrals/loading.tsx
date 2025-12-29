import { Skeleton } from "@/components/ui/skeleton"

export default function ReferralsLoading() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-full mx-auto p-4 lg:p-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-6 text-white">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-2xl bg-white/20" />
              <div>
                <Skeleton className="w-40 h-8 bg-white/30 rounded-lg mb-2" />
                <Skeleton className="w-60 h-4 bg-white/20 rounded-lg" />
              </div>
            </div>
            <Skeleton className="w-32 h-10 bg-white/30 rounded-lg" />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-6 border-t border-white/20">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="w-16 h-8 bg-white/30 rounded-lg mb-2" />
                <Skeleton className="w-24 h-4 bg-white/20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-11 rounded-lg col-span-2" />
            <Skeleton className="h-11 rounded-lg" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
