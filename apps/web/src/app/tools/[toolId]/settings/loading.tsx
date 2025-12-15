import { Skeleton } from '@hive/ui';

export default function ToolSettingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-36 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Settings sections */}
      <div className="space-y-8">
        {/* General settings */}
        <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6 space-y-6">
          <Skeleton className="h-5 w-32" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6 space-y-6">
          <Skeleton className="h-5 w-28" />

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
