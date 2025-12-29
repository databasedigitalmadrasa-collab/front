export default function ManageAdminsLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8 animate-pulse">
        <div className="h-24 bg-white/10 rounded-lg" />
      </div>

      {/* Search Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
        <div className="h-11 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
