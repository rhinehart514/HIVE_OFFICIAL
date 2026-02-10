import { Skeleton } from '@hive/ui';

export default function NewSetupLoading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-ground, #0A0A09)' }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back link */}
        <Skeleton className="h-4 w-24 mb-8" />

        {/* Header */}
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-40 mx-auto mb-3" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        {/* Form */}
        <div
          className="p-6 rounded-lg space-y-6"
          style={{
            backgroundColor: 'var(--hivelab-surface, #141414)',
            borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
          }}
        >
          {/* Name */}
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Description */}
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          {/* Category */}
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Tools */}
          <div>
            <Skeleton className="h-3 w-12 mb-2" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* Submit */}
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
