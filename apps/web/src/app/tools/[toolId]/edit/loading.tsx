import { Skeleton } from '@hive/ui';

export default function EditToolLoading() {
  return (
    <div className="h-screen flex">
      {/* Element palette */}
      <div className="w-64 border-r border-neutral-800 p-4 space-y-4">
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 p-8">
        <div className="h-full border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-lg mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>

      {/* Properties panel */}
      <div className="w-72 border-l border-neutral-800 p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
