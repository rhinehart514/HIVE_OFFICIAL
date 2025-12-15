import { Skeleton } from '@hive/ui';

export default function RunToolLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Tool header */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Tool runtime container */}
      <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6 space-y-6">
        {/* Tool elements */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}

        {/* Action button */}
        <div className="pt-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
