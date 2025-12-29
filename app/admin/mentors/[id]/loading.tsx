export default function MentorProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 mb-6 shadow-lg">
          <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-96"></div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
