import { Skeleton } from '@hive/ui';

export default function SpacesBrowseLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-12 w-full max-w-xl mb-6 rounded-xl" />

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        {['All', 'Academic', 'Social', 'Professional', 'Sports', 'Arts'].map(
          (cat) => (
            <Skeleton key={cat} className="h-9 w-24 rounded-full" />
          )
        )}
      </div>

      {/* Featured spaces */}
      <div className="mb-10">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SpaceCardSkeleton key={i} featured />
          ))}
        </div>
      </div>

      {/* All spaces */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SpaceCardSkeleton({ featured }: { featured?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-neutral-800/50 bg-neutral-900/30 overflow-hidden ${
        featured ? 'md:col-span-1' : ''
      }`}
    >
      {/* Banner */}
      <Skeleton className={featured ? 'h-32' : 'h-24'} />

      <div className="p-4 space-y-3">
        {/* Icon + name */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>

        {/* Description */}
        {featured && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800/30">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
