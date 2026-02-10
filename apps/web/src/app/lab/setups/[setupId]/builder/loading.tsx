import { Skeleton } from '@hive/ui';

export default function SetupBuilderLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-ground, #0A0A09)' }}>
      {/* Header bar */}
      <div
        className="h-14 border-b flex items-center justify-between px-4"
        style={{ borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))' }}
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left sidebar - Triggers */}
        <div
          className="w-64 border-r p-4"
          style={{ borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))' }}
        >
          <Skeleton className="h-4 w-16 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 p-8">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="h-16 w-16 mx-auto rounded-lg mb-4" />
              <Skeleton className="h-5 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </div>
        </div>

        {/* Right sidebar - Actions */}
        <div
          className="w-64 border-l p-4"
          style={{ borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))' }}
        >
          <Skeleton className="h-4 w-16 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
