/**
 * Leaders Page Loading State
 *
 * Shows skeleton while leaders directory loads.
 */

export default function LeadersLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-40 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Search skeleton */}
        <div className="h-12 w-full max-w-md bg-white/5 rounded-lg animate-pulse mb-8" />

        {/* Leaders grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-full bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
