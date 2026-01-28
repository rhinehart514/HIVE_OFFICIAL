import { Skeleton } from '@hive/ui';

export default function SpaceToolLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-ground, #0A0A09)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Tool content area */}
        <div
          className="rounded-xl border p-6 min-h-[500px]"
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
    </div>
  );
}
