export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="h-3 bg-slate-100 rounded w-32"></div>
        </div>
        <div className="h-11 bg-slate-100 rounded-xl w-36"></div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Patients Queue */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/2 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Diagnostic Workspace Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/4"></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl"></div>
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl"></div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-36 bg-slate-50 border border-slate-100 rounded-xl"></div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <div className="h-11 bg-slate-100 rounded-xl w-24"></div>
            <div className="h-11 bg-slate-200 rounded-xl w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
