import { Skeleton } from '@hive/ui';

export default function NotificationsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['All', 'Unread', 'Mentions'].map((tab) => (
          <Skeleton key={tab} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-lg border border-white/[0.06] bg-[var(--bg-void)]/30"
          >
            {/* Avatar */}
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Unread indicator */}
            {i % 2 === 0 && (
              <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
