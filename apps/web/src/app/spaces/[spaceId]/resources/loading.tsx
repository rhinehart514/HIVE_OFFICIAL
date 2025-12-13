export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="h-7 w-32 bg-muted rounded animate-pulse mb-4" />

      {/* Card skeleton */}
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center">
          {/* Icon skeleton */}
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse mb-4" />

          {/* Title skeleton */}
          <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />

          {/* Description skeleton */}
          <div className="h-4 w-64 bg-muted rounded animate-pulse mb-6" />

          {/* Features grid skeleton */}
          <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
