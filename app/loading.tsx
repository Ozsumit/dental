export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Search & Filter Header Skeleton */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-12 bg-slate-100 rounded-xl flex-1"></div>
          <div className="h-12 bg-slate-100 rounded-xl w-32"></div>
          <div className="h-12 bg-slate-100 rounded-xl w-36"></div>
          <div className="h-12 bg-slate-100 rounded-xl w-40"></div>
        </div>
      </div>

      {/* Directory Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex justify-between items-center">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-24 mr-10"></div>
              <div className="h-6 bg-slate-100 rounded-full w-16 mr-10"></div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
