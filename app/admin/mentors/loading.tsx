export default function MentorsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 mb-6 shadow-lg animate-pulse">
        <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-64"></div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="h-10 bg-white/20 rounded w-16 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-24"></div>
          </div>
          <div>
            <div className="h-10 bg-white/20 rounded w-16 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-24"></div>
          </div>
          <div>
            <div className="h-10 bg-white/20 rounded w-16 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-11 bg-gray-200 rounded"></div>
          <div className="h-11 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
