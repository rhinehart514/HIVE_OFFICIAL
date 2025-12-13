import { Skeleton } from '@hive/ui';

export default function UserProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
        {/* Avatar */}
        <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div>
              <Skeleton className="h-6 w-8 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div>
              <Skeleton className="h-6 w-8 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div>
              <Skeleton className="h-6 w-8 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-800/50 mb-6">
        {['Activity', 'Spaces', 'Connections'].map((tab) => (
          <Skeleton key={tab} className="h-10 w-24" />
        ))}
      </div>

      {/* Activity feed */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Actions */}
            <div className="flex gap-6 pt-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
