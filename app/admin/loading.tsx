export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="h-3 bg-slate-100 rounded w-32"></div>
        </div>
      </div>

      {/* Tabs / Switcher Skeleton */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <div className="h-10 bg-slate-100 rounded-lg w-28"></div>
        <div className="h-10 bg-slate-100 rounded-lg w-32"></div>
        <div className="h-10 bg-slate-100 rounded-lg w-24"></div>
      </div>

      {/* Main Content Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-slate-200 rounded w-1/4"></div>
          <div className="h-11 bg-slate-100 rounded-xl w-32"></div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-5 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-slate-100 rounded-full w-16 mr-10"></div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
