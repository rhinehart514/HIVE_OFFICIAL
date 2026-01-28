import { Skeleton } from '@hive/ui';

export default function SetupEditLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-ground, #0A0A09)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Form sections */}
        <div className="space-y-8">
          {/* Basic info */}
          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--hivelab-surface, #141414)',
              borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
            }}
          >
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Tools section */}
          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--hivelab-surface, #141414)',
              borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
            }}
          >
            <Skeleton className="h-5 w-16 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
