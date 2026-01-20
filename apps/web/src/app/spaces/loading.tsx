/**
 * Spaces Discovery Page - Loading Skeleton
 *
 * Matches the redesigned discovery page layout:
 * - Sticky header with search + category pills
 * - Featured Hero Section (bento grid skeleton)
 * - Discovery Grid sections (card skeletons)
 */

function CategoryPillSkeleton() {
  return (
    <div className="h-9 w-24 rounded-full bg-neutral-800/50 animate-pulse flex-shrink-0" />
  );
}

function HeroSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Large hero card skeleton */}
      <div className="md:col-span-2 md:row-span-2 h-[240px] md:h-80 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 animate-pulse">
        <div className="h-full p-6 flex flex-col justify-end">
          <div className="h-6 w-48 bg-neutral-800 rounded mb-2" />
          <div className="h-4 w-32 bg-neutral-800/60 rounded" />
        </div>
      </div>

      {/* Secondary card skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-1 md:flex md:flex-col gap-4">
        <div className="h-[140px] md:flex-1 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 animate-pulse p-4">
          <div className="h-4 w-32 bg-neutral-800 rounded mb-2" />
          <div className="h-3 w-20 bg-neutral-800/60 rounded" />
        </div>
        <div className="h-[140px] md:flex-1 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 animate-pulse p-4">
          <div className="h-4 w-28 bg-neutral-800 rounded mb-2" />
          <div className="h-3 w-24 bg-neutral-800/60 rounded" />
        </div>
      </div>
    </div>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-800/50 animate-pulse" />
        <div>
          <div className="h-5 w-40 bg-neutral-800 rounded mb-1" />
          <div className="h-3 w-28 bg-neutral-800/60 rounded" />
        </div>
      </div>
      <div className="h-4 w-16 bg-neutral-800/40 rounded" />
    </div>
  );
}

function DiscoveryCardSkeleton() {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-neutral-800 rounded" />
          <div className="h-3 w-24 bg-neutral-800/60 rounded" />
        </div>
        <div className="h-8 w-16 bg-neutral-800 rounded-lg" />
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-800/50">
        <div className="h-4 w-20 bg-neutral-800/40 rounded" />
      </div>
    </div>
  );
}

function DiscoveryCardSkeletonStaggered({ delay }: { delay: number }) {
  return (
    <div
      className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-12 h-12 rounded-xl bg-neutral-800 animate-pulse"
          style={{ animationDelay: `${delay + 50}ms` }}
        />
        <div className="flex-1 space-y-2">
          <div
            className="h-4 w-32 bg-neutral-800 rounded animate-pulse"
            style={{ animationDelay: `${delay + 100}ms` }}
          />
          <div
            className="h-3 w-24 bg-neutral-800/60 rounded animate-pulse"
            style={{ animationDelay: `${delay + 150}ms` }}
          />
        </div>
        <div
          className="h-8 w-16 bg-neutral-800 rounded-lg animate-pulse"
          style={{ animationDelay: `${delay + 200}ms` }}
        />
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-800/50">
        <div
          className="h-4 w-20 bg-neutral-800/40 rounded animate-pulse"
          style={{ animationDelay: `${delay + 250}ms` }}
        />
      </div>
    </div>
  );
}

function DiscoveryGridSkeleton({ count = 4, startDelay = 0 }: { count?: number; startDelay?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <DiscoveryCardSkeletonStaggered key={i} delay={startDelay + i * 50} />
      ))}
    </div>
  );
}

export default function SpacesLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Sticky Header Skeleton */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-4">
          {/* Title Row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="h-7 w-24 bg-neutral-800 rounded mb-2" />
              <div className="h-4 w-36 bg-neutral-800/60 rounded" />
            </div>
            <div className="h-9 w-24 bg-gold-500/20 rounded-lg" />
          </div>

          {/* Search Skeleton */}
          <div className="h-10 w-full bg-neutral-900/50 border border-neutral-800 rounded-md mb-4" />

          {/* Category Pills Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <CategoryPillSkeleton key={i} />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        {/* Featured Section */}
        <section>
          <SectionHeaderSkeleton />
          <HeroSectionSkeleton />
        </section>

        {/* Recommended Section */}
        <section>
          <SectionHeaderSkeleton />
          <DiscoveryGridSkeleton count={4} />
        </section>

        {/* Popular Section */}
        <section>
          <SectionHeaderSkeleton />
          <DiscoveryGridSkeleton count={4} />
        </section>
      </main>
    </div>
  );
}
