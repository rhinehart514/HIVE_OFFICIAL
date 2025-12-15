import { Skeleton } from '@hive/ui';

export default function SpaceDetailLoading() {
  return (
    <div className="h-screen flex flex-col bg-neutral-950">
      {/* Space header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Board tabs */}
      <div className="border-b border-neutral-800 px-4 py-2">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Main content: 60/40 split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat area - 60% */}
        <main className="flex-[3] flex flex-col border-r border-neutral-800/50 lg:border-r-0">
          {/* Messages area */}
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-4 w-3/4 max-w-sm" />
                </div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div className="border-t border-neutral-800 p-4">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </main>

        {/* Sidebar - 40% (hidden on mobile) */}
        <aside className="hidden lg:flex lg:flex-col lg:flex-[2] max-w-[400px] border-l border-neutral-800 bg-neutral-950/50 overflow-y-auto">
          {/* Sidebar sections */}
          <div className="p-4 border-b border-neutral-800 space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-neutral-800 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

