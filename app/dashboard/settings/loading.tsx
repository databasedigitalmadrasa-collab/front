export default function SettingsLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse mb-8" />
      <div className="space-y-6">
        <div className="h-64 w-full bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-96 w-full bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
