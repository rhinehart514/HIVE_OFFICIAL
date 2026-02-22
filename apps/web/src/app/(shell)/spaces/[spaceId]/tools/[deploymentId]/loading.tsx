import { Skeleton } from '@hive/ui';

export default function ToolDeploymentLoading() {
  return (
    <div className="px-6 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Description */}
      <div className="mb-8">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Tool preview area */}
      <div
        className="rounded-lg p-8 min-h-[400px]"
        style={{
          backgroundColor: 'var(--bg-void, #0A0A09)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Skeleton className="h-12 w-12 mx-auto rounded-lg mb-4" />
            <Skeleton className="h-5 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
