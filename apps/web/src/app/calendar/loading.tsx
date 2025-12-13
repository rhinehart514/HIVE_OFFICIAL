import { Skeleton } from '@hive/ui';

export default function CalendarLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        {['Day', 'Week', 'Month'].map((view) => (
          <Skeleton key={view} className="h-9 w-20 rounded-lg" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-4">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Skeleton key={day} className="h-8 w-full" />
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-neutral-800/30 p-2"
            >
              <Skeleton className="h-5 w-5 mb-2" />
              {i % 4 === 0 && <Skeleton className="h-3 w-full rounded" />}
              {i % 7 === 2 && <Skeleton className="h-3 w-3/4 rounded mt-1" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
