import { Skeleton } from '@hive/ui';

export default function SetupsLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-ground, #0A0A09)' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link skeleton */}
        <Skeleton className="h-4 w-24 mb-8" />

        {/* Header skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-32 mx-auto mb-3" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        {/* Search skeleton */}
        <div className="max-w-xl mx-auto mb-6">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Category pills skeleton */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-lg border"
              style={{
                backgroundColor: 'var(--hivelab-surface, #141414)',
                borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
