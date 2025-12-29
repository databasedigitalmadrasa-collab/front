export default function LoadingCreatePlan() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 animate-pulse">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-2xl"></div>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
