export default function CertificatesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8 text-white shadow-xl animate-pulse">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-8 w-64 bg-white/20 rounded"></div>
              <div className="h-4 w-96 bg-white/10 rounded"></div>
            </div>
          </div>
          <div className="h-11 w-48 bg-white/20 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-8 w-16 bg-white/20 rounded"></div>
              <div className="h-4 w-32 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 animate-pulse">
        <div className="h-11 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="aspect-[3/2] bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <div className="flex-1 h-9 bg-gray-200 rounded"></div>
              <div className="h-9 w-9 bg-gray-200 rounded"></div>
              <div className="h-9 w-9 bg-gray-200 rounded"></div>
              <div className="h-9 w-9 bg-gray-200 rounded"></div>
              <div className="h-9 w-9 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
