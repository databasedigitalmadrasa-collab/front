export default function CertificateEditorLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-9 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded"></div>
            <div className="h-9 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="h-9 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Canvas Area Skeleton */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-100">
          <div className="bg-white rounded-lg shadow-2xl animate-pulse" style={{ width: 1200, height: 800 }}>
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#0066ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg font-medium">Loading Certificate Editor...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your canvas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
