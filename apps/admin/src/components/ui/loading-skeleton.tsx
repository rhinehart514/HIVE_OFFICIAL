"use client";

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/[0.06] ${className}`}
    />
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-white/[0.06]">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBar key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonBar
              key={c}
              className={`h-4 flex-1 ${c === 0 ? "max-w-[40%]" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 space-y-3"
        >
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-8 w-24" />
          <SkeletonBar className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-lg bg-white/[0.03] animate-pulse flex items-end gap-1 p-4"
      style={{ height }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-white/[0.06]"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <SkeletonBar className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-4 w-3/4" />
            <SkeletonBar className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBar className="h-6 w-48" />
          <SkeletonBar className="h-4 w-32" />
        </div>
        <SkeletonBar className="h-9 w-24 rounded-lg" />
      </div>
      {/* Cards */}
      <CardGridSkeleton count={4} />
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 space-y-3">
          <SkeletonBar className="h-5 w-32" />
          <ChartSkeleton height={200} />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 space-y-3">
          <SkeletonBar className="h-5 w-32" />
          <ChartSkeleton height={200} />
        </div>
      </div>
      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  );
}
