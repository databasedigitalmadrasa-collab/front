export default function SupportLoading() {
  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <aside className="w-60 bg-white border-r border-gray-200" />
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 h-[73px]" />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-8">
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  )
}
