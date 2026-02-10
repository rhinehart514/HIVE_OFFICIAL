import { Skeleton } from '@hive/ui';

export default function SetupDetailLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-ground, #0A0A09)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Skeleton className="h-4 w-24 mb-8" />

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--hivelab-surface, #141414)',
                borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
              }}
            >
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>

        {/* Tools section */}
        <div className="mb-8">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--hivelab-surface, #141414)',
                  borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
                }}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
