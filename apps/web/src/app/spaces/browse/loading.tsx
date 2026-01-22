/**
 * Browse Loading State
 * Skeleton UI that matches the browse page structure
 */

export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0A0A0A]/80 border-b border-white/[0.04]">
        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-8 rounded-lg bg-white/[0.02] animate-pulse" />
            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-7 rounded-full bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/[0.02] animate-pulse" />
        </div>
      </header>

      {/* Hero Skeleton */}
      <div className="px-6 md:px-8 py-16 md:py-24">
        <div className="max-w-3xl space-y-6">
          <div className="h-14 md:h-16 w-3/4 rounded-lg bg-white/[0.02] animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-full max-w-md rounded bg-white/[0.02] animate-pulse" />
            <div className="h-5 w-2/3 max-w-sm rounded bg-white/[0.02] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="px-6 md:px-8 pb-16 space-y-12">
        {/* Featured Section */}
        <section className="space-y-6">
          <div className="h-6 w-32 rounded bg-white/[0.02] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-white/[0.02] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </section>

        {/* Grid Section */}
        <section className="space-y-6">
          <div className="h-6 w-48 rounded bg-white/[0.02] animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-white/[0.02] animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
