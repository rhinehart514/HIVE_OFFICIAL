/**
 * Resources Page Loading State
 *
 * Shows skeleton while resources load.
 */

export default function ResourcesLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-36 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-4 w-56 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Categories skeleton */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 bg-white/5 rounded-full animate-pulse shrink-0" />
          ))}
        </div>

        {/* Resources grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="h-5 w-12 bg-white/5 rounded-full animate-pulse" />
                <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
