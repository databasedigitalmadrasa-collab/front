export default function WalletLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          <div className="h-64 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          <div className="h-32 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          <div className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
