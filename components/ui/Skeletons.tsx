"use client";

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 h-14 border-b border-slate-200 animate-pulse" />
      <div className="divide-y divide-slate-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="bg-slate-200 w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <div className="bg-slate-200 h-4 w-32 rounded" />
                <div className="bg-slate-100 h-3 w-24 rounded" />
              </div>
            </div>
            <div className="bg-slate-100 h-4 w-24 rounded" />
            <div className="bg-slate-100 h-6 w-16 rounded-full" />
            <div className="flex gap-2">
              <div className="bg-slate-100 w-8 h-8 rounded-lg" />
              <div className="bg-slate-100 w-8 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex gap-6">
        <div className="bg-slate-200 w-32 h-32 rounded-2xl" />
        <div className="space-y-4 flex-1">
          <div className="bg-slate-200 h-8 w-1/2 rounded" />
          <div className="bg-slate-100 h-4 w-1/3 rounded" />
          <div className="flex gap-4">
            <div className="bg-slate-100 h-6 w-20 rounded-full" />
            <div className="bg-slate-100 h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-slate-50 h-64 rounded-2xl border border-slate-100" />
        <div className="bg-slate-50 h-64 rounded-2xl border border-slate-100" />
      </div>
    </div>
  );
}
