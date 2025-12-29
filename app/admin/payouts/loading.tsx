export default function PayoutsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 mb-6 animate-pulse">
        <div className="h-8 bg-white/20 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-1/2"></div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-8 bg-white/20 rounded w-16 mb-1"></div>
              <div className="h-4 bg-white/20 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
