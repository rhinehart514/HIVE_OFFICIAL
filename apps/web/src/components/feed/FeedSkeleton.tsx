'use client';

export function FeedSkeleton() {
  return (
    <div className="space-y-8">
      {/* Live now section skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
          <div className="h-3 w-16 bg-white/[0.05] rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[260px] rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-hidden"
            >
              <div className="h-28 bg-white/[0.05] animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-1/2 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Today events section skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
          <div className="h-3 w-12 bg-white/[0.05] rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-hidden flex"
            >
              <div className="w-24 min-h-[88px] bg-white/[0.05] animate-pulse" />
              <div className="flex-1 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-white/[0.05] rounded animate-pulse" />
                  <div className="h-3 w-12 bg-white/[0.03] rounded animate-pulse" />
                </div>
                <div className="h-4 w-2/3 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-white/[0.03] rounded animate-pulse" />
                <div className="flex gap-2 mt-1">
                  <div className="h-6 w-14 bg-white/[0.05] rounded-lg animate-pulse" />
                  <div className="h-6 w-14 bg-white/[0.03] rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Discover section skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-16 bg-white/[0.05] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.05]" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-white/[0.05] rounded" />
                  <div className="h-2.5 w-16 bg-white/[0.03] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
