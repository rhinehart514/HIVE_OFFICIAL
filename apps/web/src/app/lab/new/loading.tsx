import { Skeleton } from '@hive/ui';

export default function NewToolLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-ground, #0A0A09)' }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-32 mx-auto mb-3" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>

        {/* Options */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--hivelab-surface, #141414)',
                borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
