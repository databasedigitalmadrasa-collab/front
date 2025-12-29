export default function LoadingPlans() {
  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8 animate-pulse">
        <div className="h-20 bg-white/20 rounded-lg"></div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
