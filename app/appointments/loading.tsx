export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Calendar Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-2 w-full md:w-auto">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="h-3 bg-slate-100 rounded w-32"></div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-11 bg-slate-100 rounded-xl w-32"></div>
          <div className="h-11 bg-slate-100 rounded-xl w-36"></div>
        </div>
      </div>

      {/* Main Grid: Scheduler & Calendar Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List Column */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-12"></div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
                <div className="h-3 bg-slate-100 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Large Calendar Grid View Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
              <div className="w-16 h-8 bg-slate-100 rounded-lg"></div>
              <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
          {/* Calendar Day Grid Skeleton */}
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-50 rounded text-center py-2">
                <div className="h-3 bg-slate-200 rounded mx-auto w-8"></div>
              </div>
            ))}
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-50/50 rounded-xl border border-slate-100 p-2 flex flex-col justify-between">
                <div className="h-3 bg-slate-200 rounded w-4"></div>
                <div className="space-y-1">
                  <div className="h-2 bg-slate-100 rounded w-full"></div>
                  <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
