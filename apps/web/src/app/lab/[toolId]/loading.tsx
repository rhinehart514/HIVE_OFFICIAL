import { Skeleton } from '@hive/ui';

export default function ToolDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Skeleton className="h-8 w-24 mb-6" />

      {/* Tool header */}
      <div className="flex items-start gap-6 mb-8">
        <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-800/50 mb-6">
        {['Overview', 'Canvas', 'Settings'].map((tab) => (
          <Skeleton key={tab} className="h-10 w-24" />
        ))}
      </div>

      {/* Content area */}
      <div className="space-y-6">
        {/* Canvas preview */}
        <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6 min-h-[400px]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-xl mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-4"
            >
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
