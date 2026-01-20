/**
 * Settings Loading State
 *
 * Shows skeleton while settings page hydrates.
 */

export default function SettingsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-10">
        {/* Header skeleton */}
        <div className="mb-20">
          <div className="h-8 w-32 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Navigation cards skeleton */}
        <div className="grid gap-3 md:grid-cols-2 p-4 -mx-4 rounded-2xl bg-white/[0.015]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-3 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Action buttons skeleton */}
        <div className="mt-16 space-y-3">
          <div className="h-12 w-full bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-white/5 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}
