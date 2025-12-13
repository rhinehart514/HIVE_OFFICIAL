import { Skeleton } from '@hive/ui';

export default function SchoolsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Search */}
      <Skeleton className="h-12 w-full max-w-md mx-auto mb-10 rounded-xl" />

      {/* School list */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/30"
          >
            {/* School logo */}
            <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />

            {/* Info */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Status badge */}
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        ))}
      </div>

      {/* Waitlist CTA */}
      <div className="mt-12 text-center">
        <Skeleton className="h-5 w-64 mx-auto mb-4" />
        <Skeleton className="h-10 w-40 mx-auto" />
      </div>
    </div>
  );
}
