import { Skeleton } from "@/components/ui/skeleton"

export default function ManageUsersLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8">
        <Skeleton className="h-20 w-full bg-white/20" />
        <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/20">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 bg-white/20" />
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
