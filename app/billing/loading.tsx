export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Stats Cards Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex gap-4">
          <div className="h-11 bg-slate-100 rounded-xl flex-1"></div>
          <div className="h-11 bg-slate-100 rounded-xl w-32"></div>
        </div>

        <div className="divide-y divide-slate-100 border-t border-slate-100 mt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-5 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-24 mr-10"></div>
              <div className="h-6 bg-slate-100 rounded-full w-20 mr-10"></div>
              <div className="h-8 bg-slate-100 rounded-lg w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
